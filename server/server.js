#!/usr/bin/env node
/*
 * سيرفر تراخيص وإدارة أجهزة هوست مصري / Masry.
 *
 *  zero dependencies — Node built-ins only.
 *  - يقدّم ملفات الموقع الثابت من جذر الريبو (نفس الأصل => لا CORS).
 *  - يقدّم لوحة الأدمن من server/admin.
 *  - API للتراخيص والأجهزة تحت /api/v1.
 *  - تخزين JSON محلي (server/data.json) مع كتابة ذرّية.
 *
 *  المتغيرات:
 *    PORT         رقم البورت (افتراضي 8080)
 *    HOST         عنوان الربط (افتراضي 0.0.0.0)
 *    ADMIN_PASSWORD  كلمة مرور الأدمن (لو مش موجودة تتولّد عشوائية وتُطبع)
 *    WATERMARK    اسم العلامة على الأجهزة (افتراضي sistro)
 *    OWNER        اسم المالك تحت العلامة (افتراضي Mohamed_0_9)
 *    TRIAL_DAYS   مدة التجربة بالأيام (افتراضي 3)
 *    DATA_FILE    مسار ملف البيانات
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const ADMIN_DIR = path.join(ROOT, "admin");
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.join(__dirname, "data.json");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const WATERMARK = process.env.WATERMARK || "sistro";
const OWNER = process.env.OWNER || "Mohamed_0_9";
const TRIAL_DAYS = Math.max(0, Number(process.env.TRIAL_DAYS || 3));
const SESSION_TTL = 12 * 60 * 60 * 1000; // 12 ساعة
const BLOB_TOKEN_TTL = 10 * 60 * 1000;   // 10 دقائق
const ACTIVATION_DAYS = 30;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/* ------------------------------------------------------------------ */
/* التخزين                                                             */
/* ------------------------------------------------------------------ */

function emptyStore() {
  return { secret: null, admin: { hash: null, salt: null }, devices: {} };
}

let store = emptyStore();

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      store = Object.assign(emptyStore(), parsed);
      return true;
    }
  } catch (e) {
    if (e.code !== "ENOENT") console.error("تحذير: تعذّر قراءة ملف البيانات:", e.message);
  }
  return false;
}

function saveStore() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

function ensureSecrets() {
  let changed = false;
  if (!store.secret) {
    store.secret = crypto.randomBytes(32).toString("hex");
    changed = true;
  }
  if (!store.admin || !store.admin.hash) {
    const password = process.env.ADMIN_PASSWORD;
    const salt = crypto.randomBytes(16).toString("hex");
    if (password) {
      store.admin = { hash: hashPassword(password, salt), salt };
      console.log("تم ضبط كلمة مرور الأدمن من ADMIN_PASSWORD.");
    } else {
      const generated = crypto.randomBytes(12).toString("base64url");
      store.admin = { hash: hashPassword(generated, salt), salt };
      console.log("");
      console.log("========================================================");
      console.log(" أول تشغيل — لا توجد كلمة مرور للأدمن.");
      console.log(" كلمة المرور المولّدة: " + generated);
      console.log(" احفظها الآن، أو اضبط ADMIN_PASSWORD في البيئة.");
      console.log("========================================================");
      console.log("");
    }
    changed = true;
  }
  if (changed) saveStore();
}

/* ------------------------------------------------------------------ */
/* كلمات المرور والجلسات                                              */
/* ------------------------------------------------------------------ */

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("hex");
}

function checkPassword(password) {
  if (!store.admin || !store.admin.hash) return false;
  const candidate = Buffer.from(hashPassword(password, store.admin.salt || ""));
  const expected = Buffer.from(store.admin.hash);
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

const sessions = new Map(); // token -> expiresAt

function issueSession() {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL);
  return token;
}

function isAuthed(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const exp = sessions.get(match[1]);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(match[1]); return false; }
  return true;
}

// تحديد معدل محاولات تسجيل الدخول لكل IP.
const attempts = new Map();
function loginThrottled(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { n: 0, reset: now + 60000 };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + 60000; }
  rec.n += 1;
  attempts.set(ip, rec);
  return rec.n > 5;
}

/* ------------------------------------------------------------------ */
/* الرموز الموقّعة (لتوصيل البايلود عن طريق السيرفر)                   */
/* ------------------------------------------------------------------ */

function issueBlobToken(deviceId) {
  const exp = Date.now() + BLOB_TOKEN_TTL;
  const payload = deviceId + "." + exp;
  const sig = crypto.createHmac("sha256", store.secret).update(payload).digest("base64url");
  return { token: payload + "." + sig, exp };
}

function checkBlobToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = parts[0] + "." + parts[1];
  const expected = crypto.createHmac("sha256", store.secret).update(payload).digest("base64url");
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return parts[0];
}

/* ------------------------------------------------------------------ */
/* حالة الجهاز                                                         */
/* ------------------------------------------------------------------ */

function trialEnd(d) {
  const days = d.trialDays != null ? d.trialDays : TRIAL_DAYS;
  return d.createdAt + days * 86400000;
}

function statusOf(d, now) {
  if (d.status === "revoked") return "revoked";
  if (d.expiresAt && now < d.expiresAt) return "active";
  if (now < trialEnd(d)) return "trial";
  return "expired";
}

function publicDevice(d, now) {
  const status = statusOf(d, now);
  return {
    deviceId: d.id,
    status: status,
    valid: status === "active" || status === "trial",
    firmware: d.firmware,
    lastSeen: d.lastSeen,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt || null,
    trialEndsAt: trialEnd(d),
    watermark: WATERMARK,
    owner: OWNER
  };
}

/* ------------------------------------------------------------------ */
/* أدوات الاستجابة                                                     */
/* ------------------------------------------------------------------ */

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ "x-content-type-options": "nosniff" }, headers || {}));
  res.end(body);
}

function sendJson(res, code, obj) {
  send(res, code, JSON.stringify(obj), {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
}

function readBody(req, limit) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > limit) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req, 64 * 1024);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString("utf8")); } catch (e) { return {}; }
}

/* ------------------------------------------------------------------ */
/* الملفات الثابتة                                                     */
/* ------------------------------------------------------------------ */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".appcache": "text/cache-manifest; charset=utf-8",
  ".bin": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function contentType(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

function cacheControlFor(file) {
  const ext = path.extname(file).toLowerCase();
  if ([".bin", ".js", ".css", ".png", ".jpg", ".jpeg", ".woff", ".woff2"].indexOf(ext) !== -1) {
    return "public, max-age=3600";
  }
  return "no-store";
}

function safeRel(relPath) {
  if (!relPath || relPath === "/") return "index.html";
  const rel = relPath.replace(/^\/+/, "");
  const segments = rel.split("/");
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "" || seg === "." || seg === "..") return null;
    if (seg.charAt(0) === ".") return null; // ملفات مخفية / .git
  }
  if (rel === "server" || rel.indexOf("server/") === 0) return null;
  if (/\/data\.json$/.test(rel)) return null;
  if (/\.(env|log|tmp)$/.test(rel)) return null;
  return rel;
}

function serveFile(res, abs, cacheOverride) {
  fs.stat(abs, function (err, st) {
    if (err || !st.isFile()) {
      send(res, 404, "Not found", { "content-type": "text/plain; charset=utf-8" });
      return;
    }
    res.writeHead(200, {
      "content-type": contentType(abs),
      "content-length": st.size,
      "cache-control": cacheOverride || cacheControlFor(abs),
      "x-content-type-options": "nosniff"
    });
    fs.createReadStream(abs).pipe(res);
  });
}

function serveStatic(res, pathname) {
  const rel = safeRel(pathname);
  if (!rel) { send(res, 403, "Forbidden", { "content-type": "text/plain; charset=utf-8" }); return; }
  const abs = path.join(ROOT, rel);
  if (abs.indexOf(ROOT + path.sep) !== 0) {
    send(res, 403, "Forbidden", { "content-type": "text/plain; charset=utf-8" });
    return;
  }
  serveFile(res, abs);
}

function serveAdmin(res, rel) {
  const safe = safeRel(rel || "index.html");
  if (!safe) { send(res, 403, "Forbidden", { "content-type": "text/plain; charset=utf-8" }); return; }
  const abs = path.join(ADMIN_DIR, safe);
  if (abs.indexOf(ADMIN_DIR + path.sep) !== 0) {
    send(res, 403, "Forbidden", { "content-type": "text/plain; charset=utf-8" });
    return;
  }
  serveFile(res, abs);
}

/* ------------------------------------------------------------------ */
/* واجهة API                                                           */
/* ------------------------------------------------------------------ */

function findDevice(id) {
  return store.devices[id] || null;
}

function upsertDevice(body) {
  const id = String(body.deviceId || "").trim();
  if (!ID_RE.test(id)) return null;
  const now = Date.now();
  let d = store.devices[id];
  if (!d) {
    d = {
      id: id,
      firmware: String(body.firmware || "").slice(0, 32),
      ua: String(body.ua || "").slice(0, 300),
      createdAt: now,
      lastSeen: now,
      status: null,
      expiresAt: null,
      note: ""
    };
    store.devices[id] = d;
  } else {
    if (body.firmware) d.firmware = String(body.firmware).slice(0, 32);
    if (body.ua) d.ua = String(body.ua).slice(0, 300);
    d.lastSeen = now;
  }
  return d;
}

async function handleApi(req, res, url, pathname, ip) {
  const method = req.method || "GET";

  // إعدادات عامة — بلا مصادقة.
  if (pathname === "/api/v1/config" && method === "GET") {
    return sendJson(res, 200, {
      watermark: WATERMARK,
      owner: OWNER,
      trialDays: TRIAL_DAYS
    });
  }

  // تسجيل/فحص جهاز: POST /api/v1/license
  if (pathname === "/api/v1/license" && method === "POST") {
    const body = await readJson(req);
    const d = upsertDevice(body);
    if (!d) return sendJson(res, 400, { error: "bad_device_id" });
    saveStore();
    const now = Date.now();
    const out = publicDevice(d, now);
    const blob = issueBlobToken(d.id);
    out.blobToken = blob.token;
    out.serverTime = now;
    return sendJson(res, 200, out);
  }

  // تسجيل دخول الأدمن
  if (pathname === "/api/v1/admin/login" && method === "POST") {
    if (loginThrottled(ip)) return sendJson(res, 429, { error: "too_many_attempts" });
    const body = await readJson(req);
    if (!checkPassword(body.password || "")) return sendJson(res, 401, { error: "bad_password" });
    const token = issueSession();
    return sendJson(res, 200, { token: token });
  }

  // توصيل ملف بايلود عبر السيرفر برمز موقّع: /api/v1/blob/<path>?token=
  // (قبل بوابة الأدمن — الجهاز نفسه هو المستعلم هنا.)
  const blobMatch = /^\/api\/v1\/blob\/(.+)$/.exec(pathname);
  if (blobMatch && method === "GET") {
    const deviceId = checkBlobToken(url.searchParams.get("token"));
    if (!deviceId) return sendJson(res, 401, { error: "bad_token" });
    const d = findDevice(deviceId);
    if (!d) return sendJson(res, 404, { error: "not_found" });
    if (!publicDevice(d, Date.now()).valid) return sendJson(res, 403, { error: "license_invalid" });
    const rel = safeRel(blobMatch[1]);
    if (!rel) return sendJson(res, 403, { error: "forbidden" });
    const allowedPrefixes = ["jb/", "ag/", "bpf/", "dev/jb/", "dev/ag/", "dev/bpf/"];
    const allowedExts = [".bin"];
    const okPrefix = allowedPrefixes.some(function (p) { return rel.indexOf(p) === 0; });
    const okExt = allowedExts.indexOf(path.extname(rel).toLowerCase()) !== -1;
    if (!okPrefix || !okExt) return sendJson(res, 403, { error: "forbidden" });
    const abs = path.join(ROOT, rel);
    if (abs.indexOf(ROOT + path.sep) !== 0) return sendJson(res, 403, { error: "forbidden" });
    return serveFile(res, abs, "no-store");
  }

  //  everything below requires an admin session.
  if (!isAuthed(req)) return sendJson(res, 401, { error: "unauthorized" });

  if (pathname === "/api/v1/admin/logout" && method === "POST") {
    const header = req.headers.authorization || "";
    const m = /^Bearer\s+(.+)$/i.exec(header);
    if (m) sessions.delete(m[1]);
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/v1/admin/devices" && method === "GET") {
    const now = Date.now();
    const list = Object.keys(store.devices).map(function (id) {
      return publicDevice(store.devices[id], now);
    }).sort(function (a, b) { return b.lastSeen - a.lastSeen; });
    return sendJson(res, 200, { devices: list, count: list.length, now: now });
  }

  if (pathname === "/api/v1/admin/stats" && method === "GET") {
    const now = Date.now();
    const counts = { active: 0, trial: 0, expired: 0, revoked: 0 };
    const day = now - 24 * 3600 * 1000;
    let online = 0;
    Object.keys(store.devices).forEach(function (id) {
      const s = statusOf(store.devices[id], now);
      if (counts[s] != null) counts[s] += 1;
      if (store.devices[id].lastSeen >= day) online += 1;
    });
    return sendJson(res, 200, {
      total: Object.keys(store.devices).length,
      counts: counts,
      onlineLast24h: online
    });
  }

  // إجراء على جهاز: /api/v1/admin/devices/<id>
  const actionMatch = /^\/api\/v1\/admin\/devices\/([A-Za-z0-9_-]{8,64})$/.exec(pathname);
  if (actionMatch && method === "POST") {
    const d = findDevice(actionMatch[1]);
    if (!d) return sendJson(res, 404, { error: "not_found" });
    const body = await readJson(req);
    const action = String(body.action || "");
    const days = Math.min(3650, Math.max(1, Number(body.days) || ACTIVATION_DAYS));
    const now = Date.now();
    switch (action) {
      case "activate":
        d.expiresAt = Math.max(now, d.expiresAt || 0) + days * 86400000;
        d.status = null;
        break;
      case "extend":
        if (!d.expiresAt) d.expiresAt = now;
        d.expiresAt += days * 86400000;
        if (d.status === "revoked") d.status = null;
        break;
      case "revoke":
        d.status = "revoked";
        break;
      case "unrevoke":
        d.status = null;
        break;
      case "delete":
        delete store.devices[d.id];
        saveStore();
        return sendJson(res, 200, { ok: true, deleted: true });
      default:
        return sendJson(res, 400, { error: "bad_action" });
    }
    d.lastSeen = d.lastSeen || now;
    saveStore();
    return sendJson(res, 200, { ok: true, device: publicDevice(d, Date.now()) });
  }

  return sendJson(res, 404, { error: "not_found" });
}

/* ------------------------------------------------------------------ */
/* الخادم                                                              */
/* ------------------------------------------------------------------ */

const server = http.createServer(function (req, res) {
  let url;
  try {
    url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  } catch (e) {
    return send(res, 400, "Bad request", { "content-type": "text/plain; charset=utf-8" });
  }

  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");

  const pathname = url.pathname;
  const ip = req.socket.remoteAddress || "";

  try {
    if (pathname.indexOf("/api/") === 0) {
      handleApi(req, res, url, pathname, ip).catch(function (e) {
        console.error("خطأ API:", e && e.message);
        if (!res.headersSent) sendJson(res, 500, { error: "server_error" });
      });
      return;
    }
    if (pathname === "/admin" || pathname === "/admin/") return serveAdmin(res, "index.html");
    if (pathname.indexOf("/admin/") === 0) return serveAdmin(res, pathname.slice(7));
    return serveStatic(res, pathname);
  } catch (e) {
    console.error("خطأ:", e && e.message);
    if (!res.headersSent) sendJson(res, 500, { error: "server_error" });
  }
});

loadStore();
ensureSecrets();

server.listen(PORT, HOST, function () {
  console.log("سيرفر مصري / Masry يعمل على:");
  console.log("  الموقع:   http://localhost:" + PORT + "/");
  console.log("  الأدمن:   http://localhost:" + PORT + "/admin/");
  console.log("  العلامة:   " + WATERMARK + " · " + OWNER);
  console.log("  التجربة:  " + TRIAL_DAYS + " يوم");
});

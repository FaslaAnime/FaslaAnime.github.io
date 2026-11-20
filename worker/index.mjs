/*
 * Masry license & device admin — Cloudflare Worker.
 *
 * الموقع الثابت على GitHub Pages؛ هذا الـ Worker يخدم /api/* فقط.
 * التخزين في Cloudflare KV عبر الربط MASRY_KV.
 * بلا node:crypto — Web Crypto فقط (PBKDF2 للكلمات، HMAC للرموز).
 */

"use strict";

const SESSION_TTL = 12 * 60 * 60 * 1000;
const BLOB_TOKEN_TTL = 10 * 60 * 1000;
const ACTIVATION_DAYS = 30;
const PBKDF2_ITERATIONS = 120000;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const te = new TextEncoder();
const td = new TextDecoder();

/* ---------------- أدوات تشفير ---------------- */

function bufToHex(buf) {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}

function hexToBuf(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function b64url(bytes) {
  let bin = "";
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bufToHex(arr);
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", te.encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBuf(saltHex), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key, 512
  );
  return bufToHex(bits);
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", te.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(message));
  return bufToHex(sig);
}

async function hmacB64url(secret, message) {
  const key = await crypto.subtle.importKey("raw", te.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(message));
  return b64url(sig);
}

/* ---------------- التخزين (KV) ---------------- */

async function kvGet(env, key) {
  try { return await env.MASRY_KV.get(key); } catch (e) { return null; }
}

async function kvGetJson(env, key) {
  const raw = await kvGet(env, key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

async function kvPut(env, key, value) {
  await env.MASRY_KV.put(key, typeof value === "string" ? value : JSON.stringify(value));
}

async function kvDelete(env, key) {
  try { await env.MASRY_KV.delete(key); } catch (e) {}
}

async function kvList(env, prefix) {
  const out = [];
  let cursor;
  do {
    const res = await env.MASRY_KV.list({ prefix: prefix, limit: 1000, cursor: cursor });
    for (const k of res.keys) out.push(k.name);
    cursor = res.cursor;
  } while (cursor);
  return out;
}

/* ---------------- الإعدادات والحالة ---------------- */

function config(env) {
  return {
    watermark: env.WATERMARK || "sistro",
    owner: env.OWNER || "Mohamed_0_9",
    trialDays: Math.max(0, Number(env.TRIAL_DAYS || 3)),
    pagesOrigin: String(env.PAGES_ORIGIN || "").replace(/\/+$/, "")
  };
}

async function getSecret(env) {
  let secret = await kvGet(env, "secret");
  if (!secret) {
    secret = randomHex(32);
    await kvPut(env, "secret", secret);
  }
  return secret;
}

async function ensureAdmin(env) {
  let admin = await kvGetJson(env, "admin");
  if (admin && admin.hash) return admin;
  const password = env.ADMIN_PASSWORD;
  if (!password) return null; // غير مُعدّ — يفشل الدخول برسالة واضحة.
  const salt = randomHex(16);
  const hash = await pbkdf2(password, salt);
  admin = { algo: "pbkdf2-sha256", iterations: PBKDF2_ITERATIONS, salt: salt, hash: hash };
  await kvPut(env, "admin", admin);
  return admin;
}

async function checkPassword(env, password) {
  const admin = await ensureAdmin(env);
  if (!admin) return "not_configured";
  const hash = await pbkdf2(password || "", admin.salt);
  return timingSafeEqualStr(hash, admin.hash);
}

function trialEnd(d, cfg) {
  const days = d.trialDays != null ? d.trialDays : cfg.trialDays;
  return d.createdAt + days * 86400000;
}

function statusOf(d, cfg, now) {
  if (d.status === "revoked") return "revoked";
  if (d.expiresAt && now < d.expiresAt) return "active";
  if (now < trialEnd(d, cfg)) return "trial";
  return "expired";
}

function publicDevice(d, cfg, now) {
  const status = statusOf(d, cfg, now);
  return {
    deviceId: d.id,
    status: status,
    valid: status === "active" || status === "trial",
    firmware: d.firmware,
    lastSeen: d.lastSeen,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt || null,
    trialEndsAt: trialEnd(d, cfg),
    watermark: cfg.watermark,
    owner: cfg.owner
  };
}

async function issueSession(env) {
  const token = randomHex(24);
  await kvPut(env, "session:" + token, { exp: Date.now() + SESSION_TTL });
  return token;
}

async function isAuthed(env, request) {
  const header = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return false;
  const rec = await kvGetJson(env, "session:" + m[1]);
  if (!rec || !rec.exp || rec.exp < Date.now()) {
    if (rec) await kvDelete(env, "session:" + m[1]);
    return false;
  }
  return true;
}

async function issueBlobToken(env, secret, deviceId) {
  const exp = Date.now() + BLOB_TOKEN_TTL;
  const payload = deviceId + "." + exp;
  return payload + "." + (await hmacB64url(secret, payload));
}

async function checkBlobToken(env, secret, token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = parts[0] + "." + parts[1];
  const expected = await hmacB64url(secret, payload);
  if (!timingSafeEqualStr(parts[2], expected)) return null;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return parts[0];
}

/* ---------------- تحديد معدل الدخول ---------------- */

const attempts = new Map(); // لكل isolate — يُمسح عند إعادة التشغيل.

function loginThrottled(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { n: 0, reset: now + 60000 };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + 60000; }
  rec.n += 1;
  attempts.set(ip, rec);
  return rec.n > 5;
}

/* ---------------- الاستجابات ---------------- */

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function cors(extra) {
  const h = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "DENY"
  };
  if (extra) Object.assign(h, extra);
  return h;
}

async function readJson(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}

/* ---------------- المسارات ---------------- */

async function handleApi(request, env, url) {
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const cfg = config(env);

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (pathname === "/api/v1/config" && method === "GET") {
    return new Response(JSON.stringify({
      watermark: cfg.watermark,
      owner: cfg.owner,
      trialDays: cfg.trialDays
    }), { status: 200, headers: Object.assign(cors(), { "content-type": "application/json; charset=utf-8" }) });
  }

  if (pathname === "/api/v1/license" && method === "POST") {
    const body = await readJson(request);
    const id = String(body.deviceId || "").trim();
    if (!ID_RE.test(id)) return json({ error: "bad_device_id" }, 400);

    const now = Date.now();
    let d = await kvGetJson(env, "device:" + id);
    if (!d) {
      d = {
        id: id,
        firmware: String(body.firmware || "").slice(0, 32),
        ua: String(body.ua || "").slice(0, 300),
        createdAt: now,
        lastSeen: now,
        status: null,
        expiresAt: null,
        trialDays: cfg.trialDays
      };
    } else {
      if (body.firmware) d.firmware = String(body.firmware).slice(0, 32);
      if (body.ua) d.ua = String(body.ua).slice(0, 300);
      d.lastSeen = now;
    }
    await kvPut(env, "device:" + id, d);

    const secret = await getSecret(env);
    const out = publicDevice(d, cfg, now);
    out.blobToken = await issueBlobToken(env, secret, d.id);
    out.serverTime = now;
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: Object.assign(cors(), { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" })
    });
  }

  if (pathname === "/api/v1/admin/login" && method === "POST") {
    if (loginThrottled(ip)) return json({ error: "too_many_attempts" }, 429);
    const body = await readJson(request);
    const ok = await checkPassword(env, body.password || "");
    if (ok === "not_configured") return json({ error: "not_configured" }, 503);
    if (!ok) return json({ error: "bad_password" }, 401);
    const token = await issueSession(env);
    return json({ token: token });
  }

  // توصيل بايلود عبر الـ Worker برمز موقّع — متاح للأجهزة قبل بوابة الأدمن.
  const blobMatch = /^\/api\/v1\/blob\/(.+)$/.exec(pathname);
  if (blobMatch && method === "GET") {
    const secret = await getSecret(env);
    const deviceId = await checkBlobToken(env, secret, url.searchParams.get("token"));
    if (!deviceId) return json({ error: "bad_token" }, 401);
    const d = await kvGetJson(env, "device:" + deviceId);
    if (!d) return json({ error: "not_found" }, 404);
    if (!publicDevice(d, cfg, Date.now()).valid) return json({ error: "license_invalid" }, 403);

    const rel = decodeURIComponent(blobMatch[1]);
    const allowedPrefixes = ["jb/", "ag/", "bpf/", "dev/jb/", "dev/ag/", "dev/bpf/"];
    const okPrefix = allowedPrefixes.some((p) => rel.indexOf(p) === 0);
    const okExt = rel.endsWith(".bin");
    if (!okPrefix || !okExt || rel.includes("..")) return json({ error: "forbidden" }, 403);

    const target = cfg.pagesOrigin + "/" + rel;
    const upstream = await fetch(target, { method: "GET" });
    if (!upstream.ok) return json({ error: "upstream_" + upstream.status }, 502);
    const headers = cors({ "content-type": "application/octet-stream", "cache-control": "no-store" });
    return new Response(upstream.body, { status: 200, headers: headers });
  }

  // كل ما يلي يتطلب جلسة أدمن.
  if (!(await isAuthed(env, request))) return json({ error: "unauthorized" }, 401);

  if (pathname === "/api/v1/admin/logout" && method === "POST") {
    const m = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") || "");
    if (m) await kvDelete(env, "session:" + m[1]);
    return json({ ok: true });
  }

  if (pathname === "/api/v1/admin/devices" && method === "GET") {
    const keys = await kvList(env, "device:");
    const devices = [];
    for (const key of keys) {
      const d = await kvGetJson(env, key);
      if (d) devices.push(publicDevice(d, cfg, Date.now()));
    }
    devices.sort((a, b) => b.lastSeen - a.lastSeen);
    return json({ devices: devices, count: devices.length, now: Date.now() });
  }

  if (pathname === "/api/v1/admin/stats" && method === "GET") {
    const keys = await kvList(env, "device:");
    const counts = { active: 0, trial: 0, expired: 0, revoked: 0 };
    const day = Date.now() - 24 * 3600 * 1000;
    let online = 0;
    for (const key of keys) {
      const d = await kvGetJson(env, key);
      if (!d) continue;
      const s = statusOf(d, cfg, Date.now());
      if (counts[s] != null) counts[s] += 1;
      if (d.lastSeen >= day) online += 1;
    }
    return json({ total: keys.length, counts: counts, onlineLast24h: online });
  }

  const actionMatch = /^\/api\/v1\/admin\/devices\/([A-Za-z0-9_-]{8,64})$/.exec(pathname);
  if (actionMatch && method === "POST") {
    const d = await kvGetJson(env, "device:" + actionMatch[1]);
    if (!d) return json({ error: "not_found" }, 404);
    const body = await readJson(request);
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
        await kvDelete(env, "device:" + d.id);
        return json({ ok: true, deleted: true });
      default:
        return json({ error: "bad_action" }, 400);
    }
    await kvPut(env, "device:" + d.id, d);
    return json({ ok: true, device: publicDevice(d, cfg, Date.now()) });
  }

  return json({ error: "not_found" }, 404);
}

/* ---------------- نقطة الدخول ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url);
      }
      // أي مسار غير API: وجّه للموقع على Pages (إن وُجد) أو أرجع 404.
      const cfg = config(env);
      if (cfg.pagesOrigin) {
        return await fetch(cfg.pagesOrigin + url.pathname + url.search);
      }
      return new Response("Not found", { status: 404, headers: cors() });
    } catch (e) {
      return json({ error: "server_error", detail: String(e && e.message) }, 500);
    }
  }
};

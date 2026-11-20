/*
 * لوحة إدارة أجهزة مصري / Masry.
 * تتعامل مع الـ Worker عبر العنوان المكتوب في <meta name="masry-api">.
 * لا تملك أي قدرة مسح على الأجهزة.
 */
(function () {
  "use strict";

  var TOKEN_KEY = "masry_admin_token";
  var els = {
    loginView: document.getElementById("loginView"),
    dashView: document.getElementById("dashView"),
    loginForm: document.getElementById("loginForm"),
    password: document.getElementById("password"),
    loginError: document.getElementById("loginError"),
    logoutBtn: document.getElementById("logoutBtn"),
    stats: document.getElementById("stats"),
    rows: document.getElementById("rows"),
    empty: document.getElementById("empty"),
    search: document.getElementById("search")
  };

  // نفس الأصل (سيرفر محلي) أو رابط الـ Worker (GitHub Pages).
  function apiBase() {
    try {
      var qs = new URLSearchParams(location.search).get("api");
      if (qs) { localStorage.setItem("masry_api_base", qs); }
      var saved = localStorage.getItem("masry_api_base");
      if (saved) return saved;
    } catch (e) {}
    // نفس الأصل (سيرفر محلي) أو رابط الـ Worker (GitHub Pages).
    var meta = document.querySelector('meta[name="masry-api"]');
    var base = meta ? (meta.getAttribute("content") || "") : "";
    if (base && base.charAt(base.length - 1) !== "/") base += "/";
    return base;
  }

  function url(path) {
    return apiBase() + path.replace(/^\/+/, "");
  }

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }
  function setToken(value) {
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function headers(withBody) {
    var h = {};
    if (withBody) h["content-type"] = "application/json";
    if (token()) h.authorization = "Bearer " + token();
    return h;
  }

  async function api(path, options) {
    var res = await fetch(url(path), Object.assign({ headers: headers(options && options.body) }, options || {}));
    if (res.status === 401 && !path.endsWith("/login")) {
      setToken("");
      showLogin();
      throw new Error("unauthorized");
    }
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || ("http_" + res.status));
    return data;
  }

  function fmt(ts) {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return new Date(ts).toLocaleString();
    }
  }

  function statusLabel(s) {
    return { active: "مُفعّل", trial: "تجربة", expired: "منتهي", revoked: "مُبطَل", offline: "غير متصل" }[s] || s;
  }

  /* ---------------- العرض ---------------- */

  function showLogin() {
    els.loginView.hidden = false;
    els.dashView.hidden = true;
    els.logoutBtn.hidden = true;
  }

  function showDash() {
    els.loginView.hidden = true;
    els.dashView.hidden = false;
    els.logoutBtn.hidden = false;
  }

  function renderStats(stats) {
    var boxes = [
      { label: "إجمالي الأجهزة", value: stats.total, cls: "" },
      { label: "مُفعّلة", value: stats.counts.active, cls: "ok" },
      { label: "تجربة", value: stats.counts.trial, cls: "warn" },
      { label: "منتهية", value: stats.counts.expired, cls: "bad" },
      { label: "مُبطَلة", value: stats.counts.revoked, cls: "bad" },
      { label: "ظهرت آخر 24 ساعة", value: stats.onlineLast24h, cls: "" }
    ];
    els.stats.innerHTML = "";
    boxes.forEach(function (b) {
      var div = document.createElement("div");
      div.className = "stat " + b.cls;
      var strong = document.createElement("b");
      strong.textContent = String(b.value);
      var span = document.createElement("span");
      span.textContent = b.label;
      div.appendChild(strong);
      div.appendChild(span);
      els.stats.appendChild(div);
    });
  }

  function renderDevices(devices) {
    var q = (els.search.value || "").trim().toLowerCase();
    var list = devices.filter(function (d) {
      if (!q) return true;
      return (d.deviceId || "").toLowerCase().indexOf(q) !== -1 ||
             (d.firmware || "").toLowerCase().indexOf(q) !== -1 ||
             (d.status || "").toLowerCase().indexOf(q) !== -1;
    });

    els.rows.innerHTML = "";
    els.empty.hidden = list.length > 0;

    list.forEach(function (d) {
      var tr = document.createElement("tr");

      var tdId = document.createElement("td");
      tdId.className = "id";
      tdId.textContent = d.deviceId;

      var tdFw = document.createElement("td");
      tdFw.textContent = d.firmware || "—";

      var tdStatus = document.createElement("td");
      var badge = document.createElement("span");
      badge.className = "badge " + d.status;
      badge.textContent = statusLabel(d.status);
      tdStatus.appendChild(badge);

      var tdExp = document.createElement("td");
      tdExp.textContent = d.status === "active" ? fmt(d.expiresAt)
        : d.status === "trial" ? fmt(d.trialEndsAt) : "—";

      var tdSeen = document.createElement("td");
      tdSeen.textContent = fmt(d.lastSeen);

      var tdActions = document.createElement("td");
      tdActions.appendChild(makeBtn("تفعيل 30 يوم", "", function () { act(d.deviceId, "activate"); }));
      if (d.status === "active") {
        tdActions.appendChild(makeBtn("تمديد 30 يوم", "", function () { act(d.deviceId, "extend"); }));
      }
      if (d.status !== "revoked") {
        tdActions.appendChild(makeBtn("إبطال", "danger", function () { act(d.deviceId, "revoke"); }));
      } else {
        tdActions.appendChild(makeBtn("إلغاء الإبطال", "", function () { act(d.deviceId, "unrevoke"); }));
      }
      tdActions.appendChild(makeBtn("حذف", "danger", function () { act(d.deviceId, "delete"); }));

      tr.appendChild(tdId);
      tr.appendChild(tdFw);
      tr.appendChild(tdStatus);
      tr.appendChild(tdExp);
      tr.appendChild(tdSeen);
      tr.appendChild(tdActions);
      els.rows.appendChild(tr);
    });
  }

  function makeBtn(label, kind, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mini" + (kind ? " " + kind : "");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  /* ---------------- البيانات ---------------- */

  var cache = { devices: [] };

  async function refresh() {
    var stats = await api("/api/v1/admin/stats");
    var devices = await api("/api/v1/admin/devices");
    cache.devices = devices.devices || [];
    renderStats(stats);
    renderDevices(cache.devices);
  }

  async function act(id, action) {
    try {
      await api("/api/v1/admin/devices/" + encodeURIComponent(id), {
        method: "POST",
        body: JSON.stringify({ action: action })
      });
      await refresh();
    } catch (e) {
      alert("فشل الإجراء: " + e.message);
    }
  }

  /* ---------------- الجلسة ---------------- */

  els.loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    els.loginError.hidden = true;
    try {
      var data = await api("/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: els.password.value })
      });
      setToken(data.token);
      els.password.value = "";
      showDash();
      await refresh();
    } catch (err) {
      els.loginError.hidden = false;
    }
  });

  els.logoutBtn.addEventListener("click", async function () {
    try { await api("/api/v1/admin/logout", { method: "POST" }); } catch (e) {}
    setToken("");
    showLogin();
  });

  els.search.addEventListener("input", function () { renderDevices(cache.devices); });

  // دخول تلقائي لو توجد جلسة محفوظة.
  if (token()) {
    showDash();
    refresh().catch(function () { showLogin(); });
  } else {
    showLogin();
  }
})();

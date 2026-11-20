/*
 * بوابة الترخيص لهوست مصري / Masry.
 *
 * - تولّد معرّف جهاز ثابت في localStorage وتُسجّل الجهاز عند السيرفر.
 * - تعرض حالة الترخيص والعلامة (sistro) في الواجهة.
 * - تسمح بالتفعيل فقط للحالات: مُفعّل / تجربة / غير متصل (fail-open).
 *   الحالة «منتهي» أو «مُبطَل» تمنع زر التفعيل وتعرض رسالة تجديد.
 * - لا تمسح أي شيء على الجهاز مهما كانت الحالة.
 */
(function () {
  "use strict";

  var KEY = "masry_device_id";
  var ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

  function uid() {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID().replace(/-/g, "");
      }
    } catch (e) {}
    var out = "";
    var alphabet = "abcdef0123456789";
    for (var i = 0; i < 32; i++) {
      out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return out;
  }

  function deviceId() {
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored && ID_RE.test(stored)) return stored;
    var fresh = uid();
    try { localStorage.setItem(KEY, fresh); } catch (e) {}
    return fresh;
  }

  function apiBase() {
    // أولوية: معامل ?api= أو localStorage (للضبط اليدوي)، بعدين meta tag.
    try {
      var qs = new URLSearchParams(location.search).get("api");
      if (qs) { localStorage.setItem("masry_api_base", qs); }
      var saved = localStorage.getItem("masry_api_base");
      if (saved) return saved;
    } catch (e) {}
    var meta = document.querySelector('meta[name="masry-api"]');
    var base = meta ? (meta.getAttribute("content") || "") : "";
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function detectFirmware() {
    var ua = navigator.userAgent || "";
    var match = /PlayStation\s+4[\/ ](\d+)\.([0-9a-fA-F]+)/.exec(ua);
    if (!match) return "";
    var hex = match[2].toLowerCase();
    if (hex.length < 2) hex = "0" + hex;
    var minor = parseInt(hex, 16);
    return match[1] + "." + (minor < 10 ? "0" + minor : String(minor));
  }

  var STATE_LABELS = {
    active: "مُفعّل — صالح",
    trial: "تجربة — صالح",
    expired: "انتهى الاشتراك",
    revoked: "مُبطَل — تواصل مع الإدارة",
    offline: "غير متصل بالسيرفر"
  };

  function apply(state) {
    window.__MASRY_LICENSE__ = state;
    var watermark = (state && state.watermark) || "sistro";
    var owner = (state && state.owner) || "Mohamed_0_9";
    var status = (state && state.status) || "offline";

    setText("licenseName", watermark + " · " + owner);
    setText("licenseState", STATE_LABELS[status] || status);

    // إشعار للهَوست بتغيّر الحالة (dev.js يعرّف الـ hook قبل اكتمال الطلب).
    if (typeof window.__MASRY_ONSTATE__ === "function") {
      try { window.__MASRY_ONSTATE__(state); } catch (e) {}
    }
  }

  function register() {
    var payload = {
      deviceId: deviceId(),
      firmware: detectFirmware(),
      ua: navigator.userAgent || ""
    };
    // XHR بدل fetch: متصفح PS4 القديم لا يدعم fetch على كل النسخ.
    var done = false;
    function fail() {
      if (done) return;
      done = true;
      // بلا سيرفر (نسخة GitHub Pages) أو انقطاع: استمر كتجربة مفتوحة.
      apply({ status: "offline", valid: true, watermark: "sistro", owner: "Mohamed_0_9" });
    }
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", apiBase() + "api/v1/license", true);
      xhr.setRequestHeader("content-type", "application/json");
      xhr.timeout = 8000;
      xhr.onload = function () {
        if (done) return;
        if (xhr.status === 200 || xhr.status === 0) {
          done = true;
          try {
            apply(JSON.parse(xhr.responseText));
          } catch (e) { fail(); }
        } else {
          fail();
        }
      };
      xhr.onerror = fail;
      xhr.ontimeout = fail;
      xhr.send(JSON.stringify(payload));
    } catch (e) {
      fail();
    }
  }

  // dev.js يحتاج المعرّف لاحقاً (مثلاً لتوصيل البايلود عبر السيرفر).
  window.__MASRY_DEVICE__ = deviceId();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register);
  } else {
    register();
  }
})();

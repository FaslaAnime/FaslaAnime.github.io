/* Our own glue around the vendored AGPL chain. No exploit code lives here.
   This supplies the small host API the 4.50-5.07 chain expects from WebKitty. */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var isRun = /run\.html(?:\?|$)/.test(location.pathname);

  var payload = params.get("payload") || sessionStorage.getItem("masry_bpf_payload") || "hen";
  var fw = params.get("fw") || sessionStorage.getItem("masry_bpf_fw") || "";
  sessionStorage.setItem("masry_bpf_payload", payload);
  sessionStorage.setItem("masry_bpf_fw", fw);

  var bin = payload === "goldhen" ? "./goldhen.bin" : "./hen.bin";
  sessionStorage.setItem("payload_path", bin);

  var fwEl = document.getElementById("agFw");
  var payloadEl = document.getElementById("agPayload");
  if (fwEl) fwEl.textContent = fw || "من الجهاز";
  if (payloadEl) payloadEl.textContent = payload === "goldhen" ? "GoldHEN 2.4b18.14" : "PS4HEN";

  if (!isRun) {
    var msg = document.getElementById("agMsg");
    if (msg) msg.textContent = "جارٍ تشغيل السلسلة…";
    setTimeout(function () { location.replace("./run.html"); }, 700);
    return;
  }

  var outEl = document.getElementById("console");
  var stateEl = document.getElementById("state");

  function log(text, colour) {
    if (outEl) {
      outEl.textContent += String(text) + "\n";
      outEl.scrollTop = outEl.scrollHeight;
    }
    if (stateEl && colour !== "dim") stateEl.textContent = String(text).slice(0, 140);
  }
  window.log = log;

  window.jailbreakSuccess = function () {
    if (stateEl) stateEl.textContent = "تم تفعيل HEN. أغلق المتصفح وأعد فتحه";
    document.body.classList.add("done");
  };

  // Upstream reads the firmware straight from the PS4 user agent.
  window.getPs4FwVersion = function () {
    var m = /PlayStation\s+4[\/ ](\d+\.\d+)/.exec(navigator.userAgent || "");
    return m ? m[1] : null;
  };

  window.storage = {
    session: {
      set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
      get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
    }
  };

  function getScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("failed to load " + src)); };
      document.body.appendChild(s);
    });
  }
  window.getScript = getScript;

  var files = [
    "./main.js",
    "./common.js",
    "./rop.js",
    "./offsets.js",
    "./kernelExploit_bpf_double_free.js",
    "./userland.js",
    "./webkitExploit_stackUnitializedRead.js",
    "./webkitExploit_haveABadTime.js"
  ];

  files.reduce(function (chain, file) {
    return chain.then(function () { return getScript(file); });
  }, Promise.resolve()).then(function () {
    log("الملفات المحلية جاهزة. بدء السلسلة…", "dim");
    if (typeof window.startbpfDoubleFree === "function") {
      window.startbpfDoubleFree(0);
    } else {
      log("تعذر بدء السلسلة. أعد فتح الصفحة.", "red");
    }
  }).catch(function (e) {
    log("تعذر تحميل السلسلة: " + (e && e.message), "red");
  });
})();

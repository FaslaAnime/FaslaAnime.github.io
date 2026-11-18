/*
 * Masry bridge for the locally vendored PS4JB chains.
 * Written from scratch for this site. It only sets up storage, labels and the
 * hand-off to the unchanged chain files in the sibling folders.
 * No exploit, kernel or payload code lives here.
 */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var path = (location.pathname || "").replace(/\/+$/, "");
  var chain = "badhoist";
  if (/\/relapse\//.test(path)) chain = "relapse";
  else if (/\/cssfontface\//.test(path)) chain = "cssfontface";
  else if (/\/slopkit\//.test(path)) chain = "slopkit";
  else if (/\/psfree\//.test(path)) chain = "psfree";

  var fw = params.get("fw") || sessionStorage.getItem("masry_fw") || "";
  var payload = params.get("payload") || "goldhen";
  sessionStorage.setItem("masry_fw", fw);
  sessionStorage.setItem("masry_payload", payload);
  window.__ps4jbFw = fw || null;

  // cssfontface and slopkit ship their own payload.bin beside the chain.
  // relapse picks hen.bin / goldhen.bin from its own firmware table, but both
  // files are present in its folder as well so no path is ever missing.
  var payloadPath = "./payload.bin";
  if (chain === "relapse") payloadPath = payload === "hen" ? "./hen.bin" : "./goldhen.bin";
  sessionStorage.setItem("payload_path", payloadPath);

  // WebKitty's own chain selector. Explicit values stop a stale choice from a
  // previous visit selecting the wrong kernel exploit.
  if (chain === "cssfontface") localStorage.setItem("exploitChain", "4");
  if (chain === "slopkit") {
    var number = parseInt(String(fw).replace(".", ""), 10);
    localStorage.setItem("exploitChain", number >= 1250 && number <= 1300 ? "6" : "5");
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function appendText(id, text) {
    var el = document.getElementById(id);
    if (el) el.append(text);
  }
  function setState(text) {
    setText("state", text);
  }

  var label = "Slopkit Relapse";
  if (chain === "cssfontface") label = "CSSFontFace + Lapse";
  if (chain === "slopkit") {
    label = localStorage.getItem("exploitChain") === "6" ? "Slopkit Netctrl" : "Slopkit Lapse";
  }
  if (chain === "badhoist") label = "BadHoist";
  if (chain === "psfree") label = "PSFree + Lapse";

  setText("jbFw", fw || "من الجهاز");
  setText("jbChain", label);
  setText("jbPayload", chain === "relapse"
    ? (payload === "hen" ? "PS4HEN" : "GoldHEN")
    : "payload.bin من السلسلة");

  // Hooks the vendored chains look for before they report a result.
  window.isPayloadElf = function (p) {
    return /\.elf(?:\?|$)/i.test(String(p || ""));
  };
  window.log = function (message) {
    var sink = document.getElementById("log") || document.getElementById("console");
    if (sink) sink.append(String(message) + "\n");
  };
  window.jailbreakSuccess = function () {
    setState("تم تفعيل HEN. أغلق المتصفح وأعد فتحه");
    document.body.classList.add("done");
  };
  window.__ps4jbProgressComplete = function (ok) {
    if (ok === false) {
      setState("فشل التهكير، أعد تشغيل الجهاز");
      document.body.classList.add("fail");
      return;
    }
    setState("تم التفعيل. أغلق المتصفح وأعد فتحه");
    document.body.classList.add("done");
  };
  window.__ps4jbProgressFail = function () {
    setState("فشل التهكير، أعد تشغيل الجهاز");
    document.body.classList.add("fail");
  };

  if (chain === "cssfontface") {
    // main.js is a classic script loaded before this one; it only defines the
    // entry point, so the call belongs here after our storage is in place.
    if (typeof doCssFontFaceJailbreak === "function") {
      setState("جارٍ تشغيل السلسلة…");
      Promise.resolve(doCssFontFaceJailbreak()).then(function () {
        setState("انتهت السلسلة. أغلق المتصفح وأعد فتحه");
        document.body.classList.add("done");
      }).catch(function (error) {
        setState("فشل التهكير، أعد تشغيل الجهاز");
        appendText("console", (error && error.message ? error.message : String(error)) + "\n");
        document.body.classList.add("fail");
      });
    } else {
      setState("ملف السلسلة مش متحمل");
      document.body.classList.add("fail");
    }
    return;
  }

  if (chain === "psfree") {
    // bundle.js is loaded before this script and only defines the entry point.
    if (typeof doJailBreak === "function") {
      setState("جارٍ تشغيل السلسلة…");
      Promise.resolve(doJailBreak()).then(function () {
        setState("انتهت السلسلة. أغلق المتصفح وأعد فتحه");
        document.body.classList.add("done");
      }).catch(function (error) {
        setState("فشل التهكير، أعد تشغيل الجهاز");
        appendText("console", (error && error.message ? error.message : String(error)) + "\n");
        document.body.classList.add("fail");
      });
    } else {
      setState("ملف السلسلة مش متحمل");
      document.body.classList.add("fail");
    }
    return;
  }

  if (chain === "badhoist") {
    setState("مفيش سلسلة محلية لهذه النسخة");
    return;
  }

  // The relapse entry file is a module and runs on import, which happens after
  // this script has finished setting everything up.
  setState("جارٍ تشغيل السلسلة…");

  if (chain === "slopkit") {
    // Two chain files ship in this folder. Pick the one matching the firmware
    // range, then let it import its own unchanged sibling modules.
    var source = localStorage.getItem("exploitChain") === "6"
      ? "./chain_poops.js" : "./chain_lapse.js";
    var script = document.createElement("script");
    script.type = "module";
    script.src = source;
    script.onerror = function () {
      setState("فشل تحميل السلسلة");
      document.body.classList.add("fail");
    };
    document.head.appendChild(script);
  }
})();

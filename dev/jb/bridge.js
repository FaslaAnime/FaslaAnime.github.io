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
  // BadHoist ships only GoldHEN for 6.7x in this host.
  if (chain === "badhoist") payloadPath = "./goldhen.bin";
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
  if (chain === "badhoist") label = "BadHoist + Sleirsgoevy 6.7x";
  if (chain === "psfree") label = "PSFree + Lapse";

  setText("jbFw", fw || "من الجهاز");
  setText("jbChain", label);
  setText("jbPayload", chain === "relapse"
    ? (payload === "hen" ? "PS4HEN" : "GoldHEN")
    : chain === "badhoist" ? "GoldHEN" : "payload.bin من السلسلة");

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
    // 672entrypoint.js is loaded synchronously before this script and sets the
    // two flags below. The kernel file is the unchanged WebKitty 6.7x chain.
    var entry = window.entrypoint672_result || 0;
    var setup = window.exploitsetup672_result || 0;
    appendText("log", "entrypoint=" + entry + " setup=" + setup + "\n");
    if (entry < 1 || setup < 1) {
      setState("فشل تحضير السلسلة، حدّث الصفحة");
      appendText("log", "Userland entry point did not arm on this browser.\n");
      document.body.classList.add("fail");
      return;
    }

    setState("جارٍ تشغيل السلسلة…");
    var kernel = document.createElement("script");
    kernel.src = "./672kexploit.js";
    kernel.onerror = function () {
      setState("فشل تحميل السلسلة");
      document.body.classList.add("fail");
    };
    kernel.onload = function () {
      var result;
      try {
        result = KernelExploit672();
      } catch (error) {
        setState("فشل التهكير، أعد تشغيل الجهاز");
        appendText("log", (error && error.message ? error.message : String(error)) + "\n");
        document.body.classList.add("fail");
        return;
      }
      appendText("log", "KernelExploit672 -> " + result + "\n");
      // WebKitty treats 0, 91 and 179 as success (179 = already jailbroken).
      if (result !== 0 && result !== 91 && result !== 179) {
        setState("فشل التهكير، أعد تشغيل الجهاز");
        document.body.classList.add("fail");
        return;
      }
      try {
        getPayload672(payloadPath);
      } catch (error) {
        setState("فشل حقن البايلود");
        appendText("log", (error && error.message ? error.message : String(error)) + "\n");
        document.body.classList.add("fail");
        return;
      }
      // getPayload672 schedules LoadPayload672 internally after 500ms.
      setTimeout(function () { window.jailbreakSuccess(); }, 1200);
    };
    document.head.appendChild(kernel);
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

/* Our own glue around the vendored AGPL chain. No exploit code lives here. */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var isRun = /run\.html(?:\?|$)/.test(location.pathname);

  var payload = params.get("payload") || sessionStorage.getItem("masry_payload") || "goldhen";
  var fw = params.get("fw") || sessionStorage.getItem("masry_fw") || "";
  sessionStorage.setItem("masry_payload", payload);
  sessionStorage.setItem("masry_fw", fw);

  var bin = payload === "hen" ? "./hen.bin" : "./goldhen.bin";
  sessionStorage.setItem("payload_path", bin);

  var fwEl = document.getElementById("agFw");
  var payloadEl = document.getElementById("agPayload");
  if (fwEl) fwEl.textContent = fw || "من الجهاز";
  if (payloadEl) payloadEl.textContent = payload === "hen" ? "PS4HEN" : "GoldHEN 2.4b18.14";

  /* The landing page hands off inside this folder. The chain's own referrer
     guard requires that step before it will arm. */
  if (!isRun) {
    var msg = document.getElementById("agMsg");
    if (msg) msg.textContent = "جارٍ تشغيل السلسلة…";
    var keep = ["mem", "hx1400", "attempts", "verbose", "probe", "stop"];
    var qs = new URLSearchParams();
    keep.forEach(function (k) {
      var v = params.get(k);
      if (v !== null) qs.set(k, v);
    });
    var suffix = qs.toString() ? "?" + qs.toString() : "";
    setTimeout(function () { location.replace("./run.html" + suffix); }, 700);
    return;
  }

  /* The chain asks the host whether the chosen payload is an ELF file. */
  window.isPayloadElf = function (path) {
    return /\.elf(?:\?|$)/i.test(String(path || ""));
  };

  /* The chain calls this when HEN is up. */
  window.jailbreakSuccess = function () {
    var state = document.getElementById("state");
    if (state) state.textContent = "تم تفعيل HEN. أغلق المتصفح وأعد فتحه";
    document.body.classList.add("done");
  };
})();

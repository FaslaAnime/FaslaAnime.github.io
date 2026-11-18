/*
 * Dev host UI … written from scratch for this site.
 * It only builds a UI and hands off to the local engine files in jb/.
 * No exploit or payload code lives here.
 */
(function () {
  "use strict";

  // Chain mapping mirrors the local engine's own routing table (jb/index.html).
  var OPTIONS = [
    { fw: "6.00", label: "6.00 – 6.69", chain: "cssfontface", chainName: "CSSFontFace + Lapse",
      min: 600, max: 669, note: "أول نطاق يبدأ به المحرك المدمج." },
    { fw: "6.70", label: "6.70 – 6.72", chain: "badhoist", chainName: "BadHoist",
      min: 670, max: 672, note: "سلسلة مخصصة لهذه النسخة، مختلفة عن باقي 6.xx." },
    { fw: "7.00", label: "7.00 – 11.02", chain: "cssfontface", chainName: "CSSFontFace + Lapse",
      min: 700, max: 1102, note: "تغطية واسعة من متصفح السوني." },
    { fw: "11.03", label: "11.03 – 12.02", chain: "slopkit", chainName: "Slopkit Lapse",
      min: 1103, max: 1202, note: "سلسلة أحدث للنسخ المتوسطة." },
    { fw: "12.50", label: "12.50 – 13.00", chain: "slopkit", chainName: "Slopkit Netctrl",
      min: 1250, max: 1300, note: "يعتمد على أبحاث TheFloW." },
    { fw: "13.02", label: "13.02 / 13.04 / 13.50 / 13.52", chain: "relapse", chainName: "Slopkit Relapse",
      only: [1302, 1304, 1350, 1352], note: "السلسلة المُثبتة على النسخ الأحدث." }
  ];

  var deviceEl = document.getElementById("devDevice");
  var fwEl = document.getElementById("devFw");
  var chainEl = document.getElementById("devChain");
  var stateEl = document.getElementById("devState");
  var cacheEl = document.getElementById("devCache");
  var select = document.getElementById("fwSelect");
  var noteEl = document.getElementById("chainNote");
  var button = document.getElementById("startBtn");
  var cacheBtn = document.getElementById("cacheBtn");
  var logEl = document.getElementById("log");

  function detect() {
    var ua = navigator.userAgent || "";
    var isPs4 = /PlayStation\s+4/i.test(ua);
    var match = /PlayStation\s+4[\/ ](\d+)\.([0-9a-fA-F]+)/.exec(ua);
    var key = null;
    var number = null;

    if (match) {
      var hex = match[2].toLowerCase();
      if (hex.length < 2) hex = "0" + hex;
      var minor = parseInt(hex, 16);
      // PS4 reports the minor in hex. Show it in decimal so 13.34 reads as 13.52.
      key = match[1] + "." + (minor < 10 ? "0" + minor : String(minor));
      number = parseInt(match[1], 10) * 100 + minor;
    }

    var option = null;
    if (number !== null) {
      for (var i = 0; i < OPTIONS.length; i++) {
        var candidate = OPTIONS[i];
        if (candidate.only) {
          if (candidate.only.indexOf(number) !== -1) option = candidate;
        } else if (number >= candidate.min && number <= candidate.max) {
          option = candidate;
        }
        if (option) break;
      }
    }
    return { isPs4: isPs4, key: key, option: option };
  }

  var detected = detect();

  OPTIONS.forEach(function (option, index) {
    var el = document.createElement("option");
    el.value = String(index);
    el.textContent = option.label;
    select.appendChild(el);
  });

  function current() {
    return OPTIONS[Number(select.value)] || OPTIONS[0];
  }

  function update() {
    var option = current();
    chainEl.textContent = option.chain;
    noteEl.textContent = option.chainName + "، " + option.note;
  }

  deviceEl.textContent = detected.isPs4 ? "PlayStation 4" : "متصفح عادي";
  fwEl.textContent = detected.key || "…";
  if (detected.option) select.value = String(OPTIONS.indexOf(detected.option));
  stateEl.textContent = detected.isPs4
    ? (detected.option ? "جاهز للتجربة" : "نسخة غير مدعومة بالخريطة")
    : "للعرض فقط";
  cacheEl.textContent = detected.isPs4 ? "ينصح بالتجهيز أول مرة" : "للعرض فقط";
  update();

  select.addEventListener("change", update);

  cacheBtn.addEventListener("click", function () {
    logEl.textContent = "جارٍ تجهيز كاش المحرك المحلي...\n" +
      "كل الملفات والبايلودات بتتحفظ على الجهاز قبل التشغيل.";
    // The engine's own primer caches every asset, then hands off to the engine.
    window.location.href = "../jb/cache.html";
  });

  button.addEventListener("click", function () {
    var option = current();
    var fw = detected.option === option && detected.key ? detected.key : option.fw;
    logEl.textContent =
      "جارٍ تحضير المحرك المحلي...\n" +
      "النسخة: " + fw + "\n" +
      "السلسلة: " + option.chainName;
    window.location.href = "../jb/index.html?chain=" +
      encodeURIComponent(option.chain) + "&fw=" + encodeURIComponent(fw);
  });
})();

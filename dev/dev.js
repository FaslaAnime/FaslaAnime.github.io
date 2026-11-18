/*
 * Dev host UI … written from scratch for this site.
 * It only builds a UI and hands off to the local engine files in jb/.
 * No exploit or payload code lives here.
 */
(function () {
  "use strict";

  // Chain mapping mirrors the local engine's own routing table (jb/index.html).
  var OPTIONS = [
    { fw: "4.50", label: "4.50 – 5.07", chain: "bpf", chainName: "BPF Double Free",
      min: 450, max: 507, note: "أقدم سلسلة محلية، مخصّصة للنسخ القديمة." },
    { fw: "9.00", label: "9.00 / 9.60", chain: "psfree", chainName: "PSFree + Lapse",
      only: [900, 960], note: "النسخة الذهبية والنسخة 9.60." },
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
      only: [1302, 1304, 1350, 1352], note: "السلسلة المُثبتة على النسخ الأحدث." },
    { fw: "14.00", label: "14.00", chain: "afterglow", chainName: "Slopkit Afterglow",
      only: [1400], note: "سلسلة Afterglow مخزّنة محلياً بواجهة مصري." },
    { fw: "14.02", label: "14.02", chain: "afterglow", chainName: "Slopkit Afterglow",
      only: [1402], note: "أحدث نسخة مدعومة بالسلسلة المحلية." }
  ];

  var deviceEl = document.getElementById("devDevice");
  var fwEl = document.getElementById("devFw");
  var chainEl = document.getElementById("devChain");
  var stateEl = document.getElementById("devState");
  var cacheEl = document.getElementById("devCache");
  var select = document.getElementById("fwSelect");
  var noteEl = document.getElementById("chainNote");
  var button = document.getElementById("startBtn");
  var logEl = document.getElementById("log");
  var progressEl = document.getElementById("progress");
  var progressLabel = document.getElementById("progressLabel");
  var progressPct = document.getElementById("progressPct");
  var progressFill = document.getElementById("progressFill");
  var progressNote = document.getElementById("progressNote");

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

  var AC = window.applicationCache;
  var warming = false;

  function cacheLabel(status) {
    if (!AC) return "الكاش غير مدعوم في المتصفح ده";
    if (status === AC.UNCACHED) return "لم يُجهّز بعد";
    if (status === AC.IDLE) return "مُجهّز ومحفوظ على الجهاز";
    if (status === AC.CHECKING) return "جارٍ فحص التحديثات…";
    if (status === AC.DOWNLOADING) return "جارٍ التحميل…";
    if (status === AC.UPDATEREADY) return "تحديث جاهز للتثبيت";
    if (status === AC.OBSOLETE) return "الكاش غير متاح";
    return "حالة غير معروفة (" + status + ")";
  }

  function refreshCache() {
    if (warming) return;
    cacheEl.textContent = cacheLabel(AC ? AC.status : null);
  }

  function refreshState() {
    if (!detected.isPs4) {
      stateEl.textContent = "متصفح عادي، شغّله من PS4";
    } else if (!detected.option) {
      stateEl.textContent = "نسخة غير مدعومة محلياً";
    } else {
      stateEl.textContent = "جاهز للتشغيل";
    }
  }

  deviceEl.textContent = detected.isPs4 ? "PlayStation 4" : "متصفح عادي";
  fwEl.textContent = detected.key || "…";
  if (detected.option) select.value = String(OPTIONS.indexOf(detected.option));

  // A portal row can preselect a chain with ?chain=. The activation button
  // still performs the cache warm-up before handing off.
  var forced = new URLSearchParams(location.search).get("chain");
  if (forced) {
    for (var c = 0; c < OPTIONS.length; c++) {
      if (OPTIONS[c].chain === forced) { select.value = String(c); break; }
    }
  }
  refreshState();
  refreshCache();
  update();

  if (AC) {
    ["checking", "downloading", "progress", "cached",
      "updateready", "noupdate", "obsolete", "error"].forEach(function (evt) {
      AC.addEventListener(evt, function () {
        if (evt === "updateready" && AC.swapCache) {
          try { AC.swapCache(); } catch (e) {}
        }
        refreshCache();
      }, false);
    });
  }

  select.addEventListener("change", update);

  // The warm-up list is read from the real manifests so it stays in step with
  // the files on disk. These fallbacks keep the flow alive if a manifest read
  // itself fails (for example on a flaky first connection).
  var DEV_FALLBACK = [
    "index.html", "dev.css", "dev.js",
    "ag/index.html", "ag/run.html", "ag/ag.css", "ag/bridge.js",
    "ag/jb.js", "ag/afterglow.js", "ag/core.js", "ag/mem.js",
    "ag/int64.js", "ag/ps4_offsets.js", "ag/goldhen.bin", "ag/hen.bin",
    "bpf/index.html", "bpf/run.html", "bpf/bridge.js", "bpf/main.js",
    "bpf/common.js", "bpf/rop.js", "bpf/offsets.js",
    "bpf/kernelExploit_bpf_double_free.js", "bpf/userland.js",
    "bpf/webkitExploit_stackUnitializedRead.js", "bpf/webkitExploit_haveABadTime.js",
    "bpf/hen.bin", "bpf/goldhen.bin"
  ];
  var JB_FALLBACK = [
    "jb/bridge.js",
    "jb/relapse/index.html", "jb/relapse/jb.js", "jb/relapse/core.js",
    "jb/relapse/mem.js", "jb/relapse/int64.js", "jb/relapse/ps4_offsets.js",
    "jb/relapse/hen.bin", "jb/relapse/goldhen.bin", "jb/relapse/ps4debug.bin",
    "jb/cssfontface/index.html", "jb/cssfontface/main.js",
    "jb/cssfontface/payload.bin",
    "jb/slopkit/index.html", "jb/slopkit/chain_lapse.js",
    "jb/slopkit/chain_poops.js", "jb/slopkit/payload.bin",
    "jb/psfree/index.html", "jb/psfree/bundle.js", "jb/psfree/payload.bin",
    "jb/badhoist/index.html", "jb/badhoist/672entrypoint.js",
    "jb/badhoist/672kexploit.js", "jb/badhoist/goldhen.bin"
  ];

  function parseManifest(text) {
    var out = [];
    var inCache = false;
    (text || "").split(/\r?\n/).forEach(function (line) {
      var t = line.trim();
      if (!t || /^#/.test(t)) return;
      if (/^(CACHE|NETWORK|FALLBACK):/i.test(t)) {
        inCache = /^CACHE:/i.test(t);
        return;
      }
      if (inCache) out.push(t.split(/\s+/)[0]);
    });
    return out;
  }

  function readManifest(url, prefix, fallback) {
    return new Promise(function (resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 0) {
            var files = parseManifest(xhr.responseText).map(function (f) { return prefix + f; });
            resolve(files.length ? files : fallback);
          } else {
            resolve(fallback);
          }
        };
        xhr.onerror = function () { resolve(fallback); };
        xhr.send();
      } catch (e) {
        resolve(fallback);
      }
    });
  }

  function targetFor(option, fw) {
    if (option.chain === "afterglow") {
      return "./ag/index.html?fw=" + encodeURIComponent(fw) + "&payload=goldhen";
    }
    if (option.chain === "bpf") {
      return "./bpf/index.html?fw=" + encodeURIComponent(fw) + "&payload=hen";
    }
    // Every chain now lives behind a Masry page inside dev/, exactly like
    // Afterglow and BPF. The unchanged chain files sit beside that page.
    var payload = option.chain === "relapse" && fw !== "13.52" ? "hen" : "goldhen";
    return "./jb/" + encodeURIComponent(option.chain) + "/index.html?fw=" +
      encodeURIComponent(fw) + "&payload=" + payload;
  }

  // Fetch every asset before handing off. XHR progress gives a real byte
  // percentage; when a server omits Content-Length we fall back to a per-file
  // fraction so the bar still moves. Files already on the device come back
  // from cache and finish quickly.
  function warm(files, onProgress) {
    return new Promise(function (resolve) {
      if (!files.length) { onProgress(100, 0, 0); resolve(); return; }
      var frac = [];
      for (var i = 0; i < files.length; i++) frac.push(0);
      var done = 0;
      var next = 0;
      var limit = Math.min(6, files.length);

      function report() {
        var sum = 0;
        for (var i = 0; i < frac.length; i++) sum += frac[i];
        onProgress(Math.min(100, Math.round(sum / files.length * 100)), done, files.length);
      }

      function pump() {
        if (next >= files.length) return;
        var idx = next++;
        try {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", files[idx], true);
          xhr.onprogress = function (e) {
            if (e.lengthComputable && e.total > 0) {
              frac[idx] = Math.min(0.99, e.loaded / e.total);
            } else {
              frac[idx] = Math.max(frac[idx], 0.4);
            }
            report();
          };
          function finish() {
            if (frac[idx] >= 1) return;
            frac[idx] = 1;
            done++;
            report();
            if (done === files.length) resolve(); else pump();
          }
          xhr.onload = finish;
          xhr.onerror = finish;
          xhr.ontimeout = finish;
          xhr.send();
        } catch (e) {
          frac[idx] = 1;
          done++;
          report();
          if (done === files.length) resolve(); else pump();
        }
      }
      for (var j = 0; j < limit; j++) pump();
    });
  }

  button.addEventListener("click", function () {
    var option = current();
    var fw = detected.option === option && detected.key ? detected.key : option.fw;
    var target = targetFor(option, fw);
    var started = Date.now();

    warming = true;
    button.disabled = true;
    button.textContent = "جارٍ التحميل…";
    progressEl.hidden = false;
    progressLabel.textContent = "جارٍ تجهيز الكاش…";
    progressPct.textContent = "0%";
    progressFill.style.width = "0%";
    progressNote.textContent = "جارٍ قراءة قائمة الملفات…";
    logEl.textContent = "جارٍ تحميل الكاش قبل التفعيل…\n" +
      "النسخة: " + fw + "\n" +
      "السلسلة: " + option.chainName;

    function setProgress(pct, done, total) {
      progressPct.textContent = pct + "%";
      progressFill.style.width = pct + "%";
      progressLabel.textContent = pct < 100 ? "جارٍ تحميل الكاش…" : "الكاش جاهز، بدء التهكير…";
      progressNote.textContent = total
        ? "تم تحميل " + done + " من " + total + " ملف · متبقي " + (total - done)
        : "لا توجد ملفات إضافية";
      cacheEl.textContent = pct < 100 ? "جارٍ التحميل " + pct + "%" : "مُجهّز ومحفوظ على الجهاز";
    }

    // One manifest is now the single source of truth: every chain file is
    // vendored under dev/, so there is no second host and no second list.
    readManifest("dev.appcache", "", DEV_FALLBACK).then(function (listed) {
      var seen = {};
      var files = [];
      listed.concat(JB_FALLBACK).forEach(function (f) {
        if (!seen[f]) { seen[f] = 1; files.push(f); }
      });
      logEl.textContent += "\nملفات الكاش: " + files.length;
      return warm(files, setProgress);
    }).then(function () {
      progressLabel.textContent = "الكاش جاهز، بدء التهكير…";
      logEl.textContent += "\nالكاش جاهز، بدء التهكير…";
      var wait = Math.max(0, 450 - (Date.now() - started));
      setTimeout(function () { window.location.href = target; }, wait);
    });
  });
})();

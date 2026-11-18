(function () {
  "use strict";

  var bandsEl = document.getElementById("bands");
  var tabsEl = document.getElementById("eraTabs");
  var selRange = document.getElementById("selRange");
  var selChain = document.getElementById("selChain");
  var selAction = document.getElementById("selAction");
  var frameFw = document.getElementById("frameFw");
  var frameChain = document.getElementById("frameChain");
  var reelTrack = document.getElementById("reelTrack");
  var dots = document.querySelectorAll(".reel-dots i");
  var stepViews = document.querySelectorAll(".step-view");
  var stepTag = document.getElementById("stepTag");

  var selected = 3;
  var activeEra = "all";

  function renderTabs() {
    var all = [{ id: "all", label: "الكل" }].concat(ERAS);
    tabsEl.innerHTML = all.map(function (era) {
      return '<button class="era-tab' + (era.id === activeEra ? " is-active" : "") +
        '" data-era="' + era.id + '" type="button"><strong>' + era.label + "</strong><small>" +
        (era.id === "all" ? "كل النطاقات" : "نسخ") + "</small></button>";
    }).join("");
  }

  function renderBands() {
    var list = FIRMWARES.map(function (item, index) { return { item: item, index: index }; })
      .filter(function (entry) { return activeEra === "all" || entry.item.era === activeEra; });

    bandsEl.innerHTML = list.map(function (entry) {
      var item = entry.item;
      return '<div class="band' + (entry.index === selected ? " is-selected" : "") +
        '" role="listitem" tabindex="0" data-index="' + entry.index + '">' +
        '<span class="band-range">' + item.range + "</span>" +
        '<span class="band-chain">' + item.chainName + "</span>" +
        '<span class="band-note">' + item.note + "</span>" +
        '<span class="band-state">' + item.state + "</span></div>";
    }).join("");
  }

  function selectFirmware(index) {
    var item = FIRMWARES[index];
    if (!item) return;
    selected = index;
    selRange.textContent = item.range;
    selChain.textContent = item.chainName;
    selAction.href = "jb/index.html?chain=" + item.chain;
    frameFw.textContent = item.range;
    frameChain.textContent = item.chain;
    Array.prototype.forEach.call(bandsEl.querySelectorAll(".band"), function (band) {
      band.classList.toggle("is-selected", Number(band.dataset.index) === index);
    });
  }

  tabsEl.addEventListener("click", function (event) {
    var tab = event.target.closest(".era-tab");
    if (!tab) return;
    activeEra = tab.dataset.era;
    renderTabs();
    renderBands();
  });

  bandsEl.addEventListener("click", function (event) {
    var band = event.target.closest(".band");
    if (band) selectFirmware(Number(band.dataset.index));
  });

  bandsEl.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var band = event.target.closest(".band");
    if (!band) return;
    event.preventDefault();
    selectFirmware(Number(band.dataset.index));
  });

  /* The reel: the centre frame advances with the page scroll. */
  var hero = document.querySelector(".hero");
  var currentFrame = -1;
  function updateReel() {
    var rect = hero.getBoundingClientRect();
    var travel = hero.offsetHeight - window.innerHeight;
    var progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
    var index = Math.min(2, Math.floor(progress * 3));
    if (index === currentFrame) return;
    currentFrame = index;
    reelTrack.style.transform = "translateY(-" + (index * 100) + "%)";
    Array.prototype.forEach.call(dots, function (dot, i) { dot.classList.toggle("on", i === index); });
  }

  /* The pinned panel follows whichever preparation step is being read. */
  var stepArticles = document.querySelectorAll(".step");
  var stepLabels = ["التحضير", "المتصفح", "التفعيل"];
  function setStep(index) {
    Array.prototype.forEach.call(stepViews, function (view, i) {
      view.classList.toggle("is-current", i === index);
    });
    if (stepTag) stepTag.textContent = stepLabels[index] || stepLabels[0];
  }

  if ("IntersectionObserver" in window) {
    var stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setStep(Number(entry.target.dataset.step));
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    Array.prototype.forEach.call(stepArticles, function (article) { stepObserver.observe(article); });
  }

  /* Section entrances. Elements are only marked when script runs, so the
     page stays fully readable if this file fails to load. */
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var targets = document.querySelectorAll(
      ".section h2, .section-head .btn, .figure, .step, .faq, .selection, .filelist, .engine-intro p, .faq-list"
    );
    Array.prototype.forEach.call(targets, function (el) { el.classList.add("reveal"); });
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = Array.prototype.filter.call(entry.target.parentNode.children, function (child) {
          return child.classList.contains("reveal");
        });
        var order = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = Math.max(0, order) * 70 + "ms";
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(targets, function (el) { revealObserver.observe(el); });
  }

  function onScroll() {
    updateReel();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  renderTabs();
  renderBands();
  selectFirmware(selected);
  setStep(0);
  onScroll();
})();

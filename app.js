(function () {
  "use strict";

  var groupsEl = document.getElementById("groups");
  var selRange = document.getElementById("selRange");
  var selChain = document.getElementById("selChain");
  var selAction = document.getElementById("selAction");
  var heroFw = document.getElementById("heroFw");
  var heroChain = document.getElementById("heroChain");

  var selected = 3;

  function render() {
    groupsEl.innerHTML = ERAS.map(function (era) {
      var rows = FIRMWARES.map(function (item, index) { return { item: item, index: index }; })
        .filter(function (entry) { return entry.item.era === era.id; });
      if (!rows.length) return "";

      return '<div class="group"><div class="group-label">' +
        '<img src="assets/dualshock-4.jpg" width="16" height="16" alt="" aria-hidden="true" loading="lazy">' +
        "<span>" + era.label + "</span></div>" +
        rows.map(function (entry) {
          return '<div class="row' + (entry.index === selected ? " is-selected" : "") +
            '" role="button" tabindex="0" data-index="' + entry.index + '">' +
            '<span class="row-main"><i class="dot" aria-hidden="true"></i>' +
            '<span class="row-range">' + entry.item.range + "</span>" +
            '<span class="row-chain">' + entry.item.chainName + "</span></span>" +
            '<span class="row-meta">' + entry.item.state + "</span></div>";
        }).join("") + "</div>";
    }).join("");
  }

  function select(index) {
    var item = FIRMWARES[index];
    if (!item) return;
    selected = index;
    selRange.textContent = item.range;
    selChain.textContent = item.chainName;
    selAction.href = "jb/index.html?chain=" + item.chain;
    heroFw.textContent = item.range;
    heroChain.textContent = item.chain;
    Array.prototype.forEach.call(groupsEl.querySelectorAll(".row"), function (row) {
      row.classList.toggle("is-selected", Number(row.dataset.index) === index);
    });
  }

  groupsEl.addEventListener("click", function (event) {
    var row = event.target.closest(".row");
    if (row) select(Number(row.dataset.index));
  });

  groupsEl.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var row = event.target.closest(".row");
    if (!row) return;
    event.preventDefault();
    select(Number(row.dataset.index));
  });

  /* A single quiet fade for the few focal pieces. No scroll animations. */
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var quiet = document.querySelectorAll(".hero h1, .hero .lead, .hero .actions, .panel, .block h2, .activate-line");
    Array.prototype.forEach.call(quiet, function (el) { el.classList.add("quiet-in"); });
    var fade = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("seen");
        fade.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(quiet, function (el) { fade.observe(el); });
  }

  render();
  select(selected);
})();

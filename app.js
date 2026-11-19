(function () {
  "use strict";

  var groupsEl = document.getElementById("groups");
  var heroFw = document.getElementById("heroFw");
  var heroChain = document.getElementById("heroChain");

  // Every firmware row is a direct link to the embedded engine with its chain preset.
  function render() {
    groupsEl.innerHTML = ERAS.map(function (era) {
      var rows = FIRMWARES.map(function (item, index) { return { item: item, index: index }; })
        .filter(function (entry) { return entry.item.era === era.id; });
      if (!rows.length) return "";

      return '<div class="group"><div class="group-label">' +
        '<img src="assets/dualshock-4.jpg" width="16" height="16" alt="" aria-hidden="true" loading="lazy">' +
        "<span>" + era.label + "</span></div>" +
        rows.map(function (entry) {
          return '<a class="row" href="dev/index.html?chain=' + entry.item.chain +
            '" data-index="' + entry.index + '" aria-label="تفعيل ' + entry.item.range + '">' +
            '<span class="row-main">' +
            '<span class="row-range">' + entry.item.range + "</span>" +
            '<span class="row-chain">' + entry.item.chainName + "</span></span>" +
            '<span class="row-meta">' + entry.item.state +
            '<span class="row-go" aria-hidden="true"> ←</span></span>' +
            "</a>";
        }).join("") + "</div>";
    }).join("");
  }

  // The small status panel previews the version under the pointer or keyboard focus.
  function preview(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var row = target.closest(".row");
    if (!row) return;
    var item = FIRMWARES[Number(row.dataset.index)];
    if (!item) return;
    heroFw.textContent = item.range;
    heroChain.textContent = item.chain;
  }

  // mouseover/focusin work on the older WebKit build in the PS4 browser;
  // pointerover is kept for modern browsers.
  groupsEl.addEventListener("mouseover", preview);
  groupsEl.addEventListener("pointerover", preview);
  groupsEl.addEventListener("focusin", preview);

  render();
})();

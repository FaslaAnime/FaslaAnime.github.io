const cardsEl = document.getElementById("cards");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("searchInput");
const filtersEl = document.getElementById("filters");
const sortBtn = document.getElementById("sortBtn");
const sortLabel = document.getElementById("sortLabel");
const countEl = document.getElementById("resultCount");

let activeFilter = "all";
let query = "";
let newestFirst = false;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
}

function cardTemplate(item) {
  const tags = item.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
  const links = item.links.map(
    (link) => `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener">${escapeHTML(link.label)} ↗</a>`
  ).join("");
  return `
    <article class="card${item.featured ? " card--featured" : ""}" style="--accent:${escapeHTML(item.accent)}">
      <div class="card-top">
        <div class="fw" dir="ltr">${escapeHTML(item.fw)}</div>
        <div class="kind">${escapeHTML(CATEGORY_LABELS[item.category] || item.category)}</div>
      </div>
      <h3>${escapeHTML(item.name)}</h3>
      <div class="en" dir="ltr">${escapeHTML(item.en)}</div>
      <p class="desc">${escapeHTML(item.desc)}</p>
      <div class="meta">
        <span>${escapeHTML(item.year)}</span>
        <span>${escapeHTML(item.credit)}</span>
        ${tags}
      </div>
      <div class="card-links">${links}</div>
    </article>`;
}

function render() {
  const list = RELEASES
    .filter((item) => activeFilter === "all" || item.category === activeFilter)
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize([item.fw, item.name, item.en, item.desc, item.credit, ...item.tags].join(" "));
      return haystack.includes(normalize(query));
    })
    .sort((a, b) => {
      const n = (fw) => parseFloat(String(fw).replace(/[^\d.]/g, "").split(".")[0] + "." + (String(fw).match(/\d+/g)?.[1] || "0"));
      return newestFirst ? n(b.fw) - n(a.fw) : n(a.fw) - n(b.fw);
    });

  cardsEl.innerHTML = list.map(cardTemplate).join("");
  emptyEl.hidden = list.length > 0;
  countEl.textContent = `${list.length} من ${RELEASES.length} إصدار`;
}

filtersEl.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  filtersEl.querySelectorAll(".chip").forEach((el) => el.classList.remove("is-active"));
  chip.classList.add("is-active");
  activeFilter = chip.dataset.filter;
  render();
});

searchEl.addEventListener("input", (event) => {
  query = event.target.value.trim();
  render();
});

sortBtn.addEventListener("click", () => {
  newestFirst = !newestFirst;
  sortLabel.textContent = newestFirst ? "الأحدث أولاً" : "الأقدم أولاً";
  render();
});

render();

/* =========================================================================
   AKA — Documentation page (PDF library rendered from the DOCS array)
   -------------------------------------------------------------------------
   HOW TO ADD A DOCUMENT:
   1. Put the PDF file in the docs/ folder (e.g. docs/aka-company-profile.pdf).
   2. Add one object to the DOCS array below.

     title    - document name shown on the card (required)
     category - "profile" (company profile), "certification",
                "manual" (device user manual), or "catalog" (required —
                drives the filter buttons; only categories that actually
                have documents get a button)
     file     - path to the PDF (required), e.g. "docs/iso-13485.pdf"
     desc     - (optional) one-line description shown under the title
     size     - (optional) e.g. "2.4 MB" — shown in the meta line
     lang     - (optional) e.g. "EN", "AR", "EN/AR"

   EXAMPLE (delete the leading // to activate):
   // { title: "AKA Company Profile", category: "profile",
   //   file: "docs/aka-company-profile.pdf", size: "3.1 MB", lang: "EN/AR",
   //   desc: "Who we are, what we supply, and the manufacturers we represent." },
   ========================================================================= */

const DOCS = [
  // Add your documents here (see the instructions above).
];

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("doc-grid");
  const toolbar = document.getElementById("doc-toolbar");
  const filtersWrap = document.getElementById("doc-filters");
  const search = document.getElementById("doc-search");
  const empty = document.getElementById("doc-empty");
  const soonPanel = document.getElementById("doc-soon");
  if (!grid || !filtersWrap) return;

  // NOTE: I18N is a top-level const (not a window property), so feature-detect
  // it with typeof — window.I18N would always be undefined.
  const t = (k) => (typeof I18N !== "undefined" ? I18N.t(k) : k);

  if (DOCS.length === 0) {
    if (soonPanel) soonPanel.style.display = "";
    return; // nothing else to wire up
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // One SVG icon per category, drawn in the site's line-icon style.
  const CAT_ICON = {
    profile: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M2 21h20M8 7h4M8 11h4M8 15h4"/>',
    certification: '<circle cx="12" cy="9" r="5"/><path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7"/>',
    manual: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22H20v-2.5"/><path d="M9 7h6"/>',
    catalog: '<path d="M3 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3Z"/><path d="M21 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8Z"/>',
  };

  // Filter buttons: "All" + one per category that actually has documents.
  const categories = [...new Set(DOCS.map((d) => d.category))];
  filtersWrap.innerHTML =
    `<button class="product-filter is-active" type="button" data-filter="all"
       data-i18n="docs.filter.all">${t("docs.filter.all")}</button>` +
    categories
      .map(
        (c) =>
          `<button class="product-filter" type="button" data-filter="${esc(c)}"
             data-i18n="docs.filter.${esc(c)}">${t("docs.filter." + c)}</button>`
      )
      .join("");

  grid.innerHTML = DOCS.map((d) => {
    const meta = [t("docs.filter." + d.category), d.size, d.lang]
      .filter(Boolean)
      .map(esc)
      .join(" · ");
    return `
    <article class="doc-card" data-category="${esc(d.category)}"
      data-search="${esc((d.title + " " + (d.desc || "")).toLowerCase())}">
      <span class="doc-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${CAT_ICON[d.category] || CAT_ICON.catalog}</svg>
      </span>
      <div class="doc-card__text">
        <h3 class="doc-card__title">${esc(d.title)}</h3>
        ${d.desc ? `<p class="doc-card__desc">${esc(d.desc)}</p>` : ""}
        <p class="doc-card__meta">${meta}</p>
      </div>
      <div class="doc-card__actions">
        <a class="doc-card__view" href="${esc(d.file)}" target="_blank" rel="noopener"
          data-i18n="docs.view">${t("docs.view")}</a>
        <a class="btn" href="${esc(d.file)}" download data-i18n="docs.download">${t("docs.download")}</a>
      </div>
    </article>`;
  }).join("");

  if (toolbar) toolbar.style.display = "";
  I18N.apply(); // translate the freshly injected buttons and cards

  let activeCategory = "all";

  function refresh() {
    const q = (search?.value || "").trim().toLowerCase();
    let shown = 0;
    grid.querySelectorAll(".doc-card").forEach((card) => {
      const matchCat = activeCategory === "all" || card.dataset.category === activeCategory;
      const matchText = !q || card.dataset.search.includes(q);
      const show = matchCat && matchText;
      card.style.display = show ? "" : "none";
      if (show) shown++;
    });
    if (empty) empty.style.display = shown === 0 ? "" : "none";
  }

  filtersWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-filter");
    if (!btn) return;
    activeCategory = btn.dataset.filter;
    filtersWrap
      .querySelectorAll(".product-filter")
      .forEach((b) => b.classList.toggle("is-active", b === btn));
    refresh();
  });

  if (search) search.addEventListener("input", refresh);
});

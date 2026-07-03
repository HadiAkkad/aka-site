/* =========================================================================
   AKA — Partners page (NGO slideshow + manufacturers grid from the CMS)
   -------------------------------------------------------------------------
   Partners are managed from the admin panel (/admin/content → Partners tab):
     kind = "ngo"          -> a slide in the NGO slideshow
     kind = "manufacturer" -> a card in the "Our partners" grid

   Bilingual: descriptions are <span data-bi-en data-bi-ar> filled via
   textContent; an attribute observer on <html lang> swaps them in place
   when the visitor toggles EN/العربية (no re-render, so the slideshow
   keeps its position and dots).
   ========================================================================= */

(() => {
  const API = "https://aka-api.hadi-alakkadd.workers.dev";

  const esc = (s) =>
    String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const bi = (en, ar) =>
    `<span data-bi-en="${esc(en || "")}" data-bi-ar="${esc(ar || en || "")}"></span>`;

  function applyBi(root) {
    const isAr = document.documentElement.lang === "ar";
    root.querySelectorAll("[data-bi-en]").forEach((el) => {
      el.textContent = isAr ? el.dataset.biAr : el.dataset.biEn;
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const track = document.getElementById("ngo-track");
    const grid = document.getElementById("partners-grid");
    if (!track && !grid) return;

    let items = [];
    try {
      const res = await fetch(`${API}/content?type=partners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) items = data;
      }
    } catch (e) {
      /* offline — sections stay empty */
    }
    if (!items.length) return;

    const t = (k) => (typeof I18N !== "undefined" ? I18N.t(k) : k);
    const visit = (url) =>
      url
        ? `<a class="partner__link" href="${esc(url)}" target="_blank" rel="noopener" data-i18n="partner.visit">${t("partner.visit")}</a>`
        : "";

    const ngos = items.filter((p) => p.kind === "ngo");
    const makers = items.filter((p) => p.kind === "manufacturer");

    if (track && ngos.length) {
      track.innerHTML = ngos
        .map(
          (p) => `
        <div class="ngo-slide">
          ${p.logo ? `<img class="ngo-slide__logo" src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy" decoding="async" />` : ""}
          <h3>${esc(p.name)}</h3>
          <p>${bi(p.desc, p.desc_ar)}</p>
          ${visit(p.website)}
        </div>`
        )
        .join("");
    }

    if (grid && makers.length) {
      grid.innerHTML = makers
        .map(
          (p) => `
        <div class="partner">
          ${p.logo ? `<img class="partner__logo" src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy" decoding="async" />` : ""}
          <h3>${esc(p.name)}</h3>
          <p>${bi(p.desc, p.desc_ar)}</p>
          ${visit(p.website)}
        </div>`
        )
        .join("");
    }

    applyBi(document.body);
    if (typeof I18N !== "undefined") I18N.apply(); // translate "Visit website" links
    // The slideshow was skipped on page load (empty track) — start it now.
    if (typeof initNgoSlideshow === "function") initNgoSlideshow();

    new MutationObserver(() => applyBi(document.body)).observe(
      document.documentElement,
      { attributes: true, attributeFilter: ["lang"] }
    );
  });
})();

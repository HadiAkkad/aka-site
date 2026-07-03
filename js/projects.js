/* =========================================================================
   AKA — Projects page (hospital timeline rendered from the content manager)
   -------------------------------------------------------------------------
   Projects are managed from the admin panel (/admin/content → Projects tab)
   and loaded from the backend at runtime — nothing to edit here.

   Bilingual: each text value is rendered as a <span data-bi-en data-bi-ar>;
   the right language is applied via textContent (so no re-render is needed
   when the visitor toggles EN/العربية — an attribute observer on <html>
   swaps the text in place).
   ========================================================================= */

(() => {
  const API = "https://aka-api.hadi-alakkadd.workers.dev";

  const esc = (s) =>
    String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // Bilingual span: rendered empty, filled by applyBi() below.
  const bi = (en, ar) =>
    `<span data-bi-en="${esc(en || "")}" data-bi-ar="${esc(ar || en || "")}"></span>`;

  function applyBi(root) {
    const isAr = document.documentElement.lang === "ar";
    root.querySelectorAll("[data-bi-en]").forEach((el) => {
      el.textContent = isAr ? el.dataset.biAr : el.dataset.biEn;
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("project-timeline");
    if (!root) return;

    let items = [];
    try {
      const res = await fetch(`${API}/content?type=projects`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) items = data;
      }
    } catch (e) {
      /* offline — section stays empty */
    }
    if (!items.length) return;

    const spec = (labelKey, labelText, en, ar) =>
      en
        ? `<div><strong data-i18n="${labelKey}">${labelText}</strong> ${bi(en, ar)}</div>`
        : "";

    root.innerHTML = items
      .map(
        (p) => `
      <div class="timeline-item">
        <div class="timeline-marker">${esc(p.year)}</div>
        <button class="timeline-header" type="button">
          <h3>${bi(p.name, p.name_ar)}</h3>
          <span class="timeline-toggle">+</span>
        </button>
        <div class="timeline-content">
          <div class="spec-grid">
            ${spec("proj.spec.location", "Location:", p.location, p.location_ar)}
            ${p.beds ? `<div><strong data-i18n="proj.spec.beds">Beds:</strong> ${esc(p.beds)}</div>` : ""}
            ${spec("proj.spec.departments", "Departments:", p.departments, p.departments_ar)}
            ${spec("proj.spec.equipment", "Key Equipment:", p.equipment, p.equipment_ar)}
          </div>
        </div>
      </div>`
      )
      .join("");

    applyBi(root);
    if (typeof I18N !== "undefined") I18N.apply(); // translate the spec labels
    if (typeof window.AKA_initTimeline === "function") window.AKA_initTimeline();

    // Swap bilingual text in place whenever the language toggle changes <html lang>.
    new MutationObserver(() => applyBi(root)).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
  });
})();

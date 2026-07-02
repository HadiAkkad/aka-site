/* =========================================================================
   AKA — Product catalog (devices.html #catalog)
   -------------------------------------------------------------------------
   TO ADD A PRODUCT: add one object to the PRODUCTS array below.
     name     - model name shown on the card (not translated)
     brand    - manufacturer name
     category - one of the slugs from QUOTE_CATEGORIES in components.js
                (diagnostic, imaging, endoscopy, surgical, orthopedics,
                 monitoring, cardiology, neurology, lab, sterilization,
                 hospital) — drives the filter buttons and the quote modal
     image    - path to the product photo (put files in images/devices/)
   Filter buttons are generated automatically from the categories present.
   The search box matches against product name + brand, combined with the
   active category filter. Each card's category chip links to that
   category's detail page (CATEGORY_PAGES below).

   This file is also loaded on the home page, where only the PRODUCTS data
   is used (by js/card-stack.js) — the catalog UI renders only on pages
   that have a #product-grid element.
   ========================================================================= */

const PRODUCTS = [
  { name: "SE-310 ECG", brand: "Edan", category: "cardiology", image: "images/devices/ecg.png" },
  { name: "HLT-712 v.201 Holter", brand: "ASPEL", category: "cardiology", image: "images/devices/ecg2.jpg" },
  { name: "Ultra 7FR IAB Catheter Kit", brand: "Insightra", category: "cardiology", image: "images/devices/catheterKit.png" },
  { name: "POCT-i2 Point-of-Care Analyzer", brand: "Edan", category: "diagnostic", image: "images/devices/poct.png" },
  { name: "NeuMR Universal MRI", brand: "Neusoft", category: "imaging", image: "images/devices/mri.jpg" },
  { name: "NeuViz Epoch CT", brand: "Neusoft", category: "imaging", image: "images/devices/ct.jpg" },
  { name: "Grand-Promerix Operating Table", brand: "Merivaara", category: "surgical", image: "images/devices/Grand-Promerix.jpg" },
  { name: "Endoscopic Units", brand: "Hermann", category: "endoscopy", image: "images/random/endo.png" },
  { name: "Ultrapro S100 EMG", brand: "Micromed", category: "neurology", image: "images/devices/emg.png" },
];

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("product-grid");
  const filtersWrap = document.getElementById("product-filters");
  const empty = document.getElementById("product-empty");
  const search = document.getElementById("product-search");
  if (!grid || !filtersWrap) return;

  // Filter buttons: "All" + one per category that actually has products.
  const categories = [...new Set(PRODUCTS.map((p) => p.category))];
  filtersWrap.innerHTML =
    `<button class="product-filter is-active" type="button" data-filter="all"
       data-i18n="products.filter.all">${I18N.t("products.filter.all")}</button>` +
    categories
      .map(
        (c) =>
          `<button class="product-filter" type="button" data-filter="${c}"
             data-i18n="cat.${c}">${I18N.t("cat." + c)}</button>`
      )
      .join("");

  grid.innerHTML = PRODUCTS.map(
    (p) => `
    <article class="product-card" data-category="${p.category}"
      data-search="${(p.name + " " + p.brand).toLowerCase()}">
      <div class="product-card__media">
        <img src="${p.image}" alt="${p.name} — ${p.brand}" decoding="async" />
      </div>
      <div class="product-card__body">
        <button class="product-card__cat" type="button" data-cat-filter="${p.category}"
          data-i18n="cat.${p.category}">${I18N.t("cat." + p.category)}</button>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__brand">${p.brand}</p>
        <button class="btn" type="button" data-quote-open
          data-quote-category="${p.category}"
          data-i18n="products.quote">${I18N.t("products.quote")}</button>
      </div>
    </article>`
  ).join("");

  // Translate the freshly injected filter buttons and cards.
  I18N.apply();

  let activeCategory = "all";

  function refresh() {
    const q = (search?.value || "").trim().toLowerCase();
    let shown = 0;
    grid.querySelectorAll(".product-card").forEach((card) => {
      const matchCat = activeCategory === "all" || card.dataset.category === activeCategory;
      const matchText = !q || card.dataset.search.includes(q);
      const show = matchCat && matchText;
      card.style.display = show ? "" : "none";
      if (show) shown++;
    });
    if (empty) empty.style.display = shown === 0 ? "" : "none";
  }

  // Single source for switching the active category (filter buttons, card
  // chips, and the ?cat= URL parameter all go through here).
  function setCategory(cat) {
    if (cat !== "all" && !categories.includes(cat)) return;
    activeCategory = cat;
    filtersWrap
      .querySelectorAll(".product-filter")
      .forEach((b) => b.classList.toggle("is-active", b.dataset.filter === cat));
    refresh();
  }

  filtersWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".product-filter");
    if (btn) setCategory(btn.dataset.filter);
  });

  // Category chip on a product card filters the catalog in place.
  grid.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat-filter]");
    if (!chip) return;
    setCategory(chip.dataset.catFilter);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  });

  if (search) search.addEventListener("input", refresh);

  // Deep link support: devices.html?cat=cardiology#catalog preselects the
  // category (the old per-category pages redirect here with this parameter).
  const requested = new URLSearchParams(window.location.search).get("cat");
  if (requested) setCategory(requested);
});

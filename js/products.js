/* =========================================================================
   AKA — Product catalog (devices.html #catalog)
   -------------------------------------------------------------------------
   Products are managed entirely from the admin panel (/admin/content →
   Devices tab). There is no hardcoded product list any more — this file
   loads the live list from the backend and renders:
     • the catalog grid on any page with a #product-grid element, and
     • the animated home-page card stack (via card-stack.js), which it
       kicks off with the same data through window.AKA_initCardStack().

   To add / remove a device, use the content manager — nothing to edit here.
   ========================================================================= */

const API_BASE = "https://aka-api.hadi-alakkadd.workers.dev";

document.addEventListener("DOMContentLoaded", async () => {
  // Load the live catalog once; used by both the grid and the home stack.
  let items = [];
  try {
    const res = await fetch(`${API_BASE}/content?type=products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) items = data;
    }
  } catch (e) {
    /* offline — leave the list empty */
  }

  // Feed the home-page card stack (no-op on pages without it).
  if (typeof window.AKA_initCardStack === "function") {
    window.AKA_initCardStack(items);
  }

  const grid = document.getElementById("product-grid");
  const filtersWrap = document.getElementById("product-filters");
  const empty = document.getElementById("product-empty");
  const search = document.getElementById("product-search");
  if (!grid || !filtersWrap) return; // e.g. the home page — stack handled above

  // Filter buttons: "All" + one per category that actually has products.
  const categories = [...new Set(items.map((p) => p.category))];
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

  grid.innerHTML = items.map(
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

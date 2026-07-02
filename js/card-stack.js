/* =========================================================================
   AKA — Animated product card stack (home page)
   -------------------------------------------------------------------------
   Vanilla-JS port of a React/framer-motion "card stack" animation. Three
   stacked cards cycle automatically: the front card slides down and out,
   the two behind promote forward, and a new card slides in at the back.

   Data comes from the PRODUCTS array in js/products.js (loaded first on
   index.html), so the stack always mirrors the product catalog. Autoplay
   pauses on hover, only runs while the stack is on screen, and is skipped
   entirely for users who prefer reduced motion.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("card-stack");
  if (!root || typeof PRODUCTS === "undefined" || PRODUCTS.length === 0) return;

  const CYCLE_MS = 3500;   // time between automatic advances
  const EXIT_MS = 900;     // must match the CSS transition duration
  const POS = ["stack-card--0", "stack-card--1", "stack-card--2"];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let nextProduct = 0; // index into PRODUCTS of the next card to create
  let animating = false;

  function buildCard(product, posClass) {
    const card = document.createElement("div");
    card.className = `stack-card ${posClass}`;
    card.innerHTML = `
      <div class="stack-card__media">
        <img src="${product.image}" alt="${product.name} — ${product.brand}" decoding="async" />
      </div>
      <div class="stack-card__footer">
        <div class="stack-card__text">
          <span class="stack-card__name">${product.name}</span>
          <span class="stack-card__brand" data-i18n="cat.${product.category}">${I18N.t("cat." + product.category)}</span>
        </div>
        <a class="stack-card__cta" href="devices.html#catalog">
          <span data-i18n="home.products.stack.view">${I18N.t("home.products.stack.view")}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M9.5 18L15.5 12L9.5 6"/></svg>
        </a>
      </div>`;
    return card;
  }

  function takeNextProduct() {
    const product = PRODUCTS[nextProduct % PRODUCTS.length];
    nextProduct++;
    return product;
  }

  // Initial three cards.
  POS.forEach((posClass) => root.appendChild(buildCard(takeNextProduct(), posClass)));

  function advance() {
    if (animating) return;
    animating = true;

    const cards = [...root.querySelectorAll(".stack-card:not(.stack-card--exit)")];
    const [front, middle, back] = cards;

    // Front card slides down and out, then is removed.
    front.classList.remove("stack-card--0");
    front.classList.add("stack-card--exit");
    setTimeout(() => front.remove(), reduceMotion ? 0 : EXIT_MS);

    // Promote the two remaining cards.
    middle.classList.replace("stack-card--1", "stack-card--0");
    back.classList.replace("stack-card--2", "stack-card--1");

    // New card enters at the back: mounted at the "enter" offset, then a
    // forced reflow makes the browser register that starting position before
    // the class swap, so the move to the resting position animates. (No
    // requestAnimationFrame — it doesn't fire in throttled background tabs.)
    const fresh = buildCard(takeNextProduct(), "stack-card--enter");
    root.appendChild(fresh);
    void fresh.offsetHeight; // force reflow
    fresh.classList.replace("stack-card--enter", "stack-card--2");
    animating = false;
  }

  if (reduceMotion) return; // static stack, no autoplay

  // Autoplay: runs by default, pauses on hover and while scrolled off-screen.
  let timer = null;
  let hovered = false;
  let onScreen = true;
  const sync = () => {
    if (!hovered && onScreen && !timer) timer = setInterval(advance, CYCLE_MS);
    if ((hovered || !onScreen) && timer) { clearInterval(timer); timer = null; }
  };

  root.addEventListener("mouseenter", () => { hovered = true; sync(); });
  root.addEventListener("mouseleave", () => { hovered = false; sync(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => { onScreen = e.isIntersecting; sync(); }),
      { threshold: 0.3 }
    ).observe(root);
  }

  sync();
});

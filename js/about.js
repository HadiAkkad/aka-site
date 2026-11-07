/* =========================================================================
   AKA — About page
   - Draws the lines on the world map when it scrolls into view.
   - Counts the "AKA in numbers" figures up from 0 the first time they appear.
   Without this script, or with reduced motion, everything simply shows as is.
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const onceVisible = (el, threshold, callback) => {
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          callback();
        });
      },
      { threshold }
    ).observe(el);
  };

  /* --- world map ------------------------------------------------------- */
  const map = document.querySelector("[data-world-map]");
  if (map) {
    map.classList.add("has-motion");
    onceVisible(map, 0.35, () => map.classList.add("is-visible"));
  }

  /* --- count-up numbers (see below) ------------------------------------ */
  countUp();
});

/* --- manufacturer logos ------------------------------------------------- */
// The page ships with the current list; this refreshes it from the admin
// panel, so manufacturers added or removed there show up here too. Logos that
// came with the site use a trimmed copy (images/partners/trim/) so they all
// read at a similar size; logos uploaded in the admin panel are used as is.
document.addEventListener("DOMContentLoaded", async () => {
  const row = document.querySelector("[data-maker-logos]");
  if (!row) return;
  const TRIMMED = new Set(
    "aspel cisa custo edan elvation ems esumedics hermann imo2 insightra kasios luxsutures merivaara micromed neusoft perlove sama siem steel-power sternmed".split(" ")
  );
  // Logos uploaded in the admin panel, matched by their unique upload id.
  // A re-uploaded logo gets a new id, so it is then shown as uploaded.
  const UPLOADED = {
    "94a79600-f59b": "chenwei",
    "5299f1ff-afa9": "villa",
    "43fe0c0d-285c": "biobase",
  };
  const source = (url) => {
    const m = /^images\/partners\/([^/.]+)\.(png|jpe?g)$/i.exec(url || "");
    if (m && TRIMMED.has(m[1])) return `images/partners/trim/${m[1]}.webp`;
    const id = Object.keys(UPLOADED).find((key) => String(url).includes(key));
    return id ? `images/partners/trim/${UPLOADED[id]}.webp` : url;
  };
  const esc = (t) =>
    String(t || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  try {
    const res = await fetch("https://aka-api.hadi-alakkadd.workers.dev/content?type=partners");
    if (!res.ok) return;
    const data = await res.json();
    const makers = Array.isArray(data) ? data.filter((p) => p.kind === "manufacturer" && p.logo) : [];
    if (!makers.length) return;
    row.innerHTML = makers
      .map((p) => `<img src="${esc(source(p.logo))}" alt="${esc(p.name)}" loading="lazy" decoding="async" />`)
      .join("");
  } catch (e) {
    /* offline: keep the list that shipped with the page */
  }
});

function countUp() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const onceVisible = (el, threshold, callback) => {
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          callback();
        });
      },
      { threshold }
    ).observe(el);
  };

  /* --- count-up numbers ------------------------------------------------ */
  // Each number is the first text in its element ("28" in "28<span>+</span>"),
  // so the suffix stays put. Only numbers still below the screen are reset to
  // 0; one already in view keeps its value rather than flashing back to 0.
  const DURATION = 1200;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  document.querySelectorAll(".about-numbers__item > span").forEach((el) => {
    const text = el.firstChild;
    const target = parseInt(text && text.nodeValue, 10);
    if (!target || el.getBoundingClientRect().top < window.innerHeight) return;

    text.nodeValue = "0";
    onceVisible(el, 0.6, () => {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / DURATION, 1);
        text.nodeValue = String(Math.round(ease(progress) * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
}

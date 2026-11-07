/* =========================================================================
   AKA — About page: draws the lines on the world map when it scrolls into
   view. Without this script (or with reduced motion) the lines simply show.
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const map = document.querySelector("[data-world-map]");
  if (!map || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  map.classList.add("has-motion");
  new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        map.classList.add("is-visible");
        observer.disconnect();
      });
    },
    { threshold: 0.35 }
  ).observe(map);
});

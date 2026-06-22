/* =========================================================================
   AKA — Shared header & footer
   -------------------------------------------------------------------------
   Edit the navigation links or footer ONCE here and every page updates.
   This uses plain DOM injection (no fetch), so it works even when you open
   the .html files directly by double-clicking them.

   To add/remove a menu item: edit the NAV_LINKS array below.
   ========================================================================= */

// Navigation menu items (i18n key -> file). Labels come from js/i18n.js.
const NAV_LINKS = [
  { key: "nav.devices",     href: "devices.html" },
  { key: "nav.agencies",    href: "agencies.html" },
  { key: "nav.projects",    href: "projects.html" },
  { key: "nav.about",       href: "about.html" },
  { key: "nav.support",     href: "support.html" },
  { key: "nav.careers",     href: "careers.html" },
];

// Partner names shown in the scrolling footer strip.
// Replace with logo <img> tags once you have the image files (see README).
const PARTNERS = [
  "EDAN", "NEUROWERK", "CUSTOMED", "HERMANN", "EMOS",
  "EMS", "IMO", "MERIVAARA", "NEUSOFT",
];

function buildHeader() {
  const current = document.body.dataset.page || "";
  const links = NAV_LINKS.map(
    (l) =>
      `<a href="${l.href}"${
        current === l.href ? ' aria-current="page"' : ""
      } data-i18n="${l.key}">${I18N.t(l.key)}</a>`
  ).join("");

  return `
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="site-title" href="index.html" aria-label="AKA Associates — home">
        <img class="site-logo" src="images/aka-logo.svg?v=4" alt="AKA Associates" />
      </a>
      <nav class="site-nav">${links}</nav>
      <div class="header-actions">
        <button class="lang-toggle" type="button"
          data-i18n="lang.toggle"
          data-i18n-attr="aria-label:lang.toggleLabel">${I18N.t("lang.toggle")}</button>
        <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
      </div>
    </div>
  </header>`;
}

function buildFooter() {
  // Duplicate the partner list so the marquee loops seamlessly.
  const items = [...PARTNERS, ...PARTNERS]
    .map((p) => `<span>${p}</span>`)
    .join("");

  return `
  <footer class="site-footer">
    <div class="logo-strip">
      <div class="logo-strip__track">${items}</div>
    </div>
    <div class="container footer-main">
      <div>
        <h4>AKA</h4>
        <p data-i18n="footer.about.text">Certified medical devices and equipment for hospitals, clinics,
        and laboratories across Syria — backed by agency services, installation,
        training, and dependable local support.</p>
      </div>
      <div>
        <h4 data-i18n="footer.explore">Explore</h4>
        <ul>
          <li><a href="devices.html" data-i18n="footer.devices">Devices</a></li>
          <li><a href="categories.html" data-i18n="footer.categories">Categories</a></li>
          <li><a href="agencies.html" data-i18n="footer.agencies">Agencies</a></li>
          <li><a href="projects.html" data-i18n="footer.projects">Projects</a></li>
          <li><a href="about.html" data-i18n="footer.about">About</a></li>
          <li><a href="support.html" data-i18n="footer.support">Services</a></li>
          <li><a href="careers.html" data-i18n="footer.careers">Careers</a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="footer.contact">Contact</h4>
        <ul>
          <li><a href="mailto:hadi.alakkadd@gmail.com">hadi.alakkadd@gmail.com</a></li>
          <li data-i18n="footer.location">Syria</li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      &copy; <span id="year"></span> AKA. <span data-i18n="footer.rights">All rights reserved.</span>
    </div>
  </footer>`;
}

// Inject header & footer into placeholders, then wire up the mobile menu.
document.addEventListener("DOMContentLoaded", () => {
  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  if (headerSlot) headerSlot.innerHTML = buildHeader();
  if (footerSlot) footerSlot.innerHTML = buildFooter();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Apply the saved language to the whole page (header, footer, and content).
  I18N.apply();

  // Language toggle (AR / EN)
  const langToggle = document.querySelector(".lang-toggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => I18N.toggle());
  }

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  initScrollReveal();
  initStickyHeader();

  // If the logo is clicked while already on the homepage, smooth-scroll to top
  // instead of doing a full page reload.
  const logo = document.querySelector(".site-title");
  const onHome =
    document.body.dataset.page === "index.html" ||
    document.body.dataset.page === "";
  if (logo && onHome) {
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

/* -------------------------------------------------------------------------
   Sticky header dynamics
   - Adds a shadow + compact style once scrolled past a threshold.
   - Hides the header when scrolling down, reveals it when scrolling up.
   ------------------------------------------------------------------------- */
function initStickyHeader() {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".site-nav");
  if (!header) return;

  const SCROLLED_AT = 80;   // px scrolled before the compact style kicks in
  const HIDE_AFTER = 200;   // don't hide until we're well past the top
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;

    header.classList.toggle("is-scrolled", y > SCROLLED_AT);

    const menuOpen = nav && nav.classList.contains("is-open");
    const scrollingDown = y > lastY;

    if (!menuOpen && y > HIDE_AFTER && scrollingDown) {
      header.classList.add("is-hidden");
    } else if (!scrollingDown || y <= HIDE_AFTER) {
      header.classList.remove("is-hidden");
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

/* -------------------------------------------------------------------------
   Scroll reveal
   Adds a fade-and-slide-up effect to content as it scrolls into view.
   Targets common blocks automatically so no HTML changes are needed.
   ------------------------------------------------------------------------- */
function initScrollReveal() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Pick the elements we want to animate in.
  const targets = document.querySelectorAll(
    ".section .feature, .section .card, .section > .container > h2, " +
      ".section > .container > .lead, .section .form, .grid > *"
  );

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // No animation: just make sure everything is visible.
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  targets.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Stagger items that share a parent (e.g. cards in a grid).
        const siblings = Array.from(entry.target.parentElement.children).filter(
          (c) => c.classList.contains("reveal")
        );
        const index = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(index, 6) * 0.08}s`;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

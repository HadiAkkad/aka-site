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
  { key: "nav.home",        href: "index.html" },
  { key: "nav.devices",     href: "devices.html" },
  { key: "nav.partners",    href: "partners.html" },
  { key: "nav.projects",    href: "projects.html" },
  { key: "nav.careers",     href: "careers.html" },
  { key: "nav.about",       href: "about.html" },
];

// Partner names shown in the scrolling footer strip.
// Replace with logo <img> tags once you have the image files (see README).
const PARTNERS = [
  "EDAN", "NEUSOFT", "CUSTOMED", "HERMANN",
  "EMS", "IMO", "MERIVAARA", "NEUSOFT", "CISA", "MICROMED",
  "LUXSUTURES", "ASPEL", "KASIOS", "STEEL&POWER", "INSIGHTRA",
  "S.I.E.M", "ELVATION", "ITEM", "PERLOVE", "STERNMED", "ESUMEDICS",
  "SAMA ● ALTAMAYAZ"
];

// Quote/RFQ backend endpoint (same Worker the contact form uses). Named
// QUOTE_API (not AKA_API) so it never collides with the const in js/forms.js
// on pages that load both scripts.
const QUOTE_API = "https://aka-api.hadi-alakkadd.workers.dev";

// Device categories offered in the quote line-item dropdown. Each pair is
// [slug used by data-quote-category, i18n key reused from the devices page].
const QUOTE_CATEGORIES = [
  ["diagnostic", "cat.diagnostic"],
  ["imaging", "cat.imaging"],
  ["endoscopy", "cat.endoscopy"],
  ["surgical", "cat.surgical"],
  ["orthopedics", "cat.orthopedics"],
  ["monitoring", "cat.monitoring"],
  ["cardiology", "cat.cardiology"],
  ["neurology", "cat.neurology"],
  ["lab", "cat.lab"],
  ["sterilization", "cat.sterilization"],
  ["hospital", "cat.hospital"],
];

// One repeatable product row inside the quote form.
function buildQuoteLineItem() {
  const opts = QUOTE_CATEGORIES.map(
    ([slug, key]) => `<option value="${slug}" data-i18n="${key}">${I18N.t(key)}</option>`
  ).join("");
  return `
  <div class="quote-item">
    <select class="quote-item__cat" aria-label="${I18N.t("quote.items.category")}">
      <option value="" data-i18n="quote.items.category.choose">${I18N.t("quote.items.category.choose")}</option>
      ${opts}
    </select>
    <input type="text" class="quote-item__product"
      data-i18n-attr="placeholder:quote.items.product"
      placeholder="${I18N.t("quote.items.product")}" />
    <input type="number" class="quote-item__qty" min="1" value="1"
      aria-label="${I18N.t("quote.items.qty")}" />
    <button type="button" class="quote-item__remove" data-quote-remove
      data-i18n-attr="aria-label:quote.items.remove"
      aria-label="${I18N.t("quote.items.remove")}">&times;</button>
  </div>`;
}

// The full RFQ modal, injected once into <body> on every page.
function buildQuoteModal() {
  return `
  <div class="quote-modal" id="quote-modal" aria-hidden="true">
    <div class="quote-modal__overlay" data-quote-close></div>
    <div class="quote-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title">
      <button class="quote-modal__close" type="button" data-quote-close
        data-i18n-attr="aria-label:quote.close" aria-label="${I18N.t("quote.close")}">&times;</button>
      <h2 id="quote-modal-title" class="heading-accent" data-i18n="quote.title">${I18N.t("quote.title")}</h2>
      <p class="quote-modal__sub" data-i18n="quote.subtitle">${I18N.t("quote.subtitle")}</p>

      <form class="quote-form" id="quote-form" novalidate>
        <fieldset class="quote-fieldset">
          <legend data-i18n="quote.facility.legend">Facility information</legend>
          <div class="quote-grid">
            <div class="quote-field">
              <label data-i18n="quote.facility.name">Facility name</label>
              <input type="text" name="facility" required />
            </div>
            <div class="quote-field">
              <label data-i18n="quote.facility.type">Facility type</label>
              <select name="facilityType">
                <option value="" data-i18n="quote.facility.type.choose">Select type...</option>
                <option value="Hospital" data-i18n="quote.facility.type.hospital">Hospital</option>
                <option value="Clinic" data-i18n="quote.facility.type.clinic">Clinic</option>
                <option value="Laboratory" data-i18n="quote.facility.type.lab">Laboratory</option>
                <option value="Diagnostic center" data-i18n="quote.facility.type.diagnostic">Diagnostic center</option>
                <option value="Other" data-i18n="quote.facility.type.other">Other</option>
              </select>
            </div>
            <div class="quote-field">
              <label data-i18n="quote.facility.location">City / Location</label>
              <input type="text" name="location" />
            </div>
          </div>
        </fieldset>

        <fieldset class="quote-fieldset">
          <legend data-i18n="quote.contact.legend">Contact details</legend>
          <div class="quote-grid">
            <div class="quote-field">
              <label data-i18n="quote.contact.name">Your name</label>
              <input type="text" name="name" required />
            </div>
            <div class="quote-field">
              <label data-i18n="quote.contact.email">Email</label>
              <input type="email" name="email" required />
            </div>
            <div class="quote-field">
              <label data-i18n="quote.contact.phone">Phone</label>
              <input type="tel" name="phone" />
            </div>
          </div>
        </fieldset>

        <fieldset class="quote-fieldset">
          <legend data-i18n="quote.items.legend">Products requested</legend>
          <div class="quote-items" id="quote-items">${buildQuoteLineItem()}</div>
          <button type="button" class="quote-add" data-quote-add
            data-i18n="quote.items.add">${I18N.t("quote.items.add")}</button>
        </fieldset>

        <div class="quote-field">
          <label data-i18n="quote.notes">Additional notes</label>
          <textarea name="notes"
            data-i18n-attr="placeholder:quote.notes.ph"
            placeholder="${I18N.t("quote.notes.ph")}"></textarea>
        </div>

        <button type="submit" class="btn" data-i18n="quote.submit">${I18N.t("quote.submit")}</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>`;
}

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
        <img class="site-logo" src="images/aka-logo-vector.svg?v=7" alt="AKA Associates" />
      </a>
      <nav class="site-nav">
        <button class="nav-close" aria-label="Close menu" type="button">&#8594;</button>
        ${links}
        <button class="btn nav-quote" type="button" data-quote-open
          data-i18n="quote.cta">${I18N.t("quote.cta")}</button>
        <button class="lang-toggle nav-lang-toggle" type="button"
          data-i18n="lang.toggle"
          data-i18n-attr="aria-label:lang.toggleLabel">${I18N.t("lang.toggle")}</button>
      </nav>
      <div class="header-actions">
        <button class="btn header-cta" type="button" data-quote-open
          data-i18n="quote.cta">${I18N.t("quote.cta")}</button>
        <button class="lang-toggle" type="button"
          data-i18n="lang.toggle"
          data-i18n-attr="aria-label:lang.toggleLabel">${I18N.t("lang.toggle")}</button>
        <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
      </div>
    </div>
    <div class="nav-overlay"></div>
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
      <div class="footer-about">
        <a href="index.html" class="footer-logo-link" aria-label="AKA Associates — home">
          <img class="footer-logo" src="images/aka-logo-vector.svg?v=7" alt="AKA Associates" />
        </a>
        <p data-i18n="footer.about.text">Certified medical devices and equipment for hospitals, clinics,
        and laboratories across Syria — backed by agency services, installation,
        training, and dependable local support.</p>
      </div>
      <div class="footer-section">
        <h4 data-i18n="footer.explore">Quick Links</h4>
        <ul>
          <li><a href="devices.html" data-i18n="footer.devices">Devices</a></li>
          <li><a href="devices.html#categories" data-i18n="footer.categories">Categories</a></li>
          <li><a href="partners.html" data-i18n="footer.partners">Partners</a></li>
          <li><a href="projects.html" data-i18n="footer.projects">Projects</a></li>
          <li><a href="about.html" data-i18n="footer.about">About Us</a></li>
          <li><a href="careers.html" data-i18n="footer.careers">Careers</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4 data-i18n="footer.contact">Contact Info</h4>
        <ul class="footer-contact">
          <li>
            <span class="contact-icon">📍</span>
            <span><strong>Damascus:</strong><br />Baramkeh, Syria</span>
          </li>
          <li style="margin-top: 0.8rem;">
            <span class="contact-icon">☎</span>
            <span><a href="tel:+963944212444">+963 944 212 444</a></span>
          </li>
          <li>
            <span class="contact-icon">💬</span>
            <span><a href="https://wa.me/963937322097" target="_blank">WhatsApp: +963 937 322 097</a></span>
          </li>
          <li>
            <span class="contact-icon">✉</span>
            <span><a href="mailto:hadi.alakkadd@gmail.com">hadi.alakkadd@gmail.com</a></span>
          </li>
          <li style="font-size: 0.85rem; color: rgba(255,255,255,0.65); margin-top: 0.5rem;">
            Sat–Thu, 9:00 AM – 6:00 PM
          </li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>International</h4>
        <ul class="footer-contact">
          <li>
            <span class="contact-icon">🌐</span>
            <span><strong>FutureMed Sweden</strong></span>
          </li>
          <li style="margin-top: 0.3rem;">
            <span style="width: 1.5rem;"></span>
            <span><a href="tel:+46764288823">+46 76 428 8823</a></span>
          </li>
          <li>
            <span style="width: 1.5rem;"></span>
            <span><a href="mailto:info@futuremed.se">info@futuremed.se</a></span>
          </li>
          <li style="margin-top: 1.2rem;">
            <a href="about.html#contact-details" class="footer-cta" data-i18n="footer.quote">View all contacts →</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <div class="footer-bottom-left">
        &copy; <span id="year"></span> AKA Associates. <span data-i18n="footer.rights">All rights reserved.</span>
      </div>
      <div class="footer-bottom-right">
        <span>Est. 1998 — Damascus, Syria</span>
      </div>
    </div>
  </footer>`;
}

// Inject header & footer into placeholders, then wire up the mobile menu.
document.addEventListener("DOMContentLoaded", () => {
  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  if (headerSlot) headerSlot.innerHTML = buildHeader();
  if (footerSlot) footerSlot.innerHTML = buildFooter();

  // Inject the global quote modal BEFORE I18N.apply() so its text + the first
  // line item get translated in the same pass as the header and footer.
  document.body.insertAdjacentHTML("beforeend", buildQuoteModal());

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Home page stats bar: years of experience since AKA's 1998 founding.
  const yearsEl = document.getElementById("stat-years");
  if (yearsEl) yearsEl.dataset.count = String(new Date().getFullYear() - 1998);

  // Apply the saved language to the whole page (header, footer, and content).
  I18N.apply();

  // Language toggle (AR / EN) — one copy in the header, one inside the
  // mobile side panel; both call the same toggle.
  document.querySelectorAll(".lang-toggle").forEach((btn) => {
    btn.addEventListener("click", () => I18N.toggle());
  });

  const toggle = document.querySelector(".nav-toggle");
  const close = document.querySelector(".nav-close");
  const nav = document.querySelector(".site-nav");
  const overlay = document.querySelector(".nav-overlay");
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      if (overlay) overlay.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-locked", open);
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    if (close) close.addEventListener("click", () => setOpen(false));
    if (overlay) overlay.addEventListener("click", () => setOpen(false));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  initScrollReveal();
  initStickyHeader();
  initNgoSlideshow();
  initStatsCounter();
  initQuoteModal();

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
   Quote / RFQ modal
   - Opens from any [data-quote-open] trigger (header CTA, footer link, the
     "Request a quote" buttons on category pages).
   - A data-quote-category="<slug>" on the trigger pre-selects that category
     in the first product line item.
   - Submits a structured, human-readable summary to the Worker's /contact
     endpoint (no backend changes needed).
   ------------------------------------------------------------------------- */
function initQuoteModal() {
  const modal = document.getElementById("quote-modal");
  if (!modal) return;

  const dialog = modal.querySelector(".quote-modal__dialog");
  const form = modal.querySelector("#quote-form");
  const itemsWrap = modal.querySelector("#quote-items");
  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  let lastFocused = null;

  function openModal(category) {
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-locked");

    // Pre-select the category passed by the trigger, if any.
    if (category) {
      const firstSelect = itemsWrap.querySelector(".quote-item__cat");
      if (firstSelect) firstSelect.value = category;
    }
    const firstInput = form.querySelector('input[name="facility"]');
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-locked");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // Open triggers (delegated so it also covers injected header/footer).
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-quote-open]");
    if (!trigger) return;
    e.preventDefault();
    openModal(trigger.getAttribute("data-quote-category"));
  });

  // Close: overlay, close button, Escape.
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-quote-close]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // Add / remove line items.
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-quote-add]")) {
      itemsWrap.insertAdjacentHTML("beforeend", buildQuoteLineItem());
      I18N.apply(); // translate the freshly added row
    }
    const removeBtn = e.target.closest("[data-quote-remove]");
    if (removeBtn) {
      const rows = itemsWrap.querySelectorAll(".quote-item");
      if (rows.length > 1) removeBtn.closest(".quote-item").remove();
    }
  });

  // Build the readable message and submit to the Worker.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const get = (n) => (form.querySelector(`[name="${n}"]`)?.value || "").trim();
    const facility = get("facility");
    const name = get("name");
    const email = get("email");
    if (!facility || !name || !email) {
      status.className = "form-status form-status--err";
      status.textContent = I18N.t("form.error");
      return;
    }

    // Collect line items as "Category — product × qty".
    const items = [...itemsWrap.querySelectorAll(".quote-item")]
      .map((row) => {
        const sel = row.querySelector(".quote-item__cat");
        const cat = sel.value ? sel.options[sel.selectedIndex].textContent.trim() : "";
        const product = row.querySelector(".quote-item__product").value.trim();
        const qty = row.querySelector(".quote-item__qty").value.trim() || "1";
        if (!cat && !product) return null;
        return `• ${[cat, product].filter(Boolean).join(" — ")} × ${qty}`;
      })
      .filter(Boolean);

    const message =
      `QUOTE REQUEST\n` +
      `Facility: ${facility}` +
      (get("facilityType") ? ` (${get("facilityType")})` : "") +
      (get("location") ? `\nLocation: ${get("location")}` : "") +
      (get("phone") ? `\nPhone: ${get("phone")}` : "") +
      `\n\nItems requested:\n${items.length ? items.join("\n") : "(none specified)"}` +
      (get("notes") ? `\n\nNotes: ${get("notes")}` : "");

    const payload = new FormData();
    payload.append("name", name);
    payload.append("email", email);
    payload.append("message", message);

    submitBtn.disabled = true;
    status.className = "form-status";
    status.textContent = I18N.t("form.sending");

    try {
      const res = await fetch(`${QUOTE_API}/contact`, { method: "POST", body: payload });
      const data = await res.json().catch(() => ({ ok: false }));
      if (res.ok && data.ok) {
        form.reset();
        itemsWrap.innerHTML = buildQuoteLineItem();
        I18N.apply();
        status.className = "form-status form-status--ok";
        status.textContent = I18N.t("quote.success");
      } else {
        throw new Error("request failed");
      }
    } catch (err) {
      status.className = "form-status form-status--err";
      status.textContent = I18N.t("form.error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

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
   NGO partners slideshow (Agencies page)
   - Cycles one slide at a time via prev/next buttons or dots.
   - Autoplays, pausing while the mouse is over the slideshow.
   ------------------------------------------------------------------------- */
function initNgoSlideshow() {
  const root = document.querySelector(".ngo-slideshow");
  if (!root) return;

  const track = root.querySelector(".ngo-slideshow__track");
  const slides = [...root.querySelectorAll(".ngo-slide")];
  const dotsWrap = root.querySelector(".ngo-slideshow__dots");
  const prevBtn = root.querySelector(".ngo-slideshow__btn--prev");
  const nextBtn = root.querySelector(".ngo-slideshow__btn--next");
  if (!track || slides.length === 0) return;

  let index = 0;
  let autoplay;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.className = "ngo-slideshow__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function render() {
    const isRtl = document.documentElement.dir === "rtl";
    track.style.transform = `translateX(${isRtl ? index * 100 : -index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    render();
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function startAutoplay() {
    autoplay = window.setInterval(next, 6000);
  }

  function stopAutoplay() {
    window.clearInterval(autoplay);
  }

  if (prevBtn) prevBtn.addEventListener("click", () => { prev(); stopAutoplay(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { next(); stopAutoplay(); startAutoplay(); });
  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);

  render();
  startAutoplay();
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

/* -------------------------------------------------------------------------
   Stats counter (Home page)
   Counts each .stat__number up from 0 to its data-count value once it
   scrolls into view (or immediately, if already visible on load).
   ------------------------------------------------------------------------- */
function initStatsCounter() {
  const stats = document.querySelectorAll(".stat__number[data-count]");
  if (stats.length === 0) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function setFinal(el) {
    el.textContent = `${el.dataset.count}${el.dataset.suffix || ""}`;
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    stats.forEach(setFinal);
    return;
  }

  const DURATION = 1400; // ms

  function animate(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / DURATION, 1);
      // Ease-out so the count settles smoothly instead of stopping abruptly.
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  stats.forEach((el) => observer.observe(el));
}

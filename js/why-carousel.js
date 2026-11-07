/* =========================================================================
   AKA — "Why choose AKA" connected carousel (About page)
   -------------------------------------------------------------------------
   One large card (figure, text, tags, photo) with smaller photo cards
   peeking on each side, joined by curved connectors. It moves on by itself
   every few seconds; a bar under the cards shows the progress.

   HOW TO EDIT: the cards are plain HTML in about.html (<li class="why-item">).
   Copy one to add a reason. Without JavaScript they show as a simple grid.

   The geometry of every position (centre, first and second side cards, and
   the hidden ones they slide in from) lives in css/style.css, keyed on the
   card's data-offset. This script only decides which card sits where.

   Accessibility: the moving cards are a visual extra. Each card's text is
   in the page, the tabs below choose a card, the arrow keys work while the
   carousel has focus, and autoplay pauses on hover, on focus, when the
   carousel is off screen, with the pause button, and is off entirely for
   people who prefer reduced motion.
   ========================================================================= */

(() => {
  const INTERVAL = 6000; // ms each card stays, keep in step with the CSS
  const SLIDE_MS = 700; // card movement, keep in step with --why-ms

  function init(root) {
    // "28+" years is worked out from the founding year, so it never goes stale
    root.querySelectorAll("[data-years-since]").forEach((el) => {
      el.textContent = String(new Date().getFullYear() - Number(el.dataset.yearsSince));
    });

    const items = [...root.querySelectorAll(".why-item")];
    const total = items.length;
    if (total < 2) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mod = (n) => ((n % total) + total) % total;
    const isRtl = () => document.documentElement.dir === "rtl";

    /* --- build ----------------------------------------------------------- */
    const stage = document.createElement("div");
    stage.className = "why-carousel__stage";
    stage.setAttribute("aria-live", "off");

    const controls = document.createElement("div");
    controls.className = "why-carousel__controls";
    const tablist = document.createElement("div");
    tablist.className = "why-carousel__tabs";
    tablist.setAttribute("role", "tablist");
    controls.append(tablist);

    const tabs = items.map((item, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "why-carousel__tab";
      tab.setAttribute("role", "tab");
      const label = item.querySelector(".why-item__tags span");
      tab.setAttribute("aria-label", label ? label.textContent.trim() : String(i + 1));
      tab.innerHTML = '<span class="why-carousel__bar"><span class="why-carousel__fill"></span></span>';
      tab.addEventListener("click", () => {
        let diff = i - mod(page);
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;
        go(diff, true);
      });
      tablist.append(tab);
      return tab;
    });

    // One card per visible position, made from the HTML item it shows.
    const makeCard = (index) => {
      const item = items[index];
      const img = item.querySelector("img");
      const card = document.createElement("div");
      card.className = "why-card";
      card.innerHTML = `
        <div class="why-card__clip">
          <div class="why-card__peek"></div>
          <div class="why-card__body">
            <div class="why-card__text"></div>
            <div class="why-card__photo"></div>
          </div>
        </div>`;
      const peek = img.cloneNode();
      peek.alt = "";
      peek.loading = "lazy";
      card.querySelector(".why-card__peek").append(peek);
      const photo = img.cloneNode();
      photo.loading = "lazy";
      card.querySelector(".why-card__photo").append(photo);
      const text = card.querySelector(".why-card__text");
      item.querySelectorAll(".why-item__index, .why-item__stat, .why-item__text, .why-item__tags").forEach((el) => {
        text.append(el.cloneNode(true));
      });
      card.addEventListener("click", () => {
        const offset = Number(card.dataset.offset);
        if (offset && Math.abs(offset) <= 2) go(offset, true);
      });
      return card;
    };

    /* --- positions ------------------------------------------------------- */
    let page = 0;
    const live = new Map(); // virtual index -> card element
    const RANGE = 3; // cards kept at offsets -3..3 (the outer ones invisible)

    function layout(animateIn) {
      const wanted = new Set();
      for (let offset = -RANGE; offset <= RANGE; offset++) {
        const v = page + offset;
        wanted.add(v);
        let card = live.get(v);
        if (!card) {
          card = makeCard(mod(v));
          // Enter from just beyond the edge it is coming from
          card.dataset.offset = offset < 0 ? -4 : 4;
          stage.append(card);
          live.set(v, card);
          if (animateIn) void card.offsetWidth;
        }
        card.dataset.offset = offset;
        card.classList.toggle("is-active", offset === 0);
        card.setAttribute("aria-hidden", String(offset !== 0));
      }
      // Cards that left: slide out past the edge, then go
      live.forEach((card, v) => {
        if (wanted.has(v)) return;
        live.delete(v);
        card.dataset.offset = v < page ? -4 : 4;
        setTimeout(() => card.remove(), SLIDE_MS + 50);
      });

      const active = mod(page);
      tabs.forEach((tab, i) => {
        const on = i === active;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        tab.classList.toggle("is-active", on);
      });
    }

    /* --- autoplay -------------------------------------------------------- */
    // The active tab's bar fills over INTERVAL ms (a CSS animation); when it
    // finishes the carousel moves on. Pausing simply pauses that animation.
    let userPaused = false;
    let hovered = false;
    let focused = false;
    let onScreen = false;
    const syncPause = () => {
      const paused = reduced || userPaused || hovered || focused || !onScreen;
      root.classList.toggle("is-paused", paused);
      // Announce changes only when people are moving it themselves
      stage.setAttribute("aria-live", paused ? "polite" : "off");
    };

    tablist.addEventListener("animationend", (event) => {
      if (event.target.classList.contains("why-carousel__fill")) go(1, false);
    });

    function restartProgress() {
      tabs.forEach((tab) => {
        const fill = tab.querySelector(".why-carousel__fill");
        fill.style.animation = "none";
        void fill.offsetWidth;
        fill.style.animation = "";
      });
    }

    function go(by, byUser) {
      if (!by) return;
      page += by;
      layout(true);
      restartProgress();
      if (byUser) stage.setAttribute("aria-live", "polite");
    }

    /* --- input ----------------------------------------------------------- */
    root.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const forward = (event.key === "ArrowRight") !== isRtl();
      go(forward ? 1 : -1, true);
      tabs[mod(page)].focus();
    });

    let touchX = 0;
    let touchY = 0;
    stage.addEventListener("touchstart", (e) => {
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      go((dx < 0) !== isRtl() ? 1 : -1, true);
    }, { passive: true });

    root.addEventListener("mouseenter", () => { hovered = true; syncPause(); });
    root.addEventListener("mouseleave", () => { hovered = false; syncPause(); });
    root.addEventListener("focusin", () => { focused = true; syncPause(); });
    root.addEventListener("focusout", (e) => {
      if (!root.contains(e.relatedTarget)) { focused = false; syncPause(); }
    });

    if (!reduced && window.AKA_motionToggle) {
      window.AKA_motionToggle(controls, (paused) => { userPaused = paused; syncPause(); }, "motion-toggle--inline");
    }

    // Decode every photo before its first slide, so the first moves are as
    // smooth as the rest (otherwise each new photo decodes mid-animation).
    let decoded = false;
    const decodeAll = () => {
      if (decoded) return;
      decoded = true;
      items.forEach((item) => {
        const img = new Image();
        img.src = item.querySelector("img").currentSrc || item.querySelector("img").src;
        if (img.decode) img.decode().catch(() => {});
      });
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) decodeAll(); });
      }, { rootMargin: "400px 0px" }).observe(root);
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => { onScreen = entry.isIntersecting; syncPause(); });
      }, { threshold: 0.4 }).observe(root);
    } else {
      onScreen = true;
      decodeAll();
    }

    /* --- switch from the plain list to the carousel ---------------------- */
    root.classList.add("is-ready");
    if (reduced) root.classList.add("is-static");
    root.append(stage, controls);
    layout(false);
    syncPause();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-why-carousel]").forEach(init);
  });
})();

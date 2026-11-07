/* =========================================================================
   AKA — "Squeeze" photo carousel (home page: Hospitals we've equipped)
   -------------------------------------------------------------------------
   One photo gets the room, the others narrow towards the far side. Choosing
   one slides the row along and the text underneath fades to match.

   HOW TO EDIT: the slides are plain HTML in index.html. To add a hospital,
   copy one <article class="squeeze__slide"> block and change its photo and
   text keys. Five or more slides automatically get thin strips at the end.

   Sits in a row of "columns": 0 is the open photo, 1-3 narrow steadily, and
   anything outside that is a thin strip. Stepping forward adds a copy of the
   next photo at the far end and lowers every column by one, so the old open
   photo narrows and leaves. Once the movement ends, the copies that left are
   removed without any visible change.
   ========================================================================= */

(() => {
  const DURATION = 550; // keep in step with --sq-ms in css/style.css
  const CHEVRON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

  function initSqueeze(root) {
    const slides = [...root.querySelectorAll(".squeeze__slide")].map((el) => ({
      src: el.querySelector("img").getAttribute("src"),
      tagKey: el.querySelector(".squeeze__place")?.dataset.i18n,
      text: el.querySelector(".squeeze__text"),
    }));
    const count = slides.length;
    if (!count) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduced ? 0 : DURATION;
    const slats = Math.min(Math.max(count - 4, 0), 3);
    const visible = 4 + slats;

    /* --- build ----------------------------------------------------------- */
    // The photos are a mouse and touch shortcut: keyboard and screen-reader
    // users get the same control and all the text from the section below them.
    const viewport = document.createElement("div");
    viewport.className = "squeeze__viewport";
    viewport.setAttribute("aria-hidden", "true");
    viewport.style.setProperty("--slats", slats);

    const strip = document.createElement("div");
    strip.className = "squeeze__strip";
    viewport.append(strip);

    const foot = document.createElement("div");
    foot.className = "squeeze__foot";

    const captions = document.createElement("div");
    captions.className = "squeeze__captions";
    captions.setAttribute("aria-live", "polite");
    slides.forEach((slide) => captions.append(slide.text));
    foot.append(captions);

    let counter = null;
    if (count > 1) {
      const controls = document.createElement("div");
      controls.className = "squeeze__controls";
      counter = document.createElement("span");
      counter.className = "squeeze__count";
      counter.setAttribute("aria-hidden", "true");
      controls.append(
        counter,
        makeArrow("a11y.prev", "squeeze__arrow--prev", () => step(-1)),
        makeArrow("a11y.next", "squeeze__arrow--next", () => step(1))
      );
      foot.append(controls);
    }

    function makeArrow(key, extra, onClick) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `squeeze__arrow ${extra}`;
      button.innerHTML = CHEVRON;
      // data-i18n-attr keeps the label right when the language is switched.
      button.setAttribute("data-i18n-attr", `aria-label:${key}`);
      button.setAttribute("aria-label", I18N.t(key));
      button.addEventListener("click", onClick);
      return button;
    }

    /* --- cards ----------------------------------------------------------- */
    const makeCard = (slide) => {
      const data = slides[slide];
      const el = document.createElement("button");
      el.type = "button";
      el.className = "squeeze__panel";
      el.tabIndex = -1;

      const img = document.createElement("img");
      img.src = data.src;
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      el.append(img);

      if (data.tagKey) {
        const tag = document.createElement("span");
        tag.className = "squeeze__tag";
        tag.setAttribute("data-i18n", data.tagKey);
        tag.textContent = I18N.t(data.tagKey);
        el.append(tag);
      }

      const card = { el, slide };
      el.addEventListener("click", () => {
        const col = cards.indexOf(card) + column;
        if (col > 0) step(col);
      });
      if (window.matchMedia("(hover: hover)").matches) {
        el.addEventListener("mouseenter", () => {
          const col = cards.indexOf(card) + column;
          if (col >= 1 && col <= 3) strip.dataset.hover = col;
          else delete strip.dataset.hover;
        });
      }
      return card;
    };

    let cards = Array.from({ length: visible }, (_, i) => makeCard(i % count));
    let column = 0; // a card's column is its place in the row plus this
    let timer = 0;

    strip.append(...cards.map((card) => card.el));
    strip.addEventListener("mouseleave", () => delete strip.dataset.hover);

    /* --- draw ------------------------------------------------------------ */
    function render() {
      cards.forEach((card, place) => {
        const col = place + column;
        card.el.dataset.col = col;
        card.el.classList.toggle("is-open", col === 0);
      });
      strip.style.setProperty("--slid", column);

      const open = cards[-column].slide;
      slides.forEach((slide, i) => {
        slide.text.classList.toggle("is-active", i === open);
        slide.text.setAttribute("aria-hidden", String(i !== open));
      });
      if (counter) counter.textContent = `${open + 1} / ${count}`;
    }

    // Removes the copies that have left. Same picture, so nothing may animate.
    function settle() {
      const place = -column;
      const keep = cards.slice(place, place + visible);
      cards.forEach((card) => {
        if (!keep.includes(card)) card.el.remove();
      });
      cards = keep;
      column = 0;
      strip.classList.add("is-still");
      render();
      void strip.offsetWidth;
      strip.classList.remove("is-still");
    }

    /* --- move ------------------------------------------------------------ */
    function step(by) {
      if (count < 2 || !by) return;
      clearTimeout(timer);
      delete strip.dataset.hover;

      if (by > 0) {
        // Enough copies at the far end that the row is never a photo short.
        while (cards.length < -column + by + visible) {
          const last = cards[cards.length - 1];
          const card = makeCard((last.slide + 1) % count);
          cards.push(card);
          strip.append(card.el);
        }
        column -= by;
      } else {
        const back = -by;
        const spare = Math.min(back, -column); // copies already to the left
        const missing = back - spare;
        if (missing) {
          // Add the photos we need at the start and shift the row by the same
          // amount with animation off, so this frame looks exactly the same.
          for (let i = 0; i < missing; i++) {
            const card = makeCard((cards[0].slide - 1 + count) % count);
            cards.unshift(card);
            strip.prepend(card.el);
          }
          column -= missing;
          strip.classList.add("is-still");
          render();
          void strip.offsetWidth;
          strip.classList.remove("is-still");
        }
        column += back;
      }

      render();
      timer = setTimeout(settle, ms + 20);
    }

    /* --- keyboard and swipe ---------------------------------------------- */
    const isRtl = () => document.documentElement.dir === "rtl";

    root.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      step((event.key === "ArrowRight") === isRtl() ? -1 : 1);
    });

    let touchX = 0;
    let touchY = 0;
    viewport.addEventListener(
      "touchstart",
      (event) => {
        touchX = event.changedTouches[0].clientX;
        touchY = event.changedTouches[0].clientY;
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      (event) => {
        const dx = event.changedTouches[0].clientX - touchX;
        const dy = event.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        step(dx < 0 === isRtl() ? -1 : 1);
      },
      { passive: true }
    );

    /* --- switch from the plain layout to the carousel --------------------- */
    root.querySelectorAll(".squeeze__slide").forEach((el) => el.remove());
    root.append(viewport, foot);
    root.classList.add("is-ready");
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-squeeze]").forEach(initSqueeze);
  });
})();

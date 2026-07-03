/* =========================================================================
   AKA — Lectures page (video library rendered from the LECTURES array)
   -------------------------------------------------------------------------
   HOW TO ADD A VIDEO: add one object to the LECTURES array below.

     title    - video title shown on the card (required)
     category - "presentation", "tutorial", or "webinar" (drives the filters)
     src      - EITHER a YouTube link (any form: watch?v=, youtu.be/, shorts/,
                embed/) OR a direct video file path (e.g. "videos/talk.mp4").
                YouTube links are embedded automatically and even get their
                thumbnail for free — no other setup needed.
     speaker  - (optional) speaker name shown under the title
     date     - (optional) e.g. "March 2026"
     duration - (optional) e.g. "12:45" — shown as a badge on the thumbnail
     thumb    - (optional) path to a cover image. Not needed for YouTube
                links (thumbnail is derived); recommended for .mp4 files.
     featured - (optional) true to show this video in the big featured panel
                above the grid (the first featured item wins).

   EXAMPLE (delete the leading // to activate):
   // { title: "NeuViz CT — installation overview", category: "tutorial",
   //   src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
   //   speaker: "Eng. A. Khoury", date: "March 2026", duration: "14:20",
   //   featured: true },
   ========================================================================= */

/* Videos are now managed from the admin panel (/admin/content) and loaded
   from the backend at runtime. The array below is only an offline fallback,
   used if the backend can't be reached. */
const API_BASE = "https://aka-api.hadi-alakkadd.workers.dev";
const LECTURES_FALLBACK = [
  // Optional: hardcode a video here as a fallback (see the instructions above).
];

document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("lecture-modal");
  const grid = document.getElementById("lecture-grid");
  if (!modal || !grid) return;

  // Load from the backend; fall back to the built-in list on any error.
  let LECTURES = LECTURES_FALLBACK;
  try {
    const res = await fetch(`${API_BASE}/content?type=lectures`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) LECTURES = data;
    }
  } catch (e) {
    /* offline — keep the fallback list */
  }

  const featuredSlot = document.getElementById("lecture-featured-slot");
  const filtersWrap = document.getElementById("lecture-filters");
  const soonPanel = document.getElementById("lecture-soon");
  const emptyMsg = document.querySelector(".lecture-empty");
  // NOTE: I18N is a top-level const (not a window property), so feature-detect
  // it with typeof — window.I18N would always be undefined.
  const t = (k) => (typeof I18N !== "undefined" ? I18N.t(k) : k);

  /* ---- YouTube helpers: accept any YouTube URL form ---------------------- */
  function ytId(src) {
    const m = (src || "").match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
    );
    return m ? m[1] : null;
  }
  const ytEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
  const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  /* ---- Card / featured-panel markup -------------------------------------- */
  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function mediaButton(item, className) {
    const id = ytId(item.src);
    const thumb = item.thumb || (id ? ytThumb(id) : "");
    const thumbHtml = thumb
      ? `<img class="lecture-thumb" src="${esc(thumb)}" alt="" loading="lazy" decoding="async" />`
      : `<span class="lecture-placeholder-thumb"><svg viewBox="0 0 24 24"><path d="M8 7v10l9-5Z"/></svg></span>`;
    const duration = item.duration
      ? `<span class="lecture-card__duration">${esc(item.duration)}</span>`
      : "";
    return `
      <button class="${className}" type="button"
        data-video-src="${esc(id ? ytEmbed(id) : item.src)}"
        data-video-type="${id ? "iframe" : "video"}"
        data-video-title="${esc(item.title)}"
        aria-label="${esc(item.title)}">
        ${thumbHtml}
        <span class="lecture-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"/></svg></span>
        ${duration}
      </button>`;
  }

  function metaLine(item) {
    const parts = [item.speaker, item.date].filter(Boolean).map(esc);
    return parts.length ? `<p class="lecture-card__meta">${parts.join(" · ")}</p>` : "";
  }

  /* ---- Render ------------------------------------------------------------- */
  if (LECTURES.length === 0) {
    if (soonPanel) soonPanel.style.display = "";
    return; // nothing else to wire up
  }

  const featured = LECTURES.find((l) => l.featured);
  if (featured && featuredSlot) {
    featuredSlot.innerHTML = `
      <div class="lecture-featured">
        ${mediaButton(featured, "lecture-featured__media")}
        <div class="lecture-featured__info">
          <span class="lecture-tag" data-i18n="lectures.featured.tag">${t("lectures.featured.tag")}</span>
          <h3>${esc(featured.title)}</h3>
          ${metaLine(featured)}
        </div>
      </div>`;
  }

  grid.innerHTML = LECTURES.map(
    (item) => `
    <article class="lecture-card" data-category="${esc(item.category)}">
      ${mediaButton(item, "lecture-card__media")}
      <div class="lecture-card__body">
        <span class="lecture-card__tag" data-i18n="lectures.tag.${esc(item.category)}">${t("lectures.tag." + item.category)}</span>
        <h3 class="lecture-card__title">${esc(item.title)}</h3>
        ${metaLine(item)}
      </div>
    </article>`
  ).join("");

  if (filtersWrap) filtersWrap.style.display = "";

  /* ---- Modal (opens on any media button, incl. the featured panel) -------- */
  const videoWrap = modal.querySelector(".lecture-modal__video-wrap");
  const titleEl = modal.querySelector(".lecture-modal__title");

  function openVideo(trigger) {
    const src = trigger.dataset.videoSrc;
    const type = trigger.dataset.videoType || "video";

    videoWrap.innerHTML = "";
    if (type === "iframe") {
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      videoWrap.appendChild(iframe);
    } else {
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      videoWrap.appendChild(video);
    }
    titleEl.textContent = trigger.dataset.videoTitle || "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeVideo() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    videoWrap.innerHTML = ""; // stops playback
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-video-src]");
    if (trigger) openVideo(trigger);
  });
  modal.querySelectorAll("[data-lecture-close]").forEach((el) =>
    el.addEventListener("click", closeVideo)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeVideo();
  });

  /* ---- Category filters ---------------------------------------------------- */
  const filterBtns = filtersWrap ? filtersWrap.querySelectorAll(".lecture-filter") : [];
  const cards = grid.querySelectorAll(".lecture-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      let visible = 0;
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !match);
        if (match) visible++;
      });
      if (emptyMsg) emptyMsg.style.display = visible === 0 ? "block" : "none";
    });
  });
});

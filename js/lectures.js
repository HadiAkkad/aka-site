/* =========================================================================
   AKA — Lectures page (filters + video modal)
   -------------------------------------------------------------------------
   HOW TO ADD A REAL VIDEO:
   - Find the .lecture-card__media (or .lecture-featured__media) button in
     lectures.html.
   - Set its data-video-src to a file path (e.g. "videos/my-talk.mp4") or a
     hosted URL. Set data-video-type="iframe" if it's a YouTube/Vimeo embed
     URL instead of a direct video file.
   - Replace the .lecture-placeholder-thumb inside it with a real
     <img src="images/lectures/your-thumb.jpg" alt="..." /> for the cover
     image (keep the .lecture-play button and duration badge as siblings).
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("lecture-modal");
  if (!modal) return;

  const videoWrap = modal.querySelector(".lecture-modal__video-wrap");
  const titleEl = modal.querySelector(".lecture-modal__title");

  function openVideo(trigger) {
    const src = trigger.dataset.videoSrc;
    const type = trigger.dataset.videoType || "video";
    const title = trigger.dataset.videoTitle || "";

    videoWrap.innerHTML = "";
    if (src) {
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
    } else {
      // No source uploaded yet — let the user know instead of opening a blank player.
      videoWrap.innerHTML =
        '<p style="color:#fff;text-align:center;padding:2rem">' +
        (window.I18N ? I18N.t("lectures.empty") : "Video coming soon.") +
        "</p>";
    }
    titleEl.textContent = title;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeVideo() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    videoWrap.innerHTML = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-video-src], .lecture-card__media, .lecture-featured__media").forEach((el) => {
    el.addEventListener("click", () => openVideo(el));
  });

  modal.querySelectorAll("[data-lecture-close]").forEach((el) =>
    el.addEventListener("click", closeVideo)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeVideo();
  });

  // Category filters
  const filterBtns = document.querySelectorAll(".lecture-filter");
  const cards = document.querySelectorAll(".lecture-card");
  const emptyMsg = document.querySelector(".lecture-empty");

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

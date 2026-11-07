// Timeline accordion functionality.
// Exposed as window.AKA_initTimeline so pages that inject timeline items
// dynamically (js/projects.js) can (re)bind after rendering; each item is
// guarded so calling it twice never double-binds.
window.AKA_initTimeline = function () {
  const timelineItems = document.querySelectorAll('.timeline-item');

  function closeItem(item) {
    const content = item.querySelector('.timeline-content');
    item.classList.remove('is-open');
    // From "none" the browser can't animate, so lock the real height first.
    if (content.style.maxHeight === 'none') {
      content.style.maxHeight = content.scrollHeight + 'px';
      void content.offsetHeight;
    }
    content.style.maxHeight = '0px';
    item.querySelector('.timeline-header')?.setAttribute('aria-expanded', 'false');
  }

  function openItem(item) {
    const content = item.querySelector('.timeline-content');
    item.classList.add('is-open');
    item.querySelector('.timeline-header')?.setAttribute('aria-expanded', 'true');
    content.style.maxHeight = content.scrollHeight + 'px';
    // Once open, drop the limit so nothing clips when the language or the
    // screen width changes the text height.
    content.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'max-height') return;
      content.removeEventListener('transitionend', done);
      if (item.classList.contains('is-open')) content.style.maxHeight = 'none';
    });
  }

  timelineItems.forEach(item => {
    if (item.dataset.bound) return;
    item.dataset.bound = '1';
    const header = item.querySelector('.timeline-header');
    if (!header) return;
    header.setAttribute('aria-expanded', 'false');

    header.addEventListener('click', function(e) {
      e.preventDefault();
      const isOpen = item.classList.contains('is-open');

      timelineItems.forEach(otherItem => {
        if (otherItem !== item) closeItem(otherItem);
      });

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', function() {
  window.AKA_initTimeline();
});

// Timeline accordion functionality.
// Exposed as window.AKA_initTimeline so pages that inject timeline items
// dynamically (js/projects.js) can (re)bind after rendering; each item is
// guarded so calling it twice never double-binds.
window.AKA_initTimeline = function () {
  const timelineItems = document.querySelectorAll('.timeline-item');

  function closeItem(item) {
    const content = item.querySelector('.timeline-content');
    item.classList.remove('is-open');
    content.style.maxHeight = '0px';
  }

  function openItem(item) {
    const content = item.querySelector('.timeline-content');
    item.classList.add('is-open');
    // Measure after the open class applies the padding, so the height
    // includes it — this keeps the animation matched to the real size.
    content.style.maxHeight = content.scrollHeight + 'px';
  }

  timelineItems.forEach(item => {
    if (item.dataset.bound) return;
    item.dataset.bound = '1';
    const header = item.querySelector('.timeline-header');
    if (!header) return;

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

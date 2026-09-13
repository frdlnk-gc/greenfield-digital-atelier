/* Progressively unfold the process cards; the document keeps its natural reading order. */
(() => {
  'use strict';
  const list = document.querySelector('.growth-steps');
  if (!list || !('IntersectionObserver' in window)) return;
  const steps = [...list.querySelectorAll('.growth-step')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let inView = false;
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('motion-paused');
  const render = () => {
    frame = 0;
    const animated = motionAllowed();
    list.classList.toggle('growth-fan-active', animated);
    const viewport = window.innerHeight;
    const range = Math.min(260, viewport * .3);
    // Measure the stationary wrappers, so transforms never feed back into scroll progress.
    const positions = steps.map(step => step.getBoundingClientRect().top);
    steps.forEach((step, index) => {
      const progress = animated ? Math.max(0, Math.min(1, (viewport * .91 - positions[index]) / range)) : 1;
      step.style.setProperty('--step-open', progress.toFixed(4));
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  const observer = new IntersectionObserver(entries => {
    inView = entries.some(entry => entry.isIntersecting);
    if (inView) schedule();
  }, { rootMargin: '180px 0px' });
  observer.observe(list);
  addEventListener('scroll', () => { if (inView) schedule(); }, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  reduced.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(list);
  render();
})();

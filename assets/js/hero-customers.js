(() => {
  const logos = document.querySelector('[data-customer-logos]');
  const pause = document.querySelector('[data-customer-logos-pause]');
  if (!logos || !pause) return;
  logos.classList.add('is-ready');
  pause.hidden = false;
  pause.addEventListener('click', () => {
    const paused = logos.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Logobänder weiterlaufen lassen' : 'Logobänder anhalten');
  });
  // Static, scrollable rows remain available without JavaScript or with reduced motion.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      logos.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    });
    observer.observe(logos);
  }
})();

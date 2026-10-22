// Fokus-Auftritt „Nachtschicht“ (15.10.2026): Preisrechner mit Mitarbeiter-Regler, Bühne der drei Pakete und dezente
// Bewegung beim Lesen. Ohne Skript und mit prefers-reduced-motion ist alles sofort vollständig sichtbar.
// Kein Speicher, keine Anfragen.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Preisrechner: eine Mitarbeiterliste für Kommunikation und Personal, Kundenbindung fest.
  // Der Regler läuft über Positionen 0 … schritte mit nicht-linearer Skala (website/src/fokus-preise.ts, REGLER):
  // die ersten 60 % des Weges sind 1 bis 100 Mitarbeiter. Pfeiltasten ändern die exakte Zahl um 1.
  for (const box of document.querySelectorAll('[data-fokus-prices]')) {
    const p = JSON.parse(box.dataset.fokusPrices), input = box.querySelector('[data-employees]');
    const r = p.regler, min = p.mitarbeiterMin, max = p.mitarbeiterMax;
    const knick = r.knick > min && r.knick < max ? r.knick : max;
    const a = knick === max ? r.schritte : Math.round(r.schritte * r.anteil), s = r.schritte;
    const toPos = n => Math.round(n <= knick ? ((n - min) / (knick - min)) * a : a + ((n - knick) / (max - knick)) * (s - a));
    const toCount = q => Math.round(q <= a ? min + (q / a) * (knick - min) : knick + ((q - a) / (s - a)) * (max - knick));
    const euro = cents => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    let n = toCount(Number(input.value));
    const show = () => {
      input.setAttribute('aria-valuetext', `${n} Mitarbeiter`);
      // Füllstand der Schiene für die Gestaltung des Reglers.
      input.style.setProperty('--pw-fill', `${(Number(input.value) / s) * 100}%`);
      for (const label of box.querySelectorAll('[data-employee-count]')) label.textContent = String(n);
      const price = id => p[id].monatCent + n * p[id].mitarbeiterCent;
      for (const label of box.querySelectorAll('[data-fokus-total]')) label.textContent = euro(price(label.dataset.fokusTotal));
      for (const label of box.querySelectorAll('[data-fokus-saving]')) label.textContent = euro(price('kommunikation') + price('personal') - price('kombi'));
      for (const label of box.querySelectorAll('[data-fokus-all]')) label.textContent = euro(price('kombi') + price('kundenbindung'));
    };
    const fromSlider = () => {
      const q = Number(input.value);
      if (!Number.isFinite(q)) return;
      n = Math.min(max, Math.max(min, toCount(q)));
      show();
    };
    const KEYS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    input.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      let next;
      if (e.key in KEYS) next = n + KEYS[e.key];
      else if (e.key === 'Home') next = min;
      else if (e.key === 'End') next = max;
      else return;
      e.preventDefault();
      n = Math.min(max, Math.max(min, next));
      input.value = String(toPos(n));
      show();
    });
    input.addEventListener('input', fromSlider);
    input.addEventListener('change', fromSlider);
    // Beschriftung der Skala an ihrer Stelle auf der Schiene (Daumen 26 px).
    for (const mark of box.querySelectorAll('.pw-scale [data-pos]')) mark.style.left = `calc(13px + ${mark.dataset.pos} * (100% - 26px))`;
    box.querySelector('.pw-scale')?.classList.add('is-placed');
    show();
  }

  // ---------- Preiskarten am Handy: Wisch-Karussell mit Punkten; am Rechner ein Raster (dann ohne Wirkung).
  for (const track of document.querySelectorAll('[data-pw-carousel]')) {
    const cards = [...track.children], dots = [...(track.parentElement.querySelector('[data-pw-dots]')?.children ?? [])];
    const pad = () => parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const go = (card, smooth) => track.scrollTo({ left: card.offsetLeft - pad(), behavior: smooth && !reduce ? 'smooth' : 'auto' });
    const mark = (i) => dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    dots.forEach((d, i) => d.addEventListener('click', () => go(cards[i], true)));
    // Aktiver Punkt: die Karte, die am linken Rand einrastet; ganz rechts die letzte.
    let tick = false;
    const sync = () => {
      tick = false;
      const x = track.scrollLeft + pad(), end = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      let best = 0;
      cards.forEach((c, i) => { if (Math.abs(c.offsetLeft - x) < Math.abs(cards[best].offsetLeft - x)) best = i; });
      mark(end && track.scrollLeft > 0 ? cards.length - 1 : best);
    };
    track.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(sync); } }, { passive: true });
    // Auf einer Paketseite steht das passende Paket vorn (Kundenbindung ist die letzte Karte).
    const focus = track.querySelector('.pw-plan--focus');
    if (focus && focus !== cards[0] && track.scrollWidth > track.clientWidth + 4) go(focus, false);
    sync();
  }

  if (!document.body.classList.contains('pw') || !('IntersectionObserver' in window)) return;

  // ---------- Wischstreifen (Personal): „lazy“ lädt im Scroll-Container erst beim Wischen. Kommt der Streifen in die
  // Nähe, laden alle seine Bilder, damit beim Wischen nichts leer ist.
  const strips = document.querySelectorAll('.pw-strip');
  if (strips.length) {
    const near = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { for (const i of e.target.querySelectorAll('img[loading="lazy"]')) i.loading = 'eager'; near.unobserve(e.target); }
    }, { rootMargin: '800px 0px' });
    for (const el of strips) near.observe(el);
  }

  // ---------- Bühne der Pakete (Rechner): das Paket in der Bildschirmmitte bestimmt Fenster und Handy-Bild.
  const stage = document.querySelector('[data-pw-stage]');
  if (stage) {
    const panels = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) stage.setAttribute('data-s', e.target.dataset.pwPanel);
    }, { rootMargin: '-45% 0px -45% 0px' });
    for (const panel of document.querySelectorAll('[data-pw-panel]')) panels.observe(panel);
  }
  if (reduce) return;
  document.documentElement.classList.add('pw-js');

  // ---------- Einblenden beim Lesen.
  const items = document.querySelectorAll('[data-pw-in]');
  if (items.length) {
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); seen.unobserve(e.target); }
    }, { rootMargin: '0px 0px -6% 0px' });
    for (const el of items) seen.observe(el);
  }

  // ---------- Szenen der Pakete: Chat-Nachrichten, Push und Wallet-Karte kommen nacheinander, sobald die Szene im Bild ist.
  const scenes = document.querySelectorAll('[data-pw-play]');
  if (scenes.length) {
    const play = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-play'); play.unobserve(e.target); }
    }, { rootMargin: '0px 0px -18% 0px' });
    for (const el of scenes) play.observe(el);
  }

  // ---------- Hero: die Handys rücken beim Scrollen leicht auseinander.
  const hero = document.querySelector('[data-pw-parallax]');
  if (hero) {
    let tick = false;
    const move = () => { tick = false; hero.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / 700)).toFixed(3)); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }
})();

/* ============================================================
   GREENFIELD DIGITAL – Basis-Interaktionen
   Gehört zur CI-Foundation. Seiten-spezifische Skripte bitte in
   ein eigenes <script> der jeweiligen Seite, nicht hierher.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Scroll-Fortschrittsbalken ---------- */
  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressBar);
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Navigation: Schatten beim Scrollen ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menü-Panel (mobil) ---------- */
  var burger = document.getElementById('burger');
  var navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    /* Abschluss-Bereich des Panels: CTA + direkte Kontaktwege */
    var foot = document.createElement('li');
    foot.className = 'nav-panel-foot';
    var ctaHref = document.getElementById('kontakt') ? '#kontakt' : 'index.html#kontakt';
    foot.innerHTML =
      '<a class="btn btn--primary" href="' + ctaHref + '">Kostenloses Gespräch vereinbaren</a>' +
      '<div class="npf-contact">' +
      '<a href="tel:+4922195018825"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>Anrufen</a>' +
      '<a href="mailto:hello@greenfield-digital.de"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>E-Mail</a>' +
      '</div>';
    navLinks.appendChild(foot);

    function setMenu(open) {
      navLinks.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      /* Leistungen-Akkordeon standardmäßig aufgeklappt – ein Tipp weniger */
      if (open) {
        var drop = navLinks.querySelector('.has-drop');
        if (drop) drop.classList.add('open');
      }
    }

    burger.addEventListener('click', function () {
      setMenu(!navLinks.classList.contains('open'));
    });
    navLinks.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var parentDrop = link.closest('.has-drop');
      var isMobile = window.matchMedia('(max-width: 820px)').matches;
      /* Auf mobil klappt der Eltern-Punkt nur das Untermenü auf/zu */
      if (isMobile && parentDrop && link.parentElement === parentDrop) {
        e.preventDefault();
        parentDrop.classList.toggle('open');
        return;
      }
      setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenu(false);
    });
    /* Beim Wechsel auf Desktop-Breite (z. B. Tablet-Rotation) Menü schließen */
    window.matchMedia('(min-width: 821px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Scroll-Reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Zähler-Animation ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var useSep = el.getAttribute('data-sep') === '.';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('motion-paused')) { el.textContent = target.toLocaleString('de-DE'); return; }
    var duration = 1200;
    var start = null;

    function format(n) {
      return useSep ? n.toLocaleString('de-DE') : String(n);
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      /* ease-out */
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = parseInt(el.getAttribute('data-count'), 10).toLocaleString('de-DE');
    });
  }

  /* ---------- Orbit: Hover/Fokus tauscht den Text in der Mitte ---------- */
  var orbitText = document.getElementById('orbitText');
  if (orbitText) {
    var orbitDefault = orbitText.textContent;
    document.querySelectorAll('.orbit-item').forEach(function (item) {
      function show() { orbitText.textContent = item.getAttribute('data-text') || orbitDefault; }
      function hide() { orbitText.textContent = orbitDefault; }
      item.addEventListener('mouseenter', show);
      item.addEventListener('focus', show);
      item.addEventListener('mouseleave', hide);
      item.addEventListener('blur', hide);
    });
  }

  /* ---------- Karte: sanfter 3D-Tilt bei Mausbewegung ---------- */
  var fineMotion = window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fineMotion) {
    document.querySelectorAll('.map-visual').forEach(function (vis) {
      var tilt = document.createElement('div');
      tilt.className = 'map-tilt';
      while (vis.firstChild) tilt.appendChild(vis.firstChild);
      vis.appendChild(tilt);
      vis.addEventListener('mousemove', function (e) {
        var r = vis.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = 'rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
      });
      vis.addEventListener('mouseleave', function () {
        tilt.style.transform = 'none';
      });
    });
  }

  /* ---------- Phone-Mockups: Animation starten, sobald sichtbar ---------- */
  var phones = document.querySelectorAll('.phone-mock');
  if (phones.length && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('play');
          pio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    phones.forEach(function (p) { pio.observe(p); });
  } else {
    phones.forEach(function (p) { p.classList.add('play'); });
  }

  /* ---------- Karussell-Punkte (mobil, für jedes .m-carousel) ---------- */
  document.querySelectorAll('.m-carousel').forEach(function (car) {
    var items = car.children;
    if (items.length < 2) return;
    var dots = document.createElement('div');
    dots.className = 'm-dots' + (items.length > 9 ? ' many' : '');
    for (var i = 0; i < items.length; i++) {
      (function (idx) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Zu Karte ' + (idx + 1));
        d.addEventListener('click', function () {
          items[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
        dots.appendChild(d);
      })(i);
    }
    car.parentElement.insertBefore(dots, car.nextSibling);
    function update() {
      var mid = car.scrollLeft + car.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < items.length; i++) {
        var c = items[i].offsetLeft + items[i].offsetWidth / 2;
        var dist = Math.abs(c - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      for (var j = 0; j < dots.children.length; j++) {
        dots.children[j].classList.toggle('on', j === best);
      }
    }
    car.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    update();
  });

  /* ---------- Formulare (alle mit data-webhook) ----------
     Jedes Formular mit data-webhook="https://hook.eu1.make.com/…" wird
     als JSON an Make gesendet. Erfolgs-Box: nächstes .form-success-Element
     im selben Container. Pflichtfelder über required-Attribute. */
  document.querySelectorAll('form[data-webhook]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Honeypot: Bots füllen das versteckte Feld */
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      /* Felder generisch einsammeln; Checkbox-Gruppen werden verbunden */
      var payload = {};
      var fd = new FormData(form);
      fd.forEach(function (value, key) {
        if (key === 'website') return;
        var v = String(value).trim();
        if (payload[key]) {
          payload[key] = payload[key] + ', ' + v;
        } else {
          payload[key] = v;
        }
      });
      payload.seite = document.title;
      payload.url = window.location.href;
      payload.zeit = new Date().toLocaleString('de-DE');

      var submitBtn = form.querySelector('[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Wird gesendet…';
      }

      fetch(form.getAttribute('data-webhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Webhook-Fehler ' + res.status);
          var box = form.parentElement.querySelector('.form-success');
          form.hidden = true;
          if (box) {
            box.hidden = false;
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalLabel;
          }
          alert('Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib uns direkt an hello@greenfield-digital.de');
        });
    });
  });
})();

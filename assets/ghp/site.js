// PlantWork website: menu on small screens, the tour (tabs with keyboard), the inquiry form with its fallback.
// No cookies, no requests except the form. Storage only for the consent choice on landing pages, and only when
// site.config.json names tracking services (body[data-tracking]); without it there is no banner and nothing is stored.
(() => {
  // ---------- Menu
  const button = document.querySelector(".menu-btn");
  const menu = document.getElementById("mobilmenue");
  if (button && menu) {
    const set = (open) => {
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute(
        "aria-label",
        open ? "Menü schließen" : "Menü öffnen",
      );
      menu.hidden = !open;
      // Full-screen sheet on phones (Runde 3): the page behind it does not scroll.
      document.documentElement.classList.toggle("menu-open", open);
    };
    button.addEventListener("click", () => set(menu.hidden));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) set(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        set(false);
        button.focus();
      }
    });
  }

  // Desktop solution navigation follows the mobile menu's Escape behaviour.
  // Runde 6: closes on a click beside it, on Escape and when the focus leaves it.
  for (const dropdown of document.querySelectorAll(".solutions-menu")) {
    dropdown.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dropdown.open) {
        dropdown.open = false;
        dropdown.querySelector("summary").focus();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (dropdown.open && !dropdown.contains(event.target)) dropdown.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dropdown.open && !dropdown.contains(document.activeElement)) dropdown.open = false;
    });
    dropdown.addEventListener("focusout", (event) => {
      if (dropdown.open && event.relatedTarget && !dropdown.contains(event.relatedTarget)) dropdown.open = false;
    });
  }

  // ---------- Tour
  for (const tour of document.querySelectorAll("[data-tour]")) {
    const tabs = [...tour.querySelectorAll('[role="tab"]')];
    const show = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      const tab = tabs[i];
      if (focus) tab.focus();
      // Keep the chosen station visible in the scrolling strip on phones.
      const strip = tab.parentElement;
      if (strip.scrollWidth > strip.clientWidth)
        strip.scrollTo({
          left: tab.offsetLeft - 20,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
    };
    const initial = tabs.findIndex((t) => "#" + t.id === location.hash);
    if (initial >= 0) show(initial, false);
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(i, false));
      t.addEventListener("keydown", (e) => {
        const n = tabs.length;
        const next = {
          ArrowRight: i + 1,
          ArrowDown: i + 1,
          ArrowLeft: i - 1,
          ArrowUp: i - 1,
          Home: 0,
          End: n - 1,
        }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        show((next + n) % n, true);
      });
    });
    tour.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]");
      if (!step) return;
      const i = tabs.findIndex(
        (t) => t.getAttribute("aria-selected") === "true",
      );
      const j = Math.min(
        tabs.length - 1,
        Math.max(0, i + Number(step.dataset.step)),
      );
      show(j, false);
      document
        .getElementById(tabs[j].getAttribute("aria-controls"))
        .focus({ preventScroll: true });
    });
  }

  // ---------- Calm, one-time reveal for the homepage story. CSS remains the full fallback.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveal = [...document.querySelectorAll("[data-reveal]")];
  if (reduced || !("IntersectionObserver" in window))
    reveal.forEach((el) => el.classList.add("is-visible"));
  else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    reveal.forEach((el) => observer.observe(el));
  }

  // ---------- Inquiry form
  const form = document.querySelector("[data-inquiry]");
  if (form) {
    const thanks = document.querySelector("[data-thanks]");
    const status = form.querySelector(".form-status");
    const submit = form.querySelector('[type="submit"]');
    const endpoint = form.dataset.endpoint;
    const address = form.dataset.mail;
    const mailto = (d) => {
      const lines = [
        "Anfrage PlantWork",
        "",
        `Name: ${d.name}`,
        `Betrieb: ${d.betrieb}`,
        `E-Mail: ${d.email}`,
        `Telefon: ${d.telefon}`,
        `Betriebsart: ${d.betriebsart}`,
        ...(d.utm_source || d.utm_campaign ? [`Kampagne: ${[d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(" · ")}`] : []),
        ...(d.nachricht ? ["", "Nachricht:", d.nachricht] : []),
      ];
      return `mailto:${address}?subject=${encodeURIComponent(`Anfrage PlantWork: ${d.betrieb}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
    };
    const TEXT = {
      sent: [
        "Danke für Ihre Anfrage.",
        "Wir melden uns bei Ihnen, um einen Termin zu vereinbaren.",
      ],
      mail: [
        "Fast geschafft.",
        "Ihr E-Mail-Programm öffnet sich mit der fertigen Anfrage. Senden Sie die E-Mail ab, dann melden wir uns bei Ihnen.",
      ],
      failed: [
        "Fast geschafft.",
        "Das Senden hat gerade nicht geklappt. Öffnen Sie die fertige E-Mail und senden Sie sie ab, oder rufen Sie uns an.",
      ],
    };
    // Landingpages (13.10.2026): campaign parameters from the address go with the inquiry (hidden fields).
    const utm = new URLSearchParams(location.search);
    for (const input of form.querySelectorAll("[data-utm]")) {
      const v = (utm.get(input.name) || "").replace(/[^\w .:/+-]/g, "").slice(0, 100).trim();
      if (v) input.value = v;
    }
    const done = (variant, link, reason) => {
      // A landing page continues on its own thank-you page with the next step.
      if (variant === "sent" && form.dataset.thanksUrl) return void location.assign(form.dataset.thanksUrl);
      form.hidden = true;
      thanks.hidden = false;
      thanks.dataset.variant = variant;
      thanks.querySelector("[data-thanks-title]").textContent =
        TEXT[variant][0];
      // Feinschliff 15.10.2026: der Grund des Servers (z. B. „Zu viele Anfragen …“) steht kurz davor; der Ausweichweg bleibt.
      thanks.querySelector("[data-thanks-text]").textContent = reason ? `${reason} ${TEXT[variant][1]}` : TEXT[variant][1];
      thanks.querySelector("[data-fallback]").hidden = variant === "sent";
      if (link) thanks.querySelector("[data-mailto]").href = link;
      thanks.focus();
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      // Filled only by simple bots.
      if (data.website) return done("sent");
      delete data.website;
      for (const k of ["utm_source", "utm_medium", "utm_campaign"]) if (!data[k]) delete data[k];
      // The prepared e-mail names the kind of business in words, the app receives its key (src/lib/anfrage.ts).
      const kind = form.querySelector('input[name="betriebsart"]:checked');
      const link = mailto({ ...data, betriebsart: kind?.dataset.label ?? data.betriebsart });
      if (!endpoint) {
        done("mail", link);
        window.location.href = link;
        return;
      }
      submit.disabled = true;
      status.textContent = "Wird gesendet …";
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        const send = (payload) =>
          fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
        let res = await send(data);
        // An inbox that does not know the campaign fields yet refuses them: the inquiry itself must still arrive.
        if (res.status === 400 && Object.keys(data).some((k) => k.startsWith("utm_"))) {
          const answer = await res.clone().json().catch(() => ({}));
          if (/Unbekanntes Feld „utm_/.test(answer.error || "")) {
            for (const k of Object.keys(data)) if (k.startsWith("utm_")) delete data[k];
            res = await send(data);
          }
        }
        clearTimeout(timer);
        if (res.status === 400) {
          // A field the inbox refuses: say which, keep the form.
          const answer = await res.json().catch(() => ({}));
          status.textContent = answer.error || "Bitte die Angaben prüfen.";
          return;
        }
        if (!res.ok) {
          const answer = await res.json().catch(() => ({}));
          const reason = typeof answer.error === "string" ? answer.error.replace(/\s+/g, " ").trim().slice(0, 160) : "";
          status.textContent = "";
          return void done("failed", link, reason);
        }
        done("sent");
      } catch {
        // No dead end: the same inquiry as a prepared e-mail, plus phone.
        status.textContent = "";
        done("failed", link);
      } finally {
        submit.disabled = false;
      }
    });
  }
})();

// ---------- Glashaus: Bewegung auf der Startseite. Nur transform/opacity, pausiert außerhalb des Bildes,
// ohne Bewegung (prefers-reduced-motion) gilt der Endzustand. Kein Speicher, keine Anfragen.
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("motion");
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const io = (cb, opts) => ("IntersectionObserver" in window ? new IntersectionObserver(cb, opts) : null);
  const fmt = new Intl.NumberFormat("de-DE");

  // Zahlen hochzählen
  const count = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const to = Number(el.dataset.count);
    if (reduce) return void (el.textContent = fmt.format(to));
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1200);
      el.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counter = io((es) => es.forEach((e) => e.isIntersecting && (count(e.target), counter.unobserve(e.target))), { threshold: 0.6 });
  $$("[data-count]").forEach((el) => (reduce || !counter ? count(el) : counter.observe(el)));

  // Erscheinen beim Scrollen (die Startfläche erscheint per CSS, ohne Skript)
  const riser = io((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.remove("pre"), riser.unobserve(e.target))), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  if (!reduce && riser)
    for (const el of $$("[data-rise]")) {
      if (el.closest(".g-hero")) continue;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) continue;
      el.classList.add("pre");
      riser.observe(el);
    }

  // Vignetten und Tipp-Handys laufen nur, solange sie zu sehen sind
  const player = io((es) => es.forEach((e) => e.target.classList.toggle("play", e.isIntersecting && !reduce)), { threshold: 0.35 });
  if (player) $$("[data-vig], .tapper").filter((el) => !el.closest("[data-tale]")).forEach((el) => player.observe(el));

  // Karussell: Zähler und Punkte
  for (const car of $$("[data-carousel]")) {
    const track = car.querySelector(".vigs__track"),
      items = $$(".vig", track),
      dots = car.querySelector(".vigs__dots"),
      num = car.querySelector(".vigs__count b");
    const buttons = items.map((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Situation ${i + 1} von ${items.length}`);
      b.addEventListener("click", () => track.scrollTo({ left: it.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft || "0"), behavior: reduce ? "auto" : "smooth" }));
      dots.append(b);
      return b;
    });
    let cur = -1;
    const upd = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      items.forEach((it, i) => {
        const d = Math.abs(it.offsetLeft - track.offsetLeft + it.offsetWidth / 2 - mid);
        if (d < bd) (bd = d), (best = i);
      });
      if (best === cur) return;
      cur = best;
      num.textContent = String(best + 1);
      buttons.forEach((b, i) => b.classList.toggle("on", i === best));
    };
    track.addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true });
    upd();
  }

  // Ablauf: Schritt aus der Scrollposition; Tiefe der Glas-Ebenen; Leiste auf dem Handy
  const story = document.querySelector("[data-story]");
  const par = $$("[data-speed]");
  const big = matchMedia("(min-width: 1025px) and (pointer: fine)");
  const dock = document.querySelector(".dock"),
    hero = document.querySelector(".g-hero"),
    fin = document.querySelector(".final");
  // Erzählabschnitte (Runde 3): eine Situation nach der anderen; die Scrollposition führt vom Problem zur Lösung.
  const tales = $$("[data-tale]").map((t) => ({
    track: t.querySelector(".tale__track"),
    sticky: t.querySelector(".tale__sticky"),
    items: $$(".tale__item", t),
    bars: $$(".tale__bar u", t),
    cur: -1,
  }));
  const taleFrame = (vh) => {
    if (reduce) return;
    for (const t of tales) {
      const r = t.track.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(t.sticky).top) || 0; // the sticky stage sits below the header
      const span = Math.max(1, r.height - t.sticky.offsetHeight);
      const progress = Math.min(0.9999, Math.max(0, (top - r.top) / span));
      const n = t.items.length;
      const idx = Math.min(n - 1, Math.floor(progress * n));
      const local = progress * n - idx;
      const seen = r.top < vh && r.bottom > 0;
      t.items.forEach((it, i) => {
        const on = i === idx;
        if (it.classList.contains("is-on") !== on) it.classList.toggle("is-on", on);
        it.classList.toggle("play", on && seen);
        if (on) {
          // Problem in the first half, solution in the second; the short cross-fade (42–56 % of the loop) takes
          // only a sliver of scrolling, so the picture is never empty for long.
          const time =
            local < 0.47 ? 0.06 + (local / 0.47) * 0.36 : local < 0.53 ? 0.42 + ((local - 0.47) / 0.06) * 0.14 : 0.56 + ((local - 0.53) / 0.47) * 0.37;
          it.style.setProperty("--sd", `${(-time * 8).toFixed(2)}s`);
          const phase = time < 0.5 ? "prob" : "sol";
          if (it.dataset.phase !== phase) it.dataset.phase = phase;
        }
      });
      t.bars.forEach((u, i) => (u.style.transform = `scaleX(${i < idx ? 1 : i === idx ? local.toFixed(3) : 0})`));
    }
  };
  const frame = () => {
    const vh = innerHeight;
    taleFrame(vh);
    if (!reduce && big.matches)
      for (const el of par) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        el.style.transform = `translate3d(0,${((r.top + r.height / 2 - vh / 2) * -Number(el.dataset.speed)).toFixed(1)}px,0)`;
      }
    if (dock && hero && fin) {
      const inStory = tales.some((t) => { const r = t.track.getBoundingClientRect(); return r.top < vh * 0.5 && r.bottom > vh * 0.5; });
      const show = hero.getBoundingClientRect().bottom < 0 && fin.getBoundingClientRect().top > vh * 0.9 && !inStory;
      if (dock.classList.contains("on") !== show) {
        dock.classList.toggle("on", show);
        dock.setAttribute("aria-hidden", String(!show));
        dock.querySelector("a").tabIndex = show ? 0 : -1;
      }
    }
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => ((ticking = false), frame()));
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  frame();

  // Funktionen: Reiter mit Fortschritt, schalten weiter, solange sichtbar und unberührt
  for (const box of $$("[data-tabs]")) {
    const tabs = $$('[role="tab"]', box),
      panels = $$('[role="tabpanel"]', box);
    let idx = 0, timer = null, visible = false, hover = false, manual = false;
    const show = (i, user) => {
      idx = i;
      tabs.forEach((t, k) => {
        t.setAttribute("aria-selected", String(k === i));
        t.tabIndex = k === i ? 0 : -1;
        t.classList.remove("run");
      });
      panels.forEach((p, k) => {
        p.classList.toggle("is-on", k === i);
        p.setAttribute("aria-hidden", String(k !== i));
        if (k === i) $$("[data-count]", p).forEach((el) => ((el.dataset.done = ""), count(el)));
      });
      if (user) {
        manual = true;
        clearInterval(timer);
        timer = null;
        return;
      }
      void tabs[i].offsetWidth;
      if (visible && !reduce) tabs[i].classList.add("run");
    };
    const start = () => {
      if (reduce || timer || manual) return;
      tabs[idx].classList.add("run");
      timer = setInterval(() => hover || show((idx + 1) % tabs.length), 6500);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(i, true));
      t.addEventListener("keydown", (e) => {
        const n = tabs.length;
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        show((next + n) % n, true);
        tabs[(next + n) % n].focus();
      });
    });
    box.addEventListener("pointerenter", () => (hover = true));
    box.addEventListener("pointerleave", () => (hover = false));
    const watch = io((es) => {
      visible = es[0].isIntersecting;
      box.classList.toggle("play", visible && !reduce);
      if (visible) start();
      else {
        clearInterval(timer);
        timer = null;
        tabs.forEach((t) => t.classList.remove("run"));
      }
    }, { threshold: 0.3 });
    if (watch) watch.observe(box);
  }

  // Betriebsart: Umschalter auf dem Handy
  for (const seg of $$("[data-seg]")) {
    const btns = $$('[role="tab"]', seg),
      cards = $$("[data-types] .type");
    btns.forEach((b, i) =>
      b.addEventListener("click", () => {
        btns.forEach((x, k) => {
          x.setAttribute("aria-selected", String(k === i));
          x.tabIndex = k === i ? 0 : -1;
        });
        cards.forEach((c, k) => c.classList.toggle("is-on", k === i));
      }),
    );
  }
})();

// ---------- Funktionen: Kapitel steuern das stehende App-Bild
(() => {
  const box = document.querySelector("[data-fx]");
  if (!box || !("IntersectionObserver" in window)) return;
  const chapters = [...box.querySelectorAll(".fx__ch")],
    shots = [...box.querySelectorAll(".fx__shot")],
    rail = [...box.querySelectorAll(".fx__rail i")],
    navs = [...document.querySelectorAll(".fx__nav")];
  let cur = 0;
  const set = (i) => {
    if (i === cur) return;
    cur = i;
    shots.forEach((s, k) => s.classList.toggle("is-on", k === i));
    rail.forEach((r, k) => r.classList.toggle("is-on", k === i));
    navs.forEach((n, k) => n.classList.toggle("is-on", k === i));
  };
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && set(Number(e.target.dataset.ch))),
    { rootMargin: "-45% 0px -50% 0px" },
  );
  chapters.forEach((c) => io.observe(c));
})();

// ---------- Runde 5: Vorher/Nachher-Umschalter, Ablauf zum Durchtippen, Mini-Vorführung im Bestand
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (q, c = document) => [...c.querySelectorAll(q)];
  const io = (cb, o) => ("IntersectionObserver" in window ? new IntersectionObserver(cb, o) : null);

  // „Heute | Mit PlantWork“: the visitor switches; once, shortly after a card is in view, it switches by itself.
  for (const pair of $$("[data-pair]")) {
    const btns = $$(".pair__switch button", pair);
    let touched = false;
    const set = (to) => {
      pair.dataset.state = to;
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.to === to)));
    };
    btns.forEach((b) => b.addEventListener("click", () => ((touched = true), set(b.dataset.to))));
    if (reduce) continue;
    let timer = null;
    const watch = io((es) => {
      const e = es[0];
      if (e.isIntersecting && !touched && pair.dataset.state === "heute") timer = setTimeout(() => touched || (set("mit"), watch.disconnect()), 2200);
      else clearTimeout(timer);
    }, { threshold: 0.7 });
    if (watch) watch.observe(pair);
  }

  // Ablauf: Zeitstrahl, Schritte antippen; läuft langsam von selbst weiter, solange sichtbar und unberührt.
  for (const flow of $$("section.story--flow, section[data-chain]")) {
    const btns = $$(".flow__btn", flow);
    const n = btns.length;
    let step = 1, timer = null, touched = false, seen = false;
    const set = (s) => {
      step = ((s - 1 + n) % n) + 1;
      flow.dataset.step = String(step);
      btns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.go) === step)));
    };
    const stop = () => ((touched = true), clearInterval(timer), (timer = null));
    btns.forEach((b) => b.addEventListener("click", () => (stop(), set(Number(b.dataset.go)))));
    flow.querySelector(".flow__prev")?.addEventListener("click", () => (stop(), set(step - 1)));
    flow.querySelector(".flow__next")?.addEventListener("click", () => (stop(), set(step + 1)));
    set(1);
    if (reduce) continue;
    const watch = io((es) => {
      seen = es[0].isIntersecting;
      if (seen && !touched && !timer) timer = setInterval(() => set(step + 1), 5200);
      if (!seen) (clearInterval(timer), (timer = null));
    }, { threshold: 0.5 });
    if (watch) watch.observe(flow);
  }

  // Mini-Vorführung: 40 Stk. verkaufen und sehen, wie frei und reserviert sich ändern.
  for (const demo of $$("[data-demo]")) {
    const btn = demo.querySelector("[data-demo-btn]"),
      res = demo.querySelector("[data-res]"),
      free = demo.querySelector("[data-free]"),
      note = demo.querySelector("[data-demo-note]");
    btn?.addEventListener("click", () => {
      const sold = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(sold));
      demo.classList.toggle("is-sold", sold);
      res.textContent = sold ? "400" : "360";
      free.textContent = sold ? "20" : "60";
      note.textContent = sold ? "Auftrag angelegt: 40 Stk. sind jetzt für den Kunden reserviert. Frei sind noch 20." : "Tippen Sie und sehen Sie, wie sich der Bestand ändert.";
    });
  }
})();

// ---------- Runde 6: Schaubilder der vier Säulen. Jede Bedienung wirkt sofort; von selbst nur einmal und nur
// ohne reduzierte Bewegung, solange das Schaubild zu sehen ist.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (q, c = document) => [...c.querySelectorAll(q)];
  const once = (el, ms, fn, threshold = 0.6) => {
    if (reduce || !("IntersectionObserver" in window)) return;
    let timer = null;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) timer = setTimeout(() => (fn(), io.disconnect()), ms);
      else clearTimeout(timer);
    }, { threshold });
    io.observe(el);
    return () => (clearTimeout(timer), io.disconnect());
  };

  // Säule Bestand: „Heute | Mit PlantWork“
  for (const fig of $$("[data-dg1]")) {
    const btns = $$(".dg-switch button", fig);
    const set = (to) => {
      fig.dataset.state = to;
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.to === to)));
    };
    const cancel = once(fig, 2600, () => set("mit"));
    btns.forEach((b) => b.addEventListener("click", () => (cancel?.(), set(b.dataset.to))));
  }

  // Personalplanung: Plan vorschlagen lassen
  for (const fig of $$("[data-plan]")) {
    const btn = fig.querySelector("[data-plan-btn]"),
      label = fig.querySelector("[data-plan-label]"),
      title = fig.querySelector("[data-plan-title]");
    const set = (on) => {
      fig.classList.toggle("is-planned", on);
      btn.setAttribute("aria-pressed", String(on));
      label.textContent = on ? "Zurück zum heutigen Stand" : "Plan vorschlagen lassen";
      title.textContent = on ? "Vorschlag: alle unter 20 Stunden" : "Heute: zwei Konten über 90 Stunden";
      for (const v of $$(".dg3__v", fig)) v.textContent = on ? v.dataset.m : v.dataset.h;
    };
    const cancel = once(fig, 3000, () => set(true));
    btn.addEventListener("click", () => (cancel?.(), set(btn.getAttribute("aria-pressed") !== "true")));
  }

  // Kommunikation: Nachrichten laufen, solange das Netz zu sehen ist
  for (const fig of $$("[data-net]")) {
    if (!("IntersectionObserver" in window)) { fig.classList.add("is-on"); continue; }
    new IntersectionObserver((es) => fig.classList.toggle("is-on", es[0].isIntersecting), { threshold: 0.3 }).observe(fig);
  }
})();

// ---------- Runde 7: Endlose Animationen laufen nur, solange ihr Abschnitt zu sehen ist (WebKit-Befund 12.10.:
// dauernd laufende Schleifen außerhalb des Bildes hielten die Darstellung beschäftigt). CSS: .is-paused.
(() => {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.target.classList.toggle("is-paused", !e.isIntersecting)),
    { rootMargin: "120px 0px" },
  );
  document.querySelectorAll("main section, main figure, .aurora").forEach((el) => io.observe(el));
})();

// ---------- Runde 7: Schaufenster, Verlauf, Kartenstapel, Kartenreihe der Preise. Nur transform/opacity; ohne
// Bewegung wechselt nichts von selbst. Kein Speicher, keine Anfragen.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (q, c = document) => [...c.querySelectorAll(q)];

  // Schaufenster (Runde 8): echte App-Bilder als Glasscheiben hintereinander; die vordere wechselt, das iPhone daneben
  // zeigt abwechselnd die Sicht einer Mitarbeiterin. Läuft nur sichtbar und ungestoppt, hält bei Maus und Fokus an.
  for (const show of $$("[data-show]")) {
    const steps = $$("[data-show-go]", show),
      panes = $$(".sc8__pane", show),
      shots = $$(".iph__shot", show),
      title = show.querySelector("[data-show-title]"),
      cap = show.querySelector("[data-show-cap]"),
      pause = show.querySelector("[data-show-pause]");
    const titles = steps.map((b) => b.dataset.title),
      alts = steps.map((b) => b.dataset.alt);
    let i = 0, timer = null, seen = false, paused = reduce, hold = false;
    const focus = (n) => {
      i = n;
      show.dataset.i = String(n);
      panes.forEach((p) => (p.dataset.pos = String((Number(p.dataset.n) - n + panes.length) % panes.length)));
      shots.forEach((s, k) => s.classList.toggle("is-on", k === n % shots.length));
      steps.forEach((b, k) => b.setAttribute("aria-pressed", String(k === n)));
      if (title.textContent !== titles[n]) {
        title.classList.add("is-out");
        setTimeout(() => ((title.textContent = titles[n]), title.classList.remove("is-out")), reduce ? 0 : 300);
      }
      if (cap) cap.textContent = alts[n];
    };
    const stop = () => (clearTimeout(timer), (timer = null));
    const run = () => {
      stop();
      if (paused || !seen || hold) return;
      timer = setTimeout(() => (focus((i + 1) % steps.length), run()), 5600);
    };
    steps.forEach((b, k) => b.addEventListener("click", () => (focus(k), run())));
    if (pause) {
      const setPaused = (p) => {
        paused = p;
        pause.setAttribute("aria-pressed", String(p));
        pause.setAttribute("aria-label", p ? "Wechsel fortsetzen" : "Wechsel anhalten");
        if (p) stop();
        else run();
      };
      if (reduce) setPaused(true);
      pause.addEventListener("click", () => setPaused(!paused));
    }
    const holdOn = () => ((hold = true), stop());
    const holdOff = () => ((hold = false), run());
    show.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && holdOn());
    show.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && holdOff());
    show.addEventListener("focusin", holdOn);
    show.addEventListener("focusout", (e) => !show.contains(e.relatedTarget) && holdOff());
    if ("IntersectionObserver" in window)
      new IntersectionObserver((es) => {
        const visible = es[0].isIntersecting;
        // Threshold/layout notifications can repeat while the showcase stays visible.
        if (visible === seen) return;
        seen = visible;
        if (seen) run();
        else stop();
      }, { threshold: 0.35 }).observe(show);
  }

  // Abläufe im Vergleich: Reiter mit Pfeiltasten (Runde 8).
  for (const box of $$("[data-ab]")) {
    const tabs = $$('[role="tab"]', box);
    const pick = (k, f) => {
      tabs.forEach((t, j) => {
        t.setAttribute("aria-selected", String(j === k));
        t.tabIndex = j === k ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = j !== k;
      });
      if (f) tabs[k].focus();
    };
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => pick(k, false));
      t.addEventListener("keydown", (e) => {
        const n = tabs.length, to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: n - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        pick((to + n) % n, true);
      });
    });
  }

  // Kartenstapel: die oberste Karte bestimmt die Überschrift in der Liste; darunterliegende Karten treten zurück.
  for (const lf of $$("[data-lf]")) {
    const cards = $$("[data-lf-card]", lf),
      items = $$("[data-lf-li]", lf),
      list = lf.querySelector(".lf__list");
    let cur = -1;
    const frame = () => {
      let a = 0;
      cards.forEach((c, k) => {
        const top = parseFloat(getComputedStyle(c).top) || 0;
        if (c.getBoundingClientRect().top <= top + 2) a = k;
      });
      cards.forEach((c, k) => c.classList.toggle("is-under", k < a && !reduce));
      if (a === cur) return;
      cur = a;
      items.forEach((li, k) => li.classList.toggle("is-on", k === a));
      if (list) list.style.setProperty("--a", String(a));
    };
    let ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => ((ticking = false), frame()));
    }, { passive: true });
    frame();
  }

  // Kartenreihe der Preise: Pfeile blättern um eine Karte; deaktiviert am Anfang und Ende.
  for (const fam of $$(".an__fam")) {
    const row = fam.querySelector("[data-row]"),
      arrows = $$("[data-row-step]", fam);
    if (!row) continue;
    const upd = () => {
      const max = row.scrollWidth - row.clientWidth - 2;
      arrows.forEach((a) => (a.disabled = Number(a.dataset.rowStep) < 0 ? row.scrollLeft <= 2 : row.scrollLeft >= max));
    };
    arrows.forEach((a) =>
      a.addEventListener("click", () => {
        const card = row.querySelector(".an__card");
        row.scrollBy({ left: Number(a.dataset.rowStep) * ((card?.offsetWidth ?? 300) + 16), behavior: reduce ? "auto" : "smooth" });
      }),
    );
    row.addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true });
    addEventListener("resize", upd);
    upd();
  }
})();

// ---------- Landingpages: Einwilligung für Messdienste (13.10.2026). Nur wenn body[data-tracking] Dienste nennt; ohne
// Einwilligung wird nichts geladen. Noch ist kein Pixel eingebaut: „plantwork:tracking“ ist die Stelle dafür, die
// Danke-Seite meldet dort zusätzlich „plantwork:conversion“.
(() => {
  const services = (document.body.dataset.tracking || "").split(" ").filter(Boolean);
  const banner = document.querySelector("[data-consent]");
  if (!services.length || !banner) return;
  const KEY = "pw_einwilligung";
  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };
  const start = () => {
    if (document.documentElement.dataset.trackingOn) return;
    document.documentElement.dataset.trackingOn = "1";
    document.dispatchEvent(new CustomEvent("plantwork:tracking", { detail: { services } }));
    if (document.querySelector("[data-conversion]")) document.dispatchEvent(new CustomEvent("plantwork:conversion", { detail: { services } }));
  };
  const choose = (v) => {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    banner.hidden = true;
    if (v === "ja") start();
    else if (document.documentElement.dataset.trackingOn) location.reload();
  };
  banner.addEventListener("click", (e) => {
    const b = e.target.closest("[data-consent-choice]");
    if (b) choose(b.dataset.consentChoice);
  });
  const open = document.querySelector("[data-consent-open]");
  if (open) {
    open.addEventListener("click", () => {
      banner.hidden = false;
      banner.querySelector("button")?.focus();
    });
    // The static page can be visible before this deferred script has loaded.
    open.disabled = false;
  }
  const stored = read();
  if (stored === "ja") start();
  else if (stored !== "nein") banner.hidden = false;
})();

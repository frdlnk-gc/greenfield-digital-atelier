/* First-party consent preferences. No optional service is loaded by this file. */
(() => {
  'use strict';
  const KEY = 'gf-consent-v1', VERSION = 1, DAYS = 180, TTL = DAYS * 86400000;
  const base = new URL('../../', document.currentScript.src);
  const privacy = new URL('datenschutz.html#cookies', base).href;
  const imprint = new URL('impressum.html', base).href;
  const valid = value => value && value.version === VERSION && typeof value.vimeo === 'boolean'
    && Number.isFinite(value.savedAt) && value.savedAt <= Date.now()
    && value.expiresAt === value.savedAt + TTL && value.expiresAt > Date.now();
  function read() {
    try { const value = JSON.parse(localStorage.getItem(KEY)); return valid(value) ? value : null; }
    catch { return null; }
  }
  let choice = read(), timer, returnFocus;
  const banner = document.createElement('section');
  banner.className = 'gf-consent';
  banner.setAttribute('aria-labelledby', 'gf-consent-title');
  banner.innerHTML = `<div class="gf-consent-heading"><span class="gf-consent-mark" aria-hidden="true">✓</span><div><span class="gf-consent-kicker">Cookies & Datenschutz</span><h2 id="gf-consent-title">Deine Entscheidung. Deine Daten.</h2></div></div>
    <p>Wir nutzen technisch notwendige Speicherfunktionen. Kundenfilme von Vimeo laden wir nur mit deiner Einwilligung. Dabei können Daten wie deine IP-Adresse auch in den USA verarbeitet werden.</p>
    <div class="gf-consent-actions"><button type="button" data-consent-reject>Nur notwendige</button><button type="button" data-consent-accept>Alle akzeptieren</button></div>
    <button class="gf-consent-customize" type="button" data-consent-settings>Einstellungen anpassen</button>
    <div class="gf-consent-links"><a href="${privacy}">Datenschutz</a><a href="${imprint}">Impressum</a><span>Jederzeit im Footer änderbar</span></div>`;
  banner.hidden = !!choice;
  document.body.append(banner);

  const settings = document.createElement('dialog');
  settings.className = 'gf-consent-settings';
  settings.setAttribute('aria-labelledby', 'gf-settings-title');
  settings.innerHTML = `<div class="gf-settings-head"><div><span class="gf-consent-kicker">Du hast die Wahl</span><h2 id="gf-settings-title">Cookie-Einstellungen</h2></div><button class="gf-consent-close" type="button" aria-label="Einstellungen schließen">×</button></div>
    <p>Du entscheidest, ob wir externe Kundenfilme einbetten dürfen. Deine Auswahl gilt für 180 Tage und kann hier jederzeit geändert oder widerrufen werden.</p>
    <div class="gf-consent-category"><div class="gf-consent-category-title"><strong>Notwendige Funktionen</strong><span class="gf-consent-required">Immer aktiv</span></div><p>Wir speichern deine Datenschutz-Auswahl und auf Wunsch deine Einstellung für Animationen in diesem Browser. Formulare und unsere eigenen Reels funktionieren auch ohne optionale Einwilligung.</p></div>
    <div class="gf-consent-category"><label class="gf-consent-category-title" for="gf-vimeo"><strong>Externe Medien · Vimeo</strong><input type="checkbox" id="gf-vimeo" aria-describedby="gf-vimeo-description"></label><p id="gf-vimeo-description">Zeigt Kundeninterviews mit dem Player von Vimeo.com, Inc. an. Erst wenn du einen Film öffnest, erhält Vimeo Verbindungsdaten wie IP-Adresse, Browser und die besuchte Seite. Cookies und eine Verarbeitung in den USA sind möglich. Wir verwenden die datensparsame Player-Einstellung „Do Not Track“; sie verhindert nicht alle technisch notwendigen Cookies.</p><a href="${privacy}">Details zu Vimeo und zum Widerruf →</a></div>
    <p class="gf-consent-note">Auf dieser Website sind derzeit weder Google Analytics noch Meta Pixel eingebunden.</p>
    <div class="gf-consent-actions"><button type="button" data-consent-reject>Nur notwendige</button><button type="button" data-consent-accept>Alle akzeptieren</button></div>
    <button class="gf-consent-save" type="button">Auswahl speichern</button>`;
  document.body.append(settings);
  const toggle = settings.querySelector('#gf-vimeo');
  const status = document.createElement('p');
  status.className = 'gf-consent-status'; status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite'); document.body.append(status);

  function render() {
    banner.hidden = !!choice;
    document.body.classList.toggle('gf-consent-visible', !choice);
    toggle.checked = !!choice?.vimeo;
    clearTimeout(timer);
    if (choice) timer = setTimeout(refresh, Math.min(choice.expiresAt - Date.now() + 20, 2147483647));
  }
  function announceChange() {
    document.dispatchEvent(new CustomEvent('gf:consentchange', {detail: {vimeo: valid(choice) && choice.vimeo === true}}));
  }
  function save(vimeo) {
    const savedAt = Date.now();
    choice = {version: VERSION, vimeo: vimeo === true, savedAt, expiresAt: savedAt + TTL};
    let persisted = true;
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch { persisted = false; }
    if (settings.open) settings.close();
    render(); announceChange();
    status.textContent = persisted ? 'Deine Datenschutz-Auswahl wurde gespeichert.' : 'Deine Auswahl gilt für diese Seite. Dein Browser erlaubt keine dauerhafte Speicherung.';
  }
  function refresh() {
    if (choice && !valid(choice)) {
      choice = null;
      try { localStorage.removeItem(KEY); } catch {}
      render(); announceChange();
    } else render();
  }
  function openSettings() {
    refresh(); returnFocus = document.activeElement; toggle.checked = !!choice?.vimeo;
    settings.showModal();
  }
  for (const root of [banner, settings]) {
    root.querySelector('[data-consent-reject]').addEventListener('click', () => save(false));
    root.querySelector('[data-consent-accept]').addEventListener('click', () => save(true));
  }
  banner.querySelector('[data-consent-settings]').addEventListener('click', openSettings);
  settings.querySelector('.gf-consent-save').addEventListener('click', () => save(toggle.checked));
  settings.querySelector('.gf-consent-close').addEventListener('click', () => settings.close());
  settings.addEventListener('close', () => { if (returnFocus?.isConnected && returnFocus.getClientRects().length) returnFocus.focus(); });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-cookie-settings]')) { event.preventDefault(); openSettings(); }
  });
  addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) { choice = read(); render(); announceChange(); }
  });
  addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

  window.GreenfieldConsent = Object.freeze({
    allows: service => service === 'vimeo' && !!valid(choice) && choice.vimeo,
    openSettings,
    showVimeoNotice(container) {
      const notice = document.createElement('div');
      notice.className = 'gf-vimeo-notice';
      notice.innerHTML = `<span class="gf-consent-kicker">Externes Kundeninterview</span><h3>Vimeo für diesen Film freigeben</h3><p>Beim Abspielen erhält Vimeo unter anderem deine IP-Adresse. Cookies und eine Verarbeitung in den USA sind möglich. Deine Freigabe gilt für alle Vimeo-Kundenfilme für 180 Tage; im Footer kannst du sie jederzeit widerrufen.</p><button type="button">Vimeo erlauben & Film abspielen</button><a href="${privacy}">Datenschutzhinweise lesen</a>`;
      notice.querySelector('button').addEventListener('click', () => save(true));
      container.replaceChildren(notice);
    }
  });
  render();
})();

/* First-party consent preferences. No optional service is loaded by this file. */
(() => {
  'use strict';
  const KEY = 'gf-consent-v2', VERSION = 2, DAYS = 180, TTL = DAYS * 86400000;
  const base = new URL('../../', document.currentScript.src);
  const privacy = new URL('datenschutz.html#cookies', base).href;
  const imprint = new URL('impressum.html', base).href;
  const valid = value => value && value.version === VERSION && ['vimeo','analytics','marketing'].every(key => typeof value[key] === 'boolean')
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
    <p>Du wählst, welche optionalen Dienste du erlaubst: externe Medien, Analyse und Marketing. Ohne deine Zustimmung bleiben sie gesperrt. Bei externen Diensten können Daten auch in den USA verarbeitet werden.</p>
    <div class="gf-consent-actions"><button type="button" data-consent-reject>Nur notwendige</button><button type="button" data-consent-accept>Alle akzeptieren</button></div>
    <button class="gf-consent-customize" type="button" data-consent-settings>Einstellungen anpassen</button>
    <div class="gf-consent-links"><a href="${privacy}">Datenschutz</a><a href="${imprint}">Impressum</a><span>Jederzeit im Footer änderbar</span></div>`;
  banner.hidden = !!choice;
  document.body.append(banner);

  const settings = document.createElement('dialog');
  settings.className = 'gf-consent-settings';
  settings.setAttribute('aria-labelledby', 'gf-settings-title');
  settings.innerHTML = `<div class="gf-settings-head"><div><span class="gf-consent-kicker">Du hast die Wahl</span><h2 id="gf-settings-title">Cookie-Einstellungen</h2></div><button class="gf-consent-close" type="button" aria-label="Einstellungen schließen">×</button></div>
    <p>Externe Medien, Analyse und Marketing kannst du getrennt auswählen. Deine Entscheidung gilt für 180 Tage und ist hier jederzeit änderbar. Optionale Dienste sind zunächst ausgeschaltet.</p>
    <div class="gf-consent-category"><div class="gf-consent-category-title"><strong>Notwendige Funktionen</strong><span class="gf-consent-required">Immer aktiv</span></div><p>Speichert deine Datenschutz-Auswahl und auf Wunsch deine Einstellung für Animationen. Formulare funktionieren auch ohne optionale Einwilligung.</p></div>
    <div class="gf-consent-category"><label class="gf-consent-category-title" for="gf-vimeo"><strong>Externe Medien · Vimeo</strong><input type="checkbox" id="gf-vimeo" aria-describedby="gf-vimeo-description"></label><p id="gf-vimeo-description">Lädt Kundenfilme von Vimeo.com, Inc. erst nach deiner Freigabe und beim Abspielen. Vimeo erhält unter anderem IP-Adresse, Browser und besuchte Seite. Cookies und eine Verarbeitung in den USA sind möglich.</p><a href="${privacy}">Details zu Vimeo und zum Widerruf →</a></div>
    <div class="gf-consent-category"><label class="gf-consent-category-title" for="gf-analytics"><strong>Analyse · Google Analytics</strong><input type="checkbox" id="gf-analytics" aria-describedby="gf-analytics-description"></label><p id="gf-analytics-description">Hilft zu verstehen, welche Inhalte Besucher interessieren und wie sie die Website nutzen. Google kann dafür Nutzungs- und Geräteinformationen verarbeiten und Cookies zur Wiedererkennung speichern.</p><a href="${new URL('datenschutz.html#analyse-marketing',base).href}">Zwecke und Anbieter ansehen →</a></div>
    <div class="gf-consent-category"><label class="gf-consent-category-title" for="gf-marketing"><strong>Marketing · Google Ads & Meta Ads</strong><input type="checkbox" id="gf-marketing" aria-describedby="gf-marketing-description"></label><p id="gf-marketing-description">Ermöglicht die Messung von Werbekampagnen und die Wiederansprache interessierter Besucher. Google und Meta können Seitenaufrufe, Interaktionen und Geräteinformationen mit Werbekennungen verknüpfen.</p><a href="${new URL('datenschutz.html#analyse-marketing',base).href}">Zwecke und Anbieter ansehen →</a></div>
    <p class="gf-consent-note">Google Analytics, Google Ads und Meta Pixel sind auf dieser Website aktuell noch nicht aktiviert. Deine Auswahl startet derzeit keine Analyse- oder Werbetracker. Bei ihrer Aktivierung fragen wir erneut nach deiner Einwilligung.</p>
    <p class="gf-consent-note">Unsere Nutzung von ChatGPT, Claude, WhatsApp, E-Mail und Telefon ist in der <a href="${new URL('datenschutz.html#kommunikation',base).href}">Datenschutzerklärung</a> beschrieben. Diese Dienste sind keine optionalen Website-Cookies.</p>
    <div class="gf-settings-actions"><div class="gf-consent-actions"><button type="button" data-consent-reject>Nur notwendige</button><button type="button" data-consent-accept>Alle akzeptieren</button></div>
    <button class="gf-consent-save" type="button">Auswahl speichern</button></div>`;
  document.body.append(settings);
  const toggles = Object.fromEntries(['vimeo','analytics','marketing'].map(key => [key,settings.querySelector('#gf-'+key)]));
  const status = document.createElement('p');
  status.className = 'gf-consent-status'; status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite'); document.body.append(status);

  function render() {
    banner.hidden = !!choice;
    document.body.classList.toggle('gf-consent-visible', !choice);
    Object.entries(toggles).forEach(([key,toggle]) => toggle.checked = !!choice?.[key]);
    clearTimeout(timer);
    if (choice) timer = setTimeout(refresh, Math.min(choice.expiresAt - Date.now() + 20, 2147483647));
  }
  function announceChange() {
    document.dispatchEvent(new CustomEvent('gf:consentchange', {detail: Object.fromEntries(Object.keys(toggles).map(key => [key,!!valid(choice) && choice[key] === true]))}));
  }
  function save(values) {
    const savedAt = Date.now();
    choice = {version: VERSION, ...Object.fromEntries(Object.keys(toggles).map(key => [key,values[key] === true])), savedAt, expiresAt: savedAt + TTL};
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
    refresh(); returnFocus = document.activeElement; Object.entries(toggles).forEach(([key,toggle]) => toggle.checked = !!choice?.[key]);
    settings.showModal();
  }
  for (const root of [banner, settings]) {
    root.querySelector('[data-consent-reject]').addEventListener('click', () => save({vimeo:false,analytics:false,marketing:false}));
    root.querySelector('[data-consent-accept]').addEventListener('click', () => save({vimeo:true,analytics:true,marketing:true}));
  }
  banner.querySelector('[data-consent-settings]').addEventListener('click', openSettings);
  settings.querySelector('.gf-consent-save').addEventListener('click', () => save(Object.fromEntries(Object.entries(toggles).map(([key,toggle])=>[key,toggle.checked]))));
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
    // Analytics/Ads have no verified account IDs yet. Keep their technical gates closed.
    // Before activating either service, update the notices and bump VERSION/KEY to request fresh consent.
    allows: service => service === 'vimeo' && !!valid(choice) && choice.vimeo,
    openSettings,
    showVimeoNotice(container) {
      const notice = document.createElement('div');
      notice.className = 'gf-vimeo-notice';
      notice.innerHTML = `<span class="gf-consent-kicker">Externes Kundeninterview</span><h3>Vimeo für diesen Film freigeben</h3><p>Beim Abspielen erhält Vimeo unter anderem deine IP-Adresse. Cookies und eine Verarbeitung in den USA sind möglich. Deine Freigabe gilt für alle Vimeo-Kundenfilme für 180 Tage; im Footer kannst du sie jederzeit widerrufen.</p><button type="button">Vimeo erlauben & Film abspielen</button><a href="${privacy}">Datenschutzhinweise lesen</a>`;
      notice.querySelector('button').addEventListener('click', () => save({vimeo:true,analytics:!!choice?.analytics,marketing:!!choice?.marketing}));
      container.replaceChildren(notice);
    }
  });
  render();
})();

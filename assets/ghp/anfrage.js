/* Anfrage Green Hub Personal → Make-Webhook „GD Website: Anfrage → Slack #gd-anfragen“ (gleiches Muster wie assets/js/main.js). */
(function () {
  var form = document.getElementById('gh-anfrage');
  if (!form) return;
  var thanks = document.querySelector('[data-thanks]');
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var fd = new FormData(form);
    var art = form.querySelector('input[name="betriebsart"]:checked');
    var utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return fd.get(k) || ''; }).filter(Boolean).join(' · ');
    var payload = {
      name: String(fd.get('name') || '').trim(),
      unternehmen: String(fd.get('betrieb') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      telefon: String(fd.get('telefon') || '').trim(),
      herausforderung: 'Green Hub Personal' + (art ? ' · ' + art.dataset.label : ''),
      nachricht: utm ? 'Kampagne: ' + utm : '',
      seite: document.title,
      url: location.href,
      zeit: new Date().toLocaleString('de-DE')
    };
    var btn = form.querySelector('[type="submit"]');
    var label = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Wird gesendet…';
    fetch(form.getAttribute('data-webhook'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('Webhook ' + res.status);
      form.hidden = true;
      thanks.hidden = false;
      thanks.querySelector('[data-thanks-text]').textContent = 'Wir melden uns bei Ihnen, um einen Termin zu vereinbaren.';
      thanks.focus();
    }).catch(function () {
      btn.disabled = false; btn.innerHTML = label;
      if (status) status.textContent = 'Das Senden hat gerade nicht geklappt. Schreiben Sie uns an hello@greenfield-digital.de oder rufen Sie an: +49 (0) 221 95 01 88 25.';
    });
  });
})();

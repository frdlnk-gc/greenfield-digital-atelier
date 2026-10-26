/* Unsichtbarer Bot-Schutz für alle Formulare (26.10.2026).
   Der Server gd-formulare.vercel.app stellt eine signierte Rechenaufgabe, der Browser löst sie
   im Hintergrund (ca. 1 Sekunde, kein Rätsel). Ohne gültige Lösung leitet der Server nichts weiter. */
(function () {
  var BASIS = 'https://gd-formulare.vercel.app/api/';
  var offen = null;

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  async function loese() {
    var res = await fetch(BASIS + 'aufgabe', { cache: 'no-store' });
    if (!res.ok) throw new Error('aufgabe');
    var a = await res.json();
    var enc = new TextEncoder();
    for (var n = 0; n <= a.maxnumber; n++) {
      if (hex(await crypto.subtle.digest('SHA-256', enc.encode(a.salt + n))) === a.challenge) {
        return btoa(JSON.stringify({ algorithm: a.algorithm, challenge: a.challenge, number: n, salt: a.salt, signature: a.signature }));
      }
    }
    throw new Error('ungeloest');
  }

  window.gdFormSchutz = {
    /* Startet die Aufgabe früh (beim ersten Tippen), damit das Absenden sofort geht. */
    vorbereiten: function () { if (!offen) { offen = loese(); offen.catch(function () { offen = null; }); } },
    /* Liefert eine Lösung und verbraucht sie (jede Lösung gilt nur einmal). */
    token: function () { this.vorbereiten(); var p = offen; offen = null; return p; },
    ziel: function (art) { return BASIS + art; }
  };

  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.form && (e.target.form.dataset.endpoint || e.target.form.dataset.webhook)) window.gdFormSchutz.vorbereiten();
  });
})();

/* Local-only cost planning. No storage, analytics events or network calls. */
(function (root) {
  'use strict';
  const limits = { agency: 1e8, media: 1e8, production: 1e8, hours: 1e6, rate: 1e5, qualified: 1e7, interviews: 1e7, hires: 1e7 };
  const amounts = ['agency', 'media', 'production', 'hours', 'rate'];
  const outcomes = ['qualified', 'interviews', 'hires'];
  function calculate(raw) {
    const values = {}, errors = [];
    for (const key of [...amounts, ...outcomes]) {
      const blank = raw[key] === '' || raw[key] == null;
      if (blank && outcomes.includes(key)) { values[key] = null; continue; }
      const value = Number(raw[key]);
      if (blank || !Number.isFinite(value) || value < 0 || value > limits[key] || (outcomes.includes(key) && !Number.isInteger(value))) errors.push(key);
      values[key] = value;
    }
    if (errors.length) return { errors, message: 'Bitte ergänze alle Kostenfelder mit gültigen, nicht negativen Zahlen. Ergebniszahlen müssen ganze Zahlen sein.' };
    for (let i = 0; i < outcomes.length; i++) for (let j = i + 1; j < outcomes.length; j++) {
      if (values[outcomes[i]] !== null && values[outcomes[j]] !== null && values[outcomes[j]] > values[outcomes[i]]) errors.push(outcomes[j]);
    }
    if (errors.length) return { errors: [...new Set(errors)], message: 'Bitte prüfe die Ergebniszahlen: Für diese Auswertung dürfen Erstgespräche die passenden Bewerbungen und Einstellungen die vorherige Stufe nicht übersteigen.' };
    const external = values.agency + values.media + values.production;
    const internal = values.hours * values.rate;
    const total = external + internal;
    return { values, external, internal, total, unit: Object.fromEntries(outcomes.map(key => [key, values[key] > 0 ? total / values[key] : null])) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculate };
  if (!root.document) return;
  const tool = document.querySelector('[data-cost-tool]');
  if (!tool) return;
  const output = tool.querySelector('[data-cost-result]');
  const exportButton = tool.querySelector('[data-cost-export]');
  const inputs = Object.fromEntries([...amounts, ...outcomes].map(key => [key, document.getElementById('cost-' + key)]));
  const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  let result = null;
  const labels = { agency: 'Agenturhonorar', media: 'Werbebudget', production: 'Zusätzliche Produktion', hours: 'Interne Stunden', rate: 'Interner Stundensatz', qualified: 'Passende Bewerbungen', interviews: 'Geführte Erstgespräche', hires: 'Einstellungen' };
  function row(label, value, className) {
    const wrapper = document.createElement('div'), term = document.createElement('dt'), definition = document.createElement('dd');
    term.textContent = label; definition.textContent = value;
    if (className) wrapper.className = className;
    wrapper.append(term, definition); return wrapper;
  }
  tool.querySelector('[data-calculate]').addEventListener('click', () => {
    Object.values(inputs).forEach(input => input.removeAttribute('aria-invalid'));
    result = calculate(Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value])));
    output.replaceChildren(); exportButton.hidden = true;
    if (result.errors) {
      const message = document.createElement('p'); message.className = 'cost-error'; message.textContent = result.message; output.append(message);
      result.errors.forEach(key => inputs[key].setAttribute('aria-invalid', 'true'));
      inputs[result.errors[0]].focus(); return;
    }
    const list = document.createElement('dl');
    list.append(row('Externe Ausgaben', currency.format(result.external)), row('Interner Aufwand', currency.format(result.internal)), row('Gesamtaufwand', currency.format(result.total), 'cost-total'));
    const unitLabels = { qualified: 'Je passender Bewerbung', interviews: 'Je Erstgespräch', hires: 'Je Einstellung' };
    for (const key of outcomes) list.append(row(unitLabels[key], result.unit[key] === null ? (result.values[key] === null ? 'Nicht angegeben' : 'Kein Ergebnis') : currency.format(result.unit[key])));
    output.append(list); exportButton.hidden = false;
  });
  Object.values(inputs).forEach(input => input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    if (result) { result = null; exportButton.hidden = true; output.textContent = 'Deine Eingaben haben sich geändert. Bitte berechne die Auswertung erneut.'; }
  }));
  exportButton.addEventListener('click', () => {
    if (!result || result.errors) return;
    const number = value => value == null ? '' : value.toFixed(2).replace('.', ',');
    const rows = [['Greenfield Digital – Recruiting-Kostenplaner', 'Wert'], ...Object.entries(result.values).map(([key, value]) => [labels[key], number(value)]), ['Externe Ausgaben (€)', number(result.external)], ['Interner Aufwand (€)', number(result.internal)], ['Gesamtaufwand (€)', number(result.total)], ...outcomes.map(key => ['Kosten pro Ergebnis: ' + labels[key] + ' (€)', number(result.unit[key])]), ['Hinweis', 'Eigene Eingaben; gleicher Zeitraum und gleiche Steuerbasis; keine Ergebnisprognose.']];
    const csv = '\uFEFF' + rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'greenfield-recruiting-kosten.csv'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

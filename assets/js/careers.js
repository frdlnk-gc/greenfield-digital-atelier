/* Only roles listed in the form can be selected through a shared application link. */
(() => {
  'use strict';
  const role = document.getElementById('bw-stelle');
  if (!role) return;
  const area = document.getElementById('bw-bereich');
  const kind = document.getElementById('application-kind');
  const heading = document.getElementById('application-heading');
  const intro = document.getElementById('application-intro');
  const initial = {kind: kind.textContent, heading: heading.innerHTML, intro: intro.textContent};
  function render(updateArea) {
    const selected = role.options[role.selectedIndex];
    const specific = Boolean(selected?.dataset.role);
    if (updateArea) area.value = specific ? selected.dataset.area : '';
    kind.textContent = specific ? 'Deine Bewerbung' : initial.kind;
    if (specific) {
      heading.textContent = selected.value;
      intro.textContent = 'Zeig uns, wer du bist. Deine ausgewählte Stelle wird mit deiner Bewerbung übermittelt. Wir freuen uns darauf, dich kennenzulernen.';
    } else {
      heading.innerHTML = initial.heading;
      intro.textContent = initial.intro;
    }
  }
  const slug = new URLSearchParams(location.search).get('stelle');
  const match = Array.from(role.options).find(option => option.dataset.role && option.dataset.role === slug);
  if (match) role.value = match.value;
  render(Boolean(match));
  role.addEventListener('change', () => render(true));
  // Back navigation may restore a selection the applicant changed manually.
  window.addEventListener('pageshow', () => render(false));
})();

(() => {
 'use strict';
 const section = document.querySelector('[data-results]');
 if (!section) return;
 const cards = [...section.querySelectorAll('[data-result-card]')];
 const button = section.querySelector('[data-results-toggle]');
 const status = section.querySelector('[data-results-status]');
 const mobile = matchMedia('(max-width:700px)');
 let expanded = false;
 const limit = () => mobile.matches ? 4 : 12;
 function render() {
  const count = expanded ? cards.length : Math.min(limit(), cards.length);
  cards.forEach((card, i) => { card.hidden = i >= count; });
  button.hidden = cards.length <= limit();
  button.setAttribute('aria-expanded', String(expanded));
  button.querySelector('[data-results-label]').textContent = expanded ? 'Weniger Kundenergebnisse anzeigen' : 'Mehr Kundenergebnisse anzeigen';
  button.querySelector('[data-results-remaining]').textContent = expanded ? 'Zur kompakten Übersicht' : `${cards.length - count} weitere Betriebe und ihre Einstellungen entdecken`;
  button.querySelector('.results-toggle-icon').textContent = expanded ? '−' : '+';
  status.textContent = `${count} von ${cards.length} Kundenergebnissen`;
 }
 button.addEventListener('click', () => {
  expanded = !expanded;
  render();
  if (expanded) cards[limit()]?.focus({ preventScroll: true });
  else { button.focus({ preventScroll: true }); button.scrollIntoView({ block: 'nearest' }); }
 });
 mobile.addEventListener('change', () => {
  // Keep a focused card visible when changing the compact layout.
  if (cards.indexOf(document.activeElement) >= limit()) expanded = true;
  render();
 });
 function revealLinkedResult(){
  const target=cards.find(card=>'#'+card.id===location.hash);
  if(!target)return;
  if(cards.indexOf(target)>=limit()){expanded=true;render();}
  requestAnimationFrame(()=>target.scrollIntoView({block:'center'}));
 }
 window.addEventListener('hashchange',revealLinkedResult);
 render();
 revealLinkedResult();
})();

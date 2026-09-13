/* Page-specific storytelling, with native buttons and the shared full-film player. */
(() => {
 'use strict';
 const brand=document.querySelector('[data-brand-experience]');
 const audiences={
  team:{eyebrow:'Das Team von morgen',title:'Hier möchte ich mit anpacken.',copy:'Zeige die Menschen hinter deiner Arbeit. Fachkräfte erleben, wie ihr zusammenarbeitet und was deinen Betrieb als Arbeitgeber ausmacht.'},
  clients:{eyebrow:'Die Kunden von morgen',title:'Mit diesem Betrieb möchte ich mein Projekt umsetzen.',copy:'Mach dein Können erlebbar. Wer deine Projekte, deine Arbeitsweise und deine Haltung kennt, geht mit einem guten Gefühl ins erste Gespräch.'}
 };
 brand?.querySelectorAll('[data-brand-view]').forEach(button=>button.addEventListener('click',()=>{
  const view=audiences[button.dataset.brandView];
  brand.querySelectorAll('[data-brand-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  for(const key of ['eyebrow','title','copy'])brand.querySelector(`[data-brand-${key}]`).textContent=view[key];
 }));
 const stage=document.querySelector('[data-challenge-stage]');
 const challenges={
  visibility:{title:'Deine Qualität bekommt eine Bühne.',copy:'Wir machen aus deinen Projekten und deinem Wissen regelmäßige Einblicke. Damit deine Region sieht, was in deinem Betrieb steckt.',photo:'assets/img/productions/schwingel-pool.webp',alt:'Gartengestaltung Schwingel beim Bau eines Pools'},
  team:{title:'Lass dein Team für deinen Betrieb sprechen.',copy:'Echte Einblicke zeigen mehr als eine Stellenanzeige: die Menschen, den Umgang miteinander und die Arbeit, auf die ihr stolz seid.',photo:'assets/img/productions/scheidtmann-team.webp',alt:'Zwei Mitarbeiter von Scheidtmann gemeinsam auf einer Baustelle'},
  time:{title:'Ein Drehtag. Ein klarer Plan. Regelmäßig sichtbar.',copy:'Wir planen Themen, produzieren bei dir vor Ort und kümmern uns um die Veröffentlichung. Du bringst deinen Betrieb ein. Wir halten den Auftritt am Laufen.',photo:'assets/img/productions/woerlein-plants.webp',alt:'Mitarbeiter der Baumschule Wörlein bei der Arbeit mit Gehölzen'}
 };
 stage?.querySelectorAll('[data-challenge]').forEach(button=>button.addEventListener('click',()=>{
  const view=challenges[button.dataset.challenge];
  stage.querySelectorAll('[data-challenge]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  stage.querySelector('[data-challenge-title]').textContent=view.title;
  stage.querySelector('[data-challenge-copy]').textContent=view.copy;
  const photo=stage.querySelector('[data-challenge-photo]');photo.src=view.photo;photo.alt=view.alt;
 }));
 const films=[...document.querySelectorAll('.employer-film')];
 const filmDialog=document.querySelector('.reel-dialog');
 filmDialog?.addEventListener('close',()=>filmDialog.classList.remove('is-landscape'));

 films.forEach(film=>{
  const activate=()=>films.forEach(f=>f.classList.toggle('is-active',f===film));
  film.addEventListener('pointerenter',activate);film.addEventListener('focusin',activate);
  film.querySelector('[data-reel]')?.addEventListener('click',()=>filmDialog?.classList.add('is-landscape'));
 });
})();

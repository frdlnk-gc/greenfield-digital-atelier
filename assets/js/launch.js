/* Mobile explanations are explicit, keyboard accessible and respect motion preferences. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const moving=()=>!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-paused');
 const mobile=document.querySelector('.mobile-orbit');
 if(mobile){
  const controls=[...mobile.querySelectorAll('[data-orbit-pick]')],original=[...document.querySelectorAll('.orbit-seven .orbit-item')];let active=1,seen=false,engaged=false;
  function select(i){active=i;controls.forEach((b,n)=>b.setAttribute('aria-pressed',String(i===n)));mobile.querySelector('[data-orbit-title]').textContent=controls[i].textContent.trim();mobile.querySelector('[data-orbit-description]').textContent=original[i].dataset.text;mobile.querySelector('[data-orbit-link]').href=original[i].href;}
  controls.forEach((b,i)=>b.addEventListener('click',()=>{engaged=true;select(i);}));
  mobile.addEventListener('focusin',()=>engaged=true);new IntersectionObserver(e=>seen=e[0].isIntersecting,{threshold:.25}).observe(mobile);
  setInterval(()=>{if(seen&&!engaged&&moving())select((active+1)%7);},5200);
 }
 const cycle=document.querySelector('.growth-cycle');
 if(cycle){
  const steps=[
   ['Zeig, was deinen Betrieb besonders macht.','Eine starke Marke macht deine Arbeit in der Region bekannt – bei den Menschen, die du erreichen möchtest.'],
   ['Gute Menschen entscheiden sich für dich.','Wer deinen Betrieb kennt und versteht, kann sich bewusst für dein Team entscheiden. So wird aus Sichtbarkeit Verstärkung.'],
   ['Dein Team macht den Unterschied.','Die richtigen Mitarbeiter liefern die Qualität, für die dein Betrieb stehen soll. Gemeinsam werden aus guten Ideen starke Projekte.'],
   ['Gute Arbeit spricht sich herum.','Begeisterte Kunden, Empfehlungen und sichtbare Projekte stärken deinen Ruf. Deine Marke gewinnt weiter an Anziehungskraft.']
  ];let active=0,seen=false,engaged=false;
  const controls=[...cycle.querySelectorAll('[data-growth-step]')];
  function select(i){active=i;controls.forEach((b,n)=>b.setAttribute('aria-pressed',String(i===n)));cycle.querySelector('[data-growth-count]').textContent=`0${i+1} / 04`;cycle.querySelector('[data-growth-title]').textContent=steps[i][0];cycle.querySelector('[data-growth-copy]').textContent=steps[i][1];}
  controls.forEach((b,i)=>b.addEventListener('click',()=>{engaged=true;select(i);}));cycle.addEventListener('focusin',()=>engaged=true);
  new IntersectionObserver(e=>seen=e[0].isIntersecting,{threshold:.25}).observe(cycle);
  setInterval(()=>{if(seen&&!engaged&&moving())select((active+1)%4);},5800);
 }
 document.querySelectorAll('.inquiry-options').forEach(d=>{
  // Keep prefilled briefing information and service selections visible.
  if(d.querySelector('input:checked')||d.querySelector('textarea')?.value)d.open=true;
 });
})();

/* Shared finishing interactions. Native scrolling, local video, truthful form states. */
(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const canMove = () => !reduced.matches && !document.body.classList.contains('motion-paused') && !document.hidden && !document.querySelector('dialog[open]');
 const visible = new Map();
 const previews = [...document.querySelectorAll('video[data-preview]')];
 const syncVideo = () => {
  const candidates = [...visible].filter(([v,r]) => r > .015 && !v.closest('[hidden]')).map(([v])=>v);
  previews.forEach(v => {
   if(canMove() && candidates.includes(v)) {
    if(!v.getAttribute('src')) {v.src=v.dataset.preview;v.muted=true;}
    if(v.paused)v.play().catch(()=>{});
   } else v.pause();
  });
 };
 const observer = new IntersectionObserver(entries => {entries.forEach(e=>visible.set(e.target,e.intersectionRatio));syncVideo();},{threshold:[0,.015,.1,.5,1]});
 previews.forEach(v=>observer.observe(v));
 document.addEventListener('visibilitychange',syncVideo);
 document.addEventListener('greenfield:mediachange',syncVideo);
 reduced.addEventListener('change',syncVideo);
 new MutationObserver(syncVideo).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncVideo).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 document.querySelectorAll('dialog').forEach(d=>new MutationObserver(syncVideo).observe(d,{attributes:true,attributeFilter:['open']}));
 // Case studies stay in one generous stage. Every case keeps its own film rail.
 document.querySelectorAll('[data-case-showcase]').forEach(showcase=>{
  const tabs=[...showcase.querySelectorAll('[data-case-select]')];
  const panels=[...showcase.querySelectorAll('[data-case-panel]')];
  const activate=(slug,{focus=false,history=false,scroll=false}={})=>{
   const tab=tabs.find(t=>t.dataset.caseSelect===slug);if(!tab)return;
   panels.forEach(p=>{p.hidden=p.dataset.casePanel!==slug;if(p.hidden)p.querySelectorAll('video').forEach(v=>v.pause());});
   tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});
   const nav=showcase.querySelector('.case-navigation');
   if(nav.scrollWidth>nav.clientWidth)nav.scrollTo({left:Math.max(0,tab.offsetLeft-nav.offsetLeft-(nav.clientWidth-tab.clientWidth)/2),behavior:'instant'});
   if(history)window.history.replaceState(null,'','#case-'+slug);
   if(focus)tab.focus({preventScroll:true});
   if(scroll)showcase.querySelector('.case-navigation').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
   if(focus)tab.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest',inline:'nearest'});
   requestAnimationFrame(syncVideo);
  };
  tabs.forEach((tab,i)=>{
   tab.addEventListener('click',()=>activate(tab.dataset.caseSelect,{history:true}));
   tab.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    activate(tabs[index].dataset.caseSelect,{focus:true,history:true});
   });
  });
  showcase.querySelectorAll('[data-case-next]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.caseNext,{focus:true,history:true,scroll:true})));
  const fromHash=()=>{
   const slug=location.hash.replace(/^#case-/,'');
   if(!tabs.some(t=>t.dataset.caseSelect===slug))return;
   activate(slug);
   requestAnimationFrame(()=>showcase.querySelector('.case-navigation').scrollIntoView({block:'start',behavior:'instant'}));
  };
  window.addEventListener('hashchange',fromHash);fromHash();
 });
 // One complete, on-demand player. Full files never download for an idle card.
 const dialog=document.querySelector('.reel-dialog');
 let opener;
 if(dialog){
  const player=dialog.querySelector('video');
  document.querySelectorAll('[data-reel]').forEach(button=>button.addEventListener('click',()=>{
   opener=button;
   dialog.querySelector('strong').textContent=button.dataset.reelTitle;
   player.src=button.dataset.reel;player.poster=button.querySelector('video')?.poster||'';
   dialog.showModal();document.body.classList.add('video-open');syncVideo();
   player.play().catch(()=>{});
  }));
  dialog.querySelector('.close-reel').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();document.body.classList.remove('video-open');opener?.focus({preventScroll:true});syncVideo();});
 }
 // The same controls work for landscape testimonials and portrait production reels.
 document.querySelectorAll('.slider-controls').forEach(controls=>{
  const rail=controls.previousElementSibling;
  if(!rail?.matches('.a-film-grid,.production-rail'))return;
  const buttons=[...controls.querySelectorAll('[data-slide]')];
  const update=()=>{
   buttons.forEach(b=>{b.disabled=Number(b.dataset.slide)<0?rail.scrollLeft<3:rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;});
   const cards=[...rail.children].filter(c=>!c.hidden),position=controls.querySelector('[data-rail-position]'),total=controls.querySelector('[data-rail-total]');
   if(total)total.textContent=cards.length;
   if(position&&rail.clientWidth){const bounds=rail.getBoundingClientRect(),indices=cards.map((c,i)=>{const r=c.getBoundingClientRect();return r.right>bounds.left+20&&r.left<bounds.right-20?i+1:null;}).filter(Boolean);position.textContent=indices.length>1?indices[0]+'–'+indices.at(-1):indices[0]||1;}
  };
  buttons.forEach(b=>b.addEventListener('click',()=>{
   const card=[...rail.children].find(x=>!x.hidden);
   const distance=(card?.getBoundingClientRect().width||rail.clientWidth)+parseFloat(getComputedStyle(rail).gap||20);
   rail.scrollBy({left:distance*Number(b.dataset.slide),behavior:reduced.matches?'instant':'smooth'});
  }));
  rail.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(rail);update();
  const section=controls.closest('section');
  section?.querySelectorAll('[data-reel-filter]').forEach(button=>button.addEventListener('click',()=>{
   section.querySelectorAll('[data-reel-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   rail.querySelectorAll('.production-reel').forEach(card=>{card.hidden=button.dataset.reelFilter!=='Alle'&&card.dataset.category!==button.dataset.reelFilter;});
   rail.scrollTo({left:0,behavior:'instant'});update();syncVideo();
  }));
  rail.addEventListener('keydown',e=>{
   if(!rail.matches('.production-rail')||!['ArrowLeft','ArrowRight'].includes(e.key))return;
   const cards=[...rail.querySelectorAll('.production-reel:not([hidden]) button')];const i=cards.indexOf(document.activeElement);if(i<0)return;
   e.preventDefault();cards[Math.max(0,Math.min(cards.length-1,i+(e.key==='ArrowRight'?1:-1)))].focus();
  });
 });
 const brief=new URLSearchParams(location.search).get('personalbedarf');
 if(brief){const field=document.querySelector('#kontakt textarea[name="nachricht"]');if(field){field.value=brief.slice(0,1600);const check=document.querySelector('input[value="Mitarbeitergewinnung"]');if(check)check.checked=true;}}
})();

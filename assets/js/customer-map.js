/* Customer previews stay local, silent and on demand; the full player is shared. */
(() => {
 'use strict';
 const map=document.querySelector('.customer-map');if(!map)return;
 const data=JSON.parse(document.getElementById('customer-map-data').textContent);
 const canvas=map.querySelector('.customer-map-canvas'),panel=map.querySelector('.customer-map-panel');
 const pins=[...map.querySelectorAll('[data-customer]')],films=[...panel.querySelectorAll('[data-map-film]')];
 const desktop=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let current,leaveTimer,restoringFocus=false;
 const sync=()=>films.forEach(b=>{const v=b.querySelector('video');if(!panel.hidden&&!b.hidden&&desktop.matches&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-paused')&&!document.querySelector('dialog[open]'))v.play().catch(()=>{});else v.pause();});
 const close=(focus=false)=>{clearTimeout(leaveTimer);panel.hidden=true;pins.forEach(p=>p.setAttribute('aria-expanded','false'));films.forEach(b=>{const v=b.querySelector('video');v.pause();v.removeAttribute('src');v.load();});if(focus){restoringFocus=true;current?.focus({preventScroll:true});restoringFocus=false;}};
 const open=pin=>{
  if(!desktop.matches||restoringFocus)return;clearTimeout(leaveTimer);
  if(current===pin&&!panel.hidden){sync();return;}
  current=pin;const c=data.find(c=>c.id===pin.dataset.customer);if(!c)return;
  panel.querySelector('[data-map-logo]').src=c.logo;
  panel.querySelector('[data-map-name]').textContent=c.name;
  panel.querySelector('[data-map-city]').textContent=c.city;
  panel.querySelector('[data-map-category]').textContent=c.category;
  pins.forEach(p=>p.setAttribute('aria-expanded',String(p===pin)));
  films.forEach((b,i)=>{const f=c.films[i],v=b.querySelector('video');v.pause();b.hidden=!f;if(!f){v.removeAttribute('src');return;}
   b.dataset.reel=`assets/media/reels/${f.slug}.mp4`;b.dataset.reelTitle=`${c.name} · ${f.title}`;
   b.setAttribute('aria-label',`${c.name}: ${f.title} mit Ton ansehen`);b.classList.toggle('is-landscape',!!f.landscape);
   b.querySelector('[data-map-film-title]').textContent=f.title;v.poster=`assets/media/reels/${f.slug}.jpg`;
   v.src=`assets/media/reels/${f.slug}-preview.mp4`;v.muted=true;
  });
  panel.classList.toggle('single-film',c.films.length===1);panel.hidden=false;
  const width=canvas.clientWidth,p=pin.getBoundingClientRect(),r=canvas.getBoundingClientRect();
  const left=Math.min(width-panel.offsetWidth,Math.max(0,p.left-r.left+30));
  const top=Math.max(0,Math.min(canvas.clientHeight-panel.offsetHeight,p.top-r.top-70));
  panel.style.left=`${left}px`;panel.style.top=`${top}px`;sync();
 };
 pins.forEach(pin=>{pin.addEventListener('pointerenter',()=>open(pin));pin.addEventListener('focus',()=>open(pin));pin.addEventListener('click',()=>{open(pin);films[0].focus({preventScroll:true});});});
 canvas.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));
 canvas.addEventListener('pointerleave',()=>{leaveTimer=setTimeout(()=>{if(!panel.contains(document.activeElement)&&!document.querySelector('dialog[open]'))close();},250);});
 canvas.addEventListener('focusout',e=>{if(!canvas.contains(e.relatedTarget)&&!document.querySelector('dialog[open]'))close();});
 panel.querySelector('[data-map-close]').addEventListener('click',()=>close(true));
 map.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close(true);}});
 desktop.addEventListener('change',()=>close());window.addEventListener('resize',()=>close());
 document.addEventListener('visibilitychange',sync);document.addEventListener('greenfield:mediachange',sync);reduced.addEventListener('change',sync);
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.querySelectorAll('dialog').forEach(d=>new MutationObserver(sync).observe(d,{attributes:true,attributeFilter:['open']}));
 new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)close();}).observe(map);
})();

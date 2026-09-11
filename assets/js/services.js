(function(){
 'use strict';
 const drop=document.querySelector('.has-drop'),trigger=drop?.querySelector('.services-trigger');
 if(trigger){
  let timer;
  const mobile=()=>matchMedia('(max-width:820px)').matches;
  const set=open=>{clearTimeout(timer);drop.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));};
  trigger.addEventListener('click',e=>set(!mobile()&&e.detail>0?true:!drop.classList.contains('open')));
  drop.addEventListener('mouseenter',()=>{if(!mobile())set(true)});
  drop.addEventListener('mouseleave',()=>{if(!mobile())timer=setTimeout(()=>set(false),160)});
  drop.addEventListener('focusout',e=>{if(!mobile()&&!drop.contains(e.relatedTarget))set(false)});
  document.addEventListener('click',e=>{if(!mobile()&&!drop.contains(e.target))set(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drop.classList.contains('open')){set(false);if(!mobile())trigger.focus();}});
  document.getElementById('burger')?.addEventListener('click',()=>trigger.setAttribute('aria-expanded',String(drop.classList.contains('open')&&document.body.classList.contains('nav-open'))));
  matchMedia('(min-width:821px)').addEventListener('change',()=>set(false));
 }
 document.querySelectorAll('[data-service-tabs]').forEach(group=>{
  const tabs=[...group.querySelectorAll('[role=tab]')],panels=[...group.querySelectorAll('[role=tabpanel]')];
  function select(index,focus){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1});panels.forEach(p=>{p.hidden=p.id!==tabs[index].getAttribute('aria-controls')});if(focus)tabs[index].focus();}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i,false));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();select(n,true)}})});
  group.querySelector('[data-service-next]')?.addEventListener('click',()=>select((tabs.findIndex(t=>t.getAttribute('aria-selected')==='true')+1)%tabs.length,false));
 });
})();
// A real, scrollable logo rail: automatic motion yields to touch, keyboard and pause controls.
(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.service-trust--flow').forEach(rail=>{
  const viewport=rail.querySelector('.client-window'),group=rail.querySelector('.client-group'),button=rail.querySelector('.client-motion');
  let paused=false,hover=false,touch=false,visible=false,last=0;
  const label=()=>{button.setAttribute('aria-pressed',String(paused));button.innerHTML=paused?'Logos abspielen <span aria-hidden="true">▶</span>':'Logos pausieren <span aria-hidden="true">Ⅱ</span>';};
  const pause=()=>{paused=true;label();};
  button.addEventListener('click',()=>{paused=!paused;label();});
  viewport.addEventListener('mouseenter',()=>hover=true);viewport.addEventListener('mouseleave',()=>hover=false);
  viewport.addEventListener('pointerdown',()=>{touch=true;pause();});
  viewport.addEventListener('pointerup',()=>touch=false);viewport.addEventListener('pointercancel',()=>touch=false);
  viewport.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();pause();if(e.key==='Home')viewport.scrollTo({left:0,behavior:'smooth'});else viewport.scrollBy({left:(e.key==='ArrowRight'?1:-1)*183,behavior:'smooth'});}});
  rail.querySelectorAll('.client-logo').forEach(el=>{el.addEventListener('pointerdown',()=>el.classList.add('is-color'));el.addEventListener('pointerleave',()=>el.classList.remove('is-color'));});
  new IntersectionObserver(e=>visible=e[0].isIntersecting,{threshold:.05}).observe(rail);
  function frame(t){const dt=Math.min(t-last,60);last=t;if(visible&&!paused&&!hover&&!touch&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-paused')&&document.activeElement!==viewport){viewport.scrollLeft+=dt*.038;if(viewport.scrollLeft>=group.offsetWidth)viewport.scrollLeft-=group.offsetWidth;}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
 });
})();

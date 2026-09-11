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

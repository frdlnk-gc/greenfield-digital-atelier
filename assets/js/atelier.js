/* Independent Atelier enhancements. No requests are sent until a visitor submits. */
(() => {
 'use strict';
 const $ = (s, r=document) => r.querySelector(s), $$ = (s, r=document) => [...r.querySelectorAll(s)];
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const motionButton = $('.a-motion');
 let paused = reduced.matches;
 try { paused = paused || localStorage.getItem('gf-motion-paused') === 'true'; } catch {}
 const applyMotion = () => {
  document.body.classList.toggle('motion-paused', paused);
  if (motionButton) { motionButton.setAttribute('aria-pressed', String(paused)); motionButton.textContent = paused ? 'Animationen aktivieren ▷' : 'Animationen pausieren Ⅱ'; }
 };
 applyMotion();
 motionButton?.addEventListener('click', () => { paused = !paused; applyMotion(); try {localStorage.setItem('gf-motion-paused',String(paused));}catch{} });
 reduced.addEventListener('change', e => {paused=e.matches;applyMotion();});
 // Native details work without JavaScript; image transitions enhance them.
 $$('.a-service').forEach(detail => detail.addEventListener('toggle', () => {
  if (!detail.open) return;
  $$('.a-service').forEach(other => { if (other !== detail) other.open=false; });
  $$('[data-service-image]').forEach(img => img.classList.toggle('active',img.dataset.serviceImage===detail.dataset.service));
 }));
 // Keyboard operable filters with announced result count.
 $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
  let count=0;
  $$('.a-ref-grid .ref-card').forEach(card => {
   const show=button.dataset.filter==='all'||card.dataset.category===button.dataset.filter;
   card.hidden=!show; if(show){count++;card.classList.add('in');}
  });
  if($('.a-filter-count')) $('.a-filter-count').textContent=`${count} Projektbeispiele`;
 }));
 // Vimeo only loads in response to the explicitly labelled video button.
 const dialog=$('.a-video-dialog'); let videoTrigger=null;
 $$('[data-video]').forEach(button=>button.addEventListener('click',()=>{
  if(!dialog || !/^\d+$/.test(button.dataset.video))return;
  videoTrigger=button; $('#video-title',dialog).textContent=button.dataset.title;
  const iframe=document.createElement('iframe');
  iframe.title=`Kundeninterview: ${button.dataset.title}`;
  iframe.src=`https://player.vimeo.com/video/${button.dataset.video}?autoplay=1&dnt=1`;
  iframe.allow='autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen=true;
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  $('.a-player',dialog).replaceChildren(iframe);
  $('.a-video-external',dialog).href=`https://vimeo.com/${button.dataset.video}`;
  dialog.showModal();document.documentElement.classList.add('video-open');
 }));
 if(dialog){
  $('.a-dialog-close',dialog).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{$('.a-player',dialog).replaceChildren();document.documentElement.classList.remove('video-open');videoTrigger?.focus();});
 }
 // Keep the mobile menu inside the keyboard focus path and restore focus.
 const burger=$('#burger'), nav=$('#navLinks');
 if(burger&&nav){
  burger.addEventListener('click',()=>requestAnimationFrame(()=>{if(burger.getAttribute('aria-expanded')==='true') $('a',nav)?.focus();}));
  document.addEventListener('keydown',e=>{
   if(!document.body.classList.contains('nav-open'))return;
   if(e.key==='Escape'){burger.focus();return;}
   if(e.key!=='Tab')return;
   const focusable=[burger,...$$('a,button',nav).filter(el=>el.getClientRects().length)];
   const first=focusable[0],last=focusable[focusable.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
 }
 // One consistent, recoverable submission handler for the duplicated website.
 $$('form[data-endpoint]').forEach(form=>{
  let busy=false;
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   if(busy||$('input[name="website"]',form)?.value)return;
   $$('input[required],textarea[required]',form).forEach(el=>{el.value=el.value.trim();});
   if(!form.reportValidity())return;
   const data={};
   new FormData(form).forEach((v,k)=>{if(k==='website')return;const value=String(v).trim();data[k]=data[k]?`${data[k]}, ${value}`:value;});
   data.seite=document.title;data.url=location.href;data.zeit=new Date().toLocaleString('de-DE');
   const btn=$('[type="submit"]',form),label=btn.innerHTML;
   let error=$('.a-form-error',form);
   if(!error){error=document.createElement('p');error.className='a-form-error';error.setAttribute('role','alert');form.append(error);}
   error.hidden=true;busy=true;btn.disabled=true;btn.textContent='Anfrage wird gesendet …';form.setAttribute('aria-busy','true');
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
   try{
    const response=await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
    if(!response.ok)throw new Error('request_failed');
    let success=$('.form-success',form.parentElement);
    if(!success){success=document.createElement('div');success.className='form-success';success.textContent='Danke für deine Anfrage. Wir melden uns bei dir.';form.after(success);}
    success.setAttribute('role','status');success.tabIndex=-1;form.hidden=true;success.hidden=false;success.focus();
   }catch(err){
    error.textContent=err.name==='AbortError'?'Die Bestätigung dauert länger als erwartet. Bitte frag kurz unter hello@greenfield-digital.de nach, bevor du erneut sendest.':'Deine Anfrage konnte nicht gesendet werden. Deine Eingaben bleiben erhalten. Versuche es erneut oder schreib an hello@greenfield-digital.de.';
    error.hidden=false;btn.innerHTML=label;btn.disabled=false;
   }finally{clearTimeout(timeout);busy=false;form.removeAttribute('aria-busy');}
  });
 });
 // Surface the next step on mobile after the hero, hide at the actual form.
 const mobileCTA=$('.a-mobile-cta'), contact=$('#kontakt');
 let contactVisible=false,ticking=false;
 function updateCTA(){ticking=false;if(mobileCTA)mobileCTA.classList.toggle('visible',scrollY>650&&!contactVisible);}
 if(mobileCTA&&contact){
  new IntersectionObserver(entries=>{contactVisible=entries[0].isIntersecting;updateCTA();},{threshold:0}).observe(contact);
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateCTA);}},{passive:true});updateCTA();
 }
 // Graceful progressive enhancement: show late visible elements consistently.
 if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');observer.unobserve(e.target);}}),{threshold:.08});
  $$('.reveal').forEach(el=>observer.observe(el));
 }else{$$('.reveal').forEach(el=>el.classList.add('in'));}
})();

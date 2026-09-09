/* Motion adds to the original interactions, without changing the phone component. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canMove=()=>!reduced.matches&&!document.body.classList.contains('motion-paused')&&!document.hidden;
 const orbit=document.querySelector('.orbit');
 if(orbit){
  const cards=[...orbit.querySelectorAll('.orbit-item')],label=orbit.querySelector('#orbitText');
  let current=0,visible=false,engaged=false;
  const show=i=>{current=i;cards.forEach((c,n)=>c.classList.toggle('is-current',n===i));if(label)label.textContent=cards[i].dataset.text;};
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.2}).observe(orbit);
  cards.forEach((card,i)=>{
   ['mouseenter','focus'].forEach(event=>card.addEventListener(event,()=>{engaged=true;show(i);}));
   ['mouseleave','blur'].forEach(event=>card.addEventListener(event,()=>{engaged=false;show(current);}));
  });
  show(0);
  setInterval(()=>{if(visible&&!engaged&&canMove())show((current+1)%cards.length);},4800);
 }
 // Touch dragging keeps the original marquee composition and reveals real brand colors.
 document.querySelectorAll('.marquee').forEach(rail=>{
  const track=rail.querySelector('.marquee-track');if(!track)return;
  let start=null,offset=0,origin=0,raf=0;
  const colorAt=x=>{
   track.querySelectorAll('img').forEach(img=>{const r=img.getBoundingClientRect();img.classList.toggle('is-color',x>=r.left-20&&x<=r.right+20);});
  };
  rail.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse')return;
   start=e.clientX;origin=offset;rail.classList.add('is-dragging');rail.setPointerCapture(e.pointerId);colorAt(e.clientX);
  });
  rail.addEventListener('pointermove',e=>{
   if(start===null)return;
   offset=origin+e.clientX-start;
   cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{track.style.translate=`${offset}px 0`;colorAt(e.clientX);});
  },{passive:true});
  const end=()=>{if(start===null)return;start=null;offset=0;track.style.translate='';rail.classList.remove('is-dragging');setTimeout(()=>track.querySelectorAll('.is-color').forEach(i=>i.classList.remove('is-color')),1000);};
  rail.addEventListener('pointerup',end);rail.addEventListener('pointercancel',end);
 });
 document.querySelectorAll('.ref-card,.google-card .g-right img').forEach(card=>{
  card.addEventListener('pointerdown',()=>card.classList.add('is-color'));
  card.addEventListener('pointerleave',()=>card.classList.remove('is-color'));
 });
 // Allow arrow-key navigation through the film rail on small screens.
 document.querySelectorAll('.a-film-grid').forEach(rail=>rail.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
  const buttons=[...rail.querySelectorAll('button')],idx=buttons.indexOf(document.activeElement);
  if(idx<0)return;
  e.preventDefault();buttons[(idx+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].focus();
 }));
})();

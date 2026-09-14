/* A bounded preview window for an unbounded, verified customer film catalogue. */
(() => {
 'use strict';
 const map=document.querySelector('.customer-map');if(!map)return;
 const data=JSON.parse(document.getElementById('customer-map-data').textContent);
 const canvas=map.querySelector('.customer-map-canvas'),panel=map.querySelector('.customer-map-panel');
 const pins=[...map.querySelectorAll('[data-customer]')],slots=[...panel.querySelectorAll('[data-map-film]')];
 const desktop=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let client=null,opener=null,offset=0,kind='Alle',leaveTimer,hoverTimer,restoringFocus=false,pinned=false,keyboardMode=false,pinPositions=[];
 const filmCount=n=>`${n} ${n===1?'Film':'Filme'}`;
 const displayed=()=>client?.films.filter(f=>kind==='Alle'||f.kind===kind)||[];
 const moving=()=>desktop.matches&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-paused')&&!document.querySelector('dialog[open]');
 const sync=()=>slots.forEach(b=>{const v=b.querySelector('video');if(!panel.hidden&&!b.hidden&&moving()&&v.dataset.mapPreview){if(!v.getAttribute('src')){v.src=v.dataset.mapPreview;v.muted=true;}v.play().catch(()=>{});}else v.pause();});
 const release=v=>{v.pause();v.removeAttribute('src');delete v.dataset.mapPreview;v.load();};
 const close=(focus=false)=>{clearTimeout(leaveTimer);clearTimeout(hoverTimer);pinned=false;keyboardMode=false;const returnFocus=focus||panel.contains(document.activeElement);panel.hidden=true;pins.forEach(p=>p.setAttribute('aria-expanded','false'));slots.forEach(b=>release(b.querySelector('video')));if(returnFocus&&opener?.isConnected){restoringFocus=true;opener.focus({preventScroll:true});restoringFocus=false;}};
 // A hover preview belongs to its pin and panel, never to the whole map.
 // Keyboard focus keeps it usable without turning a mouse click into a permanent popup.
 const scheduleClose=()=>{
  clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>{
   const pin=pins.find(p=>p.dataset.customer===client?.id),active=document.activeElement;
   if(panel.hidden||document.querySelector('dialog[open]')||panel.matches(':hover')||pin?.matches(':hover'))return;
   if(keyboardMode&&(panel.contains(active)||pin===active))return;
   close();
  },400);
 };
 const position=()=>{
  if(panel.hidden)return;
  const pin=pins.find(p=>p.dataset.customer===client.id),r=canvas.getBoundingClientRect();
  const pinRect=pin&&!pin.hidden?pin.getBoundingClientRect():null;
  const x=pinRect?pinRect.left+pinRect.width/2-r.left:r.width/2,y=pinRect?pinRect.top+pinRect.height/2-r.top:r.height/2;
  const nearby=pinPositions.filter(p=>Math.hypot(p.x-x,p.y-y)<70);
  const right=Math.max(x,...nearby.map(p=>p.x))+24,left=Math.min(x,...nearby.map(p=>p.x))-24-panel.offsetWidth;
  const maxLeft=innerWidth-16-r.left-panel.offsetWidth,minLeft=Math.max(0,16-r.left);
  const panelLeft=right<=maxLeft?right:left>=minLeft?left:Math.max(minLeft,Math.min(maxLeft,right));
  const headerBottom=document.querySelector('header')?.getBoundingClientRect().bottom||80;
  const minimum=Math.max(0,headerBottom+12-r.top);
  const maximum=Math.min(r.height-panel.offsetHeight,innerHeight-16-r.top-panel.offsetHeight);
  const top=maximum>=minimum?Math.max(minimum,Math.min(maximum,y-80)):Math.max(0,Math.min(r.height-panel.offsetHeight,y-80));
  panel.style.left=`${panelLeft}px`;
  panel.style.top=`${top}px`;
 };
 const renderFilms=()=>{
  const list=displayed();offset=Math.max(0,Math.min(offset,Math.max(0,Math.ceil(list.length/3)-1)*3));
  slots.forEach((b,i)=>{const f=list[offset+i],v=b.querySelector('video');release(v);b.hidden=!f;
   if(!f){delete b.dataset.reel;delete b.dataset.reelTitle;return;}
   b.dataset.reel=f.src;b.dataset.reelTitle=`${client.name} · ${f.title}`;b.setAttribute('aria-label',`${client.name}: ${f.title} mit Ton ansehen`);b.classList.toggle('is-landscape',!!f.landscape);b.querySelector('[data-map-film-title]').textContent=f.title;v.poster=f.poster;if(f.preview)v.dataset.mapPreview=f.preview;
  });
  panel.querySelector('[data-map-film-empty]').hidden=!!list.length;
  panel.querySelector('[data-map-prev]').disabled=offset===0;panel.querySelector('[data-map-next]').disabled=offset+3>=list.length;
  panel.querySelector('[data-map-position]').textContent=list.length?`${offset+1}–${Math.min(offset+3,list.length)} / ${filmCount(list.length)}`:'0 Filme';
  panel.querySelectorAll('[data-map-kind]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mapKind===kind));b.hidden=b.dataset.mapKind!=='Alle'&&!client.films.some(f=>f.kind===b.dataset.mapKind);});
  panel.classList.toggle('single-film',list.length===1);position();sync();
 };
 const open=(id,source,{focus=false,keyboard=false}={})=>{
  if(!desktop.matches||restoringFocus)return;clearTimeout(leaveTimer);clearTimeout(hoverTimer);
  const next=data.find(c=>c.id===id);if(!next)return;keyboardMode=keyboard;opener=source;
  if(client?.id===id&&!panel.hidden){if(focus)slots[0].focus({preventScroll:true});return;}
  client=next;opener=source;offset=0;kind='Alle';pinned=false;
  const logo=panel.querySelector('[data-map-logo]');logo.hidden=!client.logo;if(client.logo)logo.src=client.logo;else logo.removeAttribute('src');
  panel.querySelector('[data-map-name]').textContent=client.name;panel.querySelector('[data-map-city]').textContent=client.city;
  panel.querySelector('[data-map-category]').textContent=`${client.category} · ${filmCount(client.films.length)}`;
  pins.forEach(p=>p.setAttribute('aria-expanded',String(p.dataset.customer===id)));panel.hidden=false;renderFilms();if(focus)slots[0].focus({preventScroll:true});
 };
 const layoutPins=()=>{
  if(!desktop.matches||!canvas.clientWidth||!canvas.clientHeight)return;
  // All customer pins keep their saved display positions.
  const bounds=canvas.getBoundingClientRect();
  pinPositions=data.map(c=>({id:c.id,left:c.displayX,top:c.displayY,x:c.displayX*bounds.width/100,y:c.displayY*bounds.height/100}));
  for(const p of pinPositions){
   const pin=pins.find(pin=>pin.dataset.customer===p.id);
   pin.style.left=`${p.left}%`;pin.style.top=`${p.top}%`;
   const nearest=Math.min(...pinPositions.filter(q=>q.id!==p.id).map(q=>Math.hypot(q.x-p.x,q.y-p.y)));
   pin.style.width=pin.style.height=`${Math.min(24,nearest*1.8)}px`;
   pin.style.setProperty('--pin-dot-size',`${Math.min(11,nearest*.8)}px`);
  }
  position();
 };
 pins.forEach(pin=>{
  pin.addEventListener('pointerenter',()=>{clearTimeout(leaveTimer);clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>open(pin.dataset.customer,pin),120);});
  pin.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);scheduleClose();});
  pin.addEventListener('focus',()=>{if(pin.matches(':focus-visible'))open(pin.dataset.customer,pin,{keyboard:true});});
  pin.addEventListener('click',e=>{
   if(pinned&&client?.id===pin.dataset.customer&&!panel.hidden){close(true);return;}
   open(pin.dataset.customer,pin,{focus:e.detail===0,keyboard:e.detail===0});pinned=true;
  });
 });
 panel.querySelectorAll('[data-map-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.mapKind;offset=0;renderFilms();}));
 panel.querySelector('[data-map-prev]').addEventListener('click',()=>{offset-=3;renderFilms();});panel.querySelector('[data-map-next]').addEventListener('click',()=>{offset+=3;renderFilms();});
 panel.addEventListener('pointerenter',()=>{clearTimeout(leaveTimer);clearTimeout(hoverTimer);});
 panel.addEventListener('pointerleave',scheduleClose);
 panel.addEventListener('pointerdown',()=>{keyboardMode=false;});
 canvas.addEventListener('focusout',e=>{if(e.relatedTarget&&!canvas.contains(e.relatedTarget)&&!document.querySelector('dialog[open]'))close();});panel.querySelector('[data-map-close]').addEventListener('click',()=>close(true));document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!e.target.closest('[data-customer]')&&!document.querySelector('dialog[open]'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Tab'&&(panel.contains(document.activeElement)||document.activeElement?.matches('[data-customer]')))keyboardMode=true;if(e.key!=='Escape'||document.querySelector('dialog[open]'))return;if(!panel.hidden){e.preventDefault();close(true);}});
 let positioning=false;window.addEventListener('scroll',()=>{if(positioning||panel.hidden)return;positioning=true;requestAnimationFrame(()=>{position();positioning=false;});},{passive:true});
 new ResizeObserver(position).observe(panel);
 desktop.addEventListener('change',()=>{close();layoutPins();});new ResizeObserver(()=>{layoutPins();}).observe(canvas);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close();else sync();});document.addEventListener('greenfield:mediachange',sync);reduced.addEventListener('change',sync);new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});document.querySelectorAll('dialog').forEach(d=>new MutationObserver(()=>{sync();if(!d.open&&!panel.hidden)scheduleClose();}).observe(d,{attributes:true,attributeFilter:['open']}));new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)close();}).observe(map);layoutPins();
})();

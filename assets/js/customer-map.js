/* A bounded preview window for an unbounded, verified customer film catalogue. */
(() => {
 'use strict';
 const map=document.querySelector('.customer-map');if(!map)return;
 const data=JSON.parse(document.getElementById('customer-map-data').textContent);
 const canvas=map.querySelector('.customer-map-canvas'),panel=map.querySelector('.customer-map-panel');
 const pins=[...map.querySelectorAll('[data-customer]')],slots=[...panel.querySelectorAll('[data-map-film]')];
 const directory=map.querySelector('.customer-map-directory'),browse=map.querySelector('[data-map-browse]');
 const search=map.querySelector('[data-map-search]'),sector=map.querySelector('[data-map-sector]'),jump=panel.querySelector('[data-map-jump]');
 const entries=[...directory.querySelectorAll('[data-map-select]')],reset=directory.querySelector('[data-map-reset]');
 const desktop=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let client=null,opener=null,offset=0,kind='Alle',leaveTimer,hoverTimer,restoringFocus=false,pinned=false,keyboardMode=false,filtered=data,pinPositions=[];
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').replace(/ß/g,'ss');
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
  jump.replaceChildren(...list.map((f,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${f.title}`;return o;}));jump.value=String(offset);jump.closest('label').hidden=list.length<=3;
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
 const toggleDirectory=show=>{directory.hidden=!show;browse.setAttribute('aria-expanded',String(show));browse.querySelector('b').textContent=show?'−':'+';};
 // Spread only the drawn targets; the stored geographic coordinates stay unchanged.
 function spreadPins(customers,width,height){
  const gap=Math.max(24,Math.min(28,width/23.5)),svg=canvas.querySelector('.dach-map');
  const paths=[...svg.querySelectorAll('path')],box=svg.viewBox.baseVal;
  const countries={Schweiz:'CH',Deutschland:'DE','Österreich':'AT'};
  const countryAt=(x,y)=>countries[paths.find(path=>path.isPointInFill({x:x/width*box.width,y:y/height*box.height}))?.querySelector('title')?.textContent];
  const inside=(x,y)=>!!countryAt(x,y);
  const inset=(x,y)=>inside(x,y)&&inside(x-3,y)&&inside(x+3,y)&&inside(x,y-3)&&inside(x,y+3);
  const candidates=[];
  for(let row=0,y=gap/2;y<height;y+=gap*Math.sqrt(3)/2,row++){
   for(let x=gap/2+(row%2)*gap/2;x<width;x+=gap){if(inset(x,y))candidates.push({x,y,country:countryAt(x,y)});}
  }
  const anchors=customers.map(c=>({id:c.id,country:c.country,x:c.x*width/100,y:c.y*height/100}));
  const crowded=anchors.map(a=>({...a,neighbors:anchors.filter(b=>Math.hypot(a.x-b.x,a.y-b.y)<gap*3).length})).sort((a,b)=>b.neighbors-a.neighbors||a.id.localeCompare(b.id));
  const placed=[],available=p=>placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=gap-.1);
  for(const anchor of crowded){
   const options=countryAt(anchor.x,anchor.y)===anchor.country&&inset(anchor.x,anchor.y)&&available(anchor)?[anchor]:candidates.filter(p=>p.country===anchor.country&&available(p));
   options.sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y));
   const target=options[0]||anchor;
   placed.push({id:anchor.id,country:anchor.country,x:target.x,y:target.y,anchorX:anchor.x,anchorY:anchor.y});
  }
  // Improve the assignment without changing spacing or moving a customer into another country.
  const cost=(a,p)=>(a.anchorX-p.x)**2+(a.anchorY-p.y)**2;
  for(let pass=0;pass<20;pass++){
   let changed=false;
   for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){
    const a=placed[i],b=placed[j];if(a.country!==b.country)continue;
    if(cost(a,b)+cost(b,a)+.1<cost(a,a)+cost(b,b)){[a.x,b.x]=[b.x,a.x];[a.y,b.y]=[b.y,a.y];changed=true;}
   }
   if(!changed)break;
  }
  return placed;
 }
 const layoutPins=()=>{
  pins.forEach(p=>p.hidden=!filtered.some(c=>c.id===p.dataset.customer));
  if(!desktop.matches||!canvas.clientWidth||!canvas.clientHeight)return;
  // Always lay out the complete set so searching never shifts the remaining pins.
  pinPositions=spreadPins(data,canvas.clientWidth,canvas.clientHeight);
  for(const p of pinPositions){const pin=pins.find(pin=>pin.dataset.customer===p.id);pin.style.left=`${p.x}px`;pin.style.top=`${p.y}px`;}
  position();
 };
 const filter=()=>{const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);filtered=data.filter(c=>(!sector.value||c.category===sector.value)&&terms.every(t=>normalize(`${c.name} ${c.city} ${c.category}`).includes(t)));
  entries.forEach(b=>b.hidden=!filtered.some(c=>c.id===b.dataset.mapSelect));directory.querySelector('[data-map-search-status]').textContent=filtered.length?`${filtered.length} ${filtered.length===1?'Betrieb':'Betriebe'} · ${filmCount(filtered.reduce((n,c)=>n+c.films.length,0))}`:'Kein passender Betrieb. Versuche einen anderen Namen oder Ort.';reset.hidden=!search.value&&!sector.value;layoutPins();
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
 entries.forEach(b=>b.addEventListener('click',e=>{open(b.dataset.mapSelect,b,{focus:true,keyboard:e.detail===0});if(panel.getBoundingClientRect().top<80||panel.getBoundingClientRect().bottom>innerHeight)panel.scrollIntoView({block:'center',behavior:'smooth'});}));
 browse.addEventListener('click',()=>{close();toggleDirectory(directory.hidden);if(!directory.hidden)search.focus({preventScroll:true});else{search.value='';sector.value='';filter();}});
 search.addEventListener('input',()=>{close();filter();});sector.addEventListener('change',()=>{close();filter();});reset.addEventListener('click',()=>{search.value='';sector.value='';filter();search.focus();});
 panel.querySelectorAll('[data-map-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.mapKind;offset=0;renderFilms();}));
 panel.querySelector('[data-map-prev]').addEventListener('click',()=>{offset-=3;renderFilms();});panel.querySelector('[data-map-next]').addEventListener('click',()=>{offset+=3;renderFilms();});jump.addEventListener('change',()=>{const index=Number(jump.value);offset=Math.floor(index/3)*3;renderFilms();slots[index%3].focus({preventScroll:true});});
 panel.addEventListener('pointerenter',()=>{clearTimeout(leaveTimer);clearTimeout(hoverTimer);});
 panel.addEventListener('pointerleave',scheduleClose);
 panel.addEventListener('pointerdown',()=>{keyboardMode=false;});
 canvas.addEventListener('focusout',e=>{if(e.relatedTarget&&!canvas.contains(e.relatedTarget)&&!document.querySelector('dialog[open]'))close();});panel.querySelector('[data-map-close]').addEventListener('click',()=>close(true));document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!e.target.closest('[data-customer]')&&!document.querySelector('dialog[open]'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Tab'&&(panel.contains(document.activeElement)||document.activeElement?.matches('[data-customer]')))keyboardMode=true;if(e.key!=='Escape'||document.querySelector('dialog[open]'))return;if(!panel.hidden){e.preventDefault();close(true);}else if(!directory.hidden){e.preventDefault();toggleDirectory(false);search.value='';sector.value='';filter();browse.focus({preventScroll:true});}});
 let positioning=false;window.addEventListener('scroll',()=>{if(positioning||panel.hidden)return;positioning=true;requestAnimationFrame(()=>{position();positioning=false;});},{passive:true});
 new ResizeObserver(position).observe(panel);
 desktop.addEventListener('change',()=>{close();layoutPins();});new ResizeObserver(()=>{layoutPins();}).observe(canvas);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close();else sync();});document.addEventListener('greenfield:mediachange',sync);reduced.addEventListener('change',sync);new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});document.querySelectorAll('dialog').forEach(d=>new MutationObserver(()=>{sync();if(!d.open&&!panel.hidden)scheduleClose();}).observe(d,{attributes:true,attributeFilter:['open']}));new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)close();}).observe(map);filter();
})();

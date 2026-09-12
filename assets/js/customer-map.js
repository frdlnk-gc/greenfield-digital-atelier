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
 let client=null,opener=null,offset=0,kind='Alle',leaveTimer,restoringFocus=false,clusterIds=null,filtered=data;
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').replace(/ß/g,'ss');
 const filmCount=n=>`${n} ${n===1?'Film':'Filme'}`;
 const displayed=()=>client?.films.filter(f=>kind==='Alle'||f.kind===kind)||[];
 const moving=()=>desktop.matches&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-paused')&&!document.querySelector('dialog[open]');
 const sync=()=>slots.forEach(b=>{const v=b.querySelector('video');if(!panel.hidden&&!b.hidden&&moving()&&v.dataset.mapPreview){if(!v.getAttribute('src')){v.src=v.dataset.mapPreview;v.muted=true;}v.play().catch(()=>{});}else v.pause();});
 const release=v=>{v.pause();v.removeAttribute('src');delete v.dataset.mapPreview;v.load();};
 const close=(focus=false)=>{clearTimeout(leaveTimer);panel.hidden=true;pins.forEach(p=>p.setAttribute('aria-expanded','false'));slots.forEach(b=>release(b.querySelector('video')));if(focus&&opener?.isConnected){restoringFocus=true;opener.focus({preventScroll:true});restoringFocus=false;}};
 const position=()=>{
  if(panel.hidden)return;
  const pin=pins.find(p=>p.dataset.customer===client.id),r=canvas.getBoundingClientRect();
  const x=pin&&!pin.hidden?client.x/100*r.width:r.width/2,y=pin&&!pin.hidden?client.y/100*r.height:r.height/2;
  const headerBottom=document.querySelector('header')?.getBoundingClientRect().bottom||80;
  const minimum=Math.max(0,headerBottom+12-r.top);
  const maximum=Math.min(r.height-panel.offsetHeight,innerHeight-16-r.top-panel.offsetHeight);
  const top=maximum>=minimum?Math.max(minimum,Math.min(maximum,y-80)):Math.max(0,Math.min(r.height-panel.offsetHeight,y-80));
  panel.style.left=`${Math.max(0,Math.min(r.width-panel.offsetWidth,x+22))}px`;
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
 const open=(id,source,{focus=false}={})=>{
  if(!desktop.matches||restoringFocus)return;clearTimeout(leaveTimer);
  const next=data.find(c=>c.id===id);if(!next)return;
  if(client?.id===id&&!panel.hidden){if(focus)slots[0].focus({preventScroll:true});return;}
  client=next;opener=source;offset=0;kind='Alle';
  const logo=panel.querySelector('[data-map-logo]');logo.hidden=!client.logo;if(client.logo)logo.src=client.logo;else logo.removeAttribute('src');
  panel.querySelector('[data-map-name]').textContent=client.name;panel.querySelector('[data-map-city]').textContent=client.city;
  panel.querySelector('[data-map-category]').textContent=`${client.category} · ${filmCount(client.films.length)}`;
  pins.forEach(p=>p.setAttribute('aria-expanded',String(p.dataset.customer===id)));panel.hidden=false;renderFilms();if(focus)slots[0].focus({preventScroll:true});
 };
 const toggleDirectory=show=>{directory.hidden=!show;browse.setAttribute('aria-expanded',String(show));browse.querySelector('b').textContent=show?'−':'+';};
 const clusters=()=>{
  const container=map.querySelector('[data-map-clusters]');container.replaceChildren();
  pins.forEach(p=>p.hidden=!filtered.some(c=>c.id===p.dataset.customer));if(!desktop.matches)return;
  // Merge nearby targets without moving or inventing a customer's coordinates.
  const groups=[];for(const c of filtered){const x=c.x*canvas.clientWidth/100,y=c.y*canvas.clientHeight/100;let g=groups.find(g=>Math.hypot(g.x-x,g.y-y)<27);if(g)g.items.push(c);else groups.push({x,y,items:[c]});}
  for(const g of groups.filter(g=>g.items.length>1)){
   g.items.forEach(c=>{pins.find(p=>p.dataset.customer===c.id).hidden=true;});
   const b=document.createElement('button');b.type='button';b.className='customer-pin customer-pin-cluster';b.style.left=`${g.x}px`;b.style.top=`${g.y}px`;b.textContent=g.items.length;b.setAttribute('aria-label',`${g.items.length} Kunden in dieser Region anzeigen: ${g.items.map(c=>c.name).join(', ')}`);
   b.addEventListener('click',()=>{close();clusterIds=g.items.map(c=>c.id);search.value='';sector.value='';toggleDirectory(true);filter();entries.find(e=>!e.hidden)?.focus({preventScroll:true});directory.scrollIntoView({block:'nearest',behavior:'smooth'});});container.append(b);
  }
 };
 const filter=()=>{const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);filtered=data.filter(c=>(!sector.value||c.category===sector.value)&&(!clusterIds||clusterIds.includes(c.id))&&terms.every(t=>normalize(`${c.name} ${c.city} ${c.category}`).includes(t)));
  entries.forEach(b=>b.hidden=!filtered.some(c=>c.id===b.dataset.mapSelect));directory.querySelector('[data-map-search-status]').textContent=filtered.length?`${filtered.length} Betriebe · ${filtered.reduce((n,c)=>n+c.films.length,0)} Filme`:'Kein passender Betrieb. Versuche einen anderen Namen oder Ort.';reset.hidden=!clusterIds&&!search.value&&!sector.value;clusters();
 };
 pins.forEach(pin=>{pin.addEventListener('pointerenter',()=>open(pin.dataset.customer,pin));pin.addEventListener('focus',()=>open(pin.dataset.customer,pin));pin.addEventListener('click',()=>open(pin.dataset.customer,pin,{focus:true}));});
 entries.forEach(b=>b.addEventListener('click',()=>{open(b.dataset.mapSelect,b,{focus:true});if(panel.getBoundingClientRect().top<80||panel.getBoundingClientRect().bottom>innerHeight)panel.scrollIntoView({block:'center',behavior:'smooth'});}));
 browse.addEventListener('click',()=>{toggleDirectory(directory.hidden);if(!directory.hidden)search.focus({preventScroll:true});});
 search.addEventListener('input',()=>{clusterIds=null;close();filter();});sector.addEventListener('change',()=>{clusterIds=null;close();filter();});reset.addEventListener('click',()=>{clusterIds=null;search.value='';sector.value='';filter();search.focus();});
 panel.querySelectorAll('[data-map-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.mapKind;offset=0;renderFilms();}));
 panel.querySelector('[data-map-prev]').addEventListener('click',()=>{offset-=3;renderFilms();});panel.querySelector('[data-map-next]').addEventListener('click',()=>{offset+=3;renderFilms();});jump.addEventListener('change',()=>{const index=Number(jump.value);offset=Math.floor(index/3)*3;renderFilms();slots[index%3].focus({preventScroll:true});});
 canvas.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));canvas.addEventListener('pointerleave',()=>{leaveTimer=setTimeout(()=>{if(!panel.contains(document.activeElement)&&!document.querySelector('dialog[open]'))close();},350);});
 canvas.addEventListener('focusout',e=>{if(e.relatedTarget&&!canvas.contains(e.relatedTarget)&&!document.querySelector('dialog[open]'))close();});panel.querySelector('[data-map-close]').addEventListener('click',()=>close(true));map.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close(true);}});
 let positioning=false;window.addEventListener('scroll',()=>{if(positioning||panel.hidden)return;positioning=true;requestAnimationFrame(()=>{position();positioning=false;});},{passive:true});
 new ResizeObserver(position).observe(panel);
 desktop.addEventListener('change',()=>{close();clusters();});new ResizeObserver(()=>{position();clusters();}).observe(canvas);
 document.addEventListener('visibilitychange',sync);document.addEventListener('greenfield:mediachange',sync);reduced.addEventListener('change',sync);new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});document.querySelectorAll('dialog').forEach(d=>new MutationObserver(sync).observe(d,{attributes:true,attributeFilter:['open']}));new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)close();}).observe(map);filter();
})();

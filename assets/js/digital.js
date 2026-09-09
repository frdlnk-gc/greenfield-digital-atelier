/* Interactive, illustrative operations. Never sends data or runs real workflows. */
(() => {
  'use strict';
  const dataElement = document.getElementById('digital-data');
  if (!dataElement) return;
  const sectors = JSON.parse(dataElement.textContent);
  const tools = {
    chatgpt: {name:'ChatGPT',image:'chatgpt.png',description:'Anfragen verstehen, Informationen aufbereiten und Antworten vorbereiten.'},
    claude: {name:'Claude',image:'claude.png',description:'Dokumente strukturieren, Wissen nutzbar machen und Entwürfe ausarbeiten.'},
    make: {name:'Make',image:'make.png',description:'Deine Anwendungen verbinden und wiederkehrende Arbeitsschritte koordinieren.'},
    n8n: {name:'n8n',image:'n8n.png',description:'Individuelle Abläufe und KI-Assistenten mit deinen Systemen verknüpfen.'},
    higgsfield: {name:'Higgsfield',image:'higgsfield.png',description:'Kreative Bild- und Videoideen für deine Marke und saisonale Aktionen entwickeln.'},
    website: {name:'Website',description:'Kunden und Bewerber erreichen. Anfragen direkt in deine Abläufe übergeben.'},
    phone: {name:'Telefonie',description:'Anliegen aufnehmen, Rückfragen klären und den richtigen Ansprechpartner einbinden.'},
    crm: {name:'CRM & Daten',description:'Kontakte, Projekte und freigegebene Betriebsinformationen gemeinsam verfügbar machen.'},
    database: {name:'Betriebsdaten'},calendar:{name:'Kalender'},mail:{name:'E-Mail'},check:{name:'Freigabe'},garden:{name:'GaLaBau'},nursery:{name:'Baumschule'},store:{name:'Gartencenter'}
  };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = (key, alt = '') => tools[key]?.image
    ? `<img src="assets/img/tools/${tools[key].image}" alt="${escape(alt)}" width="36" height="36" decoding="async"${['make','n8n'].includes(key)?' class="wide-logo"':''}>`
    : `<svg class="digital-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="#di-${escape(key)}"></use></svg>`;
  const q = selector => document.querySelector(selector);
  const sectorButtons = [...document.querySelectorAll('[data-sector]')];
  const processNav = q('#process-switch');
  const stepNav = q('#process-steps');
  const detail = q('#process-detail');
  const playButton = q('#process-play');
  const prevButton = q('#process-prev');
  const nextButton = q('#process-next');
  const status = q('#process-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let sectorIndex = 0, flowIndex = 0, stepIndex = 0, playing = false, timer = null;
  const sector = () => sectors[sectorIndex];
  const flow = () => sector().flows[flowIndex];
  const number = i => String(i + 1).padStart(2, '0');
  const movementAllowed = () => !reduced.matches && !document.body.classList.contains('motion-paused') && !document.hidden;

  function updatePlayControl() {
    const manual = !movementAllowed();
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.innerHTML = icon(playing ? 'pause' : 'play') + `<span>${manual ? 'Nächster Schritt' : playing ? 'Ablauf pausieren' : stepIndex === 4 ? 'Noch einmal abspielen' : 'Ablauf abspielen'}</span>`;
  }
  function stop() {
    playing = false;
    clearTimeout(timer);
    timer = null;
    updatePlayControl();
  }
  function announce() {
    status.textContent = `${sector().short}: ${flow().short}. Schritt ${stepIndex + 1} von 5: ${flow().steps[stepIndex].title}.`;
  }
  function centerStep() {
    const target = stepNav.children[stepIndex];
    if (stepNav.scrollWidth > stepNav.clientWidth + 2) {
      stepNav.scrollTo({left:target.offsetLeft - stepNav.offsetLeft - (stepNav.clientWidth - target.offsetWidth) / 2,behavior:movementAllowed()?'smooth':'auto'});
    }
  }
  function renderStep({announceChange = true, center = true} = {}) {
    const step = flow().steps[stepIndex];
    [...stepNav.children].forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === stepIndex));
      button.tabIndex = i === stepIndex ? 0 : -1;
      button.classList.toggle('is-complete', i < stepIndex);
    });
    detail.setAttribute('aria-labelledby', `process-step-${stepIndex}`);
    q('#step-position').textContent = `SCHRITT ${number(stepIndex)} / 05`;
    q('#step-heading').textContent = step.heading;
    q('#step-copy').textContent = step.copy;
    q('#step-owner').innerHTML = icon(step.owner.includes('gibt frei') || step.owner.includes('entscheidet') || step.owner.includes('bestätigt') ? 'check' : 'connect') + `<span>${escape(step.owner)}</span>`;
    q('#output-tools').innerHTML = step.tools.map(key => `<span class="output-tool" title="${escape(tools[key].name)}" aria-label="${escape(tools[key].name)}">${icon(key)}</span>`).join('');
    q('#output-heading').textContent = step.tag;
    q('#output-rows').innerHTML = step.rows.map(([label,value]) => `<div class="output-row"><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('');
    const output = q('#process-output');
    output.classList.remove('is-updating');
    // Restart a short, opacity-only content transition without changing focus.
    void output.offsetWidth;
    if (movementAllowed()) output.classList.add('is-updating');
    prevButton.disabled = stepIndex === 0;
    nextButton.disabled = stepIndex === flow().steps.length - 1;
    updatePlayControl();
    if (center) centerStep();
    if (announceChange) announce();
  }
  function updateHash() {
    const hash = `#prozess-${sector().id}-${flow().id}`;
    history.replaceState(null, '', hash);
  }
  function renderFlow({changeHash = false, announceChange = true} = {}) {
    stop(); stepIndex = 0;
    q('#process-title').textContent = flow().title;
    q('#process-intro').textContent = flow().intro;
    q('#process-sector-label').textContent = `${sector().short} · Beispielprozess`;
    q('#process-outcome-copy').textContent = flow().outcome;
    processNav.innerHTML = sector().flows.map((item,i) => `<button type="button" class="process-button" data-flow="${i}" aria-pressed="${i === flowIndex}" aria-controls="process-studio"><span>${number(i)}</span>${escape(item.short)}</button>`).join('');
    stepNav.innerHTML = flow().steps.map((step,i) => `<button type="button" class="process-step" role="tab" id="process-step-${i}" aria-controls="process-detail" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" style="--step:${i}" data-step="${i}"><span class="process-step-icon">${icon(step.icon)}</span><span class="process-step-number">${number(i)}</span><span class="process-step-label">${escape(step.title)}</span></button>`).join('');
    stepNav.scrollLeft = 0;
    renderStep({announceChange,center:false});
    if (changeHash) updateHash();
  }
  function selectSector(index, process = 0, changeHash = true) {
    sectorIndex = index; flowIndex = process;
    sectorButtons.forEach((button,i) => button.setAttribute('aria-pressed',String(i === index)));
    q('#sector-heading').textContent = sector().line;
    q('#sector-description').textContent = sector().description;
    renderFlow({changeHash,announceChange:changeHash});
  }
  function goStep(index, focus = false) {
    stop(); stepIndex = Math.max(0, Math.min(flow().steps.length - 1,index));
    renderStep();
    if (focus) stepNav.children[stepIndex].focus({preventScroll:true});
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing || !movementAllowed()) return stop();
    timer = setTimeout(() => {
      if (!movementAllowed() || document.querySelector('#process-studio.is-idle')) return stop();
      if (stepIndex >= flow().steps.length - 1) return stop();
      stepIndex++;
      renderStep();
      if (stepIndex === flow().steps.length - 1) stop(); else schedule();
    }, 4600);
  }
  sectorButtons.forEach((button,index) => button.addEventListener('click',() => selectSector(index)));
  processNav.addEventListener('click',event => {
    const button = event.target.closest('[data-flow]');
    if (!button) return;
    flowIndex = Number(button.dataset.flow);
    renderFlow({changeHash:true});
    processNav.children[flowIndex].focus({preventScroll:true});
  });
  stepNav.addEventListener('click',event => {
    const button = event.target.closest('[data-step]');
    if (button) goStep(Number(button.dataset.step));
  });
  stepNav.addEventListener('keydown',event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    goStep(event.key === 'Home' ? 0 : event.key === 'End' ? 4 : (stepIndex + (event.key === 'ArrowRight'?1:4)) % 5,true);
  });
  [q('#sector-switch'),processNav].forEach(nav => nav.addEventListener('keydown',event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    const buttons = [...nav.querySelectorAll('button')];
    const current = buttons.indexOf(event.target);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight'?1:buttons.length-1)) % buttons.length;
    buttons[next].click();
    nav.querySelectorAll('button')[next].focus({preventScroll:true});
  }));
  prevButton.addEventListener('click',() => goStep(stepIndex - 1));
  nextButton.addEventListener('click',() => goStep(stepIndex + 1));
  playButton.addEventListener('click',() => {
    if (!movementAllowed()) return goStep((stepIndex + 1) % 5);
    if (playing) return stop();
    if (stepIndex === 4) {stepIndex = 0; renderStep();}
    playing = true; updatePlayControl(); schedule();
  });
  document.querySelectorAll('[data-agent-example]').forEach(button => button.addEventListener('click',() => {
    const [sectorId,flowId] = button.dataset.agentExample.split(':');
    const index = sectors.findIndex(item => item.id === sectorId);
    selectSector(index,sectors[index].flows.findIndex(item => item.id === flowId));
    q('#process-title').setAttribute('tabindex','-1');
    q('#process-title').focus({preventScroll:true});
    q('#prozesse').scrollIntoView({behavior:movementAllowed()?'smooth':'auto',block:'start'});
  }));
  q('[data-discuss-process]').addEventListener('click',() => {
    const message = q('#kontakt textarea[name="nachricht"]');
    if (message && !message.value.trim()) message.value = `Ich interessiere mich für Digitalisierung & KI im Bereich ${sector().label}. Der Beispielprozess „${flow().short}“ ist für meinen Betrieb interessant.`;
  });
  document.querySelectorAll('.network-node').forEach(button => button.addEventListener('click',() => {
    const key = button.dataset.tool;
    document.querySelectorAll('.network-node').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    document.querySelectorAll('[data-connection]').forEach(line => line.classList.toggle('is-selected',line.dataset.connection === key));
    q('#network-note').innerHTML = `<strong>${escape(tools[key].name)}</strong><span>${escape(tools[key].description)}</span>`;
  }));
  function fromHash() {
    const hash = location.hash.slice(1);
    for (const [i,item] of sectors.entries()) {
      const j = item.flows.findIndex(process => hash === `prozess-${item.id}-${process.id}`);
      if (j >= 0) {
        selectSector(i,j,false);
        requestAnimationFrame(() => q('#prozesse').scrollIntoView({block:'start',behavior:'instant'}));
        return true;
      }
    }
    return false;
  }
  window.addEventListener('hashchange',fromHash);
  if (!fromHash()) selectSector(0,0,false);
  const visible = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-idle',!entry.isIntersecting);
      if (entry.target.id === 'process-studio' && !entry.isIntersecting) stop();
    });
  },{threshold:0});
  visible.observe(q('.digital-network-wrap')); visible.observe(q('#process-studio'));
  document.addEventListener('visibilitychange',() => {if(document.hidden) stop();updatePlayControl();});
  reduced.addEventListener('change',() => {stop();updatePlayControl();});
  new MutationObserver(() => {if(!movementAllowed())stop();updatePlayControl();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  q('#process-studio').setAttribute('aria-busy','false');
})();

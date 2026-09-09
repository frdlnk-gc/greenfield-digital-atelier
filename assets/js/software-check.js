/* The assessment stays in memory; nothing is sent or persisted. */
(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const symbol = key => `<svg class="digital-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="#di-${key}"/></svg>`;
  const model = window.GreenfieldSoftwareCheck;
  const data = q('#software-data');
  if (!data || !model) return;
  const catalog = JSON.parse(data.textContent);
  const tools = [...catalog.tools];
  const selected = new Map();
  const euros = value => value === null ? '—' : new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(value);
  const decimal = value => new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(value);
  const iconKeys = {branche:'garden',team:'calendar',buero:'mail',kunden:'phone',ki:'connect'};
  const logoIds = ['chatgpt','claude','make','n8n','higgsfield'];
  const normalize = value => value.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let expanded = false, stage = 1, customCounter = 0, previousSummary = '';
  let currentSummary = '';
  const needs = {
    requests:{name:'Anfragen & Nachfassen',title:'Ein vorbereitetes Kundengespräch.',copy:'Website-Anfrage oder Anruf wird zum Vorgang mit Projektwunsch, Rückfragen und nächstem Termin. Dein Team steigt mit Kontext ein.',icon:'crm',flow:'galabau-projektanfrage'},
    documents:{name:'Berichte & Dokumente',title:'Vom gesprochenen Tagesstand zum Bericht.',copy:'Dein Vorarbeiter spricht den Stand ein. Die KI strukturiert den Entwurf, dein Team prüft ihn und das Büro erhält die freigegebene Dokumentation.',icon:'mail',flow:'galabau-baustellenbericht'},
    planning:{name:'Planung & Übergaben',title:'Ein klarer nächster Einsatz.',copy:'Fällige Pflegeaufträge, bestätigte Termine und Aufgaben werden zusammengeführt. Dein Team arbeitet mit einer gemeinsamen Übersicht.',icon:'calendar',flow:'galabau-pflegeplanung'},
    knowledge:{name:'Wissen & Pflanzenlisten',title:'Aus einer Pflanzenliste wird Vorarbeit.',copy:'Anfragen werden strukturiert und mit freigegebenem Sortiment und verfügbaren Beständen abgeglichen. Dein Verkauf bestätigt Verfügbarkeit und Konditionen.',icon:'nursery',flow:'baumschule-pflanzenanfrage'},
    marketing:{name:'Marketing & Aktionen',title:'Eine Saisonaktion, gemeinsam vorbereitet.',copy:'Aus Aktionsbriefing und echtem Produktmaterial entstehen Textentwürfe und ein Redaktionsplan. Dein Team prüft Inhalte vor der Veröffentlichung.',icon:'creative',flow:'gartencenter-aktionsplanung'},
    inventory:{name:'Bestand & Einkauf',title:'Handlungsbedarf rechtzeitig auf dem Tisch.',copy:'Bestandsdaten und deine Regeln bereiten einen Bestellvorschlag vor. Dein Einkauf entscheidet, was tatsächlich bestellt wird.',icon:'database',flow:'gartencenter-bestandsplanung'}
  };
  const activeNeeds = () => qa('#sc-needs-options input:checked').map(input=>input.value);
  const values = () => [...selected.entries()].map(([id,value]) => ({id,...value}));
  const summary = () => model.summarize(values(),q('#sc-hours').value,q('#sc-rate').value);
  function status(text) {q('#sc-status').textContent=text;}
  function toolIcon(tool) {
    return logoIds.includes(tool.id) ? `<img src="assets/img/tools/${tool.id}.png" alt="" width="24" height="24">` : symbol(iconKeys[tool.category]||'connect');
  }
  function renderCatalog() {
    const search = normalize(q('#sc-search').value.trim());
    const category = q('#sc-category').value;
    const filtered = tools.filter(tool => (category==='alle'||tool.category===category) && normalize(`${tool.name} ${tool.description} ${tool.aliases}`).includes(search));
    const shown = expanded || search || category!=='alle' ? filtered : filtered.slice(0,12);
    q('#sc-catalog').innerHTML=shown.map(tool=>`<button type="button" class="sc-tool" data-sc-tool="${tool.id}" aria-pressed="${selected.has(tool.id)}" aria-label="${escape(tool.name)}"><span class="sc-tool-icon">${toolIcon(tool)}</span><span><b>${escape(tool.name)}</b><small>${escape(tool.description)}</small></span><span class="sc-tool-add" aria-hidden="true">${selected.has(tool.id)?'✓':'+'}</span></button>`).join('');
    q('#sc-no-results').hidden=filtered.length>0;
    q('#sc-show-all').hidden=!!search||category!=='alle'||filtered.length<=12;
    q('#sc-show-all').textContent=expanded?'Auswahl kompakter anzeigen ↑':`Alle ${tools.length} Tools anzeigen ↓`;
    q('#sc-show-all').setAttribute('aria-expanded',String(expanded));
  }
  function renderSelection() {
    q('#sc-selection-count').textContent=`${selected.size} ausgewählt`;
    q('#sc-selected-chips').innerHTML=values().map(entry=>`<button type="button" class="sc-chip" data-sc-remove="${entry.id}" aria-label="${escape(entry.name)} entfernen">${escape(entry.name)} <span aria-hidden="true">×</span></button>`).join('');
  }
  function toggle(id) {
    const tool=tools.find(t=>t.id===id);
    if (!tool) return;
    if(selected.has(id))selected.delete(id);else selected.set(id,{name:tool.name,cost:'',usage:'',satisfaction:'',source:'own',planIndex:0,seats:'1'});
    renderCatalog();renderSelection();
    q(`[data-sc-tool="${id}"]`)?.focus({preventScroll:true});
  }
  function options(list,value) {return list.map(([id,label])=>`<option value="${id}"${String(value)===String(id)?' selected':''}>${escape(label)}</option>`).join('');}
  function hint(entry) {
    if(model.number(entry.cost)===null)return entry.cost.trim()?'Bitte einen gültigen Betrag eingeben (z. B. 149,90).':'Noch kein Betrag erfasst.';
    return entry.source==='reference'?`Tarif-Orientierung: ${entry.referenceLabel}. Zusatzkosten bitte ergänzen.`:'Dein angegebener Gesamtbetrag.';
  }
  function referenceBlock(tool,entry) {
    if(!tool.plans.length)return `<p class="sc-price-note">${escape(tool.note)}</p>`;
    return `<button type="button" class="sc-ref-toggle" data-ref-toggle="${tool.id}" aria-expanded="false" aria-controls="sc-reference-${tool.id}">Tarif als Orientierung verwenden ↓</button><div class="sc-reference" id="sc-reference-${tool.id}" hidden><div class="sc-ref-controls"><label>Referenztarif<select data-ref-plan="${tool.id}" aria-label="Referenztarif ${escape(tool.name)}">${options(tool.plans.map((p,i)=>[i,p.name]),entry.planIndex)}</select></label><label class="sc-ref-seats">Nutzer<input type="number" min="1" max="10000" step="1" data-ref-seats="${tool.id}" aria-label="Nutzer ${escape(tool.name)}" value="${escape(entry.seats)}"></label><button type="button" class="sc-use-price" data-use-price="${tool.id}">Tarifbetrag übernehmen</button></div><p class="sc-price-preview" id="sc-price-preview-${tool.id}"></p><p class="sc-price-note">${escape(tool.note)}</p></div>`;
  }
  function renderCosts() {
    q('#sc-cost-list').innerHTML=values().map(entry=>{
      const tool=tools.find(t=>t.id===entry.id);
      return `<article class="sc-cost-card" data-cost-card="${entry.id}"><div class="sc-cost-card-head"><div><h4>${escape(tool.name)}</h4>${tool.url?`<a class="sc-source" href="${escape(tool.url)}" target="_blank" rel="noopener noreferrer">Anbieter &amp; Preisbasis ↗</a>`:'<span class="sc-source">Deine eigene Software</span>'}</div><button type="button" class="sc-remove" data-sc-remove="${entry.id}" aria-label="${escape(tool.name)} entfernen">×</button></div><div class="sc-cost-inputs"><label>Gesamtkosten / Monat in €<input type="text" inputmode="decimal" maxlength="11" data-cost="${entry.id}" aria-invalid="${!!entry.cost.trim()&&model.number(entry.cost)===null}" aria-label="Monatliche Kosten ${escape(tool.name)}" value="${escape(entry.cost)}" placeholder="Dein Betrag, z. B. 149,90" aria-describedby="sc-hint-${entry.id}"><span class="sc-cost-hint" id="sc-hint-${entry.id}">${escape(hint(entry))}</span></label><label>Genutzte Funktionen<select data-usage="${entry.id}" aria-label="Genutzte Funktionen ${escape(tool.name)}">${options([['','Bitte einschätzen'],['25','Etwa ein Viertel'],['50','Etwa die Hälfte'],['75','Den Großteil'],['100','Praktisch alle']],entry.usage)}</select></label><label>Passt es zu deinen Abläufen?<select data-satisfaction="${entry.id}" aria-label="Zufriedenheit ${escape(tool.name)}">${options([['','Bitte einschätzen'],['5','Sehr gut'],['4','Gut'],['3','Mit Kompromissen'],['2','Eher schlecht'],['1','Überhaupt nicht']],entry.satisfaction)}</select></label></div>${referenceBlock(tool,entry)}</article>`;
    }).join('')||'<div class="sc-empty">Noch keine Tools ausgewählt? Du kannst auch ohne bestehende Software deinen Arbeitsaufwand und deine Wünsche erfassen.</div>';
    values().forEach(entry=>updateReference(entry.id));
  }
  function updateReference(id) {
    const tool=tools.find(t=>t.id===id), entry=selected.get(id);
    if(!tool?.plans.length||!entry)return;
    const plan=tool.plans[entry.planIndex],card=q(`[data-cost-card="${id}"]`);
    if(!card)return;
    const seatsInput=card.querySelector('[data-ref-seats]');
    seatsInput.closest('label').hidden=plan.unit!=='seat';
    const amount=model.reference(plan,plan.unit==='seat'?entry.seats:1);
    card.querySelector('[data-use-price]').disabled=amount===null;
    q(`#sc-price-preview-${id}`).textContent=amount===null?'Bitte eine ganze Nutzerzahl von 1 bis 10.000 eingeben.':`${euros(amount)} netto / Monat · ${plan.basis}${plan.unit==='seat'?` · ${entry.seats} Nutzer`:''}${plan.smallTeamBelow&&Number(entry.seats)<plan.smallTeamBelow?' · inklusive 10 € Plattform-Pauschale':''}`;
  }
  function renderResult() {
    const s=summary(), entries=values(), goals=activeNeeds();
    q('#sc-monthly').textContent=euros(s.monthly);
    q('#sc-yearly').textContent=s.yearly===null?'Noch keine Kosten erfasst.':`${euros(s.yearly)} pro Jahr · laufende Softwarekosten`;
    const refs=entries.filter(e=>e.source==='reference'&&model.number(e.cost)!==null).length;
    q('#sc-total-note').textContent=`${s.priced} von ${s.selected} Tools mit Kosten erfasst.${s.missing?` Für ${s.missing} ${s.missing===1?'Tool fehlt der Betrag':'Tools fehlen die Beträge'}. Die Summe ist unvollständig.`:''}${refs?` ${refs} ${refs===1?'Betrag stammt aus einem übernommenen Referenztarif':'Beträge stammen aus übernommenen Referenztarifen'}.`:''} Einmalige Einrichtung, Hardware und nicht erfasste Zusatzkosten sind nicht enthalten.`;
    const priced=entries.filter(e=>model.number(e.cost)!==null).sort((a,b)=>model.number(b.cost)-model.number(a.cost));
    const barRows=priced.slice(0,4).map(e=>({name:e.name,cost:model.number(e.cost)}));
    if(priced.length>4)barRows.push({name:`Weitere ${priced.length-4} Tools`,cost:priced.slice(4).reduce((sum,e)=>sum+model.number(e.cost),0)});
    q('#sc-cost-bars').innerHTML=barRows.map(e=>`<div><div class="sc-bar-head"><span>${escape(e.name)}</span><span>${euros(e.cost)}</span></div><div class="sc-bar-track"><span style="width:${s.monthly?Math.max(0,Math.min(100,e.cost/s.monthly*100)):0}%"></span></div></div>`).join('');
    q('#sc-donut').style.setProperty('--usage',s.averageUsage||0);
    q('#sc-usage').textContent=s.averageUsage===null?'—':`${s.averageUsage}%`;
    q('#sc-fit-copy').textContent=s.usageCount?`Durchschnitt aus deinen Angaben für ${s.usageCount} von ${s.selected} Tools.`:'Noch keine Einschätzung abgegeben.';
    q('#sc-fit-detail').innerHTML=`<p><b>${s.underused}</b><span>Tools nutzt du nach eigener Einschätzung höchstens zur Hälfte.</span></p><p><b>${s.lowFit}</b><span>Tools passen für dich eher schlecht oder gar nicht. ${s.satisfactionCount} von ${s.selected} bewertet.</span></p>`;
    const effort=q('#sc-work-result');effort.hidden=s.hoursMonth===null;
    if(!effort.hidden)effort.innerHTML=`<strong>${decimal(s.hoursMonth)} Std. / Monat</strong><p>Geschätzte Handarbeit in deinem Team.${s.workValue===null?'':` Rechnerischer Zeitwert: <b>${euros(s.workValue)} / Monat.</b>`}<small>Deine Wochenstunden × 52 ÷ 12${s.workValue===null?'':' × dein interner Stundenwert'}. Dieser Aufwand ist keine zusätzliche Software-Rechnung und keine zugesagte Einsparung.</small></p>`;
    const wellFitting=entries.filter(e=>Number(e.satisfaction)>=4).map(e=>e.name);
    q('#sc-keep-copy').textContent=wellFitting.length?`Du bewertest ${wellFitting.slice(0,3).join(', ')}${wellFitting.length>3?' und weitere Tools':''} positiv. Diese Stärken bilden einen guten Ausgangspunkt für die gemeinsame Prüfung.`:'Bewährte Buchhaltung, Branchensoftware und Fachfunktionen können die Grundlage bleiben. Gemeinsam prüfen wir deinen tatsächlichen Bedarf.';
    q('#sc-connect-copy').textContent=entries.length?`Wir prüfen für deine ${entries.length} ausgewählten Tools, wo Daten heute mehrfach eingegeben werden. Verfügbare Schnittstellen, Verträge und Freigaben bestimmen die Verbindung.`:'Anfragen, Dokumente und Aufgaben können einen gemeinsamen Weg bekommen. Wir legen fest, welche Informationen dein Team wirklich benötigt.';
    q('#sc-build-copy').textContent=goals.length?`Deine Prioritäten: ${goals.map(key=>needs[key].name).join(', ')}. Daraus entwickeln wir passende Ansichten, Eingabemasken und Assistenten für deinen Alltag.`:'Eine mobile Erfassung, ein gemeinsames Betriebs-Cockpit oder ein Assistent mit deinem Fachwissen: Der erste Baustein entsteht aus deinem konkreten Arbeitsalltag.';
    q('#sc-opportunities').innerHTML=(goals.length?goals:['documents','knowledge']).map(key=>{
      const item=needs[key];return `<article class="sc-opportunity">${symbol(item.icon)}<div><h5>${item.title}</h5><p>${item.copy}</p></div><a href="#prozess-${item.flow}">Ablauf erleben ↗</a></article>`;
    }).join('');
    q('#sc-wish-result').hidden=!q('#sc-wish').value.trim();
    q('#sc-wish-copy').textContent=q('#sc-wish').value.trim();
    currentSummary=makeSummary(s);
  }
  function makeSummary(s) {
    const lines=['MEIN SOFTWARE-CHECK','Alle Geldbeträge netto. Angaben und Einschätzungen des Betriebs.',''];
    values().forEach(entry=>lines.push(`${entry.name}: ${model.number(entry.cost)===null?'Kosten noch offen':euros(model.number(entry.cost))+' / Monat'}${entry.source==='reference'?` (Tarif-Orientierung: ${entry.referenceLabel})`:''}; genutzte Funktionen: ${entry.usage?entry.usage+' %':'offen'}; Passung: ${entry.satisfaction?entry.satisfaction+'/5':'offen'}`));
    lines.push('',`Erfasste Softwarekosten: ${euros(s.monthly)} / Monat; ${euros(s.yearly)} / Jahr. ${s.missing} Kostenangaben offen.`);
    if(s.hoursMonth!==null)lines.push(`Geschätzte Handarbeit: ${q('#sc-hours').value} Std. / Woche, ${decimal(s.hoursMonth)} Std. / Monat.${s.workValue===null?'':` Rechnerischer Zeitwert: ${euros(s.workValue)} / Monat.`} Keine zugesagte Einsparung.`);
    const goals=activeNeeds();if(goals.length)lines.push(`Meine Prioritäten: ${goals.map(key=>needs[key].name).join(', ')}.`);
    if(q('#sc-wish').value.trim())lines.push(`Mein konkreter Wunsch: ${q('#sc-wish').value.trim()}`);
    lines.push('','Ich möchte besprechen, wie meine bestehenden Tools und individuelle Abläufe besser zusammenarbeiten können. Entwicklung und laufende Kosten sollen im Gespräch geklärt werden.');
    return lines.join('\n');
  }
  function goStage(next) {
    stage=Number(next);
    if(stage===2)renderCosts();if(stage===3)renderResult();
    [1,2,3].forEach(n=>q(`#sc-panel-${n}`).hidden=n!==stage);
    qa('[data-sc-stage]').forEach(button=>{if(Number(button.dataset.scStage)===stage)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    q(`#sc-title-${stage}`).focus({preventScroll:true});
    q('#software-calculator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused')?'instant':'smooth',block:'start'});
    status(`Schritt ${stage} von 3.`);
  }
  q('#sc-category').innerHTML=options(catalog.categories,'alle');
  q('#sc-search').addEventListener('input',renderCatalog);q('#sc-category').addEventListener('change',renderCatalog);
  q('#sc-show-all').addEventListener('click',()=>{expanded=!expanded;renderCatalog();});
  q('#sc-catalog').addEventListener('click',event=>{const button=event.target.closest('[data-sc-tool]');if(button)toggle(button.dataset.scTool);});
  q('#software-calculator').addEventListener('click',event=>{
    const next=event.target.closest('[data-sc-next],[data-sc-stage]');if(next)return goStage(next.dataset.scNext||next.dataset.scStage);
    const remove=event.target.closest('[data-sc-remove]');
    if(remove){const id=remove.dataset.scRemove;selected.delete(id);renderSelection();renderCatalog();if(stage===2){renderCosts();q('#sc-title-2').focus({preventScroll:true});}else q('#sc-custom-name').focus({preventScroll:true});return;}
    const toggleButton=event.target.closest('[data-ref-toggle]');
    if(toggleButton){const section=q(`#sc-reference-${toggleButton.dataset.refToggle}`);section.hidden=!section.hidden;toggleButton.setAttribute('aria-expanded',String(!section.hidden));return;}
    const use=event.target.closest('[data-use-price]');
    if(use){const id=use.dataset.usePrice,entry=selected.get(id),tool=tools.find(t=>t.id===id),plan=tool.plans[entry.planIndex];const amount=model.reference(plan,plan.unit==='seat'?entry.seats:1);if(amount===null)return;entry.cost=String(amount).replace('.',',');entry.source='reference';entry.referenceLabel=`${plan.name}, ${plan.basis}${plan.unit==='seat'?`, ${entry.seats} Nutzer`:''}`;const input=q(`[data-cost="${id}"]`);input.value=entry.cost;input.setAttribute('aria-invalid','false');q(`#sc-hint-${id}`).textContent=hint(entry);status(`${euros(amount)} als Tarif-Orientierung für ${tool.name} übernommen.`);}
  });
  q('#sc-cost-list').addEventListener('input',event=>{
    const input=event.target;
    if(input.dataset.cost){const entry=selected.get(input.dataset.cost);entry.cost=input.value;entry.source='own';input.setAttribute('aria-invalid',String(!!input.value.trim()&&model.number(input.value)===null));q(`#sc-hint-${input.dataset.cost}`).textContent=hint(entry);}
    if(input.dataset.refSeats){selected.get(input.dataset.refSeats).seats=input.value;updateReference(input.dataset.refSeats);}
  });
  q('#sc-cost-list').addEventListener('change',event=>{
    const input=event.target;
    if(input.dataset.usage)selected.get(input.dataset.usage).usage=input.value;
    if(input.dataset.satisfaction)selected.get(input.dataset.satisfaction).satisfaction=input.value;
    if(input.dataset.refPlan){selected.get(input.dataset.refPlan).planIndex=Number(input.value);updateReference(input.dataset.refPlan);}
  });
  [q('#sc-hours'),q('#sc-rate')].forEach(input=>input.addEventListener('input',()=>{
    const invalid=!!input.value.trim()&&model.number(input.value,10000)===null;
    input.setAttribute('aria-invalid',String(invalid));
    if(invalid)status('Bitte einen Wert von 0 bis 10.000 mit maximal zwei Nachkommastellen eingeben.');
  }));
  function addCustom() {
    const input=q('#sc-custom-name'),name=input.value.trim();if(!name){input.focus();return;}
    const existing=tools.find(tool=>normalize(tool.name)===normalize(name));
    if(existing){if(!selected.has(existing.id))toggle(existing.id);status(`${existing.name} ist ausgewählt.`);}else{
      const id=`custom-${++customCounter}`;tools.push({id,name,category:'buero',description:'Deine eigene Software',aliases:'',url:'',plans:[],note:'Bitte die laufenden Kosten aus deinem Vertrag eintragen.'});selected.set(id,{name,cost:'',usage:'',satisfaction:'',source:'own',planIndex:0,seats:'1'});renderCatalog();renderSelection();status(`${name} hinzugefügt.`);
    }
    input.value='';input.focus();
  }
  q('#sc-add-custom').addEventListener('click',addCustom);
  q('#sc-custom-name').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addCustom();}});
  q('#sc-discuss').addEventListener('click',()=>{
    renderResult();const message=q('#kontakt textarea[name="nachricht"]');if(!message)return;
    if(previousSummary&&message.value.includes(previousSummary))message.value=message.value.replace(previousSummary,currentSummary);
    else message.value=[message.value.trim(),currentSummary].filter(Boolean).join('\n\n');
    previousSummary=currentSummary;message.dispatchEvent(new Event('input',{bubbles:true}));
  });
  q('#sc-download').addEventListener('click',()=>{
    renderResult();const url=URL.createObjectURL(new Blob([currentSummary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Mein-Greenfield-Software-Check.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  qa('[data-privacy-mode]').forEach(button=>button.addEventListener('click',()=>{
    const cloud=button.dataset.privacyMode==='cloud';qa('[data-privacy-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    q('#privacy-diagram').dataset.mode=cloud?'cloud':'germany';q('#privacy-external').hidden=!cloud;
    q('#privacy-diagram').setAttribute('aria-label',cloud?'Architekturbeispiel mit separat geprüften externen Diensten':'Beispiel für einen geschützten Arbeitsbereich mit Verarbeitung in Deutschland');
    q('#privacy-caption').textContent=cloud?'ARCHITEKTURBEISPIEL · GEPRÜFTE VERBINDUNGEN':'ARCHITEKTURBEISPIEL · DEUTSCHLAND';
    q('#privacy-model').textContent=cloud?'Passendes Modell wählen':'Modell in Deutschland';
    q('#privacy-boundary-note').textContent=cloud?'Datenwege und Anbieter werden je Verbindung festgelegt.':'Beispiel: Anwendung + KI + Wissen bei mittwald.';
    q('#privacy-explanation').innerHTML=cloud?'<strong>Externe Dienste bewusst ergänzen.</strong><p>Wenn ChatGPT, Claude oder andere Cloud-Dienste fachlich passen, prüfen wir Verträge, Datenverwendung und mögliche Drittlandtransfers. Dein Betrieb gibt die Verbindung erst nach dieser Prüfung frei. Die Verarbeitung bleibt dabei nicht zwangsläufig in Deutschland.</p>':'<strong>Verarbeitung in Deutschland planen.</strong><p>Zum Beispiel mit mittwald AI Hosting: Dort laufen offene KI-Modelle auf deutscher Infrastruktur. Anwendung, Wissensspeicher, Backups und Zugriffe werden passend dazu festgelegt.</p>';
  }));
  new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-idle',!entry.isIntersecting))).observe(q('#privacy-diagram'));
  renderCatalog();renderSelection();
})();

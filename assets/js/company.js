(() => {
 'use strict';
 const disciplines=[
 ['Deine Richtung','VERSTEHEN. FOKUSSIEREN. PLANEN.','Ein Plan, der zu deinem Betrieb passt.','Wir übersetzen deine Ziele in eine klare Positionierung und die nächsten sinnvollen Schritte. Mit Verständnis für deinen Betrieb, deine Region und deine Zielgruppe.','Eine gemeinsame Richtung für Marke, Mitarbeiter und Kunden.'],
 ['Deine Stimme','POSITIONIEREN. ERZÄHLEN. BEGEISTERN.','Eine Marke, die man wiedererkennt.','Wir finden die Geschichten, die deinen Betrieb ausmachen, und geben ihnen eine eigene Sprache. Aus einzelnen Beiträgen wird ein Auftritt mit einer klaren Haltung.','Ein roter Faden für deine Inhalte, deinen Auftritt und deine Botschaft.'],
 ['Deine Bilder','HINSEHEN. FESTHALTEN. INSZENIEREN.','Die Qualität hinter deiner Arbeit.','Unser Content-Team bringt echte Menschen, Projekte und Pflanzen vor die Kamera. Wir planen, produzieren und schneiden Inhalte, die deinen Betrieb greifbar machen.','Eigene Fotos und Filme, aus denen deine Marke sprechen kann.'],
 ['Deine Menschen','ERREICHEN. VERBINDEN. GEWINNEN.','Sichtbarkeit mit einer Aufgabe.','Wir verbinden deine Arbeitgebermarke und deine Leistungen mit den passenden Kampagnen. Ansprache, Bewerbung und Anfrage werden als zusammenhängender Weg gestaltet.','Ein klarer Weg von der ersten Aufmerksamkeit zum persönlichen Kontakt.'],
 ['Deine Abläufe','VERNETZEN. AUTOMATISIEREN. ENTWICKELN.','Mehr Verbindung in deinem Betrieb.','Wir gestalten digitale Lösungen rund um deinen Alltag. Websites, Daten, Automatisierung und KI greifen dort ineinander, wo sie deinem Team Arbeit abnehmen können.','Individuelle Abläufe, die zu deinen Aufgaben und bestehenden Systemen passen.'],
 ['Dein Überblick','ABSTIMMEN. KOORDINIEREN. WEITERDENKEN.','Viele Disziplinen. Ein gemeinsamer Plan.','Dein Projektmanagement verbindet die Fachbereiche und hält die nächsten Schritte zusammen. So bleiben Inhalte, Kampagnen und Ziele in derselben Richtung unterwegs.','Klare Ansprechpartner, abgestimmte Aufgaben und ein Blick auf das Ganze.']
 ];
 const ids=['expertise-orbit-label','expertise-kicker','expertise-title','expertise-copy','expertise-output'];
 const bindTabs=(selector,select)=>{
  const tabs=[...document.querySelectorAll(selector)];
  const activate=(tab,focus=false)=>{tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});select(tab);if(focus)tab.focus({preventScroll:true});};
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+tabs.length)%tabs.length;activate(tabs[index],true);});});
 };
 bindTabs('[data-expertise]',tab=>{
  const index=Number(tab.dataset.expertise);ids.forEach((id,i)=>{document.getElementById(id).textContent=disciplines[index][i];});
  document.getElementById('expertise-count').textContent='0'+(index+1)+' / 06';
  document.getElementById('expertise-panel').setAttribute('aria-labelledby',tab.id);
  document.querySelectorAll('.v7-connection-art>i').forEach((node,i)=>node.classList.toggle('is-active',i===index));
 });
 document.querySelector('.v7-connection-art>i')?.classList.add('is-active');
 const industries={galabau:['Zwischen Baustelle und Büro.','Deine Projekte zeigen, was dein Team kann. Wir machen daraus Geschichten, die Auftraggeber begeistern und zukünftigen Mitarbeitern einen echten Einblick geben.','gruenteam'],baumschule:['Zwischen Kultur und Kunden.','Jahre der Pflege stecken in deinen Pflanzen. Wir machen dieses Wissen sichtbar – von der Kultur über die Qualität bis zu den Menschen, die dahinterstehen.','woerlein'],gartencenter:['Zwischen Pflanzen und Menschen.','Dein Gartencenter lebt von Inspiration, Beratung und der richtigen Idee zur richtigen Saison. Wir bringen genau dieses Erlebnis in die digitale Welt.','streb']};
 bindTabs('[data-about-industry]',tab=>{
  const id=tab.dataset.aboutIndustry,data=industries[id],panel=document.getElementById('about-industry-panel');
  panel.setAttribute('aria-labelledby',tab.id);panel.querySelector('h3').textContent=data[0];panel.querySelector('p').textContent=data[1];panel.querySelector('a').href='ergebnisse.html#case-'+data[2];
  document.querySelectorAll('[data-about-film]').forEach(film=>{film.hidden=film.dataset.aboutFilm!==id;if(film.hidden)film.querySelector('video').pause();});
  document.dispatchEvent(new Event('greenfield:mediachange'));
 });
})();

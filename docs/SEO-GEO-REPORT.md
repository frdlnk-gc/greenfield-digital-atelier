# SEO- und GEO-Prüfung – 23. September 2026

## Ergebnis und drei Korrekturrunden

1. **Technik und Veröffentlichung:** Alle 40 bisherigen Sitemap-Seiten live abgerufen und auf HTTP-Status, Canonical, Indexierbarkeit, Titel, Beschreibung, H1, Schema, interne Links, Sprungmarken und Bilder geprüft. Die Ausgangsbasis war weitgehend sauber. Der lokale Wochenartikel-Ablauf hatte keinen vollständigen öffentlichen Abschluss. Produktionsrepo als verbindliche Quelle dokumentiert, Artikelregister und deterministische Synchronisierung von Übersicht, RSS, Sitemap und Startseitenlinks eingeführt. Legacy-Artikel auf `og:type=article` korrigiert; ungültige Link-Farbvariable korrigiert. Veralteten Hinweis auf die seit Juli 2025 eingestellte EU-OS-Plattform entfernt; die bestehende Erklärung zur Verbraucherschlichtung beibehalten.
2. **Inhalte und Erschließung:** Wochenausgabe „KI im GaLaBau: von der Kundenanfrage zum Projektbriefing“ erstellt. Konkretes fiktives Beispiel, verwendbare Vorlage, Kontrollschritte, Quellenbezug und deutliche Einordnung. Von Digitalisierung, GaLaBau-Hub und Startseite verlinkt. Themenfilter, BlogPosting, Bildmetadaten, Übersicht, Feed und Sitemap synchronisiert. Keine neuen Leistungs- oder Ergebnisbehauptungen über abgebildete Kunden.
3. **Regression und Qualität:** 41 Sitemap-Seiten erneut geprüft. Wochenkontrolle verschärft: Der Dienstagslauf meldet bereits die fehlende Ausgabe der laufenden Woche. Negative Kontrollfälle für doppelte und ausbleibende Wochenartikel überprüft. Bildhöhe des neuen Artikels an die Originaldatei angepasst und doppelte Nummerierung im Inhaltsverzeichnis entfernt. Veraltete Teamgröße auf vier Seiten an die aktuelle Angabe des Inhabers angepasst. Desktop und 390px-Mobilansicht, Bildladung, Themenfilter und horizontale Überläufe geprüft. Geschlossene Stellen bleiben geschlossen und noindex.

## Dauerhafte Kontrollen

- `python3 scripts/sync_blog.py --check`: Übersicht, Register, Feed, Artikelsitemap und Startseitenhinweise stimmen mit veröffentlichtem HTML überein.
- `python3 scripts/seo_check.py --freshness`: Metadaten, Schema, Linkziele, Sprungmarken, Bildattribute, Sitemap, Artikelregister und Stellenstatus.
- `python3 scripts/seo_check.py --live --freshness --weekly-due`: zusätzliche Live- und Kalenderwochenkontrolle.
- GitHub Actions prüft Pull Requests und main. Dienstags 11:00 UTC und auf manuellen Start zusätzlich Live-Prüfung.
- Der vorhandene montägliche Redaktionsauftrag bleibt die schreibende Automation. Der GitHub-Check ist eine unabhängige Fehlerkontrolle und erzeugt keinen doppelten Artikel.

## Google und KI-Suche: Reichweite korrekt einordnen

Robots.txt erlaubt Crawling. Live-Testabrufe mit Googlebot-, Bing-, OAI-SearchBot-, ChatGPT-User-, Claude-SearchBot- und Claude-User-Kennungen lieferten den vollständigen HTML-Inhalt. Das prüft Zugänglichkeit aus der Testumgebung, nicht tatsächliche Abrufe von Anbieter-IP-Adressen, Aufnahme in einen Suchindex oder Empfehlungen durch ein Modell.

Search Console wurde direkt geprüft; ein Indexierungsantrag für die Recruiting-Seite wurde angenommen. Die Sitemap wird bereits von Google gelesen. Indexierungsentscheidungen und zeitverzögerte Berichte sind kein direkt per Websitecode reparierbarer Zustand. Ein erfolgreicher Live-Test ist nicht gleichbedeutend mit Indexierung.

Die vorhandenen Leistungs- und Branchenseiten erklären Unternehmen, Zielgruppen, Angebote und Kundenbelege in sichtbarem HTML. Für Googles KI-Suche gelten die normalen Suchgrundlagen; spezielle KI-Schemata und llms.txt sind keine Voraussetzung. Es wurde deshalb keine zusätzliche Datei als vermeintlicher Rankinghebel eingebaut.

## Grenzen und nächste Entscheidungen

- Google-Indexabdeckung und qualifizierte Suchanfragen nach weiteren Crawls erneut beurteilen. Geschlossene Jobs, Vorschauen und Weiterleitungsseiten sollen weiterhin nicht als eigene Inhalte indexiert werden.
- Tatsächliche Nennungen/Zitate in ChatGPT und Claude sowie daraus kommende qualifizierte Anfragen wurden nicht als nachgewiesen ausgewiesen. Zugänglichkeit allein belegt keine starke Marktposition.
- Search Console lieferte keine Core-Web-Vitals-Felddaten. PageSpeed-API lieferte HTTP 429; deshalb keine erfundenen Performance-Scores und keine pauschale Aussage „Core Web Vitals bestanden“.
- Alte sprechende URLs verwenden auf GitHub Pages sofortige HTML-Weiterleitungen mit Canonical. Echte HTTP-301-Regeln wären bei einer späteren Hosting-/Edge-Entscheidung vorzuziehen. Keine Infrastruktur oder Domain im Rahmen dieser Prüfung gewechselt.
- Weitere originäre Kundenfälle mit freigegebenen konkreten Problem-, Vorgehens- und Ergebnisangaben sind wertvoller als große Mengen ähnlicher KI-Texte. Keine fehlenden Belege erfunden.

## Geprüfte Primärquellen

- [Google: AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [OpenAI: Overview of crawlers](https://developers.openai.com/api/docs/bots)
- [Anthropic: Crawler und robots.txt](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Fraunhofer IESE: Halluzinationen von generativer KI und LLMs](https://www.iese.fraunhofer.de/blog/halluzinationen-generative-ki-llm/)
- [Europäische Kommission: Einstellung der OS-Plattform](https://consumer-redress.ec.europa.eu/site-relocation_en)

Interne Search-Console-Kennzahlen werden nicht in diesem öffentlichen Repository veröffentlicht.

# Wöchentliche Veröffentlichung – Greenfield Digital

## Verbindlicher Ausgangspunkt

Die öffentliche Website wird direkt aus dem Repository `frdlnk-gc/greenfield-digital-atelier`, Branch `main`, auf GitHub Pages veröffentlicht. Die HTML-Dateien im Repository-Root sind der aktuelle Produktionsstand. **Keinen älteren Desktop-Ordner oder privaten Vorschau-Export über diesen Stand kopieren.** Vor jeder Ausgabe `origin/main` aktualisieren, den tatsächlichen Diff prüfen und auf einem eigenen Branch arbeiten. Bei fehlendem oder nicht lesbarem Checkout einen frischen Clone in einem lokalen, nicht durch iCloud ausgelagerten Verzeichnis anlegen. Fremde Änderungen weder überschreiben noch zurücksetzen.

Dieser Auftrag ist ausschließlich die wöchentliche Redaktion. Ältere Landingpage-, Creative-, Dashboard- und Designaufträge aus dem Gespräch gehören nicht zum Veröffentlichungslauf. Bei Kontextwechsel zuerst dieses Dokument und den Git-Status lesen; anschließend genau an der letzten noch offenen Veröffentlichungsstufe fortfahren.

## Redaktion

1. `data/publications.json` und die vorhandenen Artikel lesen. Höchstens **ein neuer Artikel mit `publicationKind: weekly` pro ISO-Kalenderwoche (Europe/Berlin)**. Bestehende Themen nicht als leicht umformulierte neue Beiträge duplizieren. Das einmalige Startpaket vom 12.09.2026 bleibt `launch-batch`, weitere historische Artikel sind `legacy`.
2. Themen an konkreten Fragen von Geschäftsführern aus GaLaBau, Baumschulen, Gartencentern, Pflanzenhandel und Kulturbetrieben ausrichten. Recruiting und Arbeitgebermarke priorisieren; Social Media, Neukundengewinnung, Websites, Branding, Strategie und KI sinnvoll ergänzen. Fachlich hilfreiche Inhalte sind wichtiger als Keywordhäufigkeit oder eine feste Wortzahl.
3. Aktuelle Primärquellen öffnen und die relevanten Aussagen prüfen. Originalität über nachvollziehbare Arbeitsbeispiele, Vorlagen oder Entscheidungshilfen herstellen. Keine erfundenen Kundenfälle, Zahlen, Zitate, Autoren, Testergebnisse, Leistungsversprechen oder Quellen. Beispiele ausdrücklich als Beispiele kennzeichnen. Quellen direkt an den belegten Aussagen verlinken.
4. Vorhandene redaktionelle Gestaltung verwenden: klare Einleitung, direkte Antwort, konkret nutzbare Anleitung, Checkliste, sinnvolle FAQs, Quellenstand, Greenfield Redaktion und bestehende KI-Transparenz. Reale passende Kundenaufnahme mit korrektem Alttext und Bildmaßen verwenden. Abgebildete Betriebe nicht als Nutzer einer unbewiesenen Leistung darstellen.
5. Neue root-HTML-Seite aus einem aktuellen Artikel übernehmen, aber **alle** alten Inhalte, Titel, Canonical, Social-Metadaten, Bildbeschreibungen, Inhaltsverzeichnis, Quellen und JSON-LD aktualisieren. `datePublished` ist der tatsächliche Veröffentlichungstag; `dateModified` nur bei inhaltlichen Änderungen anpassen. Nie rückdatieren oder sämtliche alten Daten künstlich aktualisieren. Keine neuen Tracking- oder Formularintegrationen.
6. Neuen Pfad in `data/publications.json` als `weekly` eintragen. Mindestens eine passende Leistungs-/Branchenseite verlinkt den Artikel im sichtbaren Hauptinhalt. Vom Artikel auf relevante Leistung, Branche und weiterführende Inhalte verlinken. Keine neue Alias-URL für jeden Artikel nötig: der Canonical ist die `.html`-Adresse.

## Reproduzierbare Prüfung

```bash
python3 scripts/sync_blog.py
python3 scripts/sync_blog.py --check
python3 scripts/seo_check.py --freshness
python3 scripts/check_indexing.py
git diff --check
```

`sync_blog.py` aktualisiert aus den tatsächlichen Artikeln die Übersicht, den Themenfilter, die Startseitenhinweise, den RSS-Feed, die Artikelliste und die Artikeltermine in der Sitemap. Es veröffentlicht nichts. `seo_check.py` prüft Metadaten, Schema, interne Links und Sprungmarken, Bilder, Sitemap und geschlossene Stellen. Die Aktualitätsprüfung schlägt nach mehr als neun Tagen ohne Wochenartikel fehl. Vor Veröffentlichung zusätzlich Desktop/Mobilansicht, Lesbarkeit, Bilder und Quellen prüfen. Keine echten Testanfragen absenden. `foundation.css`, Markenbild und vorhandene Kontaktwege erhalten.

## Veröffentlichung und Abschlussnachweis

1. Nur relevante Dateien committen, Branch pushen, Pull Request mit konkreter Änderung und Prüfnachweisen erstellen. Im Codex-Auftrag verlinken/anhängen.
2. Erfolgreiche Qualitätsprüfung abwarten, PR mergen. GitHub-Pages-Deployment für den **Merge-Commit** abwarten.
3. Danach `python3 scripts/seo_check.py --live --freshness` und `python3 scripts/check_indexing.py --live` ausführen. Artikel, Canonical, Blogübersicht, Feed und Sitemap müssen öffentlich den neuen Stand liefern. Lokaler Test, Push oder Merge allein sind kein Veröffentlichungsnachweis.
4. Der Lauf ist erst erledigt, wenn die öffentliche URL geprüft ist. Bei Fehlern gezielt reparieren; einen unveröffentlichten Entwurf als solchen benennen. Keine andere Aufgabe als Ersatzabschluss verwenden.
5. Die private Sites-Vorschau kann danach separat synchronisiert werden, wenn deren aktueller Zugang verfügbar ist. Keine veralteten Vollseitenexporte auf die Produktion übertragen. Vorschau bleibt privat und `noindex`; ihr Fehlschlag darf den öffentlichen Artikel nicht blockieren. Ergebnisse getrennt nennen.
6. Nur eine bestätigte neue Veröffentlichung mit Link oder einen konkreten nicht selbst behebbaren Fehler melden. Ohne Änderung still bleiben. Keine Slack-Nachrichten.

## Unabhängige Kontrolle

`Website SEO and publishing health` läuft für Pull Requests und `main`, zusätzlich dienstags um 11:00 UTC sowie manuell. Der geplante Lauf prüft auch die Live-Website und verlangt ab Dienstag eine Veröffentlichung aus der laufenden ISO-Kalenderwoche (`--weekly-due`). Dadurch fällt bereits eine ausgelassene Montagsausgabe auf. Er schreibt keine Artikel und ersetzt nicht den montäglichen Redaktionslauf.

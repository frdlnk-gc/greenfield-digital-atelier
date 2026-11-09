# Indexierung und Navigation

Stand: 24.09.2026. Diese Regeln gelten für die öffentliche GitHub-Pages-Website.

## Welche Seiten in die Suche gehören

- Die Sitemap enthält die aktuellen öffentlichen Inhalte: Startseite, Leistungen, Branchen, Ergebnisse, Blog, Unternehmensseiten und offene Stellen.
- Recruiting, Social Media, Neukundengewinnung und KI/Automatisierung stehen in dieser Reihenfolge am Anfang von Leistungsmenü, Footer und Startseiten-Karussell. Der Blog bleibt über die Hauptnavigation und aktuelle Beiträge erreichbar.
- Karriere bleibt wegen offener Sales- und Content-Positionen indexierbar. Auch die rechtlichen Seiten bleiben erreichbar und indexierbar. Keine geschäftlich sinnvolle Seite allein zur Manipulation der Sitelinks aus Google entfernen.
- `/` ist die bevorzugte Startseiten-URL. `/index.html` bleibt erreichbar und verweist per Canonical auf `/`. Interne Startseitenlinks verwenden ebenfalls `/`.

## Bewusste Ausschlüsse

- `videograf-cutter.html` und `projekt-marketing-manager.html`: geschlossene Stellen, `noindex, follow`, keine Bewerbungsformulare und kein `JobPosting`.
- `404.html`: Fehlerseite, `noindex`.
- Historische Verzeichnisse mit `index.html`: unmittelbare HTML-Weiterleitungen (`refresh 0`) mit Canonical und sichtbarem Ziellink, **ohne `noindex`** (seit 09.11.2026), damit Google sie als Weiterleitung wertet und das Signal der alten URL auf das Ziel übergeht. Die eigentliche Zielseite wird in der Sitemap geführt; die Weiterleitungsdatei nicht. Ausgenommen sind Ziele geschlossener Stellen und der vorhandene PDF-Download.
- Alte Blog-URLs zeigen auf den neuen Blogartikel zum selben Thema, sonst auf die passende Leistungsseite (Zuordnung siehe unten).
- Canonicals enthalten keine Sprungmarken. Ein Weiterleitungsziel darf mit `#kontakt` gezielt zum Formular führen; der Canonical verweist auf die vollständige Zielseite.
- Zuordnung alter Blog-/Stellen-URLs (09.11.2026):
  - `active-sourcing-im-galabau`, `in-sechs-schritten-zum-starken-team`, `mobile-recruiting-im-galabau`, `recruiting-zukunft` → `blog-mitarbeiter-finden-galabau.html` (Recruiting-Leitfaden)
  - `effektive-mitarbeitergesprache-eine-anleitung`, `mitarbeiterbindung-im-galabau`, `wie-werde-ich-zum-top-arbeitgeber-im-galabau`, `work-life-balance-im-garten-und-landschaftsbau` → `blog-mitarbeiterbindung-galabau.html` (Bindungsgespräche)
  - `mitarbeiter-werben-mitarbeiter-im-galabau`, `mitarbeiterempfehlungsprogramme-im-galabau` → `blog-mitarbeiterempfehlungen-galabau.html`
  - `der-weg-zur-starken-arbeitgebermarke`, `erfolgreiches-employer-branding-im-galabau` → `blog-branding-galabau.html`
  - `employer-branding-fur-den-galabau-durch-instagram`, `social-media-fur-employer-branding` → `blog-social-media-galabau.html`
  - `arbeitgebermarke-im-pflanzenhandel` → `blog-recruiting-pflanzenhandel-kulturbetriebe.html`
  - `gehalt-galabau-vorarbeiter-bauleiter` → `blog-vorarbeiter-bauleiter-galabau-gewinnen.html`
  - `mentoring-programme-im-galabau` → `blog-onboarding-galabau.html`
  - `traditionelle-personalvermittlung-versagt` → `recruiting-kosten-galabau.html` (Angebotsvergleich)
  - `videograf`, `projekt-und-marketingmanager` → `karriere.html` (Stellen geschlossen)
  - ohne passenden Artikel, weiter Leistungsseite: `einsatz-von-kunstlicher-intelligenz-im-recruiting`, `digitalisierung-im-galabau-recruiting` → `digitalisierung.html`; `grundaumen-bewerbersystem-*`, `mitarbeiter-in-45-tagen-einstellen-mit-garantie` → `recruiting.html`; `social-media-management` → `social-media.html`; `unternehmensnachfolge` → `strategie.html`
- Private Vorschauen und Kampagnenentwürfe dürfen nicht ungeprüft in die öffentliche Sitemap übernommen werden.
- `green-hub-personal-k7q4m2.html` (Green Hub Personal, Stand 22.10.2026): private Vorschau nur per Direktlink, `noindex, nofollow`, kein Canonical, nicht in Sitemap, Navigation oder Footer; Pfad und `assets/ghp/` in `robots.txt` gesperrt. Seiten-Assets nur unter `assets/ghp/`.

## Automatische Kontrolle

```bash
python3 scripts/sync_blog.py --check
python3 scripts/seo_check.py --freshness
python3 scripts/check_indexing.py
# Nach erfolgreichem Pages-Deployment:
python3 scripts/seo_check.py --live --freshness
python3 scripts/check_indexing.py --live
```

`check_indexing.py` prüft alle versionierten HTML-Dateien, auch außerhalb der Sitemap. Unerwartete Sperren öffentlicher Seiten (Robots-Meta, Googlebot/Bingbot-Meta oder HTTP-Header), falsche Canonicals, nicht eingeordnete neue Seiten und kaputte Weiterleitungszuordnungen lassen den Check fehlschlagen. Die geplante Qualitätskontrolle führt ihn auch live aus.

## Grenzen

Technische Indexierbarkeit ist keine Bestätigung der Aufnahme in Googles Index. „Gefunden – zurzeit nicht indexiert“ ist von einem `noindex`-Ausschluss zu unterscheiden. Den tatsächlichen Stand für einzelne URLs in der Search Console prüfen.

Google wählt Sitelinks automatisch. Klare Navigation, passende Seitentitel und relevante interne Links unterstützen die Auswahl, stellen aber keine bestimmte Reihenfolge ein. Es gibt hier keine Sitelinks-Konfiguration oder Schema-Eigenschaft, die eine Reihenfolge erzwingt.

Quellen: [Google zu Sitelinks](https://developers.google.com/search/docs/appearance/sitelinks?hl=de), [Indexierungsbericht](https://support.google.com/webmasters/answer/7440203?hl=de).

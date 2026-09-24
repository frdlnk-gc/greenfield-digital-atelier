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
- Historische Verzeichnisse mit `index.html`: unmittelbare HTML-Weiterleitungen mit sichtbarem Ziellink. Die eigentliche Zielseite wird in der Sitemap geführt; die Weiterleitungsdatei nicht. Ausgenommen sind Ziele geschlossener Stellen und der vorhandene PDF-Download.
- Canonicals enthalten keine Sprungmarken. Ein Weiterleitungsziel darf mit `#kontakt` gezielt zum Formular führen; der Canonical verweist auf die vollständige Zielseite.
- Der alte Work-Life-Balance-Pfad enthält keinen eigenständigen Artikel mehr, sondern führt zur Recruiting-Seite. Sein `noindex` gilt nur der alten Weiterleitungsdatei. Eine Wiederveröffentlichung eines echten Fachartikels wäre eine separate redaktionelle Entscheidung.
- Private Vorschauen und Kampagnenentwürfe dürfen nicht ungeprüft in die öffentliche Sitemap übernommen werden.

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

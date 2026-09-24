# Search discovery and practical resources

## Published content model

The three `fallstudie-*.html` pages give existing customer work stable, independently addressable URLs. Their metrics, named people and films are taken from the previously published `ergebnisse.html` content; no new testimonials, prices, conversion claims or project timelines have been added. Publication date is the case-page date, not the campaign date. Video views, audience growth, applications and hires remain distinct measurements.

`recruiting-kosten-galabau.html` addresses commercial evaluation with user-supplied numbers, transparent formulas and a local-only CSV export. It is an evergreen resource, not a weekly blog publication. The cost model is in `assets/js/recruiting-costs.js`; tests cover missing values, zero denominators, numeric boundaries and inconsistent funnel counts.

Four un-gated working files live in `assets/downloads/`:

- Eight-post social media plan (UTF-8 BOM, semicolon CSV, editable in spreadsheet apps).
- Recruiting filming plan and interview checklist.
- Anonymized project-briefing prompt and human review checklist.
- Recruiting proposal comparison checklist.

They enrich the existing articles rather than create duplicate pages targeting the same intent. `blog.html#werkzeuge` is their discovery surface. The generated blog-card/feed markers remain controlled by `scripts/sync_blog.py`; the resource cards are intentionally outside them.

## Search-engine notification

`.github/workflows/indexnow.yml` runs after a successful production Pages deployment (`pages-build-deployment`) on `main`. It checks out that deployment's SHA and submits the sitemap URLs changed since its first parent. The root `index.html` maps to `/`; legacy aliases and assets are excluded. New and removed sitemap URLs are considered.

Before submission, `scripts/notify_indexnow.py` verifies the published key and compares the actual production HTML byte-for-byte with the expected files. A stale deployment aborts instead of notifying about unavailable changes. Transient network failures have bounded retries; other errors remain visible.

The root verification file is intentionally public under the IndexNow protocol. `data/indexnow.json` references its key. It is not a credential for a Google, Bing or company account. No account password or API secret is stored here.

Commands:

```sh
python3 scripts/notify_indexnow.py --since HEAD^1
python3 scripts/notify_indexnow.py --since HEAD^1 --submit
# Only for initial adoption, or an explicitly justified full resubmission:
python3 scripts/notify_indexnow.py --all --submit
```

HTTP 200 means the URLs were received. HTTP 202 means receipt with key validation pending. Neither means indexed, ranked or cited. IndexNow reaches participating engines such as Bing; it is not a Google indexing API and does not guarantee ChatGPT or Claude inclusion. Google continues to use the XML sitemap, internal links and normal crawling/URL inspection.

Official protocol: https://www.indexnow.org/documentation

## Editorial direction

Keep the weekly cadence, while prioritizing original customer evidence, practical tools and useful updates. Do not publish near-identical keyword variants merely to increase volume. Do not invent author reviews, campaign budgets, outcomes or date ranges. Add a case page only when the source evidence supports it.

A case page should contain the customer, service, concrete work, original media, results with their scope, a useful interpretation and a relevant next step. Prefer descriptive headings and plain text available without JavaScript. Consent-gated Vimeo interviews must retain the external fallback link; self-hosted clips use `preload="none"`.

## Provider-specific reality

- Google says its SEO fundamentals apply to AI search. Special AI text files or special schema do not create eligibility or ranking advantage. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OpenAI distinguishes OAI-SearchBot (search), GPTBot (training) and ChatGPT-User (user-triggered access). https://developers.openai.com/api/docs/bots
- Anthropic distinguishes Claude-SearchBot, ClaudeBot and Claude-User. https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Current `robots.txt` allows crawling generally. Allowing bots is technical access, not evidence that a site is recommended.
- The company LinkedIn identifier was verified against the public company page, company website and Hansaring address before adding it to Organization `sameAs`. The spelling `greenfield-digtal` is the actual profile slug; `greenfield-digital` refers to another company.

## Validation

```sh
node --test scripts/recruiting-costs.test.cjs
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/sync_blog.py --check
python3 scripts/seo_check.py --freshness
python3 scripts/check_indexing.py
```

After Pages publishes the exact merge SHA, also run the live checks and confirm IndexNow's workflow result. Compare search outcomes over time: non-brand impressions/clicks for service queries, indexed canonical URLs, generative-search visibility and qualified inquiries. Do not interpret rank changes from a single personalized search, or attributed conversions as qualified leads.

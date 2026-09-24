#!/usr/bin/env python3
"""Audit every published HTML file, including intentional search exclusions.

The sitemap is the allowlist of public content. Other HTML must be a closed
role, the error page, or an immediate legacy redirect to a known destination.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import re
import subprocess
import sys
from urllib.request import Request, urlopen
from urllib.parse import urldefrag
import xml.etree.ElementTree as ET

from seo_check import BASE, ROOT, NS, Page

CLOSED = {'videograf-cutter.html', 'projekt-marketing-manager.html'}
DOWNLOAD = 'https://static.onepage.io/media/Mitarbeiter-Benefits-Broschure-06680bf6-eba6-4f06-8c4e-234db169a480.pdf'


def local_text(path):
    file = ROOT / path
    if file.exists():
        return file.read_text()
    # Support a sparse checkout without fetching unrelated image/video assets.
    return subprocess.check_output(['git', 'show', 'HEAD:' + path], cwd=ROOT, text=True)


def validate(path, page, sitemap, header=''):
    errors = []
    url = BASE if path == 'index.html' else BASE + path
    directives = [header] + [a.get('content', '') for tag, a in page.tags
                            if tag == 'meta' and a.get('name', '').lower()
                            in ('robots', 'googlebot', 'bingbot')]
    excluded = any(re.search(r'\b(noindex|none)\b', value, re.I) for value in directives)
    canonical = page.values('link', 'rel', 'canonical', 'href')
    refresh = [a.get('content', '') for tag, a in page.tags
               if tag == 'meta' and a.get('http-equiv', '').lower() == 'refresh']
    if url in sitemap:
        if excluded:
            errors.append('public page blocked by robots meta or HTTP header')
        if canonical != [url] or refresh:
            errors.append('public page canonical/redirect mismatch')
        category = 'indexable'
    elif path in CLOSED or path == '404.html':
        if not excluded:
            errors.append('closed role/error page must remain noindex')
        if refresh:
            errors.append('closed role/error page must remain directly readable')
        if path in CLOSED and canonical != [url]:
            errors.append('closed role canonical mismatch')
        category = 'closed role' if path in CLOSED else 'error page'
    else:
        category = 'legacy redirect'
        targets = {DOWNLOAD} if path == 'download/index.html' else sitemap | {BASE + name for name in CLOSED}
        redirect = refresh[0].removeprefix('0;url=') if len(refresh) == 1 and refresh[0].startswith('0;url=') else ''
        if not excluded or len(canonical) != 1 or canonical[0] not in targets:
            errors.append('unclassified HTML or invalid legacy destination')
        elif urldefrag(redirect)[0] != canonical[0]:
            errors.append('legacy URL must redirect immediately to its canonical')
        elif not any(tag == 'a' and a.get('href') == redirect for tag, a in page.tags):
            errors.append('legacy redirect lacks a crawlable fallback link')
    return category, [f'{path}: {message}' for message in errors]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    paths = sorted(set(subprocess.check_output(
        ['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=ROOT,
        text=True).splitlines()))
    paths = [path for path in paths if path.endswith('.html')]

    def read(path):
        if not args.live:
            return local_text(path), ''
        # Use the public directory URL for a legacy index file.
        url = BASE + path.removesuffix('index.html') if path.endswith('/index.html') else BASE + path
        with urlopen(Request(url, headers={'User-Agent': 'Greenfield-SEO-Check/1.0'}), timeout=30) as response:
            if response.status != 200:
                raise ValueError(f'HTTP {response.status}')
            return response.read().decode(), ', '.join(response.headers.get_all('X-Robots-Tag', []))

    sitemap = {node.text for node in ET.fromstring(read('sitemap.xml')[0]).findall('s:url/s:loc', NS)}

    def check(path):
        try:
            text, header = read(path)
            return validate(path, Page(text), sitemap, header)
        except Exception as error:
            return 'error', [f'{path}: {error}']

    counts = {}
    errors = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for category, findings in pool.map(check, paths):
            counts[category] = counts.get(category, 0) + 1
            errors.extend(findings)
    if errors:
        print('\n'.join(errors))
        return 1
    print(f'PASS: {len(paths)} HTML files; ' + ', '.join(f'{count} {kind}' for kind, count in sorted(counts.items()))
          + ('; live HTTP headers and redirect destinations' if args.live else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main())

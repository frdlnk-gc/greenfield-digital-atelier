#!/usr/bin/env python3
"""Submit sitemap URL changes only after their actual production content is available.

No third-party dependency; dry-run by default. The root key file is public
verification material, not an account credential. HTTP acceptance is not indexing.
"""
import argparse
import hashlib
import json
import re
import subprocess
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.greenfield-digital.de/'
ENDPOINT = 'https://api.indexnow.org/indexnow'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()

def sitemap_urls(text):
    return {n.text for n in ET.fromstring(text).findall('s:url/s:loc', NS)}

def changed_urls(current, previous, files):
    urls = set(current ^ previous)
    for path in files:
        url = BASE if path == 'index.html' else BASE + path
        if url in current or url in previous:
            urls.add(url)
    return sorted(urls)

def request(url, data=None):
    headers = {'User-Agent': 'Greenfield-Discovery/1.0'}
    if data is not None: headers['Content-Type'] = 'application/json; charset=utf-8'
    for attempt in range(3):
        try:
            with urlopen(Request(url, data=data, headers=headers), timeout=30) as response:
                return response.status, response.read()
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2: raise
        except (URLError, TimeoutError, ConnectionError):
            if attempt == 2: raise
        time.sleep(2 ** attempt)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    scope = parser.add_mutually_exclusive_group(required=True)
    scope.add_argument('--since', help='Previous deployment SHA (git diff), normally HEAD^1')
    scope.add_argument('--all', action='store_true', help='One-time initial submission of the sitemap')
    parser.add_argument('--submit', action='store_true', help='Perform HTTP requests; otherwise just print the plan')
    args = parser.parse_args()
    config = json.loads((ROOT / 'data/indexnow.json').read_text())
    key = config['key']
    if not re.fullmatch('[a-f0-9]{32}', key): raise ValueError('Invalid verification key')
    key_path = ROOT / (key + '.txt')
    if key_path.read_text().strip() != key: raise ValueError('Key file mismatch')
    current = sitemap_urls((ROOT / 'sitemap.xml').read_text())
    if args.all:
        urls = sorted(current)
    else:
        previous = sitemap_urls(git('show', args.since + ':sitemap.xml'))
        files = git('diff', '--name-only', args.since, 'HEAD').splitlines()
        urls = changed_urls(current, previous, files)
    if any(urlsplit(url).scheme != 'https' or urlsplit(url).netloc != 'www.greenfield-digital.de' or urlsplit(url).query or urlsplit(url).fragment for url in urls):
        raise ValueError('Only canonical HTTPS URLs on the production host are allowed')
    print(json.dumps({'mode': 'submit' if args.submit else 'dry-run', 'urls': urls}, ensure_ascii=False, indent=2))
    if not args.submit or not urls: return 0
    status, deployed_key = request(BASE + key_path.name)
    if deployed_key.decode().strip() != key: raise ValueError('Verification key is not deployed')
    # Cache-independent exact-body comparison prevents notifying before Pages catches up.
    # Accept removal only when production really returns a removal status.
    for url in urls:
        if url in current:
            name = urlsplit(url).path.lstrip('/') or 'index.html'
            expected = (ROOT / name).read_bytes()
            status, live = request(url)
            if hashlib.sha256(live).digest() != hashlib.sha256(expected).digest():
                raise ValueError(f'Production does not match this commit: {url}')
        else:
            try:
                status, live = request(url)
                if not re.search(rb'content=["\'][^"\']*noindex', live, re.I):
                    raise ValueError(f'Removed sitemap URL remains indexable: {url}')
            except HTTPError as error:
                if error.code not in (404, 410): raise
    payload = {'host': 'www.greenfield-digital.de', 'key': key, 'keyLocation': BASE + key_path.name, 'urlList': urls}
    status, body = request(ENDPOINT, json.dumps(payload).encode())
    if status not in (200, 202): raise ValueError(f'Unexpected IndexNow response: {status}')
    print(f'HTTP {status}: {len(urls)} URLs received by IndexNow' + ('; key validation pending' if status == 202 else '') + '. Indexing is not guaranteed.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

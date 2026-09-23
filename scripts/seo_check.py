#!/usr/bin/env python3
"""Dependency-free checks for the actual GitHub Pages publication, never a private preview."""
import argparse, collections, datetime as dt, json, re, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.greenfield-digital.de/'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags=[]; self.ids=[]; self.schemas=[]; self.ld=False; self.buf=''; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); self.tags.append((tag,a))
        if 'id' in a: self.ids.append(a['id'])
        if tag=='script': self.ld=a.get('type')=='application/ld+json'; self.buf=''
    def handle_data(self, text):
        if self.ld: self.buf+=text
    def handle_endtag(self, tag):
        if tag=='script' and self.ld:
            self.schemas.append(json.loads(self.buf)); self.ld=False
    def values(self, tag, key, value, result):
        return [a.get(result,'') for t,a in self.tags if t==tag and a.get(key)==value]
    def nodes(self):
        return [node for graph in self.schemas for node in graph.get('@graph',[graph])]
def read(path, live=False):
    if not live: return (ROOT/path).read_text()
    with urlopen(Request(BASE+path,headers={'User-Agent':'Greenfield-SEO-Check/1.0'}),timeout=30) as r:
        if r.status!=200: raise ValueError(f'HTTP {r.status}: {path}')
        return r.read().decode()
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--live',action='store_true'); ap.add_argument('--freshness',action='store_true'); args=ap.parse_args()
    errors=[]; pages={}; titles={}; descriptions={}
    tracked=set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines())
    tree=ET.fromstring(read('sitemap.xml',args.live)); urls=[n.text for n in tree.findall('s:url/s:loc',NS)]
    if len(urls)!=len(set(urls)): errors.append('Duplicate sitemap URLs')
    for url in urls:
        path=urlsplit(url).path.lstrip('/') or 'index.html'
        try:
            text=read(path,args.live); p=Page(text); pages[url]=p
            if p.values('link','rel','canonical','href')!=[url]: errors.append(f'{path}: canonical mismatch')
            if len([1 for t,a in p.tags if t=='h1'])!=1: errors.append(f'{path}: needs one H1')
            robots=p.values('meta','name','robots','content')
            if any('noindex' in r.lower() for r in robots): errors.append(f'{path}: noindex in sitemap')
            if not p.schemas: errors.append(f'{path}: missing structured data')
            ds=p.values('meta','name','description','content')
            if len(ds)!=1 or not ds[0].strip(): errors.append(f'{path}: description missing/duplicated')
            title=re.search(r'<title>(.*?)</title>',text,re.S)
            if not title: errors.append(f'{path}: no title')
            else: titles.setdefault(title[1],[]).append(path)
            descriptions.setdefault(tuple(ds),[]).append(path)
            if len(p.ids)!=len(set(p.ids)): errors.append(f'{path}: duplicate element IDs')
            for node in p.nodes():
                if node.get('@type')=='BlogPosting':
                    for key in ('headline','datePublished','dateModified','author','publisher','mainEntityOfPage','image'):
                        if not node.get(key): errors.append(f'{path}: article missing {key}')
                    if p.values('meta','property','og:type','content')!=['article']: errors.append(f'{path}: wrong article social type')
                    if node['dateModified']<node['datePublished']: errors.append(f'{path}: dates reversed')
                    if node['datePublished']>dt.date.today().isoformat(): errors.append(f'{path}: future publication')
            for t,a in p.tags:
                if t=='img' and ('alt' not in a or not a.get('width') or not a.get('height')): errors.append(f'{path}: image missing alt/dimensions: {a.get("src")}')
                keys=['href'] if t=='a' or t=='link' else ['src','poster'] if t in ('img','script','video','source') else []
                for key in keys:
                    link=a.get(key,'')
                    if not link: continue
                    u=urlsplit(urljoin(url,link))
                    if u.scheme=='http': errors.append(f'{path}: insecure reference {link}')
                    if u.netloc not in ('www.greenfield-digital.de','greenfield-digital.de'): continue
                    target=unquote(u.path).lstrip('/') or 'index.html'
                    if target.endswith('/'): target+='index.html'
                    if target not in tracked: errors.append(f'{path}: missing local target {target}')
        except Exception as e: errors.append(f'{path}: {e}')
    for group,name in [(titles,'title'),(descriptions,'description')]:
        errors.extend(f'Duplicate {name}: {v}' for v in group.values() if len(v)>1)
    for url,p in pages.items():
        for t,a in p.tags:
            if t!='a' or not a.get('href'): continue
            u=urlsplit(urljoin(url,a['href'])); target=u._replace(fragment='',query='').geturl()
            if target==BASE+'index.html': target=BASE
            if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids: errors.append(f'{url}: missing anchor {a["href"]}')
    # The two closed jobs must never re-enter discovery, forms, or JobPosting markup.
    for path in ('videograf-cutter.html','projekt-marketing-manager.html'):
        p=Page(read(path,args.live))
        if BASE+path in urls or not any('noindex' in x for x in p.values('meta','name','robots','content')): errors.append(f'{path}: closed role became indexable')
        if any(n.get('@type')=='JobPosting' for n in p.nodes()) or any(t=='form' for t,a in p.tags): errors.append(f'{path}: closed role accepts applications')
    publications=json.loads(read('data/publications.json',args.live))
    weeks=collections.Counter(dt.date.fromisoformat(p['datePublished']).isocalendar()[:2] for p in publications if p['publicationKind']=='weekly')
    errors.extend(f'Multiple weekly articles in {week}' for week,count in weeks.items() if count>1)
    for entry in publications:
        if BASE+entry['path'] not in pages: errors.append(f'Article absent from sitemap: {entry["path"]}')
    if args.freshness:
        latest=max(dt.date.fromisoformat(p['datePublished']) for p in publications if p['publicationKind']=='weekly')
        age=(dt.date.today()-latest).days
        if age>9: errors.append(f'Weekly publishing stale: latest {latest} ({age} days ago)')
    rss=ET.fromstring(read('feed.xml',args.live))
    if len(rss.findall('channel/item'))!=len(publications): errors.append('Feed/article count mismatch')
    if errors:
        print('\n'.join(sorted(set(errors)))); return 1
    print(f'PASS: {len(urls)} sitemap pages; metadata, links, anchors, schema, article registry/feed and closed jobs'+ ('; live HTTP' if args.live else '')+ ('; publication freshness' if args.freshness else ''))
    return 0
if __name__=='__main__': sys.exit(main())

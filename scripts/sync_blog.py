#!/usr/bin/env python3
"""Sync discovery surfaces from published HTML + explicit publication classification."""
import argparse, datetime as dt, email.utils, html, json, re, sys
from pathlib import Path
import xml.etree.ElementTree as ET
from seo_check import Page, ROOT, BASE, NS
E=html.escape
MONTHS=['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
def date_label(value):
    d=dt.date.fromisoformat(value); return f'{d.day}. {MONTHS[d.month]} {d.year}'
def between(text,marker,content):
    pattern=rf'(<!-- {marker}_START -->).*?(<!-- {marker}_END -->)'
    if len(re.findall(pattern,text,re.S))!=1: raise ValueError(f'Expected one {marker} block')
    return re.sub(pattern,lambda m:m[1]+'\n'+content+'\n'+m[2],text,flags=re.S)
def card(p):
    return f'''<article class="blog-card" data-topic="{E(p['topic'])}"><div class="thumb"><a href="{p['path']}" tabindex="-1" aria-hidden="true"><img src="{p['image']}" alt="{E(p['alt'])}" loading="lazy" width="{p['width']}" height="{p['height']}"></a><span class="cat">{E(p['topic'])}</span></div><div class="body"><p class="meta">{date_label(p['datePublished'])} · {p['minutes']} Min.</p><h3><a href="{p['path']}">{E(p['title'])}</a></h3><p>{E(p['description'])}</p><a class="btn-link" href="{p['path']}" aria-label="{E(p['title'])} lesen">Artikel lesen →</a></div></article>'''
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true');args=ap.parse_args(); changes=[]
    def save(path,text):
        p=ROOT/path
        if not p.exists() or p.read_text()!=text:
            changes.append(path)
            if not args.check: p.write_text(text)
    registry=json.loads((ROOT/'data/publications.json').read_text()); kinds={p['path']:p['publicationKind'] for p in registry}; articles=[]
    for path in ROOT.glob('blog-*.html'):
        text=path.read_text(); parsed=Page(text); a=next((n for n in parsed.nodes() if n.get('@type')=='BlogPosting'),None)
        if not a: continue
        if path.name not in kinds: raise ValueError(f'Classify {path.name} in data/publications.json before publishing')
        image=a['image'][0] if isinstance(a['image'],list) else a['image']; image=image.removeprefix(BASE)
        img=next(attrs for tag,attrs in parsed.tags if tag=='img' and attrs.get('src')==image)
        article=dict(path=path.name,title=a['headline'],description=a['description'],datePublished=a['datePublished'],dateModified=a['dateModified'],publicationKind=kinds[path.name],topic=a.get('articleSection','Branche & Praxis'),image=image,alt=img['alt'],width=img['width'],height=img['height'])
        # Keep established reading times; calculate only if no visible value exists.
        duration=re.search(r'(\d+) Min\. Lesezeit',text)
        article['minutes']=int(duration[1]) if duration else max(1,round(a.get('wordCount',600)/180))
        articles.append(article)
    articles.sort(key=lambda p:(-dt.date.fromisoformat(p['datePublished']).toordinal(),p['path']))
    save('data/publications.json',json.dumps([{k:p[k] for k in ['path','title','datePublished','dateModified','publicationKind']} for p in articles],ensure_ascii=False,indent=2)+'\n')
    blog=(ROOT/'blog.html').read_text(); blog=between(blog,'BLOG_CARDS','\n'.join(card(p) for p in articles))
    options='<option value="">Alle Themen</option>'+''.join(f'<option>{E(t)}</option>' for t in sorted({p['topic'] for p in articles}))
    tools=f'<div class="blog-tools" data-blog-tools hidden><label for="blog-topic">Dein Thema <select id="blog-topic">{options}</select></label><p data-blog-count role="status" aria-live="polite">{len(articles)} Beiträge</p></div>'
    blog=between(blog,'BLOG_TOOLS',tools)
    schema={'@context':'https://schema.org','@type':'ItemList','name':'Greenfield Wissen & Impulse','itemListElement':[{'@type':'ListItem','position':i+1,'name':p['title'],'url':BASE+p['path']} for i,p in enumerate(articles)]}
    blog=between(blog,'BLOG_INDEX_SCHEMA','<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False,separators=(',',':'))+'</script>')
    save('blog.html',blog)
    # Only real article changes update article lastmod; never replace all dates with today's date.
    ET.register_namespace('',NS['s']); sitemap=ET.fromstring((ROOT/'sitemap.xml').read_text())
    existing={n.find('s:loc',NS).text:n for n in sitemap}
    for p in articles:
        url=BASE+p['path']; node=existing.get(url)
        if node is None:
            node=ET.SubElement(sitemap,'{'+NS['s']+'}url');ET.SubElement(node,'{'+NS['s']+'}loc').text=url
        lm=node.find('s:lastmod',NS)
        if lm is None: lm=ET.SubElement(node,'{'+NS['s']+'}lastmod')
        lm.text=p['dateModified']
    ET.indent(sitemap,space='  ');save('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(sitemap,encoding='unicode')+'\n')
    ET.register_namespace('atom','http://www.w3.org/2005/Atom');rss=ET.Element('rss',version='2.0'); ch=ET.SubElement(rss,'channel')
    for key,value in [('title','Greenfield Digital – Wissen & Impulse'),('link',BASE+'blog.html'),('description','Praxiswissen für Recruiting, Marketing und Digitalisierung in der grünen Branche.'),('language','de-DE')]: ET.SubElement(ch,key).text=value
    ET.SubElement(ch,'{http://www.w3.org/2005/Atom}link',href=BASE+'feed.xml',rel='self',type='application/rss+xml')
    for p in articles:
        item=ET.SubElement(ch,'item')
        for key,value in [('title',p['title']),('link',BASE+p['path']),('description',p['description']),('category',p['topic']),('pubDate',email.utils.format_datetime(dt.datetime.fromisoformat(p['datePublished']).replace(tzinfo=dt.timezone.utc)))]: ET.SubElement(item,key).text=value
        ET.SubElement(item,'guid',isPermaLink='true').text=BASE+p['path']
    ET.indent(rss,space='  ');save('feed.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(rss,encoding='unicode')+'\n')
    homepage=(ROOT/'index.html').read_text()
    if '<!-- BLOG_LATEST_START -->' in homepage:
        latest='<section class="seo-reading"><div class="container seo-reading-inner"><h2>Neue Impulse für deinen Betrieb.</h2><div class="seo-reading-links">'+''.join(f'<a href="{p["path"]}"><span>{E(p["topic"])}</span><strong>{E(p["title"])} →</strong></a>' for p in articles[:3])+'</div><p style="margin-top:24px"><a class="btn-link" href="blog.html">Alle Praxisleitfäden ansehen →</a></p></div></section>'
        save('index.html',between(homepage,'BLOG_LATEST',latest))
    print(('OUT OF SYNC: ' if args.check and changes else 'Updated: ' if changes else 'PASS: publishing surfaces synchronized; ')+', '.join(changes))
    return int(args.check and bool(changes))
if __name__=='__main__': sys.exit(main())

#!/usr/bin/env python3
"""
Generates rss.xml from the LOG array in data.js.

Run this after updating data.js each week:
    python3 generate-rss.py

Requires nothing beyond Python 3's standard library.
"""
import re
import html as html_lib
from datetime import datetime, timezone

MONTHS = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12}
YEAR = 2026  # bump this each January

def parse_short_date(short_date):
    mon, day = short_date.split(' ')
    return datetime(YEAR, MONTHS[mon], int(day), tzinfo=timezone.utc)

def rfc822(dt):
    return dt.strftime('%a, %d %b %Y %H:%M:%S GMT')

def extract_bold_title(text):
    m = re.search(r'<b>(.*?)</b>', text)
    return m.group(1) if m else None

def slugify(title):
    s = title.lower()
    s = re.sub(r'[—–]', '-', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s

def strip_tags(text):
    return re.sub(r'<[^>]+>', '', text)

def main():
    with open('data.js', 'r') as f:
        content = f.read()

    log_match = re.search(r'const LOG = \[([\s\S]*?)\n\];', content)
    if not log_match:
        raise SystemExit('Could not find LOG array in data.js')
    log_block = log_match.group(1)

    # Parse each {...} entry as its own chunk (entries never contain literal '},\n  {' inside strings in practice)
    entries = re.findall(r'\{date:.*?\}(?=,\s*\{date:|\s*\]|\s*$)', log_block, re.DOTALL)

    def field(pattern, entry, default=None):
        m = re.search(pattern, entry)
        return m.group(1) if m else default

    items = []
    for entry in entries:
        date_str = field(r"date:'([^']*)'", entry)
        plat = field(r"plat:'([^']*)'", entry)
        tag = field(r"tag:'([^']*)'", entry)
        text = field(r"text:'((?:[^'\\]|\\.)*)'", entry, '')
        what = field(r"what:'((?:[^'\\]|\\.)*)'", entry, '')
        why = field(r"why:'((?:[^'\\]|\\.)*)'", entry, '')
        source = field(r"source:'((?:[^'\\]|\\.)*)'", entry, '')
        source_url = field(r"sourceUrl:'([^']*)'", entry)
        status = field(r"status:'([^']*)'", entry, 'verified')
        verified = field(r"verified:'([^']*)'", entry, date_str)  # fall back to date_str only if truly unverified

        text = text.replace("\\'", "'")
        what = what.replace("\\'", "'")
        why = why.replace("\\'", "'")
        source = source.replace("\\'", "'")

        title_name = extract_bold_title(text)
        link_slug = slugify(title_name) if title_name else None
        link = f"https://staticreel.com/title.html?t={link_slug}" if link_slug else "https://staticreel.com/"

        plain_title = strip_tags(text)
        status_label = {'verified':'Verified','corroborated':'Corroborated','unconfirmed':'Unconfirmed'}.get(status, 'Verified')
        description_parts = [what, why]
        if source:
            description_parts.append(f"Source: {source}.")
        description_parts.append(f"Status: {status_label}.")
        description = ' '.join(p for p in description_parts if p)

        pub_date = parse_short_date(verified)

        items.append({
            'title': plain_title,
            'link': link,
            'description': description,
            'pubDate': rfc822(pub_date),
            'guid': f"{link}#{date_str.replace(' ','-')}-{tag}",
            'category': tag,
        })

    # newest first
    items.sort(key=lambda i: i['pubDate'], reverse=True)

    now = rfc822(datetime.now(timezone.utc))

    rss_items = '\n'.join(f"""    <item>
      <title>{html_lib.escape(i['title'])}</title>
      <link>{i['link']}</link>
      <guid isPermaLink="false">{html_lib.escape(i['guid'])}</guid>
      <pubDate>{i['pubDate']}</pubDate>
      <category>{html_lib.escape(i['category'])}</category>
      <description>{html_lib.escape(i['description'])}</description>
    </item>""" for i in items)

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>StaticReel — Signal Log</title>
    <link>https://staticreel.com/</link>
    <description>Verified streaming changes across Netflix, Max, Disney+, and Prime Video — titles leaving, added, price changes, cancellations, renewals, and more.</description>
    <language>en-us</language>
    <lastBuildDate>{now}</lastBuildDate>
{rss_items}
  </channel>
</rss>
"""

    with open('rss.xml', 'w') as f:
        f.write(rss)
    print(f"Wrote rss.xml with {len(items)} items.")

if __name__ == '__main__':
    main()

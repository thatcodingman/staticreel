// Usage: node build-seo.js   (run in the repo root, next to data.js)
// Generates /title/<slug>/index.html for every tracked title, sitemap.xml and robots.txt.
const fs = require('fs'), path = require('path');
const SITE = 'https://staticreel.com';
try { require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'check-data.js')], { stdio: 'inherit' }); }
catch (e) { console.error('\nBuild stopped: fix the data errors above, then run again.'); process.exit(1); }
const src = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const D = new Function(src + ';return {TITLES, PLATFORMS, LOG, logDateToISO};')();
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pretty = iso => { const [y,m,d] = iso.split('-').map(Number); return `${MON[m-1]} ${d}, ${y}`; };
const statusLabel = e => e.status === 'corroborated' ? 'Corroborated' : e.status === 'unconfirmed' ? 'Unconfirmed' : 'Verified';
const verb = e => e.type === 'leaving' ? 'Leaving' : e.type === 'added' ? 'Added to' : 'Update on';
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">';
const BASE_CSS = `:root{--void:#0A0C0F;--panel:#14171C;--panel-2:#1B1F26;--line:#262B33;--text:#ECEEF1;--text-mid:#A6ACB6;--text-dim:#5E6570;--signal:#00E5C7;--signal-dim:#0B4A44}
*{box-sizing:border-box}body{margin:0;background:var(--void);color:var(--text);font:16px/1.6 Inter,system-ui,sans-serif}
a{color:var(--signal);text-decoration:none}a:hover{text-decoration:underline}
.top{border-bottom:1px solid var(--line);background:var(--panel)}
.top-in{max-width:760px;margin:0 auto;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.brand{font:700 18px 'Space Grotesk',sans-serif;color:var(--text);letter-spacing:.2px}.brand span{color:var(--signal)}
.nav{display:flex;gap:16px;font:500 13px 'JetBrains Mono',monospace}.nav a{color:var(--text-mid)}
main{max-width:760px;margin:0 auto;padding:28px 16px 48px}
.crumbs{color:var(--text-dim);font:500 12.5px 'JetBrains Mono',monospace;margin:0 0 18px}
h1{font:700 32px/1.15 'Space Grotesk',sans-serif;margin:10px 0 12px}
h2{font:700 18px 'Space Grotesk',sans-serif;margin:32px 0 12px}
.lede{color:var(--text-mid);margin:0 0 8px}
.plat{display:inline-flex;align-items:center;gap:8px;font:600 13px Inter,sans-serif;color:var(--text)}
.dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.event{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:12px 0}
.event-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.event-date{font:700 17px 'Space Grotesk',sans-serif}
.event-meta{color:var(--text-mid);font-size:14px;margin-top:6px}
.tag{font:500 11.5px 'JetBrains Mono',monospace;padding:2px 9px;border-radius:99px;border:1px solid var(--line);color:var(--text-mid);text-transform:uppercase;letter-spacing:.4px}
.tag.verified{color:var(--signal);border-color:var(--signal-dim);background:rgba(0,229,199,.07)}
.pills{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}
.pills a{display:block;background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:6px 14px;color:var(--text);font-size:14px}
.pills a:hover{border-color:var(--signal-dim);text-decoration:none}
.note{color:var(--text-dim);font-size:13.5px;margin-top:30px;border-top:1px solid var(--line);padding-top:16px}
footer{max-width:760px;margin:0 auto;padding:0 16px 40px;color:var(--text-dim);font:12.5px 'JetBrains Mono',monospace}
@media(max-width:520px){h1{font-size:25px}.nav{gap:12px}}`;
const HEADER = `<header class="top"><div class="top-in"><a class="brand" href="/">Static<span>Reel</span></a><nav class="nav"><a href="/titles/">All titles</a><a href="/rss.xml">RSS</a></nav></div></header>`;
const FOOTER = `<footer>StaticReel · not affiliated with Netflix, Max, Disney+ or Amazon · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></footer>`;
const today = new Date().toISOString().slice(0,10);

const titles = Object.values(D.TITLES).sort((a,b)=>a.slug.localeCompare(b.slug));
let count = 0;
for (const t of titles) {
  const evs = [...t.events].sort((a,b)=>a.date.localeCompare(b.date));
  const latest = evs[evs.length-1];
  const p = D.PLATFORMS[latest.plat];
  const url = `${SITE}/title/${t.slug}/`;
  const past = latest.date < today;
  const phrase = latest.type === 'leaving' ? (past ? 'left' : 'is leaving') : (past ? 'was added to' : 'is coming to');
  const headline = `${t.title} ${phrase} ${p.name} on ${pretty(latest.date)}`;
  const pageTitle = `${t.title} on ${p.name} — ${latest.type === 'leaving' ? (past ? 'left' : 'leaving') : (past ? 'added' : 'arriving')} ${pretty(latest.date)}`;
  const pageTitleFull = pageTitle.length <= 50 ? pageTitle + ' | StaticReel' : pageTitle;
  const desc = `${t.title} ${phrase} ${p.name} on ${pretty(latest.date)}. Status: ${statusLabel(latest)}${latest.source ? ' (source: ' + latest.source + ')' : ''}. Tracked by StaticReel.`;
  const rows = evs.map(e => `<div class="event"><div class="event-top"><span class="event-date">${verb(e)} ${esc(D.PLATFORMS[e.plat].name)}: ${pretty(e.date)}</span><span class="tag ${e.status||'verified'}">${statusLabel(e)}</span></div><div class="event-meta">${e.sourceUrl ? `<a href="${esc(e.sourceUrl)}" rel="noopener">Source: ${esc(e.source)} →</a>` : ''}${e.verified ? ` · checked ${esc(e.verified)}` : ''}</div></div>`).join('\n');
  const ld = {"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","@id":url,"url":url,"name":pageTitle,"description":desc,"isPartOf":{"@id":SITE+"/#site"},"dateModified":today},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"StaticReel","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":p.name,"item":`${SITE}/${p.page}`},
      {"@type":"ListItem","position":3,"name":t.title,"item":url}]}]};
  const rel = titles.filter(o => o.slug !== t.slug && o.events.some(e => e.plat === latest.plat))
    .sort((x,y)=>Math.abs(new Date(x.events[x.events.length-1].date)-new Date(latest.date))-Math.abs(new Date(y.events[y.events.length-1].date)-new Date(latest.date))).slice(0,8);
  const related = rel.length ? `<h2>More on ${esc(p.name)}</h2>\n<ul class="pills">${rel.map(o=>`<li><a href="/title/${o.slug}/">${esc(o.title)}</a></li>`).join('')}</ul><p><a href="/titles/">Browse all tracked titles →</a></p>` : '';
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitleFull)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-snippet:-1">
<meta property="og:type" content="article"><meta property="og:site_name" content="StaticReel">
<meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${BASE_CSS}</style>${FONTS}</head><body>${HEADER}<main>
<p class="crumbs"><a href="/">StaticReel</a> / <a href="/${p.page}">${esc(p.name)}</a> / ${esc(t.title)}</p>
<span class="plat"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}</span>
<h1>${esc(headline)}</h1>
<p class="lede">${esc(desc)}</p>
<h2>Timeline</h2>
${rows}
${related}
<p class="note">StaticReel labels every claim <b>Verified</b> (read on the service's own page), <b>Corroborated</b> (reported by reliable outlets) or <b>Unconfirmed</b>. Dates can change; see the source linked above.</p>
</main>${FOOTER}</body></html>`;
  const dir = path.join(__dirname, 'title', t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  count++;
}

const sections = Object.keys(D.PLATFORMS).map(k => {
  const list = titles.filter(t => t.plat === k).sort((x,y)=>x.title.localeCompare(y.title));
  return `<h2><i class="dot" style="background:${D.PLATFORMS[k].color}"></i> ${esc(D.PLATFORMS[k].name)} (${list.length})</h2>\n<ul class="pills">${list.map(t=>`<li><a href="/title/${t.slug}/">${esc(t.title)}</a></li>`).join('')}</ul>`;
}).join('\n');
fs.mkdirSync(path.join(__dirname,'titles'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'titles','index.html'),`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All tracked titles on Netflix, Max, Disney+ and Prime Video | StaticReel</title>
<meta name="description" content="Every title StaticReel tracks across Netflix, Max, Disney+ and Prime Video, with verified add and removal dates.">
<link rel="canonical" href="${SITE}/titles/"><meta name="robots" content="index,follow">
<link rel="icon" href="/favicon.ico" sizes="any">
<style>${BASE_CSS}</style>${FONTS}</head>
<body>${HEADER}<main><h1>All tracked titles</h1>
<p class="lede">${titles.length} titles across four services. Each page shows add and removal dates with source and status.</p>
${sections}
</main>${FOOTER}</body></html>`);
const pages = ['', 'titles/', ...Object.values(D.PLATFORMS).map(p => p.page)];
const urls = [...pages.map(p => `${SITE}/${p}`), ...titles.map(t => `${SITE}/title/${t.slug}/`)];
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(__dirname, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
// RSS feed from the Signal Log (newest first)
const strip = h => String(h).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const rssItems = D.LOG.map((l,i)=>({l,i,iso:D.logDateToISO(l.verified||l.date)}))
  .sort((a,b)=>b.iso.localeCompare(a.iso)).slice(0,30)
  .map(({l,i,iso})=>`    <item>
      <title>${esc(D.PLATFORMS[l.plat].name+': '+strip(l.text))}</title>
      <link>${SITE}/#log-${i}</link>
      <guid isPermaLink="false">staticreel-${iso}-${i}</guid>
      <pubDate>${new Date(iso+'T12:00:00Z').toUTCString()}</pubDate>
      <category>${esc(l.tag||'')}</category>
      <description>${esc(strip(l.why||'')+(l.status?' ['+(l.status==='corroborated'?'Corroborated':'Unconfirmed')+']':' [Verified]'))}</description>
    </item>`).join('\n');
fs.writeFileSync(path.join(__dirname,'rss.xml'),`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
    <title>StaticReel — Signal Log</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Verified changes on Netflix, Max, Disney+ and Prime Video.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
</channel></rss>
`);
console.log(`Built ${count} title pages, sitemap.xml (${urls.length} URLs), robots.txt`);

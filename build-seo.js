// Usage: node build-seo.js   (run in the repo root, next to data.js)
// Generates /title/<slug>/index.html for every tracked title, sitemap.xml and robots.txt.
const fs = require('fs'), path = require('path');
const SITE = 'https://staticreel.com';
const src = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const D = new Function(src + ';return {TITLES, PLATFORMS};')();
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pretty = iso => { const [y,m,d] = iso.split('-').map(Number); return `${MON[m-1]} ${d}, ${y}`; };
const statusLabel = e => e.status === 'corroborated' ? 'Corroborated' : e.status === 'unconfirmed' ? 'Unconfirmed' : 'Verified';
const verb = e => e.type === 'leaving' ? 'Leaving' : e.type === 'added' ? 'Added to' : 'Update on';
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
  const pageTitle = `${t.title} on ${p.name} — ${latest.type === 'leaving' ? (past ? 'left' : 'leaving') : (past ? 'added' : 'arriving')} ${pretty(latest.date)} | StaticReel`;
  const desc = `${t.title} ${phrase} ${p.name} on ${pretty(latest.date)}. Status: ${statusLabel(latest)}${latest.source ? ' (source: ' + latest.source + ')' : ''}. Tracked by StaticReel.`;
  const rows = evs.map(e => `<li><b>${verb(e)} ${esc(D.PLATFORMS[e.plat].name)}: ${pretty(e.date)}</b> <span class="tag ${e.status||'verified'}">${statusLabel(e)}</span>${e.sourceUrl ? ` · <a href="${esc(e.sourceUrl)}" rel="noopener">Source: ${esc(e.source)}</a>` : ''}${e.verified ? ` · checked ${esc(e.verified)}` : ''}</li>`).join('\n      ');
  const ld = {"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","@id":url,"url":url,"name":pageTitle,"description":desc,"isPartOf":{"@id":SITE+"/#site"},"dateModified":today},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"StaticReel","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":p.name,"item":`${SITE}/${p.page}`},
      {"@type":"ListItem","position":3,"name":t.title,"item":url}]}]};
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-snippet:-1">
<meta property="og:type" content="article"><meta property="og:site_name" content="StaticReel">
<meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
body{margin:0;background:#0A0C0F;color:#ECEEF1;font:16px/1.6 Inter,system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:32px 16px}
a{color:#00E5C7}.crumbs{color:#A6ACB6;font-size:14px}
h1{font-size:30px;line-height:1.2;margin:12px 0}
.plat{display:inline-block;padding:2px 10px;border-radius:99px;background:${p.color};color:#fff;font-size:13px;font-weight:600}
ul{padding-left:20px}li{margin:10px 0}
.tag{font-size:12px;padding:1px 8px;border-radius:99px;border:1px solid #262B33;color:#A6ACB6}
.tag.verified{color:#00E5C7;border-color:#0B4A44}
.note{color:#A6ACB6;font-size:14px;margin-top:28px}
</style></head><body><main>
<p class="crumbs"><a href="/">StaticReel</a> › <a href="/${p.page}">${esc(p.name)}</a> › ${esc(t.title)}</p>
<span class="plat">${esc(p.name)}</span>
<h1>${esc(headline)}</h1>
<p>${esc(desc)}</p>
<h2>Timeline</h2>
<ul>
      ${rows}
</ul>
<p class="note">StaticReel labels every claim <b>Verified</b> (read on the service's own page), <b>Corroborated</b> (reported by reliable outlets) or <b>Unconfirmed</b>. Dates can change; see the source linked above.</p>
<p><a href="/">← This week on streaming</a> · <a href="/${p.page}">All ${esc(p.name)} changes</a></p>
</main></body></html>`;
  const dir = path.join(__dirname, 'title', t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  count++;
}

const pages = ['', ...Object.values(D.PLATFORMS).map(p => p.page)];
const urls = [...pages.map(p => `${SITE}/${p}`), ...titles.map(t => `${SITE}/title/${t.slug}/`)];
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(__dirname, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${count} title pages, sitemap.xml (${urls.length} URLs), robots.txt`);

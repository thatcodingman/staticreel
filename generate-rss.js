// generate-rss.js — regenerates rss.xml from data.js's Signal Log.
// Run this every time you update data.js with a new week's research:
//   node generate-rss.js
//
// This has to be a real static XML file, not JavaScript-rendered — RSS
// readers fetch the file directly and don't execute page scripts.

const fs = require('fs');
const path = require('path');

// Load data.js and export what we need (data.js itself has no module.exports,
// so we append one temporarily in memory rather than editing the real file).
const dataSource = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const wrapped = dataSource + '\nmodule.exports = { LOG, PLATFORMS };';
const Module = require('module');
const m = new Module('data-temp');
m._compile(wrapped, 'data-temp.js');
const { LOG, PLATFORMS } = m.exports;

function escapeXml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(str){
  return str.replace(/<\/?[^>]+>/g, '');
}

function slugFromLogText(text){
  const m = text.match(/<b>(.*?)<\/b>/);
  if(!m) return null;
  return m[1].toLowerCase().replace(/[—–]/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

// Map "Aug 24" style dates to a real RFC-822 pubDate. Adjust YEAR if you're
// generating this for a different year than the current data set.
const YEAR = 2026;
const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
function toRfc822(shortDate){
  const [mon, day] = shortDate.split(' ');
  const d = new Date(Date.UTC(YEAR, MONTHS[mon], parseInt(day, 10), 12, 0, 0));
  return d.toUTCString();
}

// pubDate must be when the item was PUBLISHED (verified/logged), not the
// date of the event itself — a premiere announced today for a date next
// month should show today's date, not a future one. Falls back to the
// event date only for entries with no verified date at all.
function pubDateFor(entry){
  return toRfc822(entry.verified || entry.date);
}

const sorted = [...LOG].sort((a,b)=> pubDateFor(b).localeCompare(pubDateFor(a)));

const items = sorted.map(l => {
  const p = PLATFORMS[l.plat];
  const plainText = stripHtml(l.text);
  const slug = slugFromLogText(l.text);
  const link = slug
    ? `https://staticreel.com/title.html?t=${slug}`
    : `https://staticreel.com/index.html#log`;
  const status = l.status ? l.status.charAt(0).toUpperCase()+l.status.slice(1) : 'Verified';
  const description = `${l.what || ''} ${l.why ? '— ' + l.why : ''} [${status}${l.source ? ' · ' + l.source : ''}]`.trim();

  return `    <item>
      <title>${escapeXml(plainText.toLowerCase().startsWith(p.name.toLowerCase()) ? plainText : `${p.name}: ${plainText}`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(l.date + '-' + l.plat + '-' + (slug || 'log'))}</guid>
      <pubDate>${pubDateFor(l)}</pubDate>
      <category>${escapeXml(l.tag)}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>StaticReel — Signal Log</title>
    <link>https://staticreel.com/</link>
    <description>Verified weekly changes across Netflix, Max, Disney+, and Prime Video — price changes, cancellations, renewals, and policy updates.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(__dirname, 'rss.xml'), rss);
console.log(`rss.xml written with ${sorted.length} items.`);

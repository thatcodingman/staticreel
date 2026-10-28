// Usage: node check-data.js   (also runs automatically at the start of build-seo.js)
// Catches the data mistakes that have bitten us: bad dates, "Verified" with no source,
// Verified claims backed only by news sites, duplicates, slug collisions, stale lists.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const D = new Function(src + ';return {LEAVING,ADDED,LOG,TITLES,PLATFORMS,logDateToISO};')();
const all = [...D.LEAVING.map(x=>({...x,k:'leaving'})), ...D.ADDED.map(x=>({...x,k:'added'}))];
const errors = [], warns = [];
const P = Object.keys(D.PLATFORMS);
const THIRD = /thewrap|cord-?cutters|variety|whats-on-netflix|wdwnt|filmthreat|tomsguide|comicbook|gadgethacks|deadline\.com|screenrant/i;
for (const e of all) {
  const id = `${e.plat} ${e.k} "${e.title}"`;
  if (!P.includes(e.plat)) errors.push(`${id}: unknown platform`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || isNaN(new Date(e.date))) errors.push(`${id}: bad date ${e.date}`);
  if (e.status && !['corroborated','unconfirmed'].includes(e.status)) errors.push(`${id}: bad status ${e.status}`);
  if (!e.status) {
    if (!e.source || !e.sourceUrl) errors.push(`${id}: marked Verified but has no source/sourceUrl`);
    else if (THIRD.test(e.sourceUrl)) errors.push(`${id}: marked Verified but source is a news site (${e.sourceUrl})`);
  }
  if (e.sourceUrl && !/^https:\/\//.test(e.sourceUrl)) errors.push(`${id}: bad sourceUrl`);
  if (e.verified && !/^[A-Z][a-z]{2} \d{1,2}$/.test(e.verified)) errors.push(`${id}: bad verified format ${e.verified}`);
}
const seen = {};
for (const e of all) { const k = e.k+'|'+e.plat+'|'+e.title+'|'+e.date; if (seen[k]) errors.push(`duplicate: ${k}`); seen[k] = 1; }
const byTitle = {};
for (const e of all) (byTitle[e.k+'|'+e.plat+'|'+e.title] ??= []).push(e.date);
for (const [k, d] of Object.entries(byTitle)) if (d.length > 1) warns.push(`same title twice with different dates (new episodes, not an addition?): ${k} ${d.join(', ')}`);
const slugs = {};
for (const t of Object.values(D.TITLES)) (slugs[t.slug] ??= new Set()).add(t.title);
for (const [s, v] of Object.entries(slugs)) if (v.size > 1) errors.push(`slug collision ${s}: ${[...v].join(' / ')}`);
D.LOG.forEach((l, i) => {
  if (!/^[A-Z][a-z]{2} \d{1,2}$/.test(l.date)) errors.push(`LOG[${i}] bad date ${l.date}`);
  if (!P.includes(l.plat)) errors.push(`LOG[${i}] bad platform`);
  if (!l.status && (!l.source || !l.sourceUrl)) errors.push(`LOG[${i}] marked Verified with no source`);
});
const today = new Date().toISOString().slice(0,10);
const upLeave = all.filter(e => e.k==='leaving' && e.date >= today);
const upAdd = all.filter(e => e.k==='added' && e.date >= today);
const inTwoWeeks = new Date(Date.now()+14*864e5).toISOString().slice(0,10);
if (upLeave.length === 0) warns.push('STALE: no upcoming removals on file');
if (!upLeave.some(e => e.date <= inTwoWeeks)) warns.push('STALE: no removals in the next 14 days');
if (!upAdd.some(e => e.date <= inTwoWeeks)) warns.push('STALE: no additions in the next 14 days');
for (const p of P) if (!all.some(e => e.plat === p && e.date >= today)) warns.push(`THIN: ${D.PLATFORMS[p].name} has nothing upcoming`);
const lv = (src.match(/LAST_VERIFICATION_DATE = '([^']+)'/)||[])[1];
if (lv) { const age = (Date.now() - new Date(lv)) / 864e5; if (age > 7) warns.push(`STALE: LAST_VERIFICATION_DATE (${lv}) is ${Math.floor(age)} days old`); }
console.log(`Data check: ${all.length} entries, ${Object.keys(D.TITLES).length} titles, ${D.LOG.length} log items`);
warns.forEach(w => console.log('  WARN ', w));
errors.forEach(e => console.log('  ERROR', e));
if (errors.length) { console.log(`\n${errors.length} error(s). Fix data.js before publishing.`); process.exit(1); }
console.log(errors.length === 0 && warns.length === 0 ? '  all clear' : '  no errors');

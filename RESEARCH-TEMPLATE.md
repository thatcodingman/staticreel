# StaticReel — weekly research prompt & entry template

This is the reusable prompt and template for gathering each week's real data. Paste the prompt into a new chat with web search enabled, then drop the results straight into `index.html` using the field templates below — they match the site's data structures exactly, so it's copy-paste, not reformatting.

---

## The weekly research prompt

Paste this into a fresh chat (with web search on) each week, filling in the date range:

```
Research streaming service changes for Netflix, Max, Disney+, and Prime Video
for the week of [START DATE] to [END DATE].

For each of the four services, find and verify:
1. Movies and TV shows leaving in the next 30 days (need exact leaving date)
2. Movies and TV shows just added this week (need exact add date)
3. New season announcements or premieres
4. Release date changes — delays or moved-up dates
5. Show cancellations
6. Show renewals
7. Price changes (any tier)
8. Ad-tier changes (ad load, ad-free tier changes)
9. Password/account-sharing policy changes
10. Free-trial changes (length, eligibility, availability by region)

For every finding:
- Cite the actual source (official newsroom, press page, help center, or
  billing page is strongly preferred over aggregator sites or social media)
- If you can only confirm something via user reports, forum posts, or
  unofficial trackers, say so explicitly and label it UNCONFIRMED — do not
  present it as officially confirmed
- Give the exact date you found/verified the information
- Note if a claim is disputed or contradicted between sources

Also give me, for each service, a rough count of titles added and titles
leaving this week if that's discoverable (for the weekly stat cards).

Prioritize breadth across all four services over depth on any one — I need
roughly 8-10 leaving titles, 8-10 added titles, and 8-12 log-worthy changes
(price/policy/cancellation/renewal/etc.) spread across all four services,
not concentrated on one.
```

---

## Entry templates

Once you have results, format each finding using the matching template below, then paste directly into the corresponding array in `index.html`.

### Leaving soon entry
Goes in the `LEAVING` array.

```js
{title:'TITLE', plat:'netflix', date:'Sep 5', days:11},
```

- `plat` must be exactly one of: `netflix`, `max`, `disney`, `prime`
- `date` is the display date (e.g. `'Sep 5'`)
- `days` is how many days from today until it leaves — used for sorting, so calculate it fresh each week rather than copying an old value

### Just added entry
Goes in the `ADDED` array.

```js
{title:'TITLE', plat:'netflix', date:'Aug 26'},
```

### Signal log entry
Goes in the `LOG` array. This is the one that needs the most care — it carries the verification claim.

```js
{date:'Aug 25', plat:'netflix', tag:'cancellation', verified:'Aug 25', source:'Netflix newsroom', text:'Netflix cancels <b>TITLE</b> after one season', what:'One sentence: exactly what changed.', why:'One sentence: why this matters to a viewer.'},
```

For an unconfirmed entry, add `unconfirmed:true` and make sure `source` and the `why` line make the uncertainty explicit — don't just tack the flag on without adjusting the wording:

```js
{date:'Aug 24', plat:'prime', tag:'ad-tier', unconfirmed:true, verified:'Aug 24', source:'User reports on social media, not confirmed by Amazon', text:'Prime Video may be expanding ad load on <b>ad-supported tier</b>', what:'What multiple sources are reporting, phrased as unconfirmed.', why:'Why it matters IF true, noting it is not yet officially confirmed.'},
```

Valid `tag` values (must match exactly, used by the filter chips):
`cancellation`, `renewal`, `new-season`, `release-date`, `price`, `ad-tier`, `password-policy`, `free-trial`

To feature an entry in the "Biggest changes this week" section, add `featured:true`. Pick the 3 most significant entries of the week — usually the ones with the widest impact (a price change, a major cancellation, a policy shift) rather than a routine addition.

### Weekly stat counts
Goes in the `STATS` object — one line per service.

```js
netflix:{added:18, removed:7},
```

---

## Verification standard (keep this consistent)

- **Verified** = confirmed via an official source: the service's own newsroom, press release, help center, or billing/account page.
- **Unconfirmed** = based on user reports, forum posts, or trackers the platform itself hasn't confirmed. Always say so in the entry's wording, not just the flag.
- If something later gets officially confirmed, update its `verified` date and remove `unconfirmed:true` rather than leaving stale uncertainty on the page.
- Never upgrade an unconfirmed claim to "Verified" on the strength of it being repeated by more unofficial sources — only an official source changes the status.

---

## What NOT to do

- Don't guess at exact dates or counts if you can't find a real source — leave it out rather than inventing a number the reader would take as fact.
- Don't concentrate all findings on one service because it was easier to search — the homepage stat cards will look lopsided and it signals uneven research, not uneven actual news.
- Don't carry over last week's `days` count on leaving-soon titles — recalculate from today's date.

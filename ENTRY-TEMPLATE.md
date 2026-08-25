# StaticReel — entry templates

## Leaving soon entry
Goes in the `LEAVING` array.

```js
{title:'TITLE', plat:'netflix', date:'Sep 5', days:11},
```

- `plat` must be exactly one of: `netflix`, `max`, `disney`, `prime`
- `date` is the display date (e.g. `'Sep 5'`)
- `days` is how many days from today until it leaves — recalculate fresh each week, don't carry over last week's number

## Just added entry
Goes in the `ADDED` array.

```js
{title:'TITLE', plat:'netflix', date:'Aug 26'},
```

## Signal log entry — verified
Goes in the `LOG` array.

```js
{date:'Aug 25', plat:'netflix', tag:'cancellation', verified:'Aug 25', source:'Netflix newsroom', text:'Netflix cancels <b>TITLE</b> after one season', what:'One sentence: exactly what changed.', why:'One sentence: why this matters to a viewer.'},
```

## Signal log entry — unconfirmed
Add `unconfirmed:true` and phrase `text`, `what`, and `why` so the uncertainty is explicit, not just flagged.

```js
{date:'Aug 24', plat:'prime', tag:'ad-tier', unconfirmed:true, verified:'Aug 24', source:'User reports on social media, not confirmed by Amazon', text:'Prime Video may be expanding ad load on <b>ad-supported tier</b>', what:'What multiple sources are reporting, phrased as unconfirmed.', why:'Why it matters IF true, noting it is not yet officially confirmed.'},
```

## Featured entry
Add `featured:true` to a log entry to surface it in "Biggest changes this week." Pick 3 per week — the widest-impact changes, not just the easiest to find.

## Valid tag values
Must match exactly — these drive the filter chips:

```
cancellation, renewal, new-season, release-date, price, ad-tier, password-policy, free-trial
```

## Weekly stat counts
Goes in the `STATS` object, one line per service.

```js
netflix:{added:18, removed:7},
```

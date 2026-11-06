// Blog posts. Add a new object to the top of the array, then run: node build-seo.js
// In body, [[Exact Title]] auto-links to that title's StaticReel page when it exists.
module.exports = [
{
 slug: 'netflix-leaving-november-2026',
 date: '2026-11-05',
 title: 'Leaving Netflix in November 2026: what to watch first',
 desc: 'The November 2026 Netflix removals worth your time, ordered by deadline, with the dates we confirmed on Netflix\'s own pages.',
 body: `
<p>Netflix's November exit list is a two-part story. The big batch went on November 1, mostly licensed movies. The rest trickles out through the month, and several of those are the ones people actually care about: a long-running drama, a crime thriller, and a Gilmore Girls revival. Here is what is left and how we would prioritize it.</p>
<p class="meta">Dates below were checked against Netflix's own announcements on November 3, 2026. Dates can move, so the linked pages show the source and status for each.</p>

<h2>Already gone on November 1</h2>
<p>If you were saving any of these, the window has closed in the U.S.: [[Black Adam]], [[Speed]], [[Nightcrawler]], [[Fast Five]], [[13 Going on 30]] and [[Jumanji]], plus the three seasons of [[Broadchurch — Seasons 1–3]]. Movies leave in batches on the first of the month far more often than TV does, which is why the first week of any month is the most crowded.</p>

<h2>Leaving this week and next</h2>
<ul>
<li><strong>November 5:</strong> [[The End of the F***ing World — Seasons 1–2]]. Short episodes and only two seasons, so it is the easiest one to finish before it goes.</li>
<li><strong>November 9:</strong> [[The Lost City]].</li>
<li><strong>November 14:</strong> [[The Big C — Seasons 1–4]]. Four seasons is a real commitment; decide today if you want to start.</li>
<li><strong>November 15:</strong> [[The Girl with the Dragon Tattoo]] and [[The Shallows]], which makes for an easy double feature.</li>
</ul>

<h2>Leaving in the second half of the month</h2>
<ul>
<li><strong>November 19:</strong> [[Saw X]] and [[True Romance]].</li>
<li><strong>November 20:</strong> [[The Resident — Seasons 1–6]]. Six seasons will not fit in two weeks unless you plan for it.</li>
<li><strong>November 25:</strong> [[Gilmore Girls: A Year in the Life]]. It lands just before Thanksgiving, which is a natural time to watch it.</li>
</ul>

<h2>How to decide what to watch</h2>
<p>Start with the series that have the most episodes, since those are the only ones you cannot catch up on at the last minute. Movies can wait until the final weekend. If a title has a long run, check the date first, because a deadline of the 14th and one of the 20th are very different amounts of time.</p>
<p>For the full list with every source, see the <a href="/guide/netflix-november-2026/">Netflix November 2026 guide</a>. If you also want to see what is arriving, the <a href="/titles/">all titles index</a> covers all four services.</p>
`},
{
 slug: 'why-titles-leave-netflix',
 date: '2026-11-04',
 title: 'Why shows leave Netflix (and why it is usually the 1st)',
 desc: 'A plain-English explanation of streaming licensing windows, why removals cluster on the 1st, and which titles are most likely to stay.',
 body: `
<p>Almost everyone has had the experience: you add a movie to your list, come back a month later, and it is gone. Nothing broke. The title left because of how streaming rights work.</p>

<h2>Netflix often rents what it shows</h2>
<p>Netflix makes some of what it streams, but a large share of its catalog is licensed from studios and distributors. A license is a contract with an end date. When the date arrives, the rights revert to the owner unless both sides renew. Renewal is a business decision, and it depends on price, what else the studio wants to do with the title, and how much Netflix subscribers actually watched it.</p>

<h2>Why removals bunch up on the 1st</h2>
<p>Many license terms are written to start and end at the boundary of a month, which makes the accounting simpler. That is why a long list of films tends to disappear on the 1st, and why the 1st is also a big day for new arrivals. Mid-month removals do happen, usually for individual series or for licenses signed on a different schedule.</p>

<h2>Originals are different, but not permanent</h2>
<p>A title Netflix produced itself does not have a licensing clock in the same way, so it tends to stay. There are exceptions, such as a show whose rights were shared with a studio or a title Netflix chooses to retire. If you are tracking a specific original, the signs to watch are a cancellation or end-of-run announcement rather than a leaving date.</p>

<h2>What this means for you</h2>
<ul>
<li>If it is a licensed movie from a major studio, assume it may rotate out within a year or two.</li>
<li>If it is a multi-season series you have not started, check the leaving date before you begin.</li>
<li>Netflix posts its own upcoming removals, which is the source we use for confirmed dates.</li>
</ul>
<p>StaticReel tracks those announcements and labels each one by how well it is sourced. You can browse the <a href="/guide/">monthly guides</a> to see what is leaving and arriving, or read <a href="/blog/how-staticreel-verifies-streaming-changes/">how we verify each change</a>.</p>
<p class="meta">General explanation of industry practice. Individual deals vary, and Netflix does not publish the terms of its licenses.</p>
`},
{
 slug: 'how-staticreel-verifies-streaming-changes',
 date: '2026-11-03',
 title: 'How StaticReel verifies streaming changes',
 desc: 'Our sourcing standard explained: what each label means, where our dates come from, and how we handle conflicts between sources.',
 body: `
<p>Streaming dates are easy to get wrong. A news site repeats a rumor, a date moves, or a list mixes up two services. StaticReel uses a three-level label so you can see how much weight each date deserves.</p>

<h2>Verified</h2>
<p>We read the date on a page owned by the service itself, such as Netflix's Tudum announcements or an official press release, and we link to it. Verified items also show the date we last checked. This is the strongest label.</p>

<h2>Corroborated</h2>
<p>Reliable outlets report the date, but we could not read it on the service's own page. News coverage is always capped at this level, even when several articles agree, because outlets often copy each other.</p>

<h2>Unconfirmed</h2>
<p>We have a lead but no reliable source. We keep these visible so you know something is rumored, but we do not treat them as settled.</p>

<h2>When sources disagree</h2>
<p>We do not average conflicting dates. If a service's page and a news report differ, we use the service's page and note the conflict. If we cannot read the service's page, we leave the item at Corroborated or Unconfirmed until we can.</p>

<h2>What we do not track</h2>
<p>We follow Netflix, Max, Disney+ and Prime Video. Titles that are only on a different service, such as a Hulu-only release listed in a shared Disney press page, are left out. Episode-by-episode releases are also left out unless a whole season arrives at once.</p>

<h2>How often we check</h2>
<p>We update the data weekly and show the last verification date on the home page. Dates can change after we check them, so every title page links its source.</p>
<p>You can see the labels in action on the <a href="/guide/">monthly guides</a>, or contact us through the <a href="/contact.html">contact page</a> if you spot a mistake.</p>
`},
{
 slug: 'never-miss-a-title-leaving',
 date: '2026-11-02',
 title: 'How to never miss a show before it leaves',
 desc: 'Five simple habits for catching removal dates in time, plus how to use RSS and StaticReel\'s monthly guides.',
 body: `
<p>Nobody wants to find out a show is gone the night they planned to watch it. A few habits make surprises rare.</p>

<h2>1. Check the first week of every month</h2>
<p>Because licensed titles tend to leave on the 1st, the days around the start of a month are the best time to scan for removals. Do it once a month and you will catch most of them.</p>

<h2>2. Sort by deadline, not by interest</h2>
<p>When you see an exit list, order it by date. Anything leaving in under a week and anything with many episodes goes to the top. Short films can wait for the last weekend.</p>

<h2>3. Use a watchlist you actually review</h2>
<p>Adding a title to My List is not a reminder. Pick a day each week to scan the list for items near their dates.</p>

<h2>4. Subscribe to a feed</h2>
<p>StaticReel publishes an <a href="/rss.xml">RSS feed</a> of each change we log. Add it to any feed reader and new items arrive without you checking a site.</p>

<h2>5. Use the monthly guides</h2>
<p>Each month we publish a page per service with everything leaving and arriving, each date labeled by how well it is sourced. Start with the <a href="/guide/">guide index</a>, or search the <a href="/titles/">all titles</a> page for a specific show.</p>

<h2>A note on dates</h2>
<p>Streaming dates move. When a date matters, open the source link on the title's page and confirm it. If you find a date that is wrong, tell us on the <a href="/report.html">report page</a>.</p>
`}
];

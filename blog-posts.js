// Blog posts. Add a new object to the top of the array, then run: node build-seo.js
// In body, [[Exact Title]] auto-links to that title's StaticReel page when it exists.
module.exports = [
{
 slug: 'is-this-streaming-date-reliable',
 date: '2026-11-05',
 title: 'Is that streaming date reliable? A quick checklist',
 desc: 'Five questions to ask before you plan around a premiere or removal date you saw online.',
 body: `
<p>Every week a date goes viral: a show "arrives Friday" or a movie "leaves on the 15th." Some of those dates are solid. Others are guesses repeated until they look like facts. Here is how we sort them, and how you can too.</p>

<h2>1. Who published it first?</h2>
<p>The most reliable source is the service itself: a press release, a "coming soon" page, or an official social post. A news article that links to one of those is a good sign. An article that links only to other articles is a chain, and every link in it may be copying the first.</p>

<h2>2. Is the date specific?</h2>
<p>"November" and "this fall" are intentions. "November 12" is a commitment. Exact dates are more reliable, but only when they come from the right source.</p>

<h2>3. Is it the right service?</h2>
<p>Shared press pages often cover more than one service. A title that arrives on a sister service is easy to mistake for the one you pay for. Check the service name next to the date.</p>

<h2>4. Is the date still current?</h2>
<p>Dates move, especially premieres. A listing from a few months ago may describe a schedule that has since changed. Look at when the source was last updated.</p>

<h2>5. Does it say what time zone or region?</h2>
<p>Arrival times and even days can differ outside the U.S. A title that "arrives Friday" in the U.S. may show up a day earlier or later elsewhere.</p>

<h2>How StaticReel handles this</h2>
<p>We put these questions into a label. Dates we read on the service's own page are <strong>Verified</strong>. Dates reported by reliable outlets are <strong>Corroborated</strong>. Leads we cannot source are <strong>Unconfirmed</strong>. The full method is in <a href="/blog/how-staticreel-verifies-streaming-changes/">how we verify streaming changes</a>.</p>
`},
{
 slug: 'how-different-services-handle-removals',
 date: '2026-11-05',
 title: 'Netflix, Max, Disney+ and Prime Video: how each handles removals',
 desc: 'Why a title disappears from one service quickly, from another rarely, and how to judge your risk on each.',
 body: `
<p>"It left streaming" means different things depending on the service. The business model behind each catalog changes how often titles disappear and how much warning you get. These are general patterns, not guarantees, and individual titles vary.</p>

<h2>Netflix</h2>
<p>Netflix mixes its own productions with a large licensed library. Licensed films and older series rotate out regularly, and Netflix usually announces upcoming exits. Its own originals are less likely to leave, though they can. For the licensing background, see <a href="/blog/why-titles-leave-netflix/">why shows leave Netflix</a>.</p>

<h2>Max</h2>
<p>Max draws heavily on the catalog of its parent company, which makes some of its library more stable than a pure licensing model. It still carries films from outside studios, and those can rotate. Max tends to list arrivals more prominently than departures, so check dates before starting a long series.</p>

<h2>Disney+</h2>
<p>Disney+ leans on Disney's own catalog, so fewer titles disappear because a license ended. Changes are often additions, scheduled premieres and moves between Disney's services. If you pay for Disney+ specifically, confirm the service name next to a date, because Disney publishes announcements that cover several of its services at once.</p>

<h2>Prime Video</h2>
<p>Prime Video combines titles included with Prime and titles that cost extra to rent or buy. A movie "leaving Prime" may simply move from included to paid. When you see a removal, check whether it is gone entirely or just no longer free with your subscription.</p>

<h2>What to do with this</h2>
<ul>
<li>On any service, check the date before starting a long series.</li>
<li>On Netflix, expect more movement near the start of each month.</li>
<li>On Prime Video, confirm whether a title is included or paid.</li>
</ul>
<p>Our <a href="/guide/">monthly guides</a> show what is leaving and arriving on each service, labeled by source quality.</p>
<p class="meta">General description of industry patterns. Individual licensing deals are not public.</p>
`},
{
 slug: 'finish-a-series-before-it-leaves',
 date: '2026-11-05',
 title: 'How to finish a long series before it leaves',
 desc: 'A simple way to turn a removal date and an episode count into a daily viewing plan.',
 body: `
<p>A show is leaving in two weeks and it has six seasons. Is it doable? A bit of arithmetic answers that before you start.</p>

<h2>The quick formula</h2>
<p>Divide the total runtime by the days you have. Total runtime is episodes multiplied by average episode length. For example, 100 episodes at 45 minutes is 4,500 minutes, or 75 hours. Over 14 days that is about 5.4 hours a day, which is not realistic for most people.</p>

<h2>Decide if it is worth it</h2>
<ul>
<li>Under 1.5 hours a day: easy, start tonight.</li>
<li>1.5 to 3 hours a day: doable if it is a priority.</li>
<li>Over 3 hours a day: skip it, or sample the first few episodes and decide.</li>
</ul>

<h2>Make it fit</h2>
<ol>
<li><strong>Count the exact episodes.</strong> A season count hides large differences between seasons.</li>
<li><strong>Add buffer.</strong> Plan to finish a day or two before the date, since removals can happen early in the day.</li>
<li><strong>Use dead time.</strong> Commutes and chores handle the audio-heavy episodes.</li>
<li><strong>Watch the end first for movies.</strong> For a film, you only need one evening, so leave films for last.</li>
</ol>

<h2>A note on dates</h2>
<p>Leaving dates can move, so confirm on the source before committing. Our <a href="/guide/">monthly guides</a> link the source for each date, and the <a href="/blog/netflix-leaving-november-2026/">November Netflix post</a> sorts removals by deadline to help you pick.</p>
`},
{
 slug: 'where-to-find-official-streaming-announcements',
 date: '2026-11-05',
 title: 'Where to find official streaming announcements yourself',
 desc: 'The official pages and newsrooms where Netflix, Max, Disney+ and Prime Video post arrivals, so you can check any date for yourself.',
 body: `
<p>Trackers, including ours, are only as good as the sources behind them. If a date matters to you, go to the source. Here is where each service posts.</p>

<h2>Netflix</h2>
<p>Netflix's editorial site, Tudum, publishes "new on Netflix" lists and monthly roundups. This is the first place we look for confirmed Netflix dates.</p>

<h2>Max</h2>
<p>Warner Bros. Discovery posts Max announcements through its press site, often as a monthly highlights release. Press pages are sometimes restricted to certain users, so a news outlet may repeat the list before you can read it directly.</p>

<h2>Disney+</h2>
<p>Disney publishes announcements through its press pages. A single release can list titles for several Disney services, so always check which service each title is for.</p>

<h2>Prime Video</h2>
<p>Amazon posts Prime Video announcements on its news site, including monthly lineups. Prime also separates included titles from paid ones, so read the details.</p>

<h2>Tips for reading these pages</h2>
<ul>
<li>Use the page's own date to judge how current it is.</li>
<li>Look for the region, since many announcements are U.S.-only.</li>
<li>Be careful with "premieres" versus "all episodes available," which are different things.</li>
</ul>

<h2>When you cannot reach a source</h2>
<p>Sometimes a page is down, blocked or only partly available. In that case we label the date <strong>Corroborated</strong> instead of <strong>Verified</strong>, and we say so. See <a href="/blog/is-this-streaming-date-reliable/">our reliability checklist</a> for how to judge a date yourself, or <a href="/blog/how-staticreel-verifies-streaming-changes/">how we verify changes</a>.</p>
`},
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

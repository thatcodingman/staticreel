// ── StaticReel shared data layer ────────────────────────────────────────
// Single source of truth, included by index.html and title.html.
// Edit LEAVING / ADDED / LOG here — both pages read from this one file.

// ── TMDB poster integration ─────────────────────────────────────────────
// 1. Get a free API key at https://www.themoviedb.org/settings/api
// 2. Paste your "API Key (v3 auth)" below, replacing the placeholder.
// Note: this key is visible in the page's public source (it's a static
// site with no server) — that's normal for TMDB's free client-side usage,
// but don't reuse a key you use for anything sensitive elsewhere.
const TMDB_API_KEY = 'eb04af0e6f0e7be28a001d6b3e623102';

// ── OMDb integration (optional) ──────────────────────────────────────────
// Adds IMDb and Rotten Tomatoes scores to title pages, on top of TMDB's
// own rating. Same public-key caveat as above applies.
const OMDB_API_KEY = '8a1e8a9d';

const POSTER_CACHE = {}; // title -> Promise<posterUrl|null>, dedupes repeated titles

function tmdbSearchKey(rawTitle){
  // Strip season/part suffixes so "Flex X Cop — Season 2" searches as "Flex X Cop"
  return rawTitle.replace(/\s*[—–-]\s*(Season|Part)\s*\d+.*$/i, '').trim();
}

function fetchPoster(rawTitle){
  const key = tmdbSearchKey(rawTitle);
  if(!TMDB_API_KEY || TMDB_API_KEY === 'PASTE_YOUR_TMDB_API_KEY_HERE'){
    return Promise.resolve(null);
  }
  if(!POSTER_CACHE[key]){
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(key)}`;
    POSTER_CACHE[key] = fetch(url)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if(!data || !data.results) return null;
        const hit = data.results.find(r => (r.media_type==='movie' || r.media_type==='tv') && r.poster_path);
        return hit ? `https://image.tmdb.org/t/p/w300${hit.poster_path}` : null;
      })
      .catch(()=>null);
  }
  return POSTER_CACHE[key];
}

const DETAILS_CACHE = {}; // title -> Promise<{overview,cast,genres,year,rating,posterUrl}|null>

function fetchTitleDetails(rawTitle){
  const key = tmdbSearchKey(rawTitle);
  if(!TMDB_API_KEY || TMDB_API_KEY === 'PASTE_YOUR_TMDB_API_KEY_HERE'){
    return Promise.resolve(null);
  }
  if(!DETAILS_CACHE[key]){
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(key)}`;
    DETAILS_CACHE[key] = fetch(searchUrl)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const hit = data && data.results && data.results.find(r => (r.media_type==='movie' || r.media_type==='tv') && r.poster_path);
        if(!hit) return null;
        const detailUrl = `https://api.themoviedb.org/3/${hit.media_type}/${hit.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        return fetch(detailUrl)
          .then(res => res.ok ? res.json() : null)
          .then(full => {
            if(!full) return null;
            const cast = ((full.credits && full.credits.cast) || []).slice(0, 5).map(c => c.name);
            const releaseDate = full.release_date || full.first_air_date || '';
            const year = releaseDate.slice(0, 4);
            return {
              overview: full.overview || '',
              cast,
              genres: (full.genres || []).map(g => g.name),
              year,
              releaseDate,
              rating: full.vote_average ? full.vote_average.toFixed(1) : null,
              voteCount: full.vote_count || null,
              posterUrl: `https://image.tmdb.org/t/p/w300${hit.poster_path}`,
              mediaType: hit.media_type
            };
          });
      })
      .catch(()=>null);
  }
  return DETAILS_CACHE[key];
}

const OMDB_CACHE = {}; // title -> Promise<{imdbRating,rtScore}|null>

function fetchOMDbRatings(rawTitle){
  const key = tmdbSearchKey(rawTitle);
  if(!OMDB_API_KEY){
    return Promise.resolve(null);
  }
  if(!OMDB_CACHE[key]){
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(key)}`;
    OMDB_CACHE[key] = fetch(url)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if(!data || data.Response === 'False') return null;
        const rt = (data.Ratings || []).find(r => r.Source === 'Rotten Tomatoes');
        return {
          imdbRating: (data.imdbRating && data.imdbRating !== 'N/A') ? data.imdbRating : null,
          rtScore: rt ? rt.Value : null
        };
      })
      .catch(()=>null);
  }
  return OMDB_CACHE[key];
}

const PLATFORMS = {
  netflix:{name:'Netflix', color:'#E50914', page:'netflix.html'},
  max:{name:'Max', color:'#9B5CF0', page:'max.html'},
  disney:{name:'Disney+', color:'#1FA2FF', page:'disney-plus.html'},
  prime:{name:'Prime Video', color:'#00A8E1', page:'prime-video.html'}
};

const TODAY = new Date('2026-09-02T00:00:00');
const LAST_VERIFICATION_DATE = 'Aug 26, 2026'; // when this week's research pass was actually done —
                                                 // use this for "when did we check this," never an
                                                 // event's own date (which can be in the future).
const WEEK_START = new Date('2026-08-31T00:00:00');
const WEEK_END = new Date('2026-09-06T23:59:59');

function daysUntil(iso){
  const d = new Date(iso+'T00:00:00');
  return Math.round((d - TODAY) / 86400000);
}
function formatDate(iso){
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
}
function inCurrentWeek(iso){
  const d = new Date(iso+'T00:00:00');
  return d >= WEEK_START && d <= WEEK_END;
}

// LEAVING and ADDED are append-only across weeks (never wiped, so title
// history keeps accumulating) — these two decide what the HOMEPAGE shows
// right now, without touching the underlying data or any title's history.
function isCurrentlyLeavingSoon(item){
  const days = daysUntil(item.date);
  return days >= 0 && days <= 30;
}
function isAddedThisWeek(item){
  return inCurrentWeek(item.date);
}
function isScheduled(item){
  // True if the item's date hasn't happened yet — distinguishes a title
  // that's confirmed to arrive from one that's already live on the service.
  return daysUntil(item.date) > 0;
}

function slugify(title){
  return title.toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function dot(color){return `<span class="dot" style="background:${color}"></span>`;}

function eventTypeLabel(type){
  if(type==='leaving') return 'Leaving';
  if(type==='added') return 'Added';
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g,' ');
}

const MONTHS = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
function logDateToISO(shortDate){
  // Converts "Aug 24" (LOG's display format) to "2026-08-24" for consistent sorting/formatting
  const [mon, day] = shortDate.split(' ');
  const mm = MONTHS[mon];
  const dd = day.padStart(2, '0');
  return mm ? `2026-${mm}-${dd}` : shortDate;
}

function linkifyLogText(text){
  // Wraps the bolded title name in a link to its title page, preserving the bold
  return text.replace(/<b>(.*?)<\/b>/, (m, name) => `<b><a href="title.html?t=${slugify(name)}">${name}</a></b>`);
}

const STATS_OVERRIDES = {
  max:{removedNote:'no verified Max removal list for this week'},
  disney:{removedNote:'no verified Disney+ removal list for this week'},
  prime:{removedNote:'no verified Prime Video removal list for this week'}
};

const LEAVING = [
  {title:'Going Varsity in Mariachi', plat:'netflix', date:'2026-08-29', status:'unconfirmed'},
  {title:'Undercover Law', plat:'netflix', date:'2026-08-31', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/leaving-netflix-august-2026/', verified:'Aug 25'},
  {title:'Crashing', plat:'netflix', date:'2026-09-01'},
  {title:'Black Lightning', plat:'netflix', date:'2026-09-01'},
  {title:'Creed', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Creed II', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Creed III', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Orphan Black', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Here and There (Dito at Doon)', plat:'netflix', date:'2026-09-02', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'The Bling Ring', plat:'netflix', date:'2026-09-03', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Ginger & Rosa', plat:'netflix', date:'2026-09-05', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Tokyo Revengers', plat:'max', date:'2026-08-28', status:'unconfirmed'},
  {title:'Jandino: Whatever It Takes', plat:'netflix', date:'2026-09-09'},
  {title:'Life', plat:'netflix', date:'2026-09-23'}
];

const ADDED = [
  {title:'M3GAN', plat:'netflix', date:'2026-08-24'},
  {title:'Revival — Season 1', plat:'netflix', date:'2026-08-24'},
  {title:'Stamptown', plat:'netflix', date:'2026-08-25', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Aug 25'},
  {title:'Leanne — Season 2', plat:'netflix', date:'2026-08-27', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/leanne-morgan-comedy-series-season-2', verified:'Aug 25'},
  {title:'All the Truth in My Lies', plat:'netflix', date:'2026-08-28'},
  {title:'The Whisper Man', plat:'netflix', date:'2026-08-28', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/the-whisper-man-release-date-cast-news', verified:'Aug 25'},
  {title:'Margarita: Make Your Story Count S3', plat:'max', date:'2026-08-24', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Tracked — Season 1', plat:'max', date:'2026-08-25'},
  {title:'1000-lb Roomies — Season 2', plat:'max', date:'2026-08-26', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Bobby\'s Triple Threat — Season 5', plat:'max', date:'2026-08-26', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Homestead Rescue: Intervention', plat:'max', date:'2026-08-26', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Totally \'90s House', plat:'max', date:'2026-08-27', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'House Hunters — Season 261', plat:'max', date:'2026-08-28', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'The Producer — Season 1', plat:'max', date:'2026-08-28', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Enter Nowhere', plat:'max', date:'2026-08-30', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Holla', plat:'max', date:'2026-08-30', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Knock Knock', plat:'max', date:'2026-08-30', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'The Cabin in the Woods', plat:'max', date:'2026-08-30', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'The Strangers: Chapter 1', plat:'max', date:'2026-08-30', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'The Strangers: Prey at Night', plat:'max', date:'2026-08-30', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
  {title:'Venom: The Last Dance', plat:'disney', date:'2026-08-25', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-august-2026', verified:'Aug 25'},
  {title:'Miraculous — Season 6', plat:'disney', date:'2026-08-26', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-august-2026', verified:'Aug 25'},
  {title:'The Simpsons: Yellow Mirror', plat:'disney', date:'2026-08-26', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-august-2026', verified:'Aug 25'},
  {title:'Project Runway — Season 22', plat:'disney', date:'2026-08-27', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-august-2026', verified:'Aug 25'},
  {title:'Flex X Cop — Season 2', plat:'disney', date:'2026-08-28', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-august-2026', verified:'Aug 25'},
  {title:'Flex X Cop — Season 2', plat:'disney', date:'2026-08-29', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-august-2026', verified:'Aug 25'},
  {title:'The Last Sunrise', plat:'prime', date:'2026-08-26'},
  {title:'Nickel Boys', plat:'prime', date:'2026-08-27'},
  {title:'17 Again', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Ready or Not', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Straight Outta Compton', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Lovesick', plat:'netflix', date:'2026-09-02', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Smile 2', plat:'netflix', date:'2026-09-03', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'The Gentlemen — Season 2', plat:'netflix', date:'2026-09-03', source:'Netflix (About Netflix)', sourceUrl:'https://about.netflix.com/en/news/netflix-confirms-renewals-for-uk-fan-favourites-and-debuts-trailer-for-the-gentlemen-season-2', verified:'Aug 26'},
  {title:'Earle Meets World', plat:'netflix', date:'2026-09-04', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Teenage Wasteland', plat:'netflix', date:'2026-09-04', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Poh Cooks Malaysia', plat:'max', date:'2026-09-01', status:'corroborated', source:'One More Game', sourceUrl:'https://onemoregame.ph/2026/08/hbo-max-september-2026-highlights/', verified:'Aug 26'},
  {title:'Aztec Batman: Clash of Empires', plat:'max', date:'2026-09-04', status:'corroborated', source:'One More Game', sourceUrl:'https://onemoregame.ph/2026/08/hbo-max-september-2026-highlights/', verified:'Aug 26'},
  {title:'The Runner', plat:'prime', date:'2026-09-02', status:'corroborated', source:'DIRECTV Insider', sourceUrl:'https://www.directv.com/insider/tv-premiere-dates/', verified:'Aug 26'},
  {title:'The Mandalorian and Grogu', plat:'disney', date:'2026-09-02', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'LEGO Star Wars: The Mandalorian', plat:'disney', date:'2026-09-02', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'9/11: United We Stand — 25 Years Later', plat:'disney', date:'2026-09-02', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Homicide Squad New Orleans — Season 3', plat:'disney', date:'2026-09-03', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Paranormal State — Seasons 1–2', plat:'disney', date:'2026-09-03', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Spider-Man: Far From Home', plat:'disney', date:'2026-09-04', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'}
];

const STATS = {};
Object.keys(PLATFORMS).forEach(k=>{
  const addedCount = ADDED.filter(a=>a.plat===k && isAddedThisWeek(a)).length;
  const override = STATS_OVERRIDES[k];
  if(override){
    STATS[k] = Object.assign({added: addedCount}, override);
  } else {
    const removedCount = LEAVING.filter(l=> l.plat===k && l.status!=='unconfirmed' && inCurrentWeek(l.date)).length;
    STATS[k] = {added: addedCount, removed: removedCount};
  }
});

const TAGS = ['all','cancellation','renewal','new-season','release-date','price','ad-tier','password-policy','free-trial'];

const LOG = [
  {date:'Aug 24', plat:'netflix', tag:'renewal', verified:'Aug 25', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/the-gentlemen-season-3-release-date-cast-news', text:'Netflix renews <b>The Gentlemen</b> for Season 3 ahead of Season 2\'s premiere', what:'Netflix confirmed a third season before Season 2 (streaming Sept 3) has even released.', why:'An early renewal signals strong internal confidence in the show ahead of its next season debut.'},
  {date:'Aug 20', plat:'netflix', tag:'cancellation', featured:true, verified:'Aug 25', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', text:'Netflix confirms <b>Outer Banks</b> Season 5 is the final season', what:'Tudum\'s official August 2026 roundup explicitly describes Season 5, which premiered Aug 20, as "the final season" of Outer Banks.', why:'One of Netflix\'s flagship YA franchises is ending after five seasons — likely the single biggest story of the week.'},
  {date:'Aug 20', plat:'prime', tag:'renewal', featured:true, verified:'Aug 25', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/sterling-point-series-prime-video', text:'Prime Video renews <b>Sterling Point</b> for Season 2', what:'Amazon confirmed a second season order for Sterling Point.', why:'One of the platform\'s newer originals gets a fast renewal, signaling strong internal confidence.'},
  {date:'Aug 12', plat:'prime', tag:'renewal', featured:true, verified:'Aug 25', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/prime-video-reacher-how-to-watch', text:'Prime Video\'s <b>Reacher</b> Season 5 renewal confirmed/updated Aug 12', what:'Amazon\'s article confirming Reacher Season 5 was originally published May 11 and updated Aug 12 with streaming details — the renewal itself was not first announced on this date.', why:'Confirms Prime\'s biggest action franchise continues, with Neagley and Terminal List S2 also on the way.'},
  {date:'Sep 16', plat:'prime', tag:'release-date', verified:'Aug 25', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/watch-neagley-reacher-prime-video', text:'Prime Video sets <b>Neagley</b> premiere for Sep 16', what:'All eight episodes of the Reacher spinoff premiere Sep 16, per Amazon\'s official page.', why:'First concrete date for the spinoff since it was announced, giving fans a target.'},
  {date:'Oct 21', plat:'prime', tag:'release-date', verified:'Aug 25', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/terminal-list-prime-video-chris-pratt', text:'Prime Video sets <b>The Terminal List: Season 2</b> premiere for Oct 21', what:'All eight episodes premiere Oct 21, per Amazon\'s official page.', why:'One of Prime\'s highest-profile originals returns after a multi-year gap.'},
  {date:'Sep 3', plat:'netflix', tag:'new-season', featured:true, verified:'Aug 26', source:'Netflix (About Netflix)', sourceUrl:'https://about.netflix.com/en/news/netflix-confirms-renewals-for-uk-fan-favourites-and-debuts-trailer-for-the-gentlemen-season-2', text:'Netflix confirms <b>The Gentlemen</b> Season 2 premieres Sep 3', what:'Netflix released the full trailer and confirmed Season 2\'s September 3 launch, alongside news of an already-confirmed third season.', why:'Gives fans a firm date for the long-awaited second season.'}
];

// ── TITLES: consolidated per-title records for permanent title pages ────
// Groups LEAVING + ADDED entries by slug so a title with multiple dates
// (e.g. a show airing on two different days this week) gets one page with
// a real multi-entry history, instead of colliding or losing data. Also
// pulls titles named in the Signal Log (e.g. a renewal or cancellation)
// so those get pages too, even though they're not in LEAVING/ADDED.
function buildTitles(){
  const map = {};
  function addEvent(item, type){
    const slug = slugify(item.title);
    if(!map[slug]){
      map[slug] = {slug, title: item.title, plat: item.plat, events: []};
    }
    map[slug].events.push(Object.assign({type}, item));
  }
  LEAVING.forEach(item => addEvent(item, 'leaving'));
  ADDED.forEach(item => addEvent(item, 'added'));
  LOG.forEach(entry => {
    const m = entry.text.match(/<b>(.*?)<\/b>/);
    if(!m) return;
    const titleName = m[1];
    addEvent({
      title: titleName,
      plat: entry.plat,
      date: logDateToISO(entry.date),
      source: entry.source,
      sourceUrl: entry.sourceUrl,
      verified: entry.verified,
      status: entry.status,
      text: entry.text,
      what: entry.what,
      why: entry.why
    }, entry.tag);
  });
  Object.values(map).forEach(t=>{
    t.events.sort((a,b)=> a.date.localeCompare(b.date));
  });
  return map;
}
const TITLES = buildTitles();

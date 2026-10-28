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
  return rawTitle.replace(/\s*[—–-]\s*(Seasons?|Part)\s*\d+.*$/i, '').trim();
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

// TODAY now reads the visitor's real clock — no more manually bumping this
// every few days. It's normalized to local midnight so day-based math
// (daysUntil, isCurrentlyLeavingSoon, etc.) stays exact.
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const LAST_VERIFICATION_DATE = 'Oct 28, 2026'; // when this week's research pass was actually done —
                                                 // use this for "when did we check this," never an
                                                 // event's own date (which can be in the future).
                                                 // Update this by hand each time you add new entries —
                                                 // it's a record of your work, not something to compute.

// WEEK_START/WEEK_END auto-track a rolling window around today instead of a
// fixed range you had to edit every update. It looks back a week (so
// just-released titles still show) and ahead two weeks (so confirmed
// upcoming titles show as "scheduled"). Adjust the two numbers to taste.
const WINDOW_DAYS_BACK = 7;
const WINDOW_DAYS_AHEAD = 14;
const WEEK_START = new Date(TODAY.getTime() - WINDOW_DAYS_BACK * 86400000);
const WEEK_END = new Date(TODAY.getTime() + WINDOW_DAYS_AHEAD * 86400000);
WEEK_END.setHours(23, 59, 59, 999);

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
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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
  if(!mm) return shortDate;
  // No year in LOG dates: pick the year that lands closest to today (handles Dec -> Jan rollover)
  const y = TODAY.getFullYear();
  const best = [y-1, y, y+1]
    .map(yr => ({yr, diff: Math.abs(new Date(`${yr}-${mm}-${dd}T00:00:00`) - TODAY)}))
    .sort((p,q) => p.diff - q.diff)[0].yr;
  return `${best}-${mm}-${dd}`;
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
  {title:'Crashing', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Oct 19'},
  {title:'Black Lightning', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Oct 19'},
  {title:'Creed', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Creed II', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Creed III', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Orphan Black', plat:'netflix', date:'2026-09-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Aug 26'},
  {title:'Here and There (Dito at Doon)', plat:'netflix', date:'2026-09-02', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'The Bling Ring', plat:'netflix', date:'2026-09-03', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Ginger & Rosa', plat:'netflix', date:'2026-09-05', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Jandino: Whatever It Takes', plat:'netflix', date:'2026-09-09', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Oct 19'},
  {title:'Life', plat:'netflix', date:'2026-09-23', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-september-2026/', verified:'Oct 19'},
  {title:'Poor Things', plat:'netflix', date:'2026-09-07', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Sep 2'},
  {title:'Bombshell', plat:'netflix', date:'2026-09-10', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Sep 2'},
  {title:'Nashville — Seasons 1–6', plat:'netflix', date:'2026-09-15', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Sep 2'},
  {title:'Vice', plat:'prime', date:'2026-09-04', status:'corroborated', source:'Exclaim!', sourceUrl:'https://exclaim.ca/film/article/here-s-what-s-leaving-prime-video-in-september-2026', verified:'Sep 2'},
  {title:'Lopez vs. Lopez — Seasons 1–2', plat:'netflix', date:'2026-09-18', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Sep 13'},
  {title:'Anatomy of a Fall', plat:'netflix', date:'2026-09-23', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Sep 13'},
  {title:'Dawson\'s Creek', plat:'netflix', date:'2026-10-03', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'Nurse Jackie', plat:'netflix', date:'2026-10-07', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'Poldark', plat:'netflix', date:'2026-10-08', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'The Hunger Games', plat:'netflix', date:'2026-10-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'The Hunger Games: Catching Fire', plat:'netflix', date:'2026-10-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'The Hunger Games: Mockingjay - Part 1', plat:'netflix', date:'2026-10-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'The Hunger Games: Mockingjay - Part 2', plat:'netflix', date:'2026-10-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'The Hunger Games: The Ballad of Songbirds and Snakes', plat:'netflix', date:'2026-10-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'Deadwind', plat:'netflix', date:'2026-10-29', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 1'},
  {title:'A Dog\'s Purpose', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'A League of Their Own', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'Apollo 13', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'Clueless', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'Fargo', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'Ghostbusters', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'Gone Girl', plat:'netflix', date:'2026-10-01', status:'corroborated', source:'Forbes', sourceUrl:'https://www.forbes.com/sites/erikkain/2026/09/30/15-great-movies-leaving-netflix-this-week/', verified:'Oct 1'},
  {title:'Black Adam', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'American Sniper', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Angels & Demons', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Jumanji', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Minions', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Selma', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Speed', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Nightcrawler', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Smallfoot', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Fast Five', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Furious 7', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'The Fast and the Furious', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Hitch', plat:'netflix', date:'2026-11-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'13 Going on 30', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Broadchurch — Seasons 1–3', plat:'netflix', date:'2026-11-01', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Minx — Seasons 1–3', plat:'netflix', date:'2026-11-04', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'The End of the F***ing World — Seasons 1–2', plat:'netflix', date:'2026-11-05', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Heart Eyes', plat:'netflix', date:'2026-11-08', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'The Lost City', plat:'netflix', date:'2026-11-09', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Survivor\'s Remorse — Seasons 1–4', plat:'netflix', date:'2026-11-11', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Firestarter', plat:'netflix', date:'2026-11-12', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'The Big C — Seasons 1–4', plat:'netflix', date:'2026-11-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Paddington in Peru', plat:'netflix', date:'2026-11-15', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'The Girl with the Dragon Tattoo', plat:'netflix', date:'2026-11-15', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'The Shallows', plat:'netflix', date:'2026-11-15', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'I\'m Still Here', plat:'netflix', date:'2026-11-17', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'},
  {title:'Saw X', plat:'netflix', date:'2026-11-19', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'True Romance', plat:'netflix', date:'2026-11-19', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'The Resident — Seasons 1–6', plat:'netflix', date:'2026-11-20', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'Gilmore Girls: A Year in the Life', plat:'netflix', date:'2026-11-25', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/whats-leaving-netflix', verified:'Oct 28'},
  {title:'M3GAN 2.0', plat:'netflix', date:'2026-11-26', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/leaving-soon/whats-leaving-netflix-in-november-2026/', verified:'Oct 28'}
];

const ADDED = [
  {title:'M3GAN', plat:'netflix', date:'2026-08-24', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-august-2026/', verified:'Oct 19'},
  {title:'Revival — Season 1', plat:'netflix', date:'2026-08-24', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-august-2026/', verified:'Oct 19'},
  {title:'Stamptown', plat:'netflix', date:'2026-08-25', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Aug 25'},
  {title:'Leanne — Season 2', plat:'netflix', date:'2026-08-27', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/leanne-morgan-comedy-series-season-2', verified:'Aug 25'},
  {title:'All the Truth in My Lies', plat:'netflix', date:'2026-08-28', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-august-2026/', verified:'Oct 19'},
  {title:'The Whisper Man', plat:'netflix', date:'2026-08-28', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/the-whisper-man-release-date-cast-news', verified:'Aug 25'},
  {title:'Margarita: Make Your Story Count S3', plat:'max', date:'2026-08-24', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/whats-new-hbo-max-august-1', verified:'Aug 25'},
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
  {title:'The Last Sunrise', plat:'prime', date:'2026-08-26', status:'corroborated', source:'TheWrap', sourceUrl:'https://www.thewrap.com/creative-content/what-to-watch/everything-new-on-amazon-prime-video-august-2026/', verified:'Oct 19'},
  {title:'Nickel Boys', plat:'prime', date:'2026-08-27', status:'corroborated', source:'TheWrap', sourceUrl:'https://www.thewrap.com/creative-content/what-to-watch/everything-new-on-amazon-prime-video-august-2026/', verified:'Oct 19'},
  {title:'17 Again', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Ready or Not', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Straight Outta Compton', plat:'netflix', date:'2026-09-01', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Lovesick', plat:'netflix', date:'2026-09-02', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 2'},
  {title:'Smile 2', plat:'netflix', date:'2026-09-03', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'The Gentlemen — Season 2', plat:'netflix', date:'2026-09-03', source:'Netflix (About Netflix)', sourceUrl:'https://about.netflix.com/en/news/netflix-confirms-renewals-for-uk-fan-favourites-and-debuts-trailer-for-the-gentlemen-season-2', verified:'Aug 26'},
  {title:'Earle Meets World', plat:'netflix', date:'2026-09-04', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Teenage Wasteland', plat:'netflix', date:'2026-09-04', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-september-2026/', verified:'Aug 26'},
  {title:'Poh Cooks Malaysia', plat:'max', date:'2026-09-01', status:'corroborated', source:'One More Game', sourceUrl:'https://onemoregame.ph/2026/08/hbo-max-september-2026-highlights/', verified:'Aug 26'},
  {title:'Aztec Batman: Clash of Empires', plat:'max', date:'2026-09-04', status:'corroborated', source:'One More Game', sourceUrl:'https://onemoregame.ph/2026/08/hbo-max-september-2026-highlights/', verified:'Aug 26'},
  {title:'The Runner', plat:'prime', date:'2026-09-02', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/prime-video-september-films-shows-sports-2026', verified:'Sep 2'},
  {title:'The Mandalorian and Grogu', plat:'disney', date:'2026-09-02', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 2'},
  {title:'LEGO Star Wars: The Mandalorian', plat:'disney', date:'2026-09-02', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 2'},
  {title:'9/11: United We Stand — 25 Years Later', plat:'disney', date:'2026-09-02', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Homicide Squad New Orleans — Season 3', plat:'disney', date:'2026-09-03', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Paranormal State — Seasons 1–2', plat:'disney', date:'2026-09-03', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Spider-Man: Far From Home', plat:'disney', date:'2026-09-04', status:'corroborated', source:'Williamson Source', sourceUrl:'https://williamsonsource.com/whats-new-on-disney-in-september-2026/', verified:'Aug 26'},
  {title:'Turning Point: Generation 9/11', plat:'netflix', date:'2026-09-02', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 2'},
  {title:'1000-lb Sisters — Season 9', plat:'max', date:'2026-09-02', status:'corroborated', source:'TheWrap', sourceUrl:'https://www.thewrap.com/creative-content/what-to-watch/everything-new-on-streaming-september-2026/', verified:'Sep 2'},
  {title:'Stavros Halkias: Uncle Stav', plat:'netflix', date:'2026-09-08', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Untold Mr. T: I Pity The Fool', plat:'netflix', date:'2026-09-08', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Prom Night', plat:'netflix', date:'2026-09-09', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Why Did I Get Married Again?', plat:'netflix', date:'2026-09-09', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Call My Agent! The Movie', plat:'netflix', date:'2026-09-10', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Crew Girl', plat:'netflix', date:'2026-09-10', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'The Perfect Lie', plat:'netflix', date:'2026-09-10', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'We Don\'t Live Here Anymore', plat:'netflix', date:'2026-09-10', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Go Team!', plat:'netflix', date:'2026-09-11', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Physical 100: Italy', plat:'netflix', date:'2026-09-11', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Stolen Heartbeats', plat:'netflix', date:'2026-09-11', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Tribeca 25', plat:'netflix', date:'2026-09-11', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Gabby\'s Dollhouse — Season 14', plat:'netflix', date:'2026-09-14', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Jo Koy: Blue in the Face', plat:'netflix', date:'2026-09-15', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'The Doll', plat:'netflix', date:'2026-09-16', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'The Fixers', plat:'netflix', date:'2026-09-17', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Monster: The Lizzie Borden Story', plat:'netflix', date:'2026-09-17', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Not a Stranger', plat:'netflix', date:'2026-09-17', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Plastic Beauty', plat:'netflix', date:'2026-09-17', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Stranger Things: Tales From \'85 — Season 2', plat:'netflix', date:'2026-09-17', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Best of the Best', plat:'netflix', date:'2026-09-18', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Pokémon Horizons — Part 4', plat:'netflix', date:'2026-09-18', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Stop! That! Train!', plat:'netflix', date:'2026-09-20', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Sep 13'},
  {title:'Chad Powers — Season 2', plat:'disney', date:'2026-09-03', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Made in Korea — Season 2', plat:'disney', date:'2026-09-09', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'The Secret Lives of Mormon Wives — Season 5', plat:'disney', date:'2026-09-10', status:'corroborated', source:'Multiple third-party reports', sourceUrl:'https://www.tomsguide.com/entertainment/streaming/how-to-watch-the-secret-lives-of-mormon-wives-season-5-online-from-anywhere', verified:'Sep 13'},
  {title:'Kraven the Hunter', plat:'disney', date:'2026-09-13', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Dancing with the Stars — Season 35', plat:'disney', date:'2026-09-15', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Minimum Security', plat:'disney', date:'2026-09-16', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'PLAVE Asia Tour [DASH: Quantum Leap]', plat:'disney', date:'2026-09-16', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Unexpected Loves', plat:'disney', date:'2026-09-16', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Booked: First Day In — Season 4', plat:'disney', date:'2026-09-17', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Magicampers: Shorts — Season 2', plat:'disney', date:'2026-09-18', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-september-2026', verified:'Sep 13'},
  {title:'Drawn Together', plat:'prime', date:'2026-09-09', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/prime-video-september-films-shows-sports-2026', verified:'Sep 13'},
  {title:'Bombshell', plat:'prime', date:'2026-09-10', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/prime-video-september-films-shows-sports-2026', verified:'Sep 13'},
  {title:'A Love Other Than Yours', plat:'prime', date:'2026-09-12', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/prime-video-september-films-shows-sports-2026', verified:'Sep 13'},
  {title:'Neagley', plat:'prime', date:'2026-09-16', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/watch-neagley-reacher-prime-video', verified:'Sep 13'},
  {title:'The Howard Stern Show', plat:'max', date:'2026-09-17', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max-brings-howard-stern-show-streaming-debuting-september-17', verified:'Sep 13'},
  {title:'NFL Melbourne Game: 49ers vs. Rams', plat:'netflix', date:'2026-09-10', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/features/nfl-on-netflix-schedule', verified:'Sep 16'},
  {title:'A Killer Story', plat:'max', date:'2026-09-10', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-original-documentary-series-killer-story-debuts-september-10', verified:'Sep 16'},
  {title:'Halloween Wars — Season 16', plat:'max', date:'2026-09-14', source:'Food Network', sourceUrl:'https://www.foodnetwork.com/shows/articles/food-network-serves-up-a-frightful-fall-season-2026', verified:'Sep 16'},
  {title:'Halloween Baking Championship — Season 12', plat:'max', date:'2026-09-15', source:'Food Network', sourceUrl:'https://www.foodnetwork.com/shows/articles/food-network-serves-up-a-frightful-fall-season-2026', verified:'Sep 16'},
  {title:'Youth', plat:'max', date:'2026-09-20', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-original-comedy-series-youth-sharon-horgan-debuts-september-20', verified:'Sep 16'},
  {title:'Tyler Perry\'s Doing Life', plat:'netflix', date:'2026-10-02', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/news/doing-life-tyler-perry-netflix-movie-release-date/', verified:'Oct 1'},
  {title:'Who Is Martin Mull?', plat:'netflix', date:'2026-10-07', status:'corroborated', source:'Movie Insider', sourceUrl:'https://www.movieinsider.com/m25719/who-is-martin-mull', verified:'Oct 1'},
  {title:'The Diplomat — Season 4', plat:'netflix', date:'2026-10-15', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Oct 18'},
  {title:'Norm: The Tale of Norm Macdonald', plat:'netflix', date:'2026-10-16', status:'corroborated', source:'EyeCrave', sourceUrl:'https://eyecrave.net/news/norm-the-tale-of-norm-macdonald-judd-apatow-documentary-coming-to-netflix-october-16/', verified:'Oct 1'},
  {title:'Nobody Wants This — Season 3', plat:'netflix', date:'2026-10-22', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Oct 18'},
  {title:'Paralyzed by Hope: The Maria Bamford Story', plat:'netflix', date:'2026-10-23', status:'corroborated', source:'Netflix Tudum', sourceUrl:'https://theplaylist.net/paralyzed-by-hope-maria-bamford-story-trailer-judd-apatow-20260928/', verified:'Oct 1'},
  {title:'The One About Matthew Perry', plat:'netflix', date:'2026-10-27', status:'corroborated', source:'Deadline', sourceUrl:'https://deadline.com/2026/09/the-one-about-matthew-perry-netflix-premiere-trailer-1237116154/', verified:'Oct 1'},
  {title:'SCTV: The Greatest Show You\'ve Never Heard Of', plat:'netflix', date:'2026-10-30', status:'corroborated', source:'Film Threat', sourceUrl:'https://filmthreat.com/news/take-off-eh-netflixs-sctv-doc-finally-gives-the-greatest-show-youve-never-heard-of-its-due-on-october-30/', verified:'Oct 1'},
  {title:'War', plat:'max', date:'2026-10-01', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'90 Day Fiancé: The Other Way — Season 8', plat:'max', date:'2026-10-04', source:'TLC', sourceUrl:'https://www.tlc.com/shows/90-day-fiance-the-other-way/articles/90-day-fiance-before-the-90-days-first-look-trailer-video-premiere-date-announcement', verified:'Oct 1'},
  {title:'The Housemaid', plat:'max', date:'2026-10-09', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'Rage — Season 2', plat:'max', date:'2026-10-09', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'The Pet Cemetery Murders: A Ghost Story', plat:'max', date:'2026-10-11', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'The Death of Robin Hood', plat:'max', date:'2026-10-16', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'The Invite', plat:'max', date:'2026-10-23', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'Adventure Time: Side Quests — Season 2', plat:'disney', date:'2026-10-02', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'Vampirina: Teenage Vampire — Season 2', plat:'disney', date:'2026-10-07', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'Benefits with Friends — Season 2', plat:'disney', date:'2026-10-09', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'VisionQuest', plat:'disney', date:'2026-10-14', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'Chibi Tiny Tales — Season 8', plat:'disney', date:'2026-10-17', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'Locker Diaries: Coven Academy', plat:'disney', date:'2026-10-17', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'Super Scam Me', plat:'disney', date:'2026-10-17', source:'D23 (Disney)', sourceUrl:'https://d23.com/everything-new-coming-to-disney-and-hulu-october-2026/', verified:'Oct 19'},
  {title:'Carrie', plat:'prime', date:'2026-10-07', source:'Amazon', sourceUrl:'https://www.aboutamazon.com/news/entertainment/carrie-stephen-king-mike-flanagan-prime-video', verified:'Oct 1'},
  {title:'Love of Your Life', plat:'prime', date:'2026-10-14', source:'Amazon MGM Studios', sourceUrl:'https://press.amazonmgmstudios.com/us/en/original-movies/love-of-your-life', verified:'Oct 19'},
  {title:'Helluva Boss — Season 3 (Part 1)', plat:'prime', date:'2026-10-14', status:'corroborated', source:'BroadwayWorld', sourceUrl:'https://www.broadwayworld.com/bwwtv/article/HELLUVA-BOSS-Season-Three-to-Premiere-on-Prime-Video-20260916', verified:'Oct 1'},
  {title:'Masterplan', plat:'prime', date:'2026-10-16', source:'Amazon', sourceUrl:'https://www.aboutamazon.com/news/entertainment/masterplan-stanley-tucci-prime-video', verified:'Oct 1'},
  {title:'The Terminal List — Season 2', plat:'prime', date:'2026-10-21', source:'Amazon', sourceUrl:'https://www.aboutamazon.com/news/entertainment/terminal-list-prime-video-chris-pratt', verified:'Oct 1'},
  {title:'Apocalypse Z: New World', plat:'prime', date:'2026-10-30', status:'corroborated', source:'Amazon', sourceUrl:'https://www.aboutamazon.com/news/entertainment/apocalypse-z-2-new-world-sequel-prime-video', verified:'Oct 19'},
  {title:'Blindspotting — Seasons 1–2', plat:'netflix', date:'2026-10-20', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Oct 18'},
  {title:'Cyberpunk: Edgerunners 2', plat:'netflix', date:'2026-10-20', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/cyberpunk-edgerunners-2-release-date-news', verified:'Oct 18'},
  {title:'Emily', plat:'netflix', date:'2026-10-21', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Oct 18'},
  {title:'The Mothers of Penguins — Season 2', plat:'netflix', date:'2026-10-21', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', verified:'Oct 18'},
  {title:'Lupin — Part 4', plat:'netflix', date:'2026-10-23', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/lupin-part-4-release-date-photos-news', verified:'Oct 18'},
  {title:'A Dog\'s Perfect Christmas', plat:'netflix', date:'2026-11-04', status:'corroborated', source:'What\'s on Netflix', sourceUrl:'https://www.whats-on-netflix.com/coming-soon/whats-coming-to-netflix-in-november-2026/', verified:'Oct 18'},
  {title:'Possible Love', plat:'netflix', date:'2026-11-06', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/possible-love-cast-release-date-photos', verified:'Oct 18'},
  {title:'Avedon', plat:'netflix', date:'2026-11-11', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/avedon-release-date-news', verified:'Oct 18'},
  {title:'Heartland', plat:'netflix', date:'2026-11-13', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/heartland-release-date-photos-news', verified:'Oct 18'},
  {title:'Anyone But You', plat:'max', date:'2026-10-20', source:'WBD Press', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 19'},
  {title:'The Flores Massacre', plat:'max', date:'2026-10-22', source:'WBD Press', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 19'},
  {title:'Kordell Stewart: Slash & Burn', plat:'max', date:'2026-10-27', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 1'},
  {title:'Cannibal Poet', plat:'max', date:'2026-10-29', source:'WBD Press', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max/whats-new-hbo-max-october-1', verified:'Oct 19'},
  {title:'Ariel: Dolphin Cove Tales — Season 1', plat:'disney', date:'2026-11-04', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Wolves Up Close with Bertie Gregory', plat:'disney', date:'2026-11-06', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Pokémon the Series: The Beginning — Season 2', plat:'disney', date:'2026-11-11', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'A Proud Family Wizmas', plat:'disney', date:'2026-11-14', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Love in Disguise', plat:'prime', date:'2026-10-19', status:'corroborated', source:'TheWrap', sourceUrl:'https://www.thewrap.com/creative-content/what-to-watch/everything-new-prime-video-october-2026/', verified:'Oct 18'},
  {title:'The Bride!', plat:'prime', date:'2026-10-23', status:'corroborated', source:'TheWrap', sourceUrl:'https://www.thewrap.com/creative-content/what-to-watch/everything-new-prime-video-october-2026/', verified:'Oct 18'},
  {title:'Final Table', plat:'prime', date:'2026-10-24', status:'corroborated', source:'TheWrap', sourceUrl:'https://www.thewrap.com/creative-content/what-to-watch/everything-new-prime-video-october-2026/', verified:'Oct 18'},
  {title:'The Greatest', plat:'prime', date:'2026-11-04', source:'Amazon MGM Studios', sourceUrl:'https://press.amazonmgmstudios.com/us/en/press-release/prime-video-announces-november-4-premiere-date-for', verified:'Oct 18'},
  {title:'Madden', plat:'prime', date:'2026-11-18', source:'Amazon News', sourceUrl:'https://www.aboutamazon.com/news/entertainment/madden-movie-nicolas-cage-prime-video', verified:'Oct 19'},
  {title:'Blade Runner 2099', plat:'prime', date:'2026-11-25', source:'Amazon News', sourceUrl:'https://www.aboutamazon.com/news/entertainment/blade-runner-2099-prime-video', verified:'Oct 19'},
  {title:'Miraculous: Tales of Ladybug & Cat Noir — Season 7', plat:'disney', date:'2026-11-21', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Percy Jackson and the Olympians — Season 3', plat:'disney', date:'2026-11-20', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Dasher', plat:'disney', date:'2026-11-28', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Black Bag', plat:'disney', date:'2026-11-02', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Heart Eyes', plat:'disney', date:'2026-11-08', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Love Hurts', plat:'disney', date:'2026-11-09', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Paddington in Peru', plat:'disney', date:'2026-11-15', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Mickey 17', plat:'disney', date:'2026-11-23', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Mummies', plat:'disney', date:'2026-11-26', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Meg 2: The Trench', plat:'disney', date:'2026-11-01', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'The Banshees of Inisherin', plat:'disney', date:'2026-11-01', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Rivals — Season 2 Part 2', plat:'disney', date:'2026-11-11', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Expedition: Saving Our Seas', plat:'disney', date:'2026-11-14', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Bluey: Fancy Restaurant', plat:'disney', date:'2026-11-16', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'How The Tudors Lost Their Heads', plat:'disney', date:'2026-11-17', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'Mickey\'s Home Alone', plat:'disney', date:'2026-11-27', source:'Disney+ Press', sourceUrl:'https://press.disneyplus.com/news/next-on-disney-plus-november-2026', verified:'Oct 19'},
  {title:'The Lord of the Rings: The Rings of Power — Season 3', plat:'prime', date:'2026-11-11', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/lord-of-the-rings-rings-of-power-season-3-prime-video', verified:'Oct 28'}
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
  {date:'Sep 3', plat:'netflix', tag:'new-season', featured:true, verified:'Aug 26', source:'Netflix (About Netflix)', sourceUrl:'https://about.netflix.com/en/news/netflix-confirms-renewals-for-uk-fan-favourites-and-debuts-trailer-for-the-gentlemen-season-2', text:'Netflix confirms <b>The Gentlemen</b> Season 2 premieres Sep 3', what:'Netflix released the full trailer and confirmed Season 2\'s September 3 launch, alongside news of an already-confirmed third season.', why:'Gives fans a firm date for the long-awaited second season.'},
  {date:'Dec 9', plat:'prime', tag:'release-date', featured:true, verified:'Sep 2', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/maxton-hall-prime-video', text:'Prime Video sets <b>Maxton Hall</b> Season 3 premiere for Dec 9, confirmed as the final season', what:'Amazon confirmed the third and final season of Maxton Hall premieres December 9, 2026, concluding Ruby and James\' story.', why:'Gives fans a confirmed final-season date for one of Prime Video\'s most successful international originals.'},
  {date:'Sep 17', plat:'netflix', tag:'new-season', featured:true, verified:'Sep 13', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', text:'<b>Stranger Things: Tales From \'85</b> Season 2 premieres Sep 17', what:'Netflix confirmed the animated spinoff\'s second season, following the gang uncovering ghostly apparitions and strange creatures.', why:'Extends one of Netflix\'s flagship franchises with a new animated installment.'},
  {date:'Sep 17', plat:'netflix', tag:'new-season', verified:'Sep 13', source:'Netflix Tudum', sourceUrl:'https://www.netflix.com/tudum/articles/new-on-netflix', text:'<b>Monster: The Lizzie Borden Story</b> premieres Sep 17', what:'Netflix confirmed the next installment of the Monster anthology, starring Ella Beatty as the accused axe murderer.', why:'Continues Ryan Murphy\'s high-profile true-crime anthology series.'},
  {date:'Sep 17', plat:'max', tag:'new-season', featured:true, verified:'Sep 13', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-max-brings-howard-stern-show-streaming-debuting-september-17', text:'<b>The Howard Stern Show</b> debuts globally on HBO Max Sep 17', what:'HBO Max partnered with Stern\'s production company and SiriusXM to release weekly filmed episodes, debuting worldwide Sep 17 with new episodes every Thursday.', why:'A major first-time streaming deal bringing one of radio\'s biggest names to HBO Max.'},
  {date:'Sep 11', plat:'prime', tag:'renewal', verified:'Sep 13', source:'Amazon News (aboutamazon.com)', sourceUrl:'https://www.aboutamazon.com/news/entertainment/off-campus-hockey-series-prime-video', text:'<b>Off Campus</b> officially renewed for Season 2', what:'Amazon updated its announcement confirming Off Campus has been renewed for a second season.', why:'Confirms the hockey series will continue after its debut season.'},
  {date:'Sep 20', plat:'max', tag:'new-season', featured:true, verified:'Sep 16', source:'WBD Pressroom', sourceUrl:'https://press.wbd.com/us/media-release/hbo-original-comedy-series-youth-sharon-horgan-debuts-september-20', text:'<b>Youth</b> premieres on HBO Max Sep 20', what:'HBO confirmed the Sharon Horgan comedy premieres its first two episodes Sunday, Sep 20 at 10pm ET/PT, with new episodes weekly through a Nov 1 finale.', why:'A notable new HBO Original starring and created by Sharon Horgan (Bad Sisters, Catastrophe).'},
  {date:'Oct 21', plat:'disney', tag:'price', featured:true, status:'corroborated', verified:'Oct 18', source:'Cord Cutters (Gadget Hacks)', sourceUrl:'https://cord-cutters.gadgethacks.com/news/disney-and-hulu-price-increase-2026-new-costs-compared/', text:'Disney+ U.S. prices increase for existing subscribers starting billing cycles on/after <b>Oct 21</b>', what:'New-subscriber pricing ($12.49/mo with ads, $21.49/mo Premium, $214.99/yr) took effect Sep 23; existing subscribers see the new rates starting their first billing cycle on or after October 21.', why:'Anyone who joined before Sep 23 will see a higher charge starting that billing cycle.'},
  {date:'Sep 24', plat:'netflix', tag:'release-date', featured:true, verified:'Oct 1', source:'Variety', sourceUrl:'https://variety.com/2026/music/global/gary-glitter-documentary-postponed-netflix-1236873429/', text:'Netflix postpones <b>Hunting Gary Glitter</b>, previously set for Oct 14', what:'Netflix pulled the three-part documentary three weeks before its planned release, citing "new legal information," and removed the trailer with no replacement date announced.', why:'A previously confirmed October 14 release is no longer happening and has no new date.'}
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
    // price/policy entries bold a date or amount, not a title, so they get no title page
    if(entry.tag === 'price' || entry.tag === 'policy') return;
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

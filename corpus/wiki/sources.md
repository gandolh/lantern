---
summary: The two outside sources Lantern's server calls, as read in their docs on 2026-11-04. TMDB (films, series, search, details with keywords, credits, external ids and recommendations in one call, the popular lists for the rating cards, genre lists, image sizes, the two kinds of key, about 40 requests a second) and OMDb by IMDb id (IMDb, Rotten Tomatoes and Metacritic scores; 1,000 calls a day; its error answers). The terms: TMDB non-commercial, logo plus the "not endorsed or certified" notice, six months of caching at most, no AI or machine learning; OMDb CC BY-NC 4.0. What still needs checking against a real call.
updated: 2026-11-04
---

# Sources: TMDB and OMDb

Lantern's only outside sources. Every call is made by the server, through a queue and a cache;
the browser never calls either one ([decisions.md](decisions.md)). How the server calls them,
as built: [source-calls.md](source-calls.md). Read on 2026-11-04 from the
docs linked below; no real call has been made yet, so the shapes marked "check" are from the
docs or from the list shape, and get checked against the first real answers.

## TMDB

Base `https://api.themoviedb.org/3`, JSON. Docs: <https://developer.themoviedb.org/docs>.

### The key

TMDB's API settings page shows two values, and either works on v3 with the same access
([authentication](https://developer.themoviedb.org/docs/authentication-application)):

- the **API key**, sent as the `api_key` query parameter;
- the **API Read Access Token**, sent as `Authorization: Bearer <token>`.

Lantern's `TMDB_API_KEY` takes either: a value shaped like a JWT (three dot-separated parts,
starting `eyJ`) goes in the header, anything else in the query. A URL that carries `api_key` is
never logged or put in an error message.

### Rate limit

"Somewhere in the 40 requests per second range", subject to change; answer a `429` by backing
off. The old 40-per-10-seconds cap was dropped on 2019-12-16
([rate limiting](https://developer.themoviedb.org/docs/rate-limiting)). Lantern spaces its calls
well under that.

### The endpoints Lantern uses

All with `language=en-US` (English only), and `include_adult=false` where it applies.

| Need | Endpoint | Notes |
|---|---|---|
| Search | `GET /search/multi?query=&page=` | Films, series and people in one list; each item has `media_type`. Lantern keeps `movie` and `tv`. Films have `title`, `release_date`; series `name`, `first_air_date` ([ref](https://developer.themoviedb.org/reference/search-multi)) |
| Film | `GET /movie/{id}?append_to_response=keywords,credits,recommendations` | `imdb_id`, `title`, `release_date`, `runtime`, `genres[{id,name}]`, `overview`, `poster_path`, `backdrop_path`, `vote_average`, `vote_count`, `popularity`, `tagline`, `status` ([ref](https://developer.themoviedb.org/reference/movie-details)) |
| Series | `GET /tv/{id}?append_to_response=keywords,aggregate_credits,external_ids,recommendations` | `name`, `first_air_date`, `last_air_date`, `episode_run_time[]`, `number_of_seasons`, `number_of_episodes`, `genres`, `created_by[{id,name}]`, `overview`, `poster_path`, `status`. No IMDb id of its own: it comes from `external_ids` ([ref](https://developer.themoviedb.org/reference/tv-series-details)) |
| Keywords | appended `keywords` | Films: `{ id, keywords: [{id,name}] }` ([ref](https://developer.themoviedb.org/reference/movie-keywords)). Series: `{ id, results: [{id,name}] }`, a different key ([ref](https://developer.themoviedb.org/reference/tv-series-keywords)) |
| People | appended `credits` (films) or `aggregate_credits` (series) | Films: `cast[]` in billing `order`, `crew[]` with `job` (`Director`). Series: `aggregate_credits` covers every season ("does not return the newest season" only, unlike `credits`), each cast member with `roles[{character, episode_count}]` and `total_episode_count`; it can be large (about 300 KB for a long show), so only the top of it is kept ([ref](https://developer.themoviedb.org/reference/tv-series-aggregate-credits)) |
| IMDb id of a series | appended `external_ids` | `imdb_id` such as `tt0944947` ([ref](https://developer.themoviedb.org/reference/tv-series-external-ids)) |
| Recommendations | appended `recommendations` | The reference page leaves the shape undocumented; it is taken to be the paged list (`page`, `results[]`, `total_pages`), each item as in the popular lists plus `media_type`. Check ([ref](https://developer.themoviedb.org/reference/movie-recommendations)) |
| Cards | `GET /movie/popular?page=` and `GET /tv/popular?page=` | Paged lists of 20, "ordered by popularity"; each is "a discover call behind the scenes" (`sort_by=popularity.desc`). Items carry `genre_ids` ([film](https://developer.themoviedb.org/reference/movie-popular-list), [series](https://developer.themoviedb.org/reference/tv-series-popular-list)) |
| Best-known titles | `GET /discover/movie?sort_by=vote_count.desc&page=` (and `/discover/tv`) | The titles most people have voted on: well known, so likely seen. `vote_count.desc` is an allowed sort ([ref](https://developer.themoviedb.org/reference/discover-movie)) |
| Genre names | `GET /genre/movie/list`, `GET /genre/tv/list` | `{ genres: [{id,name}] }`, to name a list item's `genre_ids` |

`append_to_response` takes up to 20 comma-separated sub-requests and adds each as a key of the
answer, so one call per title gives the details, keywords, people, IMDb id and recommendations
([append to response](https://developer.themoviedb.org/docs/append-to-response)).

Popularity is a "lifetime" score moved by daily votes, views, favourites and watchlist adds
([popularity](https://developer.themoviedb.org/docs/popularity-and-trending)), so the popular
lists lean to what is new. Whether a page number has a ceiling isn't documented; Lantern caps
its own depth and stops on any error.

Fields that may be missing or empty: `poster_path` and `backdrop_path` can be `null`;
`release_date` and `first_air_date` can be `""`. The readers are lenient and keep only the
fields Lantern shows or scores.

### Images

An image URL is `secure_base_url` + size + `file_path`, for example
`https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg`
([image basics](https://developer.themoviedb.org/docs/image-basics)). The sizes from
`/configuration` ([ref](https://developer.themoviedb.org/reference/configuration-details)):

| Kind | Sizes |
|---|---|
| Poster | `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original` |
| Backdrop | `w300`, `w780`, `w1280`, `original` |
| Profile | `w45`, `w185`, `h632`, `original` |

Images need no key. Lantern still fetches them on the server and passes them on, so the
browser talks to Lantern only.

### Attribution

From the FAQ ([faq](https://developer.themoviedb.org/docs/faq)) and the logos page
([logos](https://www.themoviedb.org/about/logos-attribution)), read 2026-11-04:

- "You shall use the TMDB logo to identify your use of the TMDB APIs", one of TMDB's approved
  logos (SVGs on the logos page), in the app's About or Credits section.
- The notice, word for word: "This product uses the TMDB API but is not endorsed or certified
  by TMDB."
- Brand colours: dark blue `#0d253f`, light blue `#01b4e4`, light green `#90cea1`.

## OMDb

`https://www.omdbapi.com/?apikey=<OMDB_API_KEY>&i=<imdb id>`, JSON by default
([omdbapi.com](https://www.omdbapi.com/)). `i` is an IMDb id such as `tt1285016`; `t` (title),
`type` (`movie`, `series`, `episode`), `y`, `plot` (`short` or `full`) are the other
parameters. HTTPS works since 2015-08-15.

Lantern asks once per title, by the IMDb id TMDB gives, and keeps the answer. The answer's
fields Lantern reads (from common use; check on the first real call):

- `Ratings: [{ Source, Value }]`, with sources `Internet Movie Database` (`8.8/10`),
  `Rotten Tomatoes` (`87%`) and `Metacritic` (`74/100`), each present only when known;
- `imdbRating`, `imdbVotes`, `Metascore`, any of which can be `"N/A"`;
- `Response: "True"`, or `Response: "False"` with an `Error` (`Incorrect IMDb ID.`, an invalid
  key, or the daily limit reached).

A free key allows 1,000 requests a day ([API keys](https://www.omdbapi.com/apikey.aspx)). A
refused or failed answer is never cached, so the next view asks again.

## Terms

- **TMDB** ([API terms of use](https://www.themoviedb.org/api-terms-of-use), read 2026-11-04):
  free for non-commercial use ("primary purpose is to create revenue" makes a project
  commercial, per the FAQ). Show the logo and the notice. Cache data for six months at most. Do
  not use TMDB or its content "in connection with, including for training," an AI or
  machine-learning application, so Lantern's suggestions are plain scoring.
- **OMDb**: "All content licensed under CC BY-NC 4.0" ([omdbapi.com](https://www.omdbapi.com/),
  read 2026-11-04); its site terms ([legal](https://www.omdbapi.com/legal.htm)) allow personal,
  non-commercial use only. The site says "This site is not endorsed by or affiliated with
  IMDb.com." Lantern credits OMDb beside the scores.

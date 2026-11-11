import type { OmdbRecord, PoolTitle, Scores, TitleState } from "@lantern/shared";
import { useEffect, type ReactNode } from "react";
import { ApiError } from "./api";
import { kindLabel, runtime, votes, years } from "./format";
import { Link } from "./Link";
import { Poster } from "./Poster";
import { StatePicker } from "./StatePicker";
import { getRecord, getTitle } from "./titlesApi";
import { useQuery, type Query } from "./useQuery";

/**
 * A title's page: the pool's facts at once, then OMDb's record (poster,
 * plot, people, the three scores), which the server keeps after asking OMDb
 * once. Without a record (no key, OMDb's daily limit, a title OMDb doesn't
 * know) the pool's facts stand alone. A title the pool lacks (a later
 * import dropped it) shows from its record only.
 */
export function TitlePage({ id }: { id: string }) {
  const item = useQuery(id, (signal) => getTitle(id, signal));
  const record = useQuery(id, (signal) => getRecord(id, signal));
  const found = record.status === "ok" ? record.data.record : null;
  const name = item.data?.title.title ?? found?.title;

  useEffect(() => {
    if (name) document.title = `${name} · Lantern`;
  }, [name]);

  const missing = item.status === "error" && item.error instanceof ApiError && item.error.status === 404;
  if (item.status === "error" && !missing) {
    return (
      <section className="page">
        <h1 className="page-title">Couldn't load this title</h1>
        <p className="muted">
          {item.error.message} <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  if (missing && record.status !== "loading" && !found) {
    return (
      <section className="page">
        <h1 className="page-title">Not in Lantern's list</h1>
        <p className="muted">
          This title isn't among the films and series Lantern imported from IMDb.{" "}
          <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  const pool = item.status === "ok" && item.data.title.imdbId === id ? item.data : undefined;
  if (!pool && !found) {
    return (
      <section className="page" aria-busy="true">
        <p className="muted">Loading…</p>
      </section>
    );
  }
  return (
    <TitleView
      id={id}
      pool={pool?.title}
      state={pool?.state ?? null}
      poolPoster={pool?.poster ?? false}
      record={found}
      recordQuery={record}
    />
  );
}

function TitleView({
  id,
  pool,
  state,
  poolPoster,
  record,
  recordQuery,
}: {
  id: string;
  pool: PoolTitle | undefined;
  state: TitleState | null;
  poolPoster: boolean;
  record: OmdbRecord | null;
  recordQuery: Query<{ record: OmdbRecord | null }>;
}) {
  const title = pool?.title ?? record?.title ?? id;
  const kind = pool?.kind ?? (record?.type === "series" ? "series" : "movie");
  const year = pool
    ? years(pool)
    : record
      ? years({ kind, year: record.year, endYear: record.ongoing ? null : record.endYear })
      : null;
  const length = record?.seasons
    ? `${record.seasons} season${record.seasons === 1 ? "" : "s"}`
    : runtime(pool?.runtime ?? record?.runtime ?? null);
  const facts = [year, kindLabel(kind), length, record?.rated].filter((fact) => fact);
  const genres = pool?.genres ?? record?.genres ?? [];

  return (
    <article className="page title-page">
      <div className="title-head">
        <Poster
          key={`${poolPoster}-${record?.hasPoster}`}
          imdbId={id}
          title={title}
          has={poolPoster || (record?.hasPoster ?? false)}
          size="large"
          className="title-poster"
        />
        <div className="title-head-text">
          <h1 className="page-title">{title}</h1>
          <p className="title-facts">{facts.join(" · ")}</p>
          {genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {genres.map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}
          {pool && (
            <p className="title-score">
              <strong>IMDb {pool.rating.toFixed(1)}</strong>{" "}
              <span className="muted">from {votes(pool.votes)} votes</span>
            </p>
          )}
          <p>
            <a href={`https://www.imdb.com/title/${id}/`} target="_blank" rel="noreferrer">
              Open on IMDb
            </a>
          </p>
        </div>
      </div>

      <section className="title-section" aria-label="Your verdict">
        <h2>Your verdict</h2>
        <StatePicker key={id} imdbId={id} state={state} title={title} />
      </section>

      <RecordSection record={record} query={recordQuery} kind={kind} />
    </article>
  );
}

/** OMDb's part of the page, or why it is missing. */
function RecordSection({
  record,
  query,
  kind,
}: {
  record: OmdbRecord | null;
  query: Query<{ record: OmdbRecord | null }>;
  kind: "movie" | "series";
}) {
  if (query.status === "loading") {
    return (
      <p className="muted title-section" aria-busy="true">
        Loading the details…
      </p>
    );
  }
  if (query.status === "error") {
    const error = query.error;
    const why =
      error instanceof ApiError && error.code === "no_key"
        ? "Details, posters and scores need OMDb's key (OMDB_API_KEY on the server)."
        : error instanceof ApiError && /limit/i.test(error.message)
          ? "OMDb's daily limit is spent; the details come back tomorrow."
          : "OMDb didn't answer.";
    return (
      <p className="muted title-section">
        {why}{" "}
        <button type="button" className="link-button" onClick={query.refresh}>
          Try again
        </button>
      </p>
    );
  }
  if (!record) return <p className="muted title-section">OMDb has no details for this title.</p>;

  const people: [string, string[]][] = [
    [
      kind === "series" ? "Created by" : "Directed by",
      kind === "series" && record.directors.length === 0 ? record.writers : record.directors,
    ],
    ...(kind === "series" && record.directors.length === 0
      ? []
      : ([["Written by", record.writers]] as [string, string[]][])),
    ["Starring", record.actors],
  ];
  return (
    <>
      {record.plot && (
        <section className="title-section" aria-labelledby="plot-heading">
          <h2 id="plot-heading">Plot</h2>
          <p className="plot">{record.plot}</p>
        </section>
      )}
      <ScoreSection scores={record.scores} />
      <section className="title-section" aria-labelledby="details-heading">
        <h2 id="details-heading">Details</h2>
        <dl className="facts title-details">
          {people
            .filter(([, names]) => names.length > 0)
            .map(([label, names]) => (
              <Fact key={label} label={label}>
                {names.join(", ")}
              </Fact>
            ))}
          {record.released && <Fact label="Released">{record.released}</Fact>}
          {record.language && <Fact label="Language">{record.language}</Fact>}
          {record.country && <Fact label="Country">{record.country}</Fact>}
          {record.awards && <Fact label="Awards">{record.awards}</Fact>}
        </dl>
      </section>
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

/** IMDb, Rotten Tomatoes and Metacritic, as OMDb gives them, with OMDb credited. */
function ScoreSection({ scores }: { scores: Scores }) {
  const shown: [string, string, string | null][] = [
    [
      "IMDb",
      scores.imdb ? `${scores.imdb.rating.toFixed(1)}/10` : "–",
      scores.imdb?.votes ? `${votes(scores.imdb.votes)} votes` : null,
    ],
    ["Rotten Tomatoes", scores.rottenTomatoes !== null ? `${scores.rottenTomatoes}%` : "–", null],
    ["Metacritic", scores.metacritic !== null ? `${scores.metacritic}/100` : "–", null],
  ];
  return (
    <section className="title-section" aria-labelledby="scores-heading">
      <h2 id="scores-heading">Scores</h2>
      <ul className="scores">
        {shown.map(([source, value, note]) => (
          <li key={source}>
            <span className="score-value">{value}</span>
            <span className="score-source">{source}</span>
            {note && <span className="score-note muted">{note}</span>}
          </li>
        ))}
      </ul>
      <p className="muted credit-line">
        Scores and details from{" "}
        <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">
          OMDb
        </a>
        .
      </p>
    </section>
  );
}

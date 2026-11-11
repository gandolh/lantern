import type { OmdbRecord, PoolTitle, Scores, TitleState } from "@lantern/shared";
import { useEffect, type ReactNode } from "react";
import { Button } from "./components/ui/Button";
import { cn } from "./lib/cn";
import { DETAIL, FACTS, PAGE_TITLE, SECTION_TITLE, TERM } from "./looks";
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
      <section>
        <h1 className={PAGE_TITLE}>Couldn't load this title</h1>
        <p className="text-ink-muted">
          {item.error.message} <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  if (missing && record.status !== "loading" && !found) {
    return (
      <section>
        <h1 className={PAGE_TITLE}>Not in Lantern's list</h1>
        <p className="text-ink-muted">
          This title isn't among the films and series Lantern imported from IMDb.{" "}
          <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  const pool = item.status === "ok" && item.data.title.imdbId === id ? item.data : undefined;
  if (!pool && !found) {
    return (
      <section aria-busy="true">
        <p className="text-ink-muted">Loading…</p>
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
    <article>
      <div className="grid grid-cols-[minmax(110px,34%)_1fr] items-start gap-4 wide:grid-cols-[240px_1fr] wide:gap-7">
        <Poster
          key={`${poolPoster}-${record?.hasPoster}`}
          imdbId={id}
          title={title}
          has={poolPoster || (record?.hasPoster ?? false)}
          size="large"
        />
        <div>
          <h1 className={PAGE_TITLE}>{title}</h1>
          <p className="mt-0 mb-2 text-ink-muted">{facts.join(" · ")}</p>
          {genres.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Genres">
              {genres.map((genre) => (
                <li key={genre} className="rounded-pill bg-surface-sunk px-2.5 py-0.5 text-small">
                  {genre}
                </li>
              ))}
            </ul>
          )}
          {pool && (
            <p className="my-2">
              <strong>IMDb {pool.rating.toFixed(1)}</strong>{" "}
              <span className="text-ink-muted">from {votes(pool.votes)} votes</span>
            </p>
          )}
          <p>
            <a href={`https://www.imdb.com/title/${id}/`} target="_blank" rel="noreferrer">
              Open on IMDb
            </a>
          </p>
        </div>
      </div>

      <section className="mt-6" aria-label="Your verdict">
        <h2 className={SECTION_TITLE}>Your verdict</h2>
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
      <p className="mt-6 text-ink-muted" aria-busy="true">
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
      <p className="mt-6 text-ink-muted">
        {why}{" "}
        <Button variant="link" onClick={query.refresh}>
          Try again
        </Button>
      </p>
    );
  }
  if (!record) return <p className="mt-6 text-ink-muted">OMDb has no details for this title.</p>;

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
        <section className="mt-6" aria-labelledby="plot-heading">
          <h2 id="plot-heading" className={SECTION_TITLE}>
            Plot
          </h2>
          <p className="m-0 max-w-prose">{record.plot}</p>
        </section>
      )}
      <ScoreSection scores={record.scores} />
      <section className="mt-6" aria-labelledby="details-heading">
        <h2 id="details-heading" className={SECTION_TITLE}>
          Details
        </h2>
        <dl className={cn(FACTS, "mt-0")}>
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
      <dt className={TERM}>{label}</dt>
      <dd className={cn(DETAIL, "font-normal")}>{children}</dd>
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
    <section className="mt-6" aria-labelledby="scores-heading">
      <h2 id="scores-heading" className={SECTION_TITLE}>
        Scores
      </h2>
      <ul className="m-0 grid list-none grid-cols-[repeat(3,1fr)] gap-2 p-0">
        {shown.map(([source, value, note]) => (
          <li key={source} className="grid gap-0.5 rounded-control border border-line bg-surface p-2.5">
            <span className="text-score font-bold">{value}</span>
            <span className="text-note font-semibold">{source}</span>
            {note && <span className="text-note text-ink-muted">{note}</span>}
          </li>
        ))}
      </ul>
      <p className="text-note text-ink-muted">
        Scores and details from{" "}
        <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">
          OMDb
        </a>
        .
      </p>
    </section>
  );
}

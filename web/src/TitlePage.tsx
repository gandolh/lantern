import type { OmdbRecord, PoolTitle, Scores, TitleState } from "@lantern/shared";
import { useEffect, type ReactNode } from "react";
import { Button } from "./components/ui/Button";
import { Facts } from "./Facts";
import { ExternalIcon } from "./Icons";
import { PAGE_TITLE, SECTION_CARD, SECTION_TITLE } from "./looks";
import { Skel } from "./States";
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
        <h1 className={PAGE_TITLE}>Couldn’t load this title</h1>
        <p className="text-ink-muted">
          {item.error.message} <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  if (missing && record.status !== "loading" && !found) {
    return (
      <section>
        <h1 className={PAGE_TITLE}>Not in Lantern’s list</h1>
        <p className="text-ink-muted">
          This title isn’t among the films and series Lantern imported from IMDb.{" "}
          <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  const pool = item.status === "ok" && item.data.title.imdbId === id ? item.data : undefined;
  if (!pool && !found) {
    return (
      <section aria-busy="true">
        <p className="m-0 mb-3 text-small text-ink-muted">Loading…</p>
        <Skel className="h-40 w-full" />
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
  const genres = pool?.genres ?? record?.genres ?? [];

  return (
    <>
      <article className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-4 gap-y-6 wide:grid-cols-[260px_minmax(0,1fr)] wide:gap-x-10">
        <div className="wide:row-span-3">
          <Poster
            key={`${poolPoster}-${record?.hasPoster}`}
            imdbId={id}
            title={title}
            has={poolPoster || (record?.hasPoster ?? false)}
            size="large"
          />
        </div>
        <header className="flex min-w-0 flex-col gap-2">
          <h1 className="m-0 font-display text-page-title text-balance wrap-break-word text-ink wide:text-display">
            {title}
          </h1>
          <div className="grid text-body text-ink-muted">
            <Facts items={[year, kindLabel(kind)]} className="text-body" />
            <Facts items={[length, record?.rated]} className="text-body" />
          </div>
          {genres.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Genres">
              {genres.map((genre) => (
                <li key={genre} className="rounded-pill bg-control px-3 py-1 text-note">
                  {genre}
                </li>
              ))}
            </ul>
          )}
          {pool && (
            <p className="m-0 text-body tabular-nums">
              <strong>IMDb {pool.rating.toFixed(1)}</strong>{" "}
              <span className="text-ink-muted">from {votes(pool.votes)} votes</span>
            </p>
          )}
          <p className="m-0 text-small">
            <a
              className="inline-flex min-h-12 items-center gap-1"
              href={`https://www.imdb.com/title/${id}/`}
              target="_blank"
              rel="noreferrer"
            >
              Open on IMDb
              <ExternalIcon />
            </a>
          </p>
        </header>

        <section
          className="col-span-full grid max-w-160 gap-3 rounded-card border border-line bg-surface p-4 shadow-card wide:col-span-1 wide:col-start-2 wide:p-5"
          aria-labelledby="verdict-heading"
        >
          <h2 id="verdict-heading" className={SECTION_TITLE}>
            Your verdict
          </h2>
          <StatePicker key={id} imdbId={id} state={state} title={title} />
        </section>

        {record?.plot && (
          <section className="col-span-full grid gap-2 wide:col-span-1 wide:col-start-2" aria-labelledby="plot-heading">
            <h2 id="plot-heading" className={SECTION_TITLE}>
              Plot
            </h2>
            <p className="m-0 max-w-[62ch]">{record.plot}</p>
          </section>
        )}
      </article>

      <RecordSection record={record} query={recordQuery} kind={kind} />
    </>
  );
}

/** OMDb's part of the page below the verdict: the scores and details, or why they are missing. */
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
      <div className="mt-8 grid gap-2" aria-busy="true">
        <p className="m-0 text-small text-ink-muted">Loading the details…</p>
        <Skel className="h-4 w-full" />
        <Skel className="h-4 w-7/10" />
      </div>
    );
  }
  if (query.status === "error") {
    const error = query.error;
    const why =
      error instanceof ApiError && error.code === "no_key"
        ? "Details, posters and scores need OMDb’s key (OMDB_API_KEY on the server)."
        : error instanceof ApiError && /limit/i.test(error.message)
          ? "OMDb’s daily limit is spent; the details come back tomorrow."
          : "OMDb didn’t answer.";
    return (
      <p className="mt-8 mb-0 text-small text-ink-muted">
        {why}{" "}
        <Button variant="link" onClick={query.refresh}>
          Try again
        </Button>
      </p>
    );
  }
  if (!record) return <p className="mt-8 mb-0 text-small text-ink-muted">OMDb has no details for this title.</p>;

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
    <div className="mt-8 grid gap-4 min-[900px]:mt-10 min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-[900px]:items-start">
      <ScoreSection scores={record.scores} />
      <section className={SECTION_CARD} aria-labelledby="details-heading">
        <h2 id="details-heading" className={SECTION_TITLE}>
          Details
        </h2>
        <dl className="m-0 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-2">
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
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="m-0 font-semibold">{children}</dd>
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
    <section className={SECTION_CARD} aria-labelledby="scores-heading">
      <h2 id="scores-heading" className={SECTION_TITLE}>
        Scores
      </h2>
      <ul className="m-0 grid list-none grid-cols-[repeat(3,minmax(0,1fr))] p-0 tabular-nums">
        {shown.map(([source, value, note]) => (
          <li
            key={source}
            className="flex flex-col gap-0.5 px-2 not-first:border-l not-first:border-line first:pl-0 wide:px-3 wide:first:pl-0"
          >
            <span className="font-display text-heading font-bold wide:text-score">{value}</span>
            <span className="text-small font-semibold">{source}</span>
            {note && <span className="text-note text-ink-muted">{note}</span>}
          </li>
        ))}
      </ul>
      <p className="m-0 text-note text-ink-muted">
        Scores and details from{" "}
        <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">
          OMDb
        </a>
        .
      </p>
    </section>
  );
}

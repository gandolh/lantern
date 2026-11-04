import { useEffect } from "react";
import { ApiError } from "./api";
import { kindLabel, runtime, votes, years } from "./format";
import { Link } from "./Link";
import { Poster } from "./Poster";
import { StatePicker } from "./StatePicker";
import { getTitle } from "./titlesApi";
import { useQuery } from "./useQuery";

/**
 * A title's page: the pool's facts and the state picker. OMDb's poster,
 * plot, people and scores are added in their own section when the title is
 * shown in full.
 */
export function TitlePage({ id }: { id: string }) {
  const item = useQuery(id, (signal) => getTitle(id, signal));

  useEffect(() => {
    if (item.data) document.title = `${item.data.title.title} · Lantern`;
  }, [item.data]);

  if (item.status === "error") {
    const missing = item.error instanceof ApiError && item.error.status === 404;
    return (
      <section className="page">
        <h1 className="page-title">{missing ? "Not in Lantern's list" : "Couldn't load this title"}</h1>
        <p className="muted">
          {missing ? "This title isn't among the films and series Lantern imported from IMDb." : item.error.message}{" "}
          <Link to={{ page: "search", query: "" }}>Search instead</Link>
        </p>
      </section>
    );
  }
  if (!item.data || item.data.title.imdbId !== id) {
    return (
      <section className="page" aria-busy="true">
        <p className="muted">Loading…</p>
      </section>
    );
  }

  const { title, state, poster } = item.data;
  const facts = [years(title), kindLabel(title.kind), runtime(title.runtime)].filter((fact) => fact);
  return (
    <article className="page title-page">
      <div className="title-head">
        <Poster imdbId={title.imdbId} title={title.title} has={poster} size="large" className="title-poster" />
        <div className="title-head-text">
          <h1 className="page-title">{title.title}</h1>
          <p className="title-facts">{facts.join(" · ")}</p>
          {title.genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {title.genres.map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}
          <p className="title-score">
            <strong>IMDb {title.rating.toFixed(1)}</strong> <span className="muted">from {votes(title.votes)} votes</span>
          </p>
          <p>
            <a href={`https://www.imdb.com/title/${title.imdbId}/`} target="_blank" rel="noreferrer">
              Open on IMDb
            </a>
          </p>
        </div>
      </div>
      <section className="title-section" aria-label="Your verdict">
        <h2>Your verdict</h2>
        <StatePicker key={title.imdbId} imdbId={title.imdbId} state={state} title={title.title} />
      </section>
    </article>
  );
}

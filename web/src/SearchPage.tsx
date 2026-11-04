import type { TitleItem, TitleKind } from "@lantern/shared";
import { useEffect, useRef, useState } from "react";
import { Link } from "./Link";
import { Poster } from "./Poster";
import { hrefOf, navigate } from "./route";
import { StatePicker } from "./StatePicker";
import { searchTitles } from "./titlesApi";
import { useQuery } from "./useQuery";
import { kindLabel, votes, years } from "./format";

const KINDS: { value: TitleKind | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "movie", label: "Films" },
  { value: "series", label: "Series" },
];

/**
 * Search the title pool by name. The query sits in the address (replaced as
 * you type, so Back leaves the page rather than stepping through letters),
 * and every result can be rated where it stands. No outside call: the pool
 * is Lantern's own.
 */
export function SearchPage({ query }: { query: string }) {
  const [text, setText] = useState(query);
  const [kind, setKind] = useState<TitleKind | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = query ? `${query} · Search · Lantern` : "Search · Lantern";
  }, [query]);

  // Type, pause, and the address (and so the results) follow.
  useEffect(() => {
    if (text.trim() === query) return;
    const timer = setTimeout(() => navigate(hrefOf({ page: "search", query: text.trim() }), { replace: true }), 250);
    return () => clearTimeout(timer);
  }, [text, query]);

  const results = useQuery(query === "" ? null : `${kind ?? "all"}:${query}`, (signal) => searchTitles(query, kind, signal));

  return (
    <section className="page search-page">
      <h1 className="page-title">Search</h1>
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(hrefOf({ page: "search", query: text.trim() }), { replace: true });
          input.current?.blur();
        }}
      >
        <input
          ref={input}
          type="search"
          className="search-input"
          aria-label="Search films and series"
          placeholder="Search films and series"
          autoComplete="off"
          autoFocus={query === ""}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </form>
      <div className="segmented" role="group" aria-label="Kind">
        {KINDS.map((option) => (
          <button key={option.label} type="button" aria-pressed={kind === option.value} onClick={() => setKind(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      {query === "" && <p className="muted">Type a title. Lantern searches its own list of IMDb's best-known films and series.</p>}
      {results.status === "error" && (
        <p className="auth-error" role="alert">
          Search didn't work. {results.error.message}{" "}
          <button type="button" className="link-button" onClick={results.refresh}>
            Try again
          </button>
        </p>
      )}
      {query !== "" && results.data && results.data.results.length === 0 && results.status === "ok" && (
        <p className="muted">Nothing in Lantern's list matches "{query}". Titles with fewer than a thousand IMDb votes aren't in it.</p>
      )}
      {query !== "" && results.data && (
        <ul className="title-list" aria-busy={results.status === "loading" || undefined}>
          {results.data.results.map((item) => (
            <TitleRow key={item.title.imdbId} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One title in a list: poster, name, facts, and the state picker. */
export function TitleRow({ item, onChange }: { item: TitleItem; onChange?: Parameters<typeof StatePicker>[0]["onChange"] }) {
  const { title } = item;
  const facts = [years(title), kindLabel(title.kind), title.genres.join(", ")].filter((fact) => fact);
  return (
    <li className="title-row">
      <Link to={{ page: "title", id: title.imdbId }} className="title-row-poster" tabIndex={-1} aria-hidden="true">
        <Poster imdbId={title.imdbId} title={title.title} has={item.poster} />
      </Link>
      <div className="title-row-body">
        <Link to={{ page: "title", id: title.imdbId }} className="title-row-name">
          {title.title}
        </Link>
        <p className="title-row-facts">{facts.join(" · ")}</p>
        <p className="title-row-score">
          IMDb {title.rating.toFixed(1)} <span className="muted">({votes(title.votes)} votes)</span>
        </p>
        <StatePicker key={title.imdbId} imdbId={title.imdbId} state={item.state} title={title.title} compact onChange={onChange} />
      </div>
    </li>
  );
}

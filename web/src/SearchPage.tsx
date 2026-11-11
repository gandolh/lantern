import type { TitleKind } from "@lantern/shared";
import { useEffect, useRef, useState } from "react";
import { hrefOf, navigate } from "./route";
import { searchTitles } from "./titlesApi";
import { TitleRow } from "./TitleRow";
import { useQuery } from "./useQuery";
import { KindFilter } from "./KindFilter";

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

  const results = useQuery(query === "" ? null : `${kind ?? "all"}:${query}`, (signal) =>
    searchTitles(query, kind, signal),
  );

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
      <KindFilter kind={kind} onChange={setKind} />

      {query === "" && (
        <p className="muted">Type a title. Lantern searches its own list of IMDb's best-known films and series.</p>
      )}
      {results.status === "error" && (
        <p className="auth-error" role="alert">
          Search didn't work. {results.error.message}{" "}
          <button type="button" className="link-button" onClick={results.refresh}>
            Try again
          </button>
        </p>
      )}
      {query !== "" && results.data && results.data.results.length === 0 && results.status === "ok" && (
        <p className="muted">
          Nothing in Lantern's list matches "{query}". Titles with fewer than a thousand IMDb votes aren't in it.
        </p>
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

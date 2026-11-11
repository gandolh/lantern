import { suggestionsResponseSchema, type TitleKind } from "@lantern/shared";
import { useEffect, useState } from "react";
import { request } from "./api";
import { Link } from "./Link";
import { TitleRow } from "./TitleRow";
import { useQuery } from "./useQuery";
import { KindFilter } from "./KindFilter";

/**
 * The home page: titles from the pool ranked by the owner's taste, each
 * saying which liked title it is there for. Giving one a state takes it off
 * the list. No outside call: posters show only when already kept.
 */
export function SuggestionsPage() {
  const [kind, setKind] = useState<TitleKind | undefined>(undefined);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const list = useQuery(`suggestions:${kind ?? "all"}`, (signal) => {
    const params = new URLSearchParams({ limit: "30" });
    if (kind) params.set("kind", kind);
    return request("GET", `/v1/suggestions?${params}`, (v) => suggestionsResponseSchema.parse(v), { signal });
  });

  useEffect(() => {
    document.title = "Suggestions · Lantern";
  }, []);

  const shown = list.data?.suggestions.filter((item) => !gone.has(item.title.imdbId)) ?? [];

  return (
    <section className="page">
      <h1 className="page-title">Suggestions</h1>
      <p className="muted">
        From the genres, directors and writers of what you rated, liked and disliked.
        {list.data && list.data.rated > 0 && ` Built on ${list.data.rated} rating${list.data.rated === 1 ? "" : "s"}.`}
      </p>
      <KindFilter kind={kind} onChange={setKind} />

      {list.status === "error" && (
        <p className="auth-error" role="alert">
          Couldn't load suggestions. {list.error.message}{" "}
          <button type="button" className="link-button" onClick={list.refresh}>
            Try again
          </button>
        </p>
      )}
      {list.status === "loading" && !list.data && (
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      )}
      {list.data && list.data.liked === 0 && (
        <div className="empty">
          <p>Rate a few titles you liked, good or amazing, and suggestions show up here.</p>
          <p>
            <Link to={{ page: "rate" }}>Rate some cards</Link> or{" "}
            <Link to={{ page: "search", query: "" }}>search for a favourite</Link>. Not interested isn't a rating, so it
            doesn't shape these.
          </p>
        </div>
      )}
      {list.data && list.data.liked > 0 && shown.length === 0 && (
        <p className="muted">Nothing left to suggest from what you rated. Rate a few more.</p>
      )}
      {shown.length > 0 && (
        <ul className="title-list" aria-busy={list.status === "loading" || undefined}>
          {shown.map((item) => (
            <TitleRow
              key={item.title.imdbId}
              item={{ ...item, state: null }}
              note={
                <>
                  Because you liked <Link to={{ page: "title", id: item.because.imdbId }}>{item.because.title}</Link>
                </>
              }
              onChange={(state) => {
                if (state !== null) setGone((all) => new Set(all).add(item.title.imdbId));
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

import { suggestionsResponseSchema, type TitleKind } from "@lantern/shared";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/Button";
import { EMPTY_BOX, PAGE_TITLE } from "./looks";
import { request } from "./api";
import { Link } from "./Link";
import { ErrorLine, Loading } from "./States";
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
    <section className="mx-auto max-w-[880px]">
      <div className="mb-6 flex flex-col items-start gap-3">
        <h1 className={PAGE_TITLE}>Suggestions</h1>
        <p className="m-0 max-w-[62ch] text-ink-muted">
          From the genres, directors and writers of what you rated, liked and disliked.
          {list.data &&
            list.data.rated > 0 &&
            ` Built on ${list.data.rated} rating${list.data.rated === 1 ? "" : "s"}.`}
        </p>
        <KindFilter kind={kind} onChange={setKind} />
      </div>

      {list.status === "error" && (
        <div className="grid justify-items-start gap-2 rounded-card bg-surface p-4 shadow-card">
          <ErrorLine>Couldn’t load suggestions. {list.error.message}</ErrorLine>
          <Button onClick={list.refresh}>Try again</Button>
        </div>
      )}
      {list.status === "loading" && !list.data && <Loading rows={3} />}
      {list.data && list.data.liked === 0 && (
        <div className={EMPTY_BOX}>
          <p className="m-0 mb-2">Rate a few titles you liked, good or amazing, and suggestions show up here.</p>
          <p className="m-0 text-small text-ink-muted">
            <Link to={{ page: "rate" }}>Rate some cards</Link> or{" "}
            <Link to={{ page: "search", query: "" }}>search for a favourite</Link>. Not interested isn’t a rating, so it
            doesn’t shape these.
          </p>
        </div>
      )}
      {list.data && list.data.liked > 0 && shown.length === 0 && (
        <p className="m-0 text-small text-ink-muted">Nothing left to suggest from what you rated. Rate a few more.</p>
      )}
      {shown.length > 0 && (
        <ul
          className="m-0 flex list-none flex-col gap-3 p-0 aria-busy:opacity-60 min-[900px]:gap-4"
          aria-label="Suggested titles"
          aria-busy={list.status === "loading" || undefined}
        >
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

import { listResponseSchema, type ListName, type ListResponse, type ListRow, type Rating, type TitleKind, type TitleState } from "@lantern/shared";
import { useEffect, useState, type ReactNode } from "react";
import { request } from "./api";
import { STATE_LABELS } from "./StatePicker";
import { saveState } from "./titlesApi";
import { TitleRow } from "./TitleRow";
import { useQuery } from "./useQuery";

const KINDS: { value: TitleKind | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "movie", label: "Films" },
  { value: "series", label: "Series" },
];

/** Which list, and for the ratings list which step. */
export interface ListChoice {
  list: ListName;
  rating?: Rating;
}

function belongs(choice: ListChoice, state: TitleState | null): boolean {
  if (state === null) return false;
  if (choice.list === "watchlist") return state === "want_to_watch";
  if (choice.list === "not-interested") return state === "not_interested";
  return choice.rating ? state === choice.rating : state === "awful" || state === "meh" || state === "good" || state === "amazing";
}

function fetchList(choice: ListChoice, kind: TitleKind | undefined, cursor: string | undefined, signal?: AbortSignal): Promise<ListResponse> {
  const params = new URLSearchParams();
  if (choice.rating) params.set("rating", choice.rating);
  if (kind) params.set("kind", kind);
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return request("GET", `/v1/lists/${choice.list}${query ? `?${query}` : ""}`, (v) => listResponseSchema.parse(v), { signal });
}

/**
 * Titles with a state, newest first, 50 at a time: the watchlist, the
 * ratings, not interested. Change a title's state in place; one that no
 * longer belongs leaves the list, with Undo. No outside call.
 */
export function TitleList({ choice, empty, tabs }: { choice: ListChoice; empty: ReactNode; tabs?: ReactNode }) {
  const [kind, setKind] = useState<TitleKind | undefined>(undefined);
  const key = `${choice.list}:${choice.rating ?? "all"}:${kind ?? "all"}`;
  const first = useQuery(key, (signal) => fetchList(choice, kind, undefined, signal));
  const [more, setMore] = useState<{ key: string; rows: ListRow[]; next: string | null } | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [last, setLast] = useState<{ row: ListRow; to: TitleState | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [undoFailed, setUndoFailed] = useState(false);

  // A new list starts clean.
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) {
    setShownKey(key);
    setMore(null);
    setGone(new Set());
    setLast(null);
  }

  const extra = more?.key === key ? more : null;
  const rows = [...(first.data?.rows ?? []), ...(extra?.rows ?? [])].filter((row) => !gone.has(row.title.imdbId));
  const next = extra ? extra.next : (first.data?.next ?? null);

  const showMore = () => {
    if (!next) return;
    setLoadingMore(true);
    fetchList(choice, kind, next).then(
      (page) => {
        setMore({ key, rows: [...(extra?.rows ?? []), ...page.rows], next: page.next });
        setLoadingMore(false);
      },
      () => setLoadingMore(false),
    );
  };

  const changed = (row: ListRow, state: TitleState | null) => {
    if (belongs(choice, state)) return;
    setGone((all) => new Set(all).add(row.title.imdbId));
    setLast({ row, to: state });
    setUndoFailed(false);
  };

  const undo = () => {
    if (!last) return;
    const { row } = last;
    saveState(row.title.imdbId, row.state).then(
      () => {
        setGone((all) => {
          const kept = new Set(all);
          kept.delete(row.title.imdbId);
          return kept;
        });
        setLast(null);
      },
      () => setUndoFailed(true),
    );
  };

  return (
    <>
      {tabs}
      <div className="segmented" role="group" aria-label="Kind">
        {KINDS.map((option) => (
          <button key={option.label} type="button" aria-pressed={kind === option.value} onClick={() => setKind(option.value)}>
            {option.label}
          </button>
        ))}
      </div>

      {last && (
        <p className="notice undo-notice" role="status">
          {last.row.title.title} {last.to === null ? "was cleared" : `is now ${STATE_LABELS[last.to].toLowerCase()}`}.{" "}
          <button type="button" className="link-button" onClick={undo}>
            Undo
          </button>
          {undoFailed && <span className="state-error"> That didn't work. Try again.</span>}
        </p>
      )}

      {first.status === "error" && (
        <p className="auth-error" role="alert">
          Couldn't load the list. {first.error.message}{" "}
          <button type="button" className="link-button" onClick={first.refresh}>
            Try again
          </button>
        </p>
      )}
      {first.status === "loading" && !first.data && (
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      )}
      {first.status !== "loading" && first.data && rows.length === 0 && <div className="empty">{empty}</div>}
      {rows.length > 0 && (
        <ul className="title-list" aria-busy={first.status === "loading" || undefined}>
          {rows.map((row) => (
            <TitleRow key={row.title.imdbId} item={row} note={row.inPool ? undefined : <span className="muted">No longer in Lantern's title list</span>} onChange={(state) => changed(row, state)} />
          ))}
        </ul>
      )}
      {next && (
        <p>
          <button type="button" className="button" onClick={showMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Show more"}
          </button>
        </p>
      )}
    </>
  );
}

/** The counts the last answer gave, for the tabs. */
export function useCounts(choice: ListChoice): ListResponse["counts"] | undefined {
  const counts = useQuery(`counts:${choice.list}:${choice.rating ?? "all"}`, (signal) => fetchList(choice, undefined, undefined, signal));
  return counts.data?.counts;
}

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Lantern`;
  }, [title]);
}

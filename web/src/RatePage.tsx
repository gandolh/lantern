import { RATINGS, type Card, type OmdbRecord, type TitleKind, type TitleState } from "@lantern/shared";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { kindLabel, runtime, votes, years } from "./format";
import { Link } from "./Link";
import { Poster } from "./Poster";
import { STATE_LABELS } from "./StatePicker";
import { SwipeCard, type SwipeDirection } from "./SwipeCard";
import { dealCards, getRecord, saveSkip, saveState } from "./titlesApi";

/** What a swipe does. Ratings are a tap: four choices don't fit a gesture. */
const SWIPES: Record<SwipeDirection, { label: string; action: Action }> = {
  right: { label: "Want to watch", action: { kind: "state", state: "want_to_watch" } },
  left: { label: "Not interested", action: { kind: "state", state: "not_interested" } },
  up: { label: "Skip", action: { kind: "skip" } },
};
const LABELS = { right: SWIPES.right.label, left: SWIPES.left.label, up: SWIPES.up.label };

type Action = { kind: "state"; state: TitleState } | { kind: "skip" };
interface Done {
  card: Card;
  action: Action;
}

/** Fetch more when fewer than this many cards are left. */
const LOW_WATER = 3;
/** How long a card takes to leave, in milliseconds (the CSS transition's length). */
const LEAVE_MS = 180;
const UNDO_DEPTH = 20;

const KINDS: { value: TitleKind | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "movie", label: "Films" },
  { value: "series", label: "Series" },
];

/**
 * The rating cards: the pool's most-voted titles not yet marked, one at a
 * time. Every choice has a button; a swipe is a shortcut for the three that
 * aren't ratings (right want to watch, left not interested, up skip), and a
 * desktop has keys (1-4, arrows, Z to undo). OMDb is asked only for the card
 * on screen and the next one, for the poster and the plot; a card shows the
 * pool's facts while it waits.
 */
export function RatePage() {
  const [kind, setKind] = useState<TitleKind | undefined>(undefined);
  const [queue, setQueue] = useState<Card[]>([]);
  const [done, setDone] = useState<Done[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<SwipeDirection | null>(null);
  const [records, setRecords] = useState<Record<string, OmdbRecord | null | "error">>({});
  const fetching = useRef(false);
  const generation = useRef(0);
  const asked = useRef(new Set<string>());

  useEffect(() => {
    document.title = "Rate · Lantern";
  }, []);

  // Deal more when the queue runs low.
  const dealMore = useEffectEvent(() => {
    if (fetching.current || exhausted || loadError !== null) return;
    fetching.current = true;
    const round = generation.current;
    dealCards(
      kind,
      queue.map((card) => card.title.imdbId),
    ).then(
      ({ cards }) => {
        fetching.current = false;
        if (round !== generation.current) return;
        if (cards.length === 0) setExhausted(true);
        setQueue((current) => {
          const held = new Set(current.map((card) => card.title.imdbId));
          return [...current, ...cards.filter((card) => !held.has(card.title.imdbId))];
        });
      },
      (error: unknown) => {
        fetching.current = false;
        if (round === generation.current) setLoadError(error instanceof Error ? error.message : String(error));
      },
    );
  });
  useEffect(() => {
    if (queue.length < LOW_WATER) dealMore();
  }, [queue.length, kind, exhausted, loadError]);

  // OMDb's record for the card on screen and the next one, each asked once.
  const current = queue[0];
  const next = queue[1];
  const askRecord = useEffectEvent((card: Card | undefined) => {
    if (!card || card.record || asked.current.has(card.title.imdbId)) return;
    const id = card.title.imdbId;
    asked.current.add(id);
    getRecord(id).then(
      ({ record }) => setRecords((all) => ({ ...all, [id]: record })),
      () => setRecords((all) => ({ ...all, [id]: "error" })),
    );
  });
  useEffect(() => {
    askRecord(current);
    askRecord(next);
  }, [current, next]);

  const chooseKind = (value: TitleKind | undefined) => {
    if (value === kind) return;
    generation.current++;
    fetching.current = false;
    setKind(value);
    setQueue([]);
    setExhausted(false);
    setLoadError(null);
  };

  const act = useCallback(
    (action: Action, direction: SwipeDirection) => {
      if (!current || leaving) return;
      const card = current;
      const id = card.title.imdbId;
      setSaveError(null);
      setLeaving(direction);
      setTimeout(() => {
        setLeaving(null);
        setQueue((all) => all.filter((c) => c.title.imdbId !== id));
        setDone((all) => [...all.slice(-(UNDO_DEPTH - 1)), { card, action }]);
      }, LEAVE_MS);
      const saved = action.kind === "skip" ? saveSkip(id, true) : saveState(id, action.state);
      saved.catch(() => {
        // Put the card back where it was, and say so.
        setTimeout(() => {
          setDone((all) => all.filter((d) => d.card.title.imdbId !== id));
          setQueue((all) => (all.some((c) => c.title.imdbId === id) ? all : [card, ...all]));
          setSaveError(`"${card.title.title}" didn't save. Try again.`);
        }, LEAVE_MS);
      });
    },
    [current, leaving],
  );

  const undo = useCallback(() => {
    const last = done[done.length - 1];
    if (!last || leaving) return;
    const id = last.card.title.imdbId;
    setDone((all) => all.slice(0, -1));
    setQueue((all) => [last.card, ...all.filter((c) => c.title.imdbId !== id)]);
    setSaveError(null);
    const reverted = last.action.kind === "skip" ? saveSkip(id, false) : saveState(id, null);
    reverted.catch(() => setSaveError(`Couldn't undo "${last.card.title.title}". Try again.`));
  }, [done, leaving]);

  const rate = (state: TitleState) =>
    act({ kind: "state", state }, state === "awful" || state === "meh" ? "left" : "right");
  const swipe = (direction: SwipeDirection) => act(SWIPES[direction].action, direction);

  // Keys on a desktop: 1-4 rate, arrows for the swipes, Z undoes.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable=true]")) return;
    const rating = { "1": "awful", "2": "meh", "3": "good", "4": "amazing" }[event.key] as TitleState | undefined;
    if (rating) rate(rating);
    else if (event.key === "ArrowRight") swipe("right");
    else if (event.key === "ArrowLeft") swipe("left");
    else if (event.key === "ArrowUp") swipe("up");
    else if (event.key === "z" || event.key === "Z") undo();
    else return;
    event.preventDefault();
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const record = current ? (current.record ?? records[current.title.imdbId]) : undefined;

  return (
    <section className="page rate-page">
      <div className="rate-head">
        <h1 className="page-title">Rate</h1>
        <button
          type="button"
          className="button rate-undo"
          onClick={undo}
          disabled={done.length === 0 || leaving !== null}
        >
          Undo
        </button>
      </div>
      <div className="segmented" role="group" aria-label="Kind">
        {KINDS.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={kind === option.value}
            onClick={() => chooseKind(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loadError !== null && (
        <p className="auth-error" role="alert">
          Couldn't deal cards. {loadError}{" "}
          <button type="button" className="link-button" onClick={() => setLoadError(null)}>
            Try again
          </button>
        </p>
      )}

      {current ? (
        <>
          <div className="card-stage">
            {next && (
              <div className="swipe-card card-behind" aria-hidden="true">
                <CardFace card={next} record={next.record ?? records[next.title.imdbId]} />
              </div>
            )}
            <SwipeCard key={current.title.imdbId} labels={LABELS} onSwipe={swipe} leaving={leaving}>
              <CardFace card={current} record={record} />
            </SwipeCard>
          </div>

          {saveError && (
            <p className="state-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="card-actions" role="group" aria-label={`Your verdict on ${current.title.title}`}>
            <div className="card-ratings">
              {RATINGS.map((rating, i) => (
                <button
                  key={rating}
                  type="button"
                  className={`state-button state-${rating}`}
                  onClick={() => rate(rating)}
                  aria-keyshortcuts={String(i + 1)}
                >
                  {STATE_LABELS[rating]}
                </button>
              ))}
            </div>
            <div className="card-others">
              <button
                type="button"
                className="state-button"
                onClick={() => swipe("left")}
                aria-keyshortcuts="ArrowLeft"
              >
                ← Not interested
              </button>
              <button type="button" className="state-button" onClick={() => swipe("up")} aria-keyshortcuts="ArrowUp">
                ↑ Skip
              </button>
              <button
                type="button"
                className="state-button"
                onClick={() => swipe("right")}
                aria-keyshortcuts="ArrowRight"
              >
                Want to watch →
              </button>
            </div>
            <p className="muted card-hint">
              Seen it? Rate it. Not seen it? Swipe right to save it, left if it's not for you, up to skip.
            </p>
          </div>
        </>
      ) : exhausted ? (
        <div className="empty">
          <p>
            No more cards{kind ? ` for ${kind === "movie" ? "films" : "series"}` : ""}: every title in Lantern's list
            has a verdict or was skipped.
          </p>
          <p>
            <Link to={{ page: "search", query: "" }}>Search for a title</Link> instead, or run the title import again
            for newer ones.
          </p>
        </div>
      ) : (
        loadError === null && (
          <p className="muted" aria-busy="true">
            Dealing…
          </p>
        )
      )}
    </section>
  );
}

/** One card's face: the poster, then the pool's facts, then OMDb's plot when it has come. */
function CardFace({ card, record }: { card: Card; record: OmdbRecord | null | "error" | undefined }) {
  const { title } = card;
  const kept = record && record !== "error" ? record : null;
  const facts = [years(title), kindLabel(title.kind), runtime(title.runtime)].filter((fact) => fact);
  return (
    <div className="card-face">
      <Poster
        key={`${card.poster || kept?.hasPoster}`}
        imdbId={title.imdbId}
        title={title.title}
        has={card.poster || (kept?.hasPoster ?? false)}
        size="large"
        className="card-poster"
      />
      <div className="card-text">
        <h2 className="card-title">
          <Link to={{ page: "title", id: title.imdbId }}>{title.title}</Link>
        </h2>
        <p className="card-facts">{facts.join(" · ")}</p>
        <p className="card-facts">
          {title.genres.join(", ")}
          {title.genres.length > 0 && " · "}IMDb {title.rating.toFixed(1)} ({votes(title.votes)})
        </p>
        {kept?.plot && <p className="card-plot">{kept.plot}</p>}
        {record === undefined && <p className="card-plot muted">Loading the plot…</p>}
      </div>
    </div>
  );
}

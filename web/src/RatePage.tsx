import { RATINGS, type Card, type OmdbRecord, type TitleKind, type TitleState } from "@lantern/shared";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "./components/ui/Button";
import { Facts } from "./Facts";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, Meter, UndoIcon } from "./Icons";
import { ErrorLine, Skel } from "./States";
import { cn } from "./lib/cn";
import { EMPTY_BOX, PAGE_TITLE } from "./looks";
import { kindLabel, runtime, votes, years } from "./format";
import { Link } from "./Link";
import { Poster } from "./Poster";
import { actionButtonClass, LEVEL, RATING_BAR, ratingStepClass, STATE_LABELS } from "./StatePicker";
import { SwipeCard, type SwipeDirection } from "./SwipeCard";
import { dealCards, getRecord, saveSkip, saveState } from "./titlesApi";
import { KindFilter } from "./KindFilter";
import { pageOwnsKey } from "./keys";

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
          setSaveError(`"${card.title.title}" didn’t save. Try again.`);
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
    reverted.catch(() => setSaveError(`Couldn’t undo "${last.card.title.title}". Try again.`));
  }, [done, leaving]);

  const rate = (state: TitleState) =>
    act({ kind: "state", state }, state === "awful" || state === "meh" ? "left" : "right");
  const swipe = (direction: SwipeDirection) => act(SWIPES[direction].action, direction);

  // Keys on a desktop: 1-4 rate, arrows for the swipes, Z undoes.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!(event.target instanceof Element) || !pageOwnsKey(event.target)) return;
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
    <section className="mx-auto flex max-w-[760px] flex-col gap-4 max-wide:min-h-[calc(100dvh-148px-env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <h1 className={PAGE_TITLE}>Rate</h1>
        <Button onClick={undo} disabled={done.length === 0 || leaving !== null} aria-keyshortcuts="Z">
          <UndoIcon />
          Undo
          <Key className="ml-1">Z</Key>
        </Button>
      </div>
      <div>
        <KindFilter kind={kind} onChange={chooseKind} />
      </div>

      {loadError !== null && (
        <div className="grid justify-items-start gap-2 rounded-card bg-surface p-4 shadow-card">
          <ErrorLine>Couldn’t deal cards. {loadError}</ErrorLine>
          <Button onClick={() => setLoadError(null)}>Try again</Button>
        </div>
      )}

      {current ? (
        <>
          <div className="relative mt-2 pb-2.5">
            {next && (
              <div
                className="pointer-events-none absolute inset-0 z-0 [transform:translateY(10px)_scale(0.96)] rounded-card border border-line bg-surface opacity-60"
                aria-hidden="true"
              />
            )}
            <SwipeCard key={current.title.imdbId} labels={LABELS} onSwipe={swipe} leaving={leaving}>
              <CardFace card={current} record={record} />
            </SwipeCard>
          </div>

          {saveError && <ErrorLine>{saveError}</ErrorLine>}

          <p className="m-auto mt-0 mb-0 max-w-[52ch] text-center text-small text-ink-muted">
            Seen it? Rate it. Not seen it? Swipe right to save it, left if it’s not for you, up to skip.
          </p>

          <div
            className="sticky bottom-[calc(var(--height-tab)+env(safe-area-inset-bottom))] z-1 mt-auto grid gap-2 bg-page pt-2 pb-2 wide:static wide:pt-0 wide:pb-0"
            role="group"
            aria-label={`Your verdict on ${current.title.title}`}
          >
            <div className={RATING_BAR}>
              {RATINGS.map((rating, i) => (
                <button
                  key={rating}
                  type="button"
                  className={ratingStepClass(rating)}
                  onClick={() => rate(rating)}
                  aria-keyshortcuts={String(i + 1)}
                >
                  <Key className="absolute top-1.5 right-1.5">{String(i + 1)}</Key>
                  <Meter level={LEVEL[rating]} />
                  <span>{STATE_LABELS[rating]}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
              <button
                type="button"
                className={actionButtonClass(ACTION)}
                onClick={() => swipe("left")}
                aria-keyshortcuts="ArrowLeft"
              >
                <ArrowLeftIcon />
                <span>Not interested</span>
              </button>
              <button
                type="button"
                className={actionButtonClass(ACTION)}
                onClick={() => swipe("up")}
                aria-keyshortcuts="ArrowUp"
              >
                <ArrowUpIcon />
                <span>Skip</span>
              </button>
              <button
                type="button"
                className={actionButtonClass(cn(ACTION, "max-[479px]:flex-col-reverse"))}
                onClick={() => swipe("right")}
                aria-keyshortcuts="ArrowRight"
              >
                <span>Want to watch</span>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </>
      ) : exhausted ? (
        <div className={EMPTY_BOX}>
          <p className="m-0 mb-2">
            No more cards{kind ? ` for ${kind === "movie" ? "films" : "series"}` : ""}: every title in Lantern’s list
            has a verdict or was skipped.
          </p>
          <p className="m-0 text-small text-ink-muted">
            <Link to={{ page: "search", query: "" }}>Search for a title</Link> instead, or run the title import again
            for newer ones.
          </p>
        </div>
      ) : (
        loadError === null && (
          <div className="grid gap-3" aria-busy="true">
            <p className="m-0 text-small text-ink-muted">Dealing…</p>
            <Skel className="h-30 w-full" />
          </div>
        )
      )}
    </section>
  );
}

/** The three actions: icon beside the word, and under 480 px an icon over its word, 56 px tall. */
const ACTION =
  "px-2 max-[479px]:h-14 max-[479px]:min-h-14 max-[479px]:flex-col max-[479px]:gap-0.5 max-[479px]:p-1 max-[479px]:text-note";

/** The key a control answers to, shown on a wide page only. */
function Key({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "hidden h-4.5 min-w-4.5 place-items-center rounded-[4px] border border-outline px-1 text-note text-ink-muted wide:inline-grid",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** One card's face: the poster, then the pool's facts, then OMDb's plot when it has come. */
function CardFace({ card, record }: { card: Card; record: OmdbRecord | null | "error" | undefined }) {
  const { title } = card;
  const kept = record && record !== "error" ? record : null;
  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-4 p-3 max-[399px]:grid-cols-[112px_minmax(0,1fr)] max-[399px]:gap-3 max-[359px]:grid-cols-[96px_minmax(0,1fr)] wide:grid-cols-[220px_minmax(0,1fr)] wide:gap-6 wide:p-5">
      <Poster
        key={`${card.poster || kept?.hasPoster}`}
        imdbId={title.imdbId}
        title={title.title}
        has={card.poster || (kept?.hasPoster ?? false)}
        size="large"
        className="pointer-events-none"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="m-0 font-display text-card-title wide:text-page-title">
          <Link className="text-ink no-underline" to={{ page: "title", id: title.imdbId }}>
            {title.title}
          </Link>
        </h2>
        <Facts items={[years(title), kindLabel(title.kind), runtime(title.runtime)]} />
        {title.genres.length > 0 && <p className="m-0 text-small text-ink-muted">{title.genres.join(", ")}</p>}
        <p className="m-0 text-small tabular-nums">
          IMDb <span className="font-semibold">{title.rating.toFixed(1)}</span>{" "}
          <span className="text-ink-muted">({votes(title.votes)})</span>
        </p>
        {kept?.plot && <p className="m-0 mt-2 line-clamp-7 text-body">{kept.plot}</p>}
        {record === undefined && <p className="m-0 mt-2 line-clamp-7 text-body text-ink-muted">Loading the plot…</p>}
      </div>
    </div>
  );
}

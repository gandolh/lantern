import { RATINGS, type Rating, type TitleState } from "@lantern/shared";
import { useState, type ReactNode } from "react";
import { ToggleGroup, ToggleItem } from "./components/ui/ToggleGroup";
import { BlockIcon, BookmarkIcon, Meter } from "./Icons";
import { cn } from "./lib/cn";
import { saveState } from "./titlesApi";

/** The words for each state. */
export const STATE_LABELS: Record<TitleState, string> = {
  awful: "Awful",
  meh: "Meh",
  good: "Good",
  amazing: "Amazing",
  not_interested: "Not interested",
  want_to_watch: "Want to watch",
};

/** The meter's level for each rating step. */
export const LEVEL = { awful: 1, meh: 2, good: 3, amazing: 4 } as const;

/** Each rating's own fill and the text on it, per theme, as the two custom properties the step's button reads. */
const STEP: Record<Rating, string> = {
  awful: "[--on-rc:var(--color-on-awful)] [--rc:var(--color-awful)]",
  meh: "[--on-rc:var(--color-on-meh)] [--rc:var(--color-meh)]",
  good: "[--on-rc:var(--color-on-good)] [--rc:var(--color-good)]",
  amazing: "[--on-rc:var(--color-on-amazing)] [--rc:var(--color-amazing)]",
};

/**
 * One step of the rating bar: a level meter over its word. Chosen, it takes its colour and the text colour made for
 * it, and its focus ring turns to that text colour so the ring still shows on the fill.
 */
export function ratingStepClass(rating: Rating, extra?: string): string {
  return cn(
    STEP[rating],
    "relative flex min-h-12 cursor-pointer flex-col items-center justify-center gap-0 bg-transparent p-1 text-small font-semibold text-ink [-webkit-tap-highlight-color:transparent] hover:not-data-pressed:bg-control-hover focus-visible:-outline-offset-3 active:not-data-pressed:bg-control-raised data-pressed:bg-(--rc) data-pressed:text-(--on-rc) data-pressed:focus-visible:outline-(--on-rc) wide:min-h-13 wide:gap-0.5",
    extra,
  );
}

/** The bar the four steps sit in: one track, hairlines between the steps. */
export const RATING_BAR =
  "grid grid-cols-[repeat(4,minmax(0,1fr))] overflow-hidden rounded-control bg-control shadow-[inset_0_0_0_1px_var(--color-line)] [&>*+*]:shadow-[inset_1px_0_0_var(--color-line)]";

/** A control button for the two states that aren't ratings, and for the swipe actions: filled, chosen is ink. */
export function actionButtonClass(extra?: string): string {
  return cn(
    "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-control bg-control px-4 text-small font-semibold whitespace-nowrap text-ink [-webkit-tap-highlight-color:transparent] hover:not-data-pressed:bg-control-hover active:not-data-pressed:bg-control-raised data-pressed:bg-ink data-pressed:text-page data-pressed:hover:opacity-90 wide:min-h-10",
    extra,
  );
}

/**
 * A title's state, shown and changed in one place: the four ratings in a
 * row, then want to watch and not interested. A tap sets a state; tapping
 * the one already set clears it. The change shows at once and rolls back,
 * with a line saying so, if the server refuses it.
 */
export function StatePicker({
  imdbId,
  state: initial,
  onChange,
  fill = false,
  title,
}: {
  imdbId: string;
  state: TitleState | null;
  /** Told after the server took the change. */
  onChange?: (state: TitleState | null) => void;
  /** The two actions share the row's width on a phone (a card in a list); otherwise they take their own. */
  fill?: boolean;
  /** For screen readers: what the picker is about. */
  title: string;
}) {
  const [state, setState] = useState<TitleState | null>(initial);
  const [failed, setFailed] = useState(false);

  const choose = (next: TitleState | null) => {
    const before = state;
    setState(next);
    setFailed(false);
    saveState(imdbId, next).then(
      () => onChange?.(next),
      () => {
        setState(before);
        setFailed(true);
      },
    );
  };

  const action = (choice: "want_to_watch" | "not_interested", icon: ReactNode) => (
    <ToggleItem
      key={choice}
      value={choice}
      className={actionButtonClass(fill ? "flex-1 min-[900px]:flex-none" : undefined)}
    >
      {icon}
      {STATE_LABELS[choice]}
    </ToggleItem>
  );

  return (
    <ToggleGroup<TitleState>
      label={`Your verdict on ${title}`}
      value={state}
      onValueChange={choose}
      className={cn("grid", fill ? "gap-2" : "gap-3")}
    >
      <div className={RATING_BAR}>
        {RATINGS.map((rating) => (
          <ToggleItem key={rating} value={rating} className={ratingStepClass(rating)}>
            <Meter level={LEVEL[rating]} />
            <span>{STATE_LABELS[rating]}</span>
          </ToggleItem>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {action("want_to_watch", <BookmarkIcon />)}
        {action("not_interested", <BlockIcon />)}
      </div>
      {failed && (
        <p className="m-0 text-small text-danger" role="alert">
          That didn’t save. Try again.
        </p>
      )}
    </ToggleGroup>
  );
}

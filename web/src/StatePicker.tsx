import { RATINGS, type TitleState } from "@lantern/shared";
import { useState } from "react";
import { ToggleGroup, ToggleItem } from "./components/ui/ToggleGroup";
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

const STATE_BUTTON =
  "min-h-10 cursor-pointer rounded-control border border-line bg-surface px-2.5 font-semibold text-ink [-webkit-tap-highlight-color:transparent] hover:bg-surface-sunk data-pressed:border-transparent data-pressed:text-on-rating";

/** What a chosen state looks like: each rating has its colour, the other two read as plain ink. */
const PRESSED: Record<TitleState, string> = {
  awful: "data-pressed:bg-awful",
  meh: "data-pressed:bg-meh",
  good: "data-pressed:bg-good",
  amazing: "data-pressed:bg-amazing",
  want_to_watch: "data-pressed:bg-ink data-pressed:text-page",
  not_interested: "data-pressed:bg-ink data-pressed:text-page",
};

/** A state's button: the page's one look for choosing a state, here and on the rating cards. */
export function stateButtonClass(choice: TitleState, extra?: string): string {
  return cn(STATE_BUTTON, PRESSED[choice], extra);
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
  compact = false,
  title,
}: {
  imdbId: string;
  state: TitleState | null;
  /** Told after the server took the change. */
  onChange?: (state: TitleState | null) => void;
  compact?: boolean;
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

  const item = (choice: TitleState) => (
    <ToggleItem
      key={choice}
      value={choice}
      className={stateButtonClass(choice, compact ? "min-h-8.5 px-2 text-small" : undefined)}
    >
      {STATE_LABELS[choice]}
    </ToggleItem>
  );

  return (
    <ToggleGroup<TitleState>
      label={`Your verdict on ${title}`}
      value={state}
      onValueChange={choose}
      className="mt-2.5 grid gap-2"
    >
      <div className="grid grid-cols-4 gap-1.5">{RATINGS.map(item)}</div>
      <div className="flex flex-wrap gap-1.5">
        {item("want_to_watch")}
        {item("not_interested")}
      </div>
      {failed && (
        <p className="m-0 text-meta text-danger" role="alert">
          That didn't save. Try again.
        </p>
      )}
    </ToggleGroup>
  );
}

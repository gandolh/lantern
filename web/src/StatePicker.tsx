import { RATINGS, type TitleState } from "@lantern/shared";
import { useState } from "react";
import { ToggleGroup, ToggleItem } from "./components/ui/ToggleGroup";
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
    <ToggleItem key={choice} value={choice} className={`state-button state-${choice}`}>
      {STATE_LABELS[choice]}
    </ToggleItem>
  );

  return (
    <ToggleGroup<TitleState>
      label={`Your verdict on ${title}`}
      value={state}
      onValueChange={choose}
      className={`state-picker${compact ? " state-picker-compact" : ""}`}
    >
      <div className="state-ratings">{RATINGS.map(item)}</div>
      <div className="state-others">
        {item("want_to_watch")}
        {item("not_interested")}
      </div>
      {failed && (
        <p className="state-error" role="alert">
          That didn't save. Try again.
        </p>
      )}
    </ToggleGroup>
  );
}

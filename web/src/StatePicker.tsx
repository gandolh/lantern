import { RATINGS, type TitleState } from "@lantern/shared";
import { useState } from "react";
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

  const choose = (choice: TitleState) => {
    const before = state;
    const next = state === choice ? null : choice;
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

  const button = (choice: TitleState, extra = "") => (
    <button
      key={choice}
      type="button"
      className={`state-button state-${choice} ${extra}`}
      aria-pressed={state === choice}
      onClick={() => choose(choice)}
    >
      {STATE_LABELS[choice]}
    </button>
  );

  return (
    <div
      className={`state-picker${compact ? " state-picker-compact" : ""}`}
      role="group"
      aria-label={`Your verdict on ${title}`}
    >
      <div className="state-ratings">{RATINGS.map((rating) => button(rating))}</div>
      <div className="state-others">
        {button("want_to_watch")}
        {button("not_interested")}
      </div>
      {failed && (
        <p className="state-error" role="alert">
          That didn't save. Try again.
        </p>
      )}
    </div>
  );
}

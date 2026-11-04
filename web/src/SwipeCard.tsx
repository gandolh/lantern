import { useRef, useState, type PointerEvent, type ReactNode } from "react";

export type SwipeDirection = "left" | "right" | "up";

/** How far a card must travel, in pixels, before letting go commits the swipe. */
const COMMIT_PX = 90;

/**
 * A card that follows the finger (or the mouse) and, let go past the
 * threshold, reports which way it was thrown; short of it, it snaps back.
 * While dragging, `labels` shows what the swipe will do. Only the card takes
 * the gesture (`touch-action: none`), so the page still scrolls around it.
 */
export function SwipeCard({
  children,
  labels,
  onSwipe,
  leaving,
}: {
  children: ReactNode;
  labels: Record<SwipeDirection, string>;
  onSwipe: (direction: SwipeDirection) => void;
  /** Set by the page when the card is on its way out, by a swipe or a button. */
  leaving: SwipeDirection | null;
}) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  const direction = (x: number, y: number): SwipeDirection | null => {
    if (-y > COMMIT_PX && -y > Math.abs(x)) return "up";
    if (Math.abs(x) > COMMIT_PX) return x > 0 ? "right" : "left";
    return null;
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (leaving || (event.pointerType === "mouse" && event.button !== 0)) return;
    // A press on a button inside the card is a press, not a drag.
    if ((event.target as HTMLElement).closest("button, a")) return;
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0 });
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== event.pointerId) return;
    setDrag({ x: event.clientX - start.current.x, y: Math.min(0, event.clientY - start.current.y) });
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== event.pointerId) return;
    const thrown = drag ? direction(drag.x, drag.y) : null;
    start.current = null;
    setDrag(null);
    if (thrown) onSwipe(thrown);
  };

  const showing = leaving ?? (drag ? direction(drag.x, drag.y) : null);
  const transform = leaving
    ? leaving === "up"
      ? "translate(0, -120%)"
      : `translate(${leaving === "right" ? 130 : -130}%, 0) rotate(${leaving === "right" ? 12 : -12}deg)`
    : drag
      ? `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`
      : undefined;

  return (
    <div
      className={`swipe-card${drag ? " is-dragging" : ""}${leaving ? " is-leaving" : ""}`}
      style={{ transform }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        start.current = null;
        setDrag(null);
      }}
    >
      {showing && (
        <span className={`swipe-label swipe-label-${showing}`} aria-hidden="true">
          {labels[showing]}
        </span>
      )}
      {children}
    </div>
  );
}

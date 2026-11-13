import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from "./Icons";
import { cn } from "./lib/cn";

export type SwipeDirection = "left" | "right" | "up";

/** The card's own look; the page behind it (`RatePage`) wears it too. */
const CARD_LOOK = "relative z-1 overflow-hidden rounded-card border border-line bg-surface shadow-card";

/** The tag that shows what a swipe will do, one look per direction. */
const LABEL: Record<SwipeDirection, string> = {
  right: "left-4 -rotate-6 text-ok",
  left: "right-4 rotate-6 text-awful",
  up: "left-1/2 -translate-x-1/2 text-ink-muted",
};

const STAMP_ICON: Record<SwipeDirection, ReactNode> = {
  right: <ArrowRightIcon />,
  left: <ArrowLeftIcon />,
  up: <ArrowUpIcon />,
};

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
      className={cn(
        CARD_LOOK,
        "touch-none select-none",
        drag
          ? "cursor-grabbing transition-none"
          : "cursor-grab motion-safe:transition-[transform,opacity] motion-safe:duration-180 motion-safe:ease-swipe motion-reduce:transition-opacity motion-reduce:duration-120 motion-reduce:ease-linear",
        leaving && "opacity-0",
      )}
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
        <span
          className={cn(
            "absolute top-4 z-2 inline-flex items-center gap-2 rounded-control border-2 border-current bg-surface px-3 py-1 text-small font-bold",
            LABEL[showing],
          )}
          aria-hidden="true"
        >
          {STAMP_ICON[showing]}
          {labels[showing]}
        </span>
      )}
      {children}
    </div>
  );
}

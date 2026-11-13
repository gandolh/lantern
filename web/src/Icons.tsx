import type { ReactNode } from "react";

/**
 * The icons the page needs, drawn inline so nothing loads from elsewhere. Each is decorative: the label beside it
 * says what it is.
 */
function Svg({ size = 22, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
      focusable={false}
    >
      {children}
    </svg>
  );
}

/** The brand: a lantern with its flame lit in the accent. */
export function LanternMark({ size = 26 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M9 5.5V4a3 3 0 0 1 6 0v1.5" />
      <path d="M7 5.5h10l1.2 4.5v6.2a2 2 0 0 1-2 2H7.8a2 2 0 0 1-2-2V10z" />
      <path d="M8.5 20.2h7" />
      <path d="M12 9.2c1.4 1.5 2 2.5 2 3.6a2 2 0 0 1-4 0c0-1.1.6-2.1 2-3.6z" fill="var(--color-accent)" stroke="none" />
    </Svg>
  );
}

export function SuggestionsIcon() {
  return (
    <Svg>
      <path d="M10 4l1.8 4.7L16.5 10.5l-4.7 1.8L10 17l-1.8-4.7L3.5 10.5l4.7-1.8z" />
      <path d="M18 3v4M16 5h4M18.5 15v4M16.5 17h4" />
    </Svg>
  );
}

export function RateIcon() {
  return (
    <Svg>
      <rect x="5" y="6" width="14" height="15" rx="2.5" />
      <path d="M8 3h8" />
    </Svg>
  );
}

export function WatchlistIcon() {
  return (
    <Svg>
      <path d="M6 3h12v18l-6-4-6 4z" />
    </Svg>
  );
}

export function RatingsIcon() {
  return (
    <Svg>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </Svg>
  );
}

export function AccountIcon() {
  return (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </Svg>
  );
}

export function BookmarkIcon() {
  return (
    <Svg size={18}>
      <path d="M6 3h12v18l-6-4-6 4z" />
    </Svg>
  );
}

export function BlockIcon() {
  return (
    <Svg size={18}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function ArrowLeftIcon() {
  return (
    <Svg size={18}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

export function ArrowUpIcon() {
  return (
    <Svg size={18}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Svg>
  );
}

export function ArrowRightIcon() {
  return (
    <Svg size={18}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function UndoIcon() {
  return (
    <Svg size={18}>
      <path d="M9 7L4 12l5 5" />
      <path d="M4 12h10a6 6 0 0 1 0 12" />
    </Svg>
  );
}

export function ExternalIcon() {
  return (
    <Svg size={16}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Svg>
  );
}

/** The four-bar level meter on a rating: `level` bars are filled, 1 for awful to 4 for amazing. */
export function Meter({ level }: { level: 1 | 2 | 3 | 4 }) {
  const bars = [
    { x: 2, y: 16, h: 7 },
    { x: 7.5, y: 12, h: 11 },
    { x: 13, y: 7, h: 16 },
    { x: 18.5, y: 2, h: 21 },
  ];
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden={true} focusable={false}>
      {bars.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={3.5}
          height={bar.h}
          rx={1}
          fill="currentColor"
          opacity={i < level ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}

export function AlertIcon() {
  return (
    <Svg size={18}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </Svg>
  );
}

export function CheckIcon() {
  return (
    <Svg size={18}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
    </Svg>
  );
}

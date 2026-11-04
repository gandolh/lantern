/**
 * The few icons the navigation needs, drawn inline so nothing loads from
 * elsewhere. Each is decorative: the label beside it says what it is.
 */
const common = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function SuggestionsIcon() {
  return (
    <svg {...common}>
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" />
      <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z" />
    </svg>
  );
}

export function RateIcon() {
  return (
    <svg {...common}>
      <rect x="6" y="3" width="12" height="16" rx="2" />
      <path d="M3.5 7.5v10A2.5 2.5 0 0 0 6 20h9" />
    </svg>
  );
}

export function WatchlistIcon() {
  return (
    <svg {...common}>
      <path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4-6 4V4.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function RatingsIcon() {
  return (
    <svg {...common}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function AccountIcon() {
  return (
    <svg {...common}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

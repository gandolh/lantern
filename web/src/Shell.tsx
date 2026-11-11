import type { ReactNode } from "react";
import { ImdbCredit } from "./Credits";
import { AccountIcon, RateIcon, RatingsIcon, SearchIcon, SuggestionsIcon, WatchlistIcon } from "./Icons";
import { Link } from "./Link";
import type { Page, Route } from "./route";

/** The five sections, in the order both navigations show them. */
export const SECTIONS: ReadonlyArray<{ route: Route; label: string; icon: () => ReactNode }> = [
  { route: { page: "suggestions" }, label: "Suggestions", icon: SuggestionsIcon },
  { route: { page: "rate" }, label: "Rate", icon: RateIcon },
  { route: { page: "watchlist" }, label: "Watchlist", icon: WatchlistIcon },
  { route: { page: "ratings" }, label: "Ratings", icon: RatingsIcon },
  { route: { page: "search", query: "" }, label: "Search", icon: SearchIcon },
];

/**
 * The frame every signed-in page sits in. Conventional on purpose: a top bar
 * with the brand, the sections and the account on wide screens; on a phone
 * the sections move to a tab bar at the bottom, under the thumb. A title page
 * belongs to no section, so no tab is marked there.
 */
export function Shell({ current, children }: { current: Page; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-bar flex h-top items-center gap-6 border-b border-line bg-bar pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))] backdrop-blur-bar">
        <Link
          to={{ page: "suggestions" }}
          className="inline-flex items-center gap-2.5 text-brand font-bold tracking-[0.01em] text-ink no-underline"
          aria-label="Lantern, home"
        >
          <span className="size-3.5 rounded-full bg-accent shadow-brand-mark" aria-hidden="true" />
          Lantern
        </Link>
        <nav className="hidden gap-1 wide:flex" aria-label="Sections">
          {SECTIONS.map(({ route, label }) => (
            <Link
              key={label}
              to={route}
              className="rounded-pill px-3 py-1.5 font-medium text-ink-muted no-underline hover:bg-surface-sunk hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-ink"
              aria-current={route.page === current ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          to={{ page: "account" }}
          className="ml-auto inline-flex items-center gap-2 rounded-pill px-2.5 py-1.5 text-ink-muted no-underline hover:bg-surface-sunk hover:text-ink aria-[current=page]:bg-surface-sunk aria-[current=page]:text-ink"
          aria-current={current === "account" ? "page" : undefined}
        >
          <AccountIcon />
          <span className="hidden wide:inline">Account</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-4 pt-5 pb-8 wide:px-6 wide:pt-7 wide:pb-10" id="content">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-page px-4 pb-[calc(var(--height-tab)+16px+env(safe-area-inset-bottom))] text-small text-ink-muted wide:px-6 wide:pb-6">
        <p>Lantern, for rating films and series and finding the next one.</p>
        <p>
          <ImdbCredit />
        </p>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-bar grid h-[calc(var(--height-tab)+env(safe-area-inset-bottom))] grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] wide:hidden"
        aria-label="Sections"
      >
        {SECTIONS.map(({ route, label, icon: Icon }) => (
          <Link
            key={label}
            to={route}
            className="flex flex-col items-center justify-center gap-0.5 text-micro font-medium text-ink-muted no-underline [-webkit-tap-highlight-color:transparent] aria-[current=page]:text-accent"
            aria-current={route.page === current ? "page" : undefined}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

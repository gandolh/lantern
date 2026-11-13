import type { ReactNode } from "react";
import { ImdbCredit } from "./Credits";
import { AccountIcon, LanternMark, RateIcon, RatingsIcon, SearchIcon, SuggestionsIcon, WatchlistIcon } from "./Icons";
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
      <header className="sticky top-0 z-bar flex h-top items-center gap-6 border-b border-line bg-page pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))] wide:h-15 wide:px-10">
        <Link
          to={{ page: "suggestions" }}
          className="inline-flex min-h-12 items-center gap-2 font-display text-heading tracking-[-0.01em] text-ink no-underline"
          aria-label="Lantern, home"
        >
          <LanternMark />
          <span>Lantern</span>
        </Link>
        <nav className="hidden self-stretch wide:flex wide:gap-1" aria-label="Sections">
          {SECTIONS.map(({ route, label }) => (
            <Link
              key={label}
              to={route}
              className="relative flex items-center px-3 text-small font-semibold text-ink-muted no-underline hover:text-ink active:text-ink aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.75 aria-[current=page]:after:rounded-t-[3px] aria-[current=page]:after:bg-ink aria-[current=page]:after:content-['']"
              aria-current={route.page === current ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          to={{ page: "account" }}
          aria-label="Account"
          className="ml-auto inline-flex size-12 items-center justify-center gap-2 rounded-pill text-small font-semibold text-ink-muted no-underline hover:bg-control hover:text-ink active:bg-control-hover aria-[current=page]:text-ink wide:h-10 wide:w-auto wide:rounded-control wide:px-3"
          aria-current={current === "account" ? "page" : undefined}
        >
          <AccountIcon />
          <span className="hidden wide:inline">Account</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-page flex-1 px-4 pt-5 pb-8 wide:px-10 wide:pt-8 wide:pb-12" id="content">
        {children}
      </main>

      <footer className="mx-auto grid w-full max-w-page gap-2 px-4 pt-4 pb-[calc(var(--height-tab)+24px+env(safe-area-inset-bottom))] text-small text-ink-muted wide:px-10 wide:pt-6 wide:pb-8">
        <p className="m-0">Lantern, for rating films and series and finding the next one.</p>
        <p className="m-0">
          <ImdbCredit />
        </p>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-bar grid h-[calc(var(--height-tab)+env(safe-area-inset-bottom))] grid-cols-[repeat(5,1fr)] border-t border-line bg-page pb-[env(safe-area-inset-bottom)] wide:hidden"
        aria-label="Sections"
      >
        {SECTIONS.map(({ route, label, icon: Icon }) => (
          <Link
            key={label}
            to={route}
            className="group flex flex-col items-center justify-center gap-0.5 text-note text-ink-muted no-underline [-webkit-tap-highlight-color:transparent] aria-[current=page]:text-ink"
            aria-current={route.page === current ? "page" : undefined}
          >
            <span className="grid h-7 w-14 place-items-center rounded-pill group-aria-[current=page]:bg-control">
              <Icon />
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

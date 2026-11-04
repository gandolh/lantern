import type { ReactNode } from "react";
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
    <div className="app">
      <header className="topbar">
        <Link to={{ page: "suggestions" }} className="brand" aria-label="Lantern, home">
          <span className="brand-mark" aria-hidden="true" />
          Lantern
        </Link>
        <nav className="topnav" aria-label="Sections">
          {SECTIONS.map(({ route, label }) => (
            <Link key={label} to={route} className="topnav-link" aria-current={route.page === current ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <Link to={{ page: "account" }} className="account-link" aria-current={current === "account" ? "page" : undefined}>
          <AccountIcon />
          <span className="account-label">Account</span>
        </Link>
      </header>

      <main className="content" id="content">
        {children}
      </main>

      <footer className="footer">
        <p>Lantern, for rating films and series and finding the next one.</p>
      </footer>

      <nav className="tabbar" aria-label="Sections">
        {SECTIONS.map(({ route, label, icon: Icon }) => (
          <Link key={label} to={route} className="tab" aria-current={route.page === current ? "page" : undefined}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

import { RATINGS, type Rating } from "@lantern/shared";
import { useState } from "react";
import { Link } from "./Link";
import { TitleList, useCounts, usePageTitle, type ListChoice } from "./ListPage";
import { STATE_LABELS } from "./StatePicker";

/** The watchlist: every title marked want to watch. Rating one takes it off. */
export function WatchlistPage() {
  usePageTitle("Watchlist");
  return (
    <section className="page">
      <h1 className="page-title">Watchlist</h1>
      <TitleList
        choice={{ list: "watchlist" }}
        empty={
          <>
            <p>Nothing on your watchlist yet.</p>
            <p>
              Swipe right on a <Link to={{ page: "rate" }}>card</Link>, or mark a title "Want to watch" from{" "}
              <Link to={{ page: "search", query: "" }}>search</Link> or your suggestions.
            </p>
          </>
        }
      />
    </section>
  );
}

type Tab = Rating | "all" | "not-interested";

/** The ratings, by step, and the titles marked not interested, each a tab with its count. */
export function RatingsPage() {
  usePageTitle("Ratings");
  const [tab, setTab] = useState<Tab>("all");
  const choice: ListChoice =
    tab === "not-interested"
      ? { list: "not-interested" }
      : { list: "ratings", rating: tab === "all" ? undefined : tab };
  const counts = useCounts(choice);
  const count = (t: Tab): number | undefined =>
    !counts
      ? undefined
      : t === "all"
        ? RATINGS.reduce((sum, r) => sum + counts[r], 0)
        : t === "not-interested"
          ? counts.not_interested
          : counts[t];
  const tabs: { value: Tab; label: string }[] = [
    { value: "all", label: "All" },
    ...RATINGS.map((rating) => ({ value: rating as Tab, label: STATE_LABELS[rating] })),
    { value: "not-interested", label: "Not interested" },
  ];

  return (
    <section className="page">
      <h1 className="page-title">Ratings</h1>
      <TitleList
        choice={choice}
        tabs={
          <div className="tabs" role="tablist" aria-label="Which ratings">
            {tabs.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={tab === option.value}
                onClick={() => setTab(option.value)}
              >
                {option.label}
                {count(option.value) !== undefined && <span className="tab-count">{count(option.value)}</span>}
              </button>
            ))}
          </div>
        }
        empty={
          tab === "not-interested" ? (
            <p>Nothing marked not interested.</p>
          ) : (
            <>
              <p>No ratings {tab === "all" ? "yet" : `marked ${STATE_LABELS[tab].toLowerCase()}`}.</p>
              <p>
                <Link to={{ page: "rate" }}>Rate some cards</Link> or{" "}
                <Link to={{ page: "search", query: "" }}>search for a title</Link>.
              </p>
            </>
          )
        }
      />
    </section>
  );
}

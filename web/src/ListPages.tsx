import { RATINGS, type Rating } from "@lantern/shared";
import { useState } from "react";
import { Tab, Tabs, TabsList } from "./components/ui/Tabs";
import { Link } from "./Link";
import { PAGE_TITLE } from "./looks";
import { TitleList, useCounts, usePageTitle, type ListChoice } from "./ListPage";
import { STATE_LABELS } from "./StatePicker";

/** The watchlist: every title marked want to watch. Rating one takes it off. */
export function WatchlistPage() {
  usePageTitle("Watchlist");
  return (
    <section>
      <h1 className={PAGE_TITLE}>Watchlist</h1>
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
    ...RATINGS.map((rating) => ({ value: rating, label: STATE_LABELS[rating] })),
    { value: "not-interested", label: "Not interested" },
  ];

  return (
    <section>
      <h1 className={PAGE_TITLE}>Ratings</h1>
      <Tabs value={tab} onValueChange={(value: Tab) => setTab(value)}>
        <TitleList
          choice={choice}
          tabs={
            <TabsList label="Which ratings">
              {tabs.map((option) => (
                <Tab key={option.value} value={option.value}>
                  {option.label}
                  {count(option.value) !== undefined && (
                    <span className="text-note opacity-75">{count(option.value)}</span>
                  )}
                </Tab>
              ))}
            </TabsList>
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
      </Tabs>
    </section>
  );
}

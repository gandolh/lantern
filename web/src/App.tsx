import { AccountPage } from "./AccountPage";
import { Placeholder } from "./Placeholder";
import { useRoute, type Route } from "./route";
import { Shell } from "./Shell";

/** Lantern in the browser, behind the sign-in gate (`AuthGate.tsx`): the shell and the page the address names. */
export function App() {
  const route = useRoute();
  return (
    <Shell current={route.page}>
      <PageFor route={route} />
    </Shell>
  );
}

function PageFor({ route }: { route: Route }) {
  switch (route.page) {
    case "suggestions":
      return <Placeholder title="Suggestions">What to watch next, from what you liked, each saying why.</Placeholder>;
    case "rate":
      return <Placeholder title="Rate">Popular titles, one card at a time: rate them, mark them, or skip.</Placeholder>;
    case "watchlist":
      return <Placeholder title="Watchlist">The titles you want to watch.</Placeholder>;
    case "ratings":
      return <Placeholder title="Ratings">What you rated, by step, and what you are not interested in.</Placeholder>;
    case "search":
      return <Placeholder title="Search">Find a film or a series by its name.</Placeholder>;
    case "title":
      return (
        <Placeholder title={route.mediaType === "movie" ? "Film" : "Series"}>
          A title's page: its facts, its scores, and your rating.
        </Placeholder>
      );
    case "account":
      return <AccountPage />;
    case "login":
      // The gate shows the login page itself and never renders the app there.
      return null;
    case "not-found":
      return <Placeholder title="Not found">There is no page at this address.</Placeholder>;
  }
}

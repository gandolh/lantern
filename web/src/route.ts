import { useMemo, useSyncExternalStore, type MouseEvent } from "react";
import { appBase } from "./base";

/**
 * The pages, by path under the base. Small enough that a router library would
 * be the bigger part; the server answers every path under the base with the
 * page, so a reload lands on the same page.
 *
 *   /lantern/              suggestions (home)
 *   /lantern/rate          the rating cards
 *   /lantern/watchlist     want to watch
 *   /lantern/ratings       what was rated, and not interested
 *   /lantern/search?q=     search
 *   /lantern/title/:id     a film or a series, by IMDb id (tt0111161)
 *   /lantern/account       the account
 *   /lantern/login         signing in
 */
export type Route =
  | { page: "suggestions" }
  | { page: "rate" }
  | { page: "watchlist" }
  | { page: "ratings" }
  | { page: "search"; query: string }
  | { page: "title"; id: string }
  | { page: "account" }
  | { page: "login" }
  | { page: "not-found" };

export type Page = Route["page"];

/** The route an address names. Anything unknown under the base is "not found". */
export function routeOf(pathname: string, search: string, base: string = appBase()): Route {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname === base.slice(0, -1) ? "" : null;
  if (rest === null) return { page: "not-found" };
  const parts = rest.split("/").filter((part) => part !== "");
  if (parts.length === 0) return { page: "suggestions" };
  const [first, second] = parts;
  if (parts.length === 1) {
    switch (first) {
      case "rate":
      case "watchlist":
      case "ratings":
      case "account":
      case "login":
        return { page: first };
      case "search":
        return { page: "search", query: new URLSearchParams(search).get("q") ?? "" };
      default:
        break;
    }
  }
  if (parts.length === 2 && first === "title" && second !== undefined && /^tt\d{7,10}$/.test(second)) {
    return { page: "title", id: second };
  }
  return { page: "not-found" };
}

/** The address of a route, under the base. */
export function hrefOf(route: Route, base: string = appBase()): string {
  switch (route.page) {
    case "suggestions":
    case "not-found":
      return base;
    case "search":
      return route.query === "" ? `${base}search` : `${base}search?${new URLSearchParams({ q: route.query })}`;
    case "title":
      return `${base}title/${route.id}`;
    default:
      return `${base}${route.page}`;
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const snapshot = () => `${window.location.pathname}${window.location.search}`;

/** Go to an address without a reload. `replace` keeps Back from returning to where this was called. */
export function navigate(href: string, { replace = false }: { replace?: boolean } = {}): void {
  if (snapshot() === href) return;
  if (replace) window.history.replaceState(null, "", href);
  else {
    window.history.pushState(null, "", href);
    window.scrollTo(0, 0);
  }
  for (const listener of listeners) listener();
}

/** The route the address shows; re-renders when it changes. */
export function useRoute(): Route {
  const address = useSyncExternalStore(subscribe, snapshot, () => "/");
  return useMemo(() => {
    const url = new URL(address, "http://page.invalid");
    return routeOf(url.pathname, url.search);
  }, [address]);
}

/**
 * A click handler for a link inside the page: a plain left click navigates
 * without a reload; a modified click (new tab, new window) is left to the
 * browser.
 */
export function followLink(event: MouseEvent<HTMLAnchorElement>): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  const href = event.currentTarget.getAttribute("href");
  if (href === null || event.currentTarget.target === "_blank") return;
  event.preventDefault();
  navigate(href);
}

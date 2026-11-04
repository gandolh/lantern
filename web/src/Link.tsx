import type { AnchorHTMLAttributes } from "react";
import { followLink, hrefOf, type Route } from "./route";

/** A link to one of the page's own routes: a real `href`, followed without a reload. */
export function Link({ to, ...rest }: { to: Route } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return <a {...rest} href={hrefOf(to)} onClick={followLink} />;
}

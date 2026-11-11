import { IMDB_CREDIT } from "@lantern/shared";

/**
 * IMDb's credit line, word for word as its terms ask, with its address as a
 * link. Shown in the footer and on the account page.
 */
export function ImdbCredit() {
  const [before, after] = IMDB_CREDIT.split("https://www.imdb.com");
  return (
    <span>
      {before}
      <a className="text-inherit" href="https://www.imdb.com" rel="noreferrer" target="_blank">
        https://www.imdb.com
      </a>
      {after}
    </span>
  );
}

import type { PoolTitle, TitleState } from "@lantern/shared";
import type { ReactNode } from "react";
import { kindLabel, votes, years } from "./format";
import { Link } from "./Link";
import { Poster } from "./Poster";
import { StatePicker } from "./StatePicker";

/** One title in a list: poster, name, facts, an optional note, and the state picker. */
export function TitleRow({
  item,
  note,
  onChange,
}: {
  item: { title: PoolTitle; state: TitleState | null; poster: boolean };
  note?: ReactNode;
  onChange?: (state: TitleState | null) => void;
}) {
  const { title } = item;
  const facts = [years(title), kindLabel(title.kind), title.genres.join(", ")].filter((fact) => fact);
  return (
    <li className="title-row">
      <Link to={{ page: "title", id: title.imdbId }} className="title-row-poster" tabIndex={-1} aria-hidden="true">
        <Poster imdbId={title.imdbId} title={title.title} has={item.poster} />
      </Link>
      <div className="title-row-body">
        <Link to={{ page: "title", id: title.imdbId }} className="title-row-name">
          {title.title}
        </Link>
        <p className="title-row-facts">{facts.join(" · ")}</p>
        {title.votes > 0 && (
          <p className="title-row-score">
            IMDb {title.rating.toFixed(1)} <span className="muted">({votes(title.votes)} votes)</span>
          </p>
        )}
        {note && <p className="title-row-note">{note}</p>}
        <StatePicker
          key={title.imdbId}
          imdbId={title.imdbId}
          state={item.state}
          title={title.title}
          compact
          onChange={onChange}
        />
      </div>
    </li>
  );
}

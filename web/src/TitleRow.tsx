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
    <li className="grid grid-cols-[64px_1fr] gap-3 rounded-card border border-line bg-surface p-3 wide:grid-cols-[80px_1fr]">
      <Link to={{ page: "title", id: title.imdbId }} className="block no-underline" tabIndex={-1} aria-hidden="true">
        <Poster imdbId={title.imdbId} title={title.title} has={item.poster} />
      </Link>
      <div className="min-w-0">
        <Link to={{ page: "title", id: title.imdbId }} className="font-bold text-ink no-underline hover:underline">
          {title.title}
        </Link>
        <p className="mt-0.5 mb-0 text-meta text-ink-muted">{facts.join(" · ")}</p>
        {title.votes > 0 && (
          <p className="mt-0.5 mb-0 text-meta text-ink">
            IMDb {title.rating.toFixed(1)} <span className="text-ink-muted">({votes(title.votes)} votes)</span>
          </p>
        )}
        {note && <p className="mt-1 mb-0 text-meta">{note}</p>}
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

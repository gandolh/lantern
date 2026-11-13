import type { PoolTitle, TitleState } from "@lantern/shared";
import type { ReactNode } from "react";
import { Facts } from "./Facts";
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
  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 rounded-card border border-line bg-surface p-3 shadow-card min-[900px]:grid-cols-[84px_minmax(0,1fr)_360px] min-[900px]:items-center min-[900px]:gap-x-5 min-[900px]:p-4">
      <Link to={{ page: "title", id: title.imdbId }} className="block no-underline" tabIndex={-1} aria-hidden="true">
        <Poster imdbId={title.imdbId} title={title.title} has={item.poster} />
      </Link>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="m-0 font-display text-card-title text-ink">
          <Link
            to={{ page: "title", id: title.imdbId }}
            className="relative text-ink no-underline after:absolute after:inset-x-0 after:-inset-y-3 hover:underline hover:underline-offset-3 wide:after:content-none"
          >
            {title.title}
          </Link>
        </h2>
        <Facts items={[years(title), kindLabel(title.kind)]} />
        {title.genres.length > 0 && <p className="m-0 text-small text-ink-muted">{title.genres.join(", ")}</p>}
        {title.votes > 0 && (
          <p className="m-0 text-small text-ink tabular-nums">
            IMDb <span className="font-semibold">{title.rating.toFixed(1)}</span>{" "}
            <span className="text-ink-muted">({votes(title.votes)} votes)</span>
          </p>
        )}
        {note && <p className="m-0 text-small">{note}</p>}
      </div>
      <div className="col-span-full min-[900px]:col-auto">
        <StatePicker
          key={title.imdbId}
          imdbId={title.imdbId}
          state={item.state}
          title={title.title}
          fill
          onChange={onChange}
        />
      </div>
    </li>
  );
}

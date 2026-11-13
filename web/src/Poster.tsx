import { useState } from "react";
import { API_BASE } from "./base";
import { cn } from "./lib/cn";

/** The six tints a poster-less title is set on, picked from its id so a title keeps its colour. */
const TINTS = [
  "bg-poster-1-bg text-poster-1-ink",
  "bg-poster-2-bg text-poster-2-ink",
  "bg-poster-3-bg text-poster-3-ink",
  "bg-poster-4-bg text-poster-4-ink",
  "bg-poster-5-bg text-poster-5-ink",
  "bg-poster-6-bg text-poster-6-ink",
] as const;

/** 0 to 5, the same for the same id. */
function tintOf(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % TINTS.length;
}

const POSTER = "block aspect-2/3 w-full rounded-xs shadow-poster";

/**
 * A title's poster, through Lantern's poster route, which serves it only
 * when OMDb's record is kept (no call is made for it). Without one, or when
 * it fails to load, a tile with the title's name set in type stands in.
 */
export function Poster({
  imdbId,
  title,
  has,
  size = "normal",
  className,
}: {
  imdbId: string;
  title: string;
  has: boolean;
  size?: "normal" | "large";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!has || failed) {
    return (
      <div
        className={cn(POSTER, "@container relative overflow-hidden", TINTS[tintOf(imdbId)], className)}
        aria-hidden="true"
      >
        <div className="absolute inset-[6cqw] flex flex-col justify-end rounded-[3px] border border-current/35 p-[6cqw]">
          <span className="min-w-0 font-display text-[clamp(12px,15cqw,30px)] leading-[1.05] font-bold wrap-break-word">
            {title}
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      className={cn(POSTER, "bg-poster-bg object-cover", className)}
      src={`${API_BASE}/v1/posters/${imdbId}${size === "large" ? "?size=large" : ""}`}
      alt={`Poster of ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

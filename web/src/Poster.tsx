import { useState } from "react";
import { API_BASE } from "./base";

/**
 * A title's poster, through Lantern's poster route, which serves it only
 * when OMDb's record is kept (no call is made for it). Without one, or when
 * it fails to load, a plain frame with the title's initials stands in.
 */
export function Poster({ imdbId, title, has, size = "normal", className = "" }: { imdbId: string; title: string; has: boolean; size?: "normal" | "large"; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!has || failed) {
    const initials = title
      .split(/\s+/)
      .filter((word) => /^[\p{L}\p{N}]/u.test(word))
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join("");
    return (
      <div className={`poster poster-empty ${className}`} aria-hidden="true">
        <span>{initials}</span>
      </div>
    );
  }
  return (
    <img
      className={`poster ${className}`}
      src={`${API_BASE}/v1/posters/${imdbId}${size === "large" ? "?size=large" : ""}`}
      alt={`Poster of ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

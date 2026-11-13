import type { ReactNode } from "react";
import { AlertIcon } from "./Icons";
import { cn } from "./lib/cn";

/** A still block standing in for what is loading: never a shimmer, so a reduced-motion reader sees the same page. */
export function Skel({ className }: { className?: string }) {
  return <span className={cn("block rounded-control bg-control", className)} aria-hidden="true" />;
}

/** The loading state: today's line, with a still sketch of the rows that are coming. */
export function Loading({ children = "Loading…", rows = 1 }: { children?: string; rows?: number }) {
  return (
    <div className="grid gap-3" aria-busy="true">
      <p className="m-0 text-small text-ink-muted">{children}</p>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-card bg-surface p-3 shadow-card">
          <Skel className="h-18 w-12 shrink-0" />
          <div className="grid flex-1 content-start gap-2">
            <Skel className="h-4 w-3/5" />
            <Skel className="h-3 w-2/5" />
            <Skel className="h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A line that says what went wrong, with its icon, so it doesn't rest on colour alone. */
export function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 flex items-start gap-2 text-small font-semibold text-danger" role="alert">
      <span className="mt-0.5">
        <AlertIcon />
      </span>
      <span>{children}</span>
    </p>
  );
}

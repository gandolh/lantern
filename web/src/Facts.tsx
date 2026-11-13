import { cn } from "./lib/cn";

/** A line of short facts split by hairlines: "2023 | Film". Nothing when there are none. */
export function Facts({ items, className }: { items: ReadonlyArray<string | null | undefined>; className?: string }) {
  const shown = items.filter((item): item is string => Boolean(item));
  if (shown.length === 0) return null;
  return (
    <p className={cn("m-0 flex flex-wrap text-small text-ink-muted", className)}>
      {shown.map((item, i) => (
        <span key={item} className={cn(i > 0 && "ml-2 border-l border-outline pl-2")}>
          {item}
        </span>
      ))}
    </p>
  );
}

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** The root renders a plain `<div>` with no look of its own. */
export const Tabs = BaseTabs.Root;

/** The row of tabs. The arrow keys move focus and choose (base-ui rule 16). */
export function TabsList({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <BaseTabs.List
      aria-label={label}
      activateOnFocus
      className={cn("mt-2 mb-3 flex [scrollbar-width:none] gap-1.5 overflow-x-auto", className)}
    >
      {children}
    </BaseTabs.List>
  );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return (
    <BaseTabs.Tab
      value={value}
      className={cn(
        "inline-flex min-h-9 flex-none cursor-pointer items-center gap-1.5 rounded-pill border border-line bg-surface px-3 font-semibold",
        "data-active:border-transparent data-active:bg-ink data-active:text-page",
      )}
    >
      {children}
    </BaseTabs.Tab>
  );
}

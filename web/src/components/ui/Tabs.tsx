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
      className={cn("mb-4 flex [scrollbar-width:none] gap-2 overflow-x-auto", className)}
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
        "inline-flex min-h-10 flex-none cursor-pointer items-center gap-1.5 rounded-pill bg-control px-3.5 text-small font-semibold text-ink",
        "hover:not-data-active:bg-control-hover active:not-data-active:bg-control-raised",
        "data-active:bg-ink data-active:text-page",
      )}
    >
      {children}
    </BaseTabs.Tab>
  );
}

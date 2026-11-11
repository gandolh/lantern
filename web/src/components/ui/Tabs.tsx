import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

/** The root renders a plain `<div>` with no look of its own. */
export const Tabs = BaseTabs.Root;

/** The row of tabs. The arrow keys move focus and choose (base-ui rule 16). */
export function TabsList({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <BaseTabs.List aria-label={label} activateOnFocus className={className}>
      {children}
    </BaseTabs.List>
  );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  return <BaseTabs.Tab value={value}>{children}</BaseTabs.Tab>;
}

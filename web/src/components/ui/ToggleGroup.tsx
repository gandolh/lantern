import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";

export interface ToggleGroupProps<Value extends string> {
  /** The group's name for screen readers. */
  label: string;
  /** The pressed item, or null when none is. */
  value: Value | null;
  /** Told the new choice, or null when the pressed item was pressed again. Never told of a focus move. */
  onValueChange: (value: Value | null) => void;
  className?: string;
  /** `ToggleItem`s, in any wrapping elements; they share the group's one Tab stop. */
  children: ReactNode;
}

/**
 * A picker that saves to the server on each choice (base-ui rule 16). The
 * arrow keys only move focus; Space, Enter or a tap chooses, and choosing the
 * pressed item again clears it.
 */
export function ToggleGroup<Value extends string>({
  label,
  value,
  onValueChange,
  className,
  children,
}: ToggleGroupProps<Value>) {
  return (
    <BaseToggleGroup
      aria-label={label}
      value={value === null ? [] : [value]}
      onValueChange={(next) => {
        const chosen = next[0] ?? null;
        if (chosen !== value) onValueChange(chosen);
      }}
      className={className}
    >
      {children}
    </BaseToggleGroup>
  );
}

export function ToggleItem({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  return (
    <Toggle value={value} className={className}>
      {children}
    </Toggle>
  );
}

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { useId, type ReactNode } from "react";
import { cn } from "../../lib/cn";

interface RadioOption<Value extends string> {
  value: Value;
  label: ReactNode;
}

export interface RadioGroupProps<Value extends string> {
  /** The group's name for screen readers; the `list` look also shows it. */
  label: string;
  options: readonly RadioOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  /** `segmented` is one row of buttons, for a filter; `list` stacks radios with dots. */
  look?: "list" | "segmented";
}

/**
 * One choice from a few. Tab enters the group, and the arrow keys move and
 * choose (base-ui rule 16): for a filter, and for a setting kept on the device.
 */
export function RadioGroup<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  look = "list",
}: RadioGroupProps<Value>) {
  const labelId = useId();
  if (look === "segmented") {
    return (
      <BaseRadioGroup<Value>
        aria-label={label}
        value={value}
        onValueChange={onValueChange}
        className="mb-4 inline-flex rounded-pill bg-surface-sunk p-0.75"
      >
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            className={cn(
              "inline-flex min-h-8.5 cursor-pointer items-center rounded-pill border-0 bg-transparent px-3.5 font-semibold text-ink-muted",
              "data-checked:bg-surface data-checked:text-ink data-checked:shadow-card",
            )}
          >
            {option.label}
          </Radio.Root>
        ))}
      </BaseRadioGroup>
    );
  }
  return (
    <div className="grid gap-2">
      <div id={labelId} className="font-semibold">
        {label}
      </div>
      <BaseRadioGroup<Value>
        aria-labelledby={labelId}
        value={value}
        onValueChange={onValueChange}
        className="grid gap-2"
      >
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2">
            <Radio.Root
              value={option.value}
              className="grid size-4.5 place-items-center rounded-full border border-ink-muted bg-surface data-checked:border-accent"
            >
              <Radio.Indicator className="size-2.5 rounded-full bg-accent" />
            </Radio.Root>
            {option.label}
          </label>
        ))}
      </BaseRadioGroup>
    </div>
  );
}

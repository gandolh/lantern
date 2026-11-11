import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { useId, type ReactNode } from "react";

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
      <BaseRadioGroup<Value> aria-label={label} value={value} onValueChange={onValueChange} className="segmented">
        {options.map((option) => (
          <Radio.Root key={option.value} value={option.value} className="segmented-option">
            {option.label}
          </Radio.Root>
        ))}
      </BaseRadioGroup>
    );
  }
  return (
    <div className="radio-list-field">
      <div id={labelId}>{label}</div>
      <BaseRadioGroup<Value>
        aria-labelledby={labelId}
        value={value}
        onValueChange={onValueChange}
        className="radio-list"
      >
        {options.map((option) => (
          <label key={option.value} className="radio-list-option">
            <Radio.Root value={option.value} className="radio-list-dot">
              <Radio.Indicator className="radio-list-mark" />
            </Radio.Root>
            {option.label}
          </label>
        ))}
      </BaseRadioGroup>
    </div>
  );
}

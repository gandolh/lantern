import type { TitleKind } from "@lantern/shared";
import { RadioGroup } from "./components/ui/RadioGroup";

type KindValue = "all" | TitleKind;

const KINDS = [
  { value: "all", label: "All" },
  { value: "movie", label: "Films" },
  { value: "series", label: "Series" },
] as const;

/** Which kind of title a page shows: all, films or series. Nothing is saved, so the arrow keys choose. */
export function KindFilter({
  kind,
  onChange,
}: {
  kind: TitleKind | undefined;
  onChange: (kind: TitleKind | undefined) => void;
}) {
  return (
    <RadioGroup<KindValue>
      label="Kind"
      look="segmented"
      options={KINDS}
      value={kind ?? "all"}
      onValueChange={(value) => onChange(value === "all" ? undefined : value)}
    />
  );
}

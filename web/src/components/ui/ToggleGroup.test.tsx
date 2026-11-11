// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToggleGroup, ToggleItem } from "./ToggleGroup";

afterEach(cleanup);

type Pick = "a" | "b" | "c";

function Picker({ onChoice }: { onChoice: (value: Pick | null) => void }) {
  const [value, setValue] = useState<Pick | null>(null);
  return (
    <ToggleGroup<Pick>
      label="Letter"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChoice(next);
      }}
    >
      <div>
        <ToggleItem value="a">A</ToggleItem>
        <ToggleItem value="b">B</ToggleItem>
      </div>
      <ToggleItem value="c">C</ToggleItem>
    </ToggleGroup>
  );
}

describe("the guarded ToggleGroup", () => {
  it("has one Tab stop, however the items are wrapped", () => {
    render(<Picker onChoice={() => undefined} />);
    const stops = screen.getAllByRole("button").filter((button) => button.tabIndex === 0);
    expect(stops).toHaveLength(1);
  });

  it("does not choose on an arrow key, only moves focus", async () => {
    const onChoice = vi.fn();
    const user = userEvent.setup();
    render(<Picker onChoice={onChoice} />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "A" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "B" }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "C" }));
    expect(onChoice).not.toHaveBeenCalled();
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it.each([" ", "{Enter}"])("chooses on %j", async (key) => {
    const onChoice = vi.fn();
    const user = userEvent.setup();
    render(<Picker onChoice={onChoice} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    await user.keyboard(key);
    expect(onChoice).toHaveBeenCalledExactlyOnceWith("b");
    expect(screen.getByRole("button", { name: "B", pressed: true })).toBeDefined();
  });

  it("clears when the pressed one is chosen again", async () => {
    const onChoice = vi.fn();
    const user = userEvent.setup();
    render(<Picker onChoice={onChoice} />);
    await user.click(screen.getByRole("button", { name: "C" }));
    await user.click(screen.getByRole("button", { name: "C" }));
    expect(onChoice.mock.calls).toEqual([["c"], [null]]);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatePicker } from "./StatePicker";
import { saveState } from "./titlesApi";

vi.mock("./titlesApi", () => ({ saveState: vi.fn() }));

const save = vi.mocked(saveState);

beforeEach(() => {
  save.mockReset();
  save.mockResolvedValue(undefined);
});
afterEach(cleanup);

function renderPicker(state: "good" | null = null, onChange = vi.fn()) {
  render(<StatePicker imdbId="tt0000001" state={state} title="A film" onChange={onChange} />);
  return onChange;
}

describe("StatePicker", () => {
  it("is one group named for the title, with six items and one Tab stop", () => {
    renderPicker();
    expect(screen.getByRole("group", { name: "Your verdict on A film" })).toBeDefined();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it("saves nothing while the arrow keys move focus", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Not interested" }));
    expect(save).not.toHaveBeenCalled();
  });

  it("saves on Space, then clears on a second tap", async () => {
    const user = userEvent.setup();
    const onChange = renderPicker();
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight} ");
    expect(save).toHaveBeenLastCalledWith("tt0000001", "good");
    expect(screen.getByRole("button", { name: "Good", pressed: true })).toBeDefined();
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("good"));

    await user.click(screen.getByRole("button", { name: "Good" }));
    expect(save).toHaveBeenLastCalledWith("tt0000001", null);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("rolls back and says so when the server refuses", async () => {
    save.mockRejectedValue(new Error("no"));
    const user = userEvent.setup();
    renderPicker("good");
    await user.click(screen.getByRole("button", { name: "Meh" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "That didn’t save. Try again.");
    expect(screen.getByRole("button", { name: "Good", pressed: true })).toBeDefined();
  });
});

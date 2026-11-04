import { describe, expect, it } from "vitest";
import { createQueue, singleFlight, type Clock } from "./queue.js";

/** A clock that only moves when someone sleeps. */
function fakeClock(): Clock & { slept: number[] } {
  let time = 0;
  const slept: number[] = [];
  return {
    slept,
    now: () => time,
    sleep: async (ms) => {
      slept.push(ms);
      time += ms;
    },
  };
}

describe("createQueue", () => {
  it("runs one task at a time, each at least the spacing after the last started", async () => {
    const clock = fakeClock();
    const queue = createQueue(100, clock);
    const starts: number[] = [];
    await Promise.all([1, 2, 3].map((n) => queue.run(async () => starts.push(clock.now()) && n)));
    expect(starts).toEqual([0, 100, 200]);
  });

  it("goes on after a task fails, failing only its caller", async () => {
    const queue = createQueue(0, fakeClock());
    const failed = queue.run(() => Promise.reject(new Error("nope")));
    const next = queue.run(async () => "ok");
    await expect(failed).rejects.toThrow("nope");
    await expect(next).resolves.toBe("ok");
  });
});

describe("singleFlight", () => {
  it("shares one request between callers asking at once, then forgets it", async () => {
    const flight = singleFlight<number>();
    let calls = 0;
    let release!: (value: number) => void;
    const task = () => {
      calls++;
      return new Promise<number>((resolve) => (release = resolve));
    };
    const a = flight("k", task);
    const b = flight("k", task);
    release(7);
    expect(await Promise.all([a, b])).toEqual([7, 7]);
    expect(calls).toBe(1);
    const c = flight("k", task);
    release(8);
    expect(await c).toBe(8);
    expect(calls).toBe(2);
  });
});

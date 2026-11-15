import { describe, expect, it } from "vitest";
import { createLogApi } from "../../api";
import { createLogState } from "../../state";
import type { LogApi, LogState } from "../../types";

// F194 (A Memory Missing): the trace grew by every entry forever, phone builds included (6166 -> 36962 entries over
// five loops of window opens), and trace() copied all of it on every call, once a frame while the editor watched.

/**
 * A fresh api with its state.
 *
 * @returns The api and the state it writes.
 */
function make(): { api: LogApi; state: LogState } {
  const state = createLogState({ config: { mode: "test" } });

  return { api: createLogApi({ config: { mode: "test" }, state }), state };
}

/**
 * Logs `count` info entries named `e:0` … `e:<count - 1>`.
 *
 * @param api - The api.
 * @param count - How many.
 */
function logMany(api: LogApi, count: number): void {
  for (let index = 0; index < count; index++) api.info(`e:${index}`);
}

describe("the bounded trace", () => {
  // Bug: the trace keeps every entry: a long session grows without end.
  it("holds at most 2000 entries, the newest last and oldest first", () => {
    const { api } = make();

    logMany(api, 5000);
    const trace = api.trace();

    expect(trace.length).toBeLessThanOrEqual(2000);
    expect(trace.at(-1)?.event).toBe("e:4999");
    const first = Number(trace[0]?.event.slice(2));

    expect(trace.map(entry => entry.event)).toEqual(
      Array.from({ length: trace.length }, (_, index) => `e:${first + index}`)
    );
  });

  // Bug: the drop cuts too deep, and a reader loses recent lines.
  it("keeps at least the newest 1000 entries", () => {
    const { api } = make();

    logMany(api, 2001);

    expect(api.trace()).toHaveLength(1001);
    expect(api.trace()[0]?.event).toBe("e:1000");
  });

  // Bug: the drop replaces the array, and an expect() chain made before it reads the old one.
  it("lets a live expect() chain see entries logged after a drop", () => {
    const { api } = make();
    const chain = api.expect();

    logMany(api, 2500);
    api.info("late:one");

    expect(() => chain.toHaveEvent("late:one")).not.toThrow();
  });
});

describe("the trace snapshot", () => {
  // Bug: every read of a quiet log copies the whole trace.
  it("is the same array while nothing was logged", () => {
    const { api } = make();

    logMany(api, 3);

    expect(api.trace()).toBe(api.trace());
  });

  // Bug: a cached snapshot hides the entry logged after it.
  it("is rebuilt after an entry, with it", () => {
    const { api } = make();

    api.info("one");
    const before = api.trace();

    api.warn("two");

    expect(api.trace()).not.toBe(before);
    expect(api.trace().map(entry => entry.event)).toEqual(["one", "two"]);
    expect(before.map(entry => entry.event)).toEqual(["one"]);
  });

  // Bug: reset() empties the entries, but trace() still answers the old snapshot.
  it("is empty after a reset", () => {
    const { api, state } = make();

    logMany(api, 3);
    api.trace();
    api.reset();

    expect(api.trace()).toEqual([]);
    expect(state.entries).toHaveLength(0);
  });
});

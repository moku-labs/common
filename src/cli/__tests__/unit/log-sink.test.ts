import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogApi } from "../../../plugins/log/api";
import { createLogState } from "../../../plugins/log/state";
import { brandedSink } from "../../log-sink";

/** Flatten a console spy's recorded args into one string for substring assertions. */
function captured(method: "log" | "warn" | "error"): string {
  const spy = console[method] as unknown as { mock: { calls: unknown[][] } };
  return spy.mock.calls.map(call => call.join(" ")).join("\n");
}

describe("brandedSink", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders each level with its brand marker, routing warn/error to stderr", () => {
    const sink = brandedSink();
    sink.write({ level: "info", event: "deploy:phase", ts: 0 });
    sink.write({ level: "warn", event: "slow", ts: 0 });
    sink.write({ level: "error", event: "boom", ts: 0 });
    sink.write({ level: "debug", event: "trace-it", ts: 0 });

    expect(captured("log")).toContain("› deploy:phase");
    expect(captured("error")).toContain("⚠ slow");
    expect(captured("error")).toContain("✗ boom");
    // debug routes to console.log (dim line, no glyph marker)
    expect(captured("log")).toContain("trace-it");
  });

  it("appends structured data compactly", () => {
    const sink = brandedSink();
    sink.write({ level: "info", event: "content:ready", data: { count: 12 }, ts: 0 });
    expect(captured("log")).toContain("content:ready");
    expect(captured("log")).toContain("12");
  });

  it("drops entries below minLevel", () => {
    const sink = brandedSink("info");
    sink.write({ level: "debug", event: "d", ts: 0 });
    expect(console.log).not.toHaveBeenCalled();
    sink.write({ level: "info", event: "i", ts: 0 });
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it("never throws on non-serializable data (falls back to String)", () => {
    const sink = brandedSink();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => sink.write({ level: "info", event: "x", data: circular, ts: 0 })).not.toThrow();
  });
});

describe("log clearSinks", () => {
  it("removes registered sinks while keeping the in-memory trace", () => {
    const state = createLogState({ config: { mode: "test" } });
    const api = createLogApi({ config: { mode: "test" }, state });
    const written: string[] = [];
    api.addSink({ write: entry => written.push(entry.event) });

    api.info("before");
    expect(written).toEqual(["before"]);

    api.clearSinks();
    api.info("after");

    expect(written).toEqual(["before"]); // no new sink output after clear
    expect(api.trace().map(entry => entry.event)).toEqual(["before", "after"]); // trace intact
  });
});

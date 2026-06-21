import { describe, expect, it } from "vitest";
import { workerSafeProcessEnv } from "../../providers.worker";

describe("env/providers.worker", () => {
  it("has the provider name worker-process-env", () => {
    expect(workerSafeProcessEnv().name).toBe("worker-process-env");
  });

  it("reads the current process.env", () => {
    process.env.MOKU_PROVIDER_TEST = "abc123";
    try {
      expect(workerSafeProcessEnv().load().MOKU_PROVIDER_TEST).toBe("abc123");
    } finally {
      delete process.env.MOKU_PROVIDER_TEST;
    }
  });

  it("snapshots fresh on each load (not a live reference)", () => {
    const provider = workerSafeProcessEnv();
    const before = provider.load();
    process.env.MOKU_PROVIDER_FRESH = "x";
    try {
      expect(before.MOKU_PROVIDER_FRESH).toBeUndefined(); // captured before the set
      expect(provider.load().MOKU_PROVIDER_FRESH).toBe("x"); // re-read picks it up
    } finally {
      delete process.env.MOKU_PROVIDER_FRESH;
    }
  });

  it("degrades to {} when there is no process global (never throws)", () => {
    const saved = globalThis.process;
    // Simulate workerd without nodejs_compat: no `process` global at all.
    // @ts-expect-error -- deleting the global is the whole point of the test
    delete globalThis.process;
    try {
      expect(() => workerSafeProcessEnv().load()).not.toThrow();
      expect(workerSafeProcessEnv().load()).toEqual({});
    } finally {
      globalThis.process = saved;
    }
  });
});

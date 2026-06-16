import { describe, expect, it } from "vitest";

import * as common from "../../src/index";

/**
 * Smoke test for the published package barrel. A catalog's one job is to be
 * importable: this asserts every advertised export resolves and has the expected
 * shape, exercising the `src/index.ts` re-export surface end to end.
 */
describe("@moku-labs/common catalog", () => {
  it("exposes the log + env core plugins", () => {
    expect(common.logPlugin).toBeDefined();
    expect(common.envPlugin).toBeDefined();
  });

  it("exposes the env providers as factory functions", () => {
    for (const provider of [
      common.browserEnv,
      common.dotenv,
      common.processEnv,
      common.cloudflareBindings
    ]) {
      expect(typeof provider).toBe("function");
    }
  });
});

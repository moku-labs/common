import { bench, describe } from "vitest";
import { createLogApi } from "../../api";
import { createLogState } from "../../state";

const state = createLogState({ config: { mode: "test" } });
const log = createLogApi({ config: { mode: "test" }, state });

for (let index = 0; index < 1500; index++) log.info("warm:entry", { index });

describe("the bounded trace (F194)", () => {
  bench("one info() on a full trace, drops included", () => {
    log.info("bench:entry");
  });

  bench("one trace() of a quiet log of 1500 entries", () => {
    log.trace();
  });
});

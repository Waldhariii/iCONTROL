import { describe, it, expect } from "vitest";
import { createLogger } from "../platform/observability/logger";

describe("Observability correlation (contract)", () => {
  it("accepts correlationId and does not throw", () => {
    const log = createLogger("contract.test");
    expect(() => log.info({ code: "OK", message: "hello", correlationId: "corr_test_1" })).not.toThrow();
  });
});

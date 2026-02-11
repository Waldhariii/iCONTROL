import { describe, it, expect } from "vitest";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("error codes (contract)", () => {
  it("contains required governance codes", () => {
    expect(ERROR_CODES.WARN_FLAG_INVALID).toBeTruthy();
    expect(ERROR_CODES.WARN_FLAGS_FORCED_OFF).toBeTruthy();
  });
});

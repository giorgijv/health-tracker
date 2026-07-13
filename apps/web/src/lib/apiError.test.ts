import { describe, expect, it } from "vitest";
import { describeError } from "./apiError";

describe("describeError", () => {
  it("passes through a plain string error unchanged", () => {
    expect(describeError({ error: "Not found" })).toBe("Not found");
  });

  it("renders zod's flatten() fieldErrors into a readable message", () => {
    const body = {
      error: {
        formErrors: [],
        fieldErrors: { targetPerWeek: ["Number must be less than or equal to 1000"] },
      },
    };
    expect(describeError(body)).toBe(
      "targetPerWeek: Number must be less than or equal to 1000",
    );
  });

  it("includes formErrors alongside fieldErrors when both are present", () => {
    const body = {
      error: {
        formErrors: ["Unrecognized key"],
        fieldErrors: { count: ["Required"] },
      },
    };
    expect(describeError(body)).toBe("Unrecognized key; count: Required");
  });

  it("returns null for a malformed or missing error body", () => {
    expect(describeError(null)).toBeNull();
    expect(describeError({})).toBeNull();
    expect(describeError({ error: {} })).toBeNull();
    expect(describeError("not an object")).toBeNull();
  });
});

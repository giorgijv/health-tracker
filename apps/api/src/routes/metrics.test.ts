import { describe, expect, it } from "vitest";
import { createMetricSchema } from "./metrics.schema.js";

describe("createMetricSchema", () => {
  it("accepts a valid metric with a numeric weight", () => {
    expect(createMetricSchema.safeParse({ date: "2026-07-11", weightKg: 82.4 }).success).toBe(true);
  });

  it("accepts explicit nulls for optional fields", () => {
    const result = createMetricSchema.safeParse({
      date: "2026-07-11",
      weightKg: null,
      bodyFatPctEst: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-ISO date", () => {
    expect(createMetricSchema.safeParse({ date: "07-11-2026", weightKg: 80 }).success).toBe(false);
  });

  it("rejects a weight outside the plausible range", () => {
    expect(createMetricSchema.safeParse({ date: "2026-07-11", weightKg: 900 }).success).toBe(false);
  });

  it("rejects an unknown source value", () => {
    const result = createMetricSchema.safeParse({ date: "2026-07-11", source: "guessed" });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createWorkoutSchema } from "./workouts.schema.js";

describe("createWorkoutSchema", () => {
  it("accepts a valid workout", () => {
    const result = createWorkoutSchema.safeParse({
      date: "2026-07-11",
      type: "Running",
      durationMin: 45,
    });
    expect(result.success).toBe(true);
  });

  it("requires a type", () => {
    expect(createWorkoutSchema.safeParse({ date: "2026-07-11" }).success).toBe(false);
  });

  it("rejects a negative duration", () => {
    const result = createWorkoutSchema.safeParse({
      date: "2026-07-11",
      type: "Run",
      durationMin: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a duration longer than a day", () => {
    const result = createWorkoutSchema.safeParse({
      date: "2026-07-11",
      type: "Run",
      durationMin: 1500,
    });
    expect(result.success).toBe(false);
  });

  it("allows notes to be omitted or explicitly null", () => {
    expect(createWorkoutSchema.safeParse({ date: "2026-07-11", type: "Run" }).success).toBe(true);
    expect(
      createWorkoutSchema.safeParse({ date: "2026-07-11", type: "Run", notes: null }).success,
    ).toBe(true);
  });
});

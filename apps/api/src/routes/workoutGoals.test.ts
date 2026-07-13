import { describe, expect, it } from "vitest";
import { createWorkoutGoalSchema, updateWorkoutGoalSchema } from "./workoutGoals.schema.js";

describe("createWorkoutGoalSchema", () => {
  it("accepts a valid goal", () => {
    const result = createWorkoutGoalSchema.safeParse({ workoutType: "Run", targetPerWeek: 3 });
    expect(result.success).toBe(true);
  });

  it("requires a workout type", () => {
    expect(createWorkoutGoalSchema.safeParse({ targetPerWeek: 3 }).success).toBe(false);
    expect(createWorkoutGoalSchema.safeParse({ workoutType: "", targetPerWeek: 3 }).success).toBe(
      false,
    );
  });

  it("rejects a target below 1", () => {
    expect(
      createWorkoutGoalSchema.safeParse({ workoutType: "Run", targetPerWeek: 0 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer target", () => {
    expect(
      createWorkoutGoalSchema.safeParse({ workoutType: "Run", targetPerWeek: 2.5 }).success,
    ).toBe(false);
  });

  it("accepts a high target for reps-style goals (e.g. 1000 push-ups/week)", () => {
    expect(
      createWorkoutGoalSchema.safeParse({ workoutType: "Push ups", targetPerWeek: 1000 }).success,
    ).toBe(true);
  });

  it("rejects a target above the ceiling", () => {
    expect(
      createWorkoutGoalSchema.safeParse({ workoutType: "Run", targetPerWeek: 1001 }).success,
    ).toBe(false);
  });
});

describe("updateWorkoutGoalSchema", () => {
  it("accepts a valid target update", () => {
    expect(updateWorkoutGoalSchema.safeParse({ targetPerWeek: 5 }).success).toBe(true);
  });

  it("rejects a missing target", () => {
    expect(updateWorkoutGoalSchema.safeParse({}).success).toBe(false);
  });
});

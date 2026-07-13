import type { BodyMetric, Workout } from "@health-tracker/shared";
import { describe, expect, it } from "vitest";
import {
  latestWithDelta,
  metricSeries,
  weeklyWorkoutCounts,
  weightSeries,
  workoutsInLastDays,
} from "./progress";

const metric = (overrides: Partial<BodyMetric>): BodyMetric => ({
  id: "m",
  userId: "u",
  date: "2026-01-01",
  weightKg: null,
  bodyFatPctEst: null,
  waistCm: null,
  source: "manual",
  createdAt: "",
  ...overrides,
});

const workout = (overrides: Partial<Workout>): Workout => ({
  id: "w",
  userId: "u",
  date: "2026-01-01",
  type: "Run",
  durationMin: null,
  notes: null,
  createdAt: "",
  ...overrides,
});

describe("weightSeries", () => {
  it("sorts ascending by date and drops entries without a weight", () => {
    const metrics = [
      metric({ date: "2026-07-10", weightKg: 80.5 }),
      metric({ date: "2026-07-01", weightKg: 82 }),
      metric({ date: "2026-07-05", weightKg: null }),
    ];
    expect(weightSeries(metrics)).toEqual([
      { date: "2026-07-01", value: 82 },
      { date: "2026-07-10", value: 80.5 },
    ]);
  });

  it("returns an empty array when no weights are logged", () => {
    expect(weightSeries([metric({ weightKg: null })])).toEqual([]);
  });
});

describe("metricSeries", () => {
  it("extracts any metric field sorted ascending, skipping nulls", () => {
    const metrics = [
      metric({ date: "2026-07-10", bodyFatPctEst: 19 }),
      metric({ date: "2026-07-01", bodyFatPctEst: 20.5 }),
      metric({ date: "2026-07-05", bodyFatPctEst: null, weightKg: 81 }),
    ];
    expect(metricSeries(metrics, "bodyFatPctEst")).toEqual([
      { date: "2026-07-01", value: 20.5 },
      { date: "2026-07-10", value: 19 },
    ]);
    expect(metricSeries(metrics, "waistCm")).toEqual([]);
  });
});

describe("latestWithDelta", () => {
  it("computes delta against the immediately prior entry", () => {
    const metrics = [
      metric({ date: "2026-07-01", weightKg: 82 }),
      metric({ date: "2026-07-05", weightKg: 81.2 }),
      metric({ date: "2026-07-10", weightKg: 80.5 }),
    ];
    const result = latestWithDelta(metrics, "weightKg");
    expect(result?.value).toBe(80.5);
    expect(result?.delta).toBeCloseTo(-0.7);
  });

  it("returns a null delta with only one entry", () => {
    const result = latestWithDelta([metric({ weightKg: 80 })], "weightKg");
    expect(result).toEqual({ value: 80, delta: null });
  });

  it("returns null when the field was never logged", () => {
    expect(latestWithDelta([metric({})], "waistCm")).toBeNull();
  });
});

describe("workoutsInLastDays", () => {
  const now = new Date("2026-07-11T12:00:00");

  it("counts workouts within the trailing window inclusive of today", () => {
    const workouts = [
      workout({ date: "2026-07-11" }), // today
      workout({ date: "2026-07-09" }), // within 7
      workout({ date: "2026-07-06" }), // within 7 (6 days ago)
      workout({ date: "2026-06-15" }), // within 30, outside 7 (26 days ago)
      workout({ date: "2026-05-01" }), // outside 30
    ];
    expect(workoutsInLastDays(workouts, 7, now)).toBe(3);
    expect(workoutsInLastDays(workouts, 30, now)).toBe(4);
  });

  it("returns 0 for no workouts", () => {
    expect(workoutsInLastDays([], 7, now)).toBe(0);
  });
});

describe("weeklyWorkoutCounts", () => {
  const now = new Date("2026-07-11T12:00:00"); // a Saturday

  it("buckets by Monday-starting week and returns the requested number of weeks", () => {
    const workouts = [
      workout({ date: "2026-07-11" }), // this week
      workout({ date: "2026-07-06" }), // this week (Monday)
      workout({ date: "2026-07-09" }), // this week
      workout({ date: "2026-06-15" }), // several weeks back
    ];
    const buckets = weeklyWorkoutCounts(workouts, 8, now);
    expect(buckets).toHaveLength(8);
    expect(buckets[buckets.length - 1]).toMatchObject({ weekStart: "2026-07-06", count: 3 });
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(4);
  });

  it("returns all-zero buckets when there are no workouts", () => {
    const buckets = weeklyWorkoutCounts([], 4, now);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });
});

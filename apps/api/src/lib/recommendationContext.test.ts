import { describe, expect, it } from "vitest";
import { formatContext, type RecContextInput } from "./recommendationContext.js";

const fullInput: RecContextInput = {
  goals: ["lose fat", "build strength"],
  activityLevel: "moderate",
  assessment: {
    type: "initial",
    date: "2026-06-01",
    overallLevel: "intermediate",
    focusAreas: ["Consistent training base", "More protein"],
  },
  weights: [
    { date: "2026-07-10", kg: 80.5 },
    { date: "2026-06-15", kg: 82.7 },
    { date: "2026-05-20", kg: 84.1 },
  ],
  workouts: [
    { date: "2026-07-11", type: "Run" },
    { date: "2026-07-09", type: "Lift" },
    { date: "2026-07-06", type: "Run" },
    { date: "2026-06-20", type: "Yoga" },
  ],
  meals: [
    { date: "2026-07-10", calories: 600, proteinG: 40, quality: "good" },
    { date: "2026-07-10", calories: 700, proteinG: 30, quality: "fair" },
    { date: "2026-07-09", calories: 500, proteinG: 35, quality: "good" },
  ],
  today: "2026-07-11",
};

describe("formatContext", () => {
  it("summarizes weight direction and magnitude across the window", () => {
    const text = formatContext(fullInput);
    expect(text).toContain("Latest: 80.5 kg on 2026-07-10");
    expect(text).toContain("down 3.6 kg since 2026-05-20");
  });

  it("tallies workout types and the trailing-7-day count", () => {
    const text = formatContext(fullInput);
    expect(text).toContain("Total: 4");
    expect(text).toContain("Last 7 days: 3");
    expect(text).toContain("Run x2");
    expect(text).toContain("Lift x1");
  });

  it("averages nutrition per logged day, not per meal", () => {
    const text = formatContext(fullInput);
    // 2026-07-10: 600+700=1300 cal; 2026-07-09: 500 cal. Avg over 2 days = 900.
    expect(text).toContain("2 day(s) logged, 3 meal(s)");
    expect(text).toContain("Avg calories/day: ~900");
    expect(text).toContain("good x2, fair x1");
  });

  it("degrades gracefully with no data at all", () => {
    const empty: RecContextInput = {
      goals: [],
      activityLevel: null,
      assessment: null,
      weights: [],
      workouts: [],
      meals: [],
      today: "2026-07-11",
    };
    const text = formatContext(empty);
    expect(text).toContain("Goals: not set");
    expect(text).toContain("None completed yet.");
    expect(text).toContain("No measurements logged.");
    expect(text).toContain("None logged.");
    expect(text).toContain("No meals logged.");
  });
});

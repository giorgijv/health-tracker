import { describe, expect, it } from "vitest";
import { EXERCISE_CATEGORIES, EXERCISE_POSES, EXERCISES, exercisesByCategory } from "./exercises.js";

describe("EXERCISES", () => {
  it("every exercise belongs to a known category", () => {
    for (const ex of EXERCISES) {
      expect(EXERCISE_CATEGORIES).toContain(ex.category);
    }
  });

  it("every exercise maps to a known pictogram pose", () => {
    for (const ex of EXERCISES) {
      expect(EXERCISE_POSES).toContain(ex.pose);
    }
  });

  it("has unique ids", () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every category has at least one exercise", () => {
    for (const category of EXERCISE_CATEGORIES) {
      expect(exercisesByCategory(category).length).toBeGreaterThan(0);
    }
  });
});

describe("exercisesByCategory", () => {
  it("returns only exercises in the requested category", () => {
    const legs = exercisesByCategory("Legs");
    expect(legs.length).toBeGreaterThan(0);
    expect(legs.every((e) => e.category === "Legs")).toBe(true);
  });
});

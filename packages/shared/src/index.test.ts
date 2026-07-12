import { describe, expect, it } from "vitest";
import { sumFoodItems, type FoodItem } from "./index.js";

describe("sumFoodItems", () => {
  it("sums calories and macros across items", () => {
    const items: FoodItem[] = [
      { name: "Chicken", estGrams: 150, calories: 240, proteinG: 45, carbsG: 0, fatG: 6 },
      { name: "Rice", estGrams: 200, calories: 260, proteinG: 5, carbsG: 57, fatG: 1 },
      { name: "Broccoli", estGrams: 100, calories: 35, proteinG: 3, carbsG: 7, fatG: 0 },
    ];

    expect(sumFoodItems(items)).toEqual({
      calories: 535,
      proteinG: 53,
      carbsG: 64,
      fatG: 7,
    });
  });

  it("returns all-zero totals for an empty list", () => {
    expect(sumFoodItems([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it("treats missing/falsy numeric fields as zero rather than NaN", () => {
    const items = [
      { name: "Mystery", estGrams: 0, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    ] as FoodItem[];
    expect(sumFoodItems(items)).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

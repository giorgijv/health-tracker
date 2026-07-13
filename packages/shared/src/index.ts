export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export interface Profile {
  userId: string;
  age: number | null;
  sex: "male" | "female" | "other" | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  goals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BodyMetric {
  id: string;
  userId: string;
  date: string;
  weightKg: number | null;
  bodyFatPctEst: number | null;
  waistCm: number | null;
  source: "manual" | "photo_est";
  createdAt: string;
}

export interface Workout {
  id: string;
  userId: string;
  date: string;
  type: string;
  durationMin: number | null;
  notes: string | null;
  createdAt: string;
}

export type BodyPhotoAngle = "front" | "side" | "back";

export interface BodyPhoto {
  id: string;
  userId: string;
  storagePath: string;
  angle: BodyPhotoAngle;
  takenAt: string;
  createdAt: string;
}

export const BODY_PHOTOS_BUCKET = "body-photos";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItem {
  name: string;
  estGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodLog {
  id: string;
  userId: string;
  /** Legacy field from when meals had an attached photo — always null on new entries. */
  storagePath: string | null;
  eatenAt: string;
  mealType: MealType;
  items: FoodItem[];
  totals: FoodTotals;
  createdAt: string;
}

export const FOOD_PHOTOS_BUCKET = "food-photos";

/** Sum per-item macros into meal totals. Used on both client and server. */
export function sumFoodItems(items: FoodItem[]): FoodTotals {
  return items.reduce<FoodTotals>(
    (t, it) => ({
      calories: t.calories + (it.calories || 0),
      proteinG: t.proteinG + (it.proteinG || 0),
      carbsG: t.carbsG + (it.carbsG || 0),
      fatG: t.fatG + (it.fatG || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

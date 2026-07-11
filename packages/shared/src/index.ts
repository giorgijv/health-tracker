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

export type AssessmentType = "initial" | "periodic";

export interface AssessmentIntake {
  age: number | null;
  sex: "male" | "female" | "other" | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goals: string[];
  injuriesOrConditions: string;
  currentExercise: string;
  sleepHoursTypical: number | null;
  dietNotes: string;
}

export interface AssessmentFocusArea {
  title: string;
  rationale: string;
  priority: "high" | "medium" | "low";
}

/** The structured write-up Claude produces from the intake. */
export interface AssessmentSummary {
  narrative: string;
  overallLevel: "beginner" | "intermediate" | "advanced";
  focusAreas: AssessmentFocusArea[];
  strengths: string[];
  cautions: string[];
}

export interface Assessment {
  id: string;
  userId: string;
  type: AssessmentType;
  intake: AssessmentIntake;
  summary: AssessmentSummary;
  model: string;
  createdAt: string;
}

export type BodyPhotoAngle = "front" | "side" | "back";

/**
 * Qualitative visual read of a body photo. Explicitly NOT a measurement or
 * medical assessment — estimates are rough and confidence-flagged.
 */
export interface BodyPhotoAnalysis {
  observations: string[];
  comparisonToPrevious: string | null;
  estimatedBodyFatRange: string | null;
  confidence: "low" | "medium" | "high";
  cautions: string[];
  encouragement: string;
}

export interface BodyPhoto {
  id: string;
  userId: string;
  storagePath: string;
  angle: BodyPhotoAngle;
  takenAt: string;
  analysis: BodyPhotoAnalysis | null;
  model: string | null;
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

export interface NutritionalQuality {
  rating: "poor" | "fair" | "good" | "excellent";
  notes: string;
}

/** What the vision call returns before the user edits anything. */
export interface FoodAnalysis {
  items: FoodItem[];
  confidence: "low" | "medium" | "high";
  nutritionalQuality: NutritionalQuality;
  cautions: string[];
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
  storagePath: string;
  eatenAt: string;
  mealType: MealType;
  items: FoodItem[];
  totals: FoodTotals;
  confidence: "low" | "medium" | "high" | null;
  nutritionalQuality: NutritionalQuality | null;
  model: string | null;
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

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

/** The structured write-up Claude produces. */
export interface AssessmentSummary {
  narrative: string;
  overallLevel: "beginner" | "intermediate" | "advanced";
  focusAreas: AssessmentFocusArea[];
  strengths: string[];
  cautions: string[];
  /** "How far you've come" — populated for periodic re-assessments, absent for initial. */
  progressSinceLast?: string | null;
}

export interface Assessment {
  id: string;
  userId: string;
  type: AssessmentType;
  /** The questionnaire for initial assessments; null for auto-generated periodic ones. */
  intake: AssessmentIntake | null;
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

export type RecommendationCategory =
  | "nutrition"
  | "training"
  | "recovery"
  | "consistency"
  | "measurement"
  | "general";

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationStatus = "active" | "done" | "dismissed";

export interface Recommendation {
  id: string;
  userId: string;
  runId: string;
  category: RecommendationCategory;
  title: string;
  detail: string;
  priority: RecommendationPriority;
  /** The specific data point this is grounded in. */
  basis: string;
  status: RecommendationStatus;
  createdAt: string;
}

/** One generation pass: a read of the data plus the recommendations it produced. */
export interface RecommendationRun {
  id: string;
  userId: string;
  summary: string;
  model: string;
  createdAt: string;
  recommendations: Recommendation[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

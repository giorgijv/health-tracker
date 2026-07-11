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

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
}

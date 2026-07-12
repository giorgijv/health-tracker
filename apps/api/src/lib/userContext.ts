import { supabaseAdmin } from "./supabase.js";
import { formatContext, type RecContextInput } from "./recommendationContext.js";

export { formatContext };
export type UserContextInput = RecContextInput;

function ymdDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Fetch the user's recent tracked data and shape it for the context formatter. */
export async function gatherUserContext(userId: string): Promise<UserContextInput> {
  const today = new Date().toISOString().slice(0, 10);

  const [profileRes, assessmentRes, metricsRes, workoutsRes, foodRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("goals, activity_level").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("assessments")
      .select("type, created_at, summary_json")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("body_metrics")
      .select("date, weight_kg")
      .eq("user_id", userId)
      .not("weight_kg", "is", null)
      .gte("date", ymdDaysAgo(60)),
    supabaseAdmin
      .from("workouts")
      .select("date, type")
      .eq("user_id", userId)
      .gte("date", ymdDaysAgo(30)),
    supabaseAdmin
      .from("food_logs")
      .select("eaten_at, total_calories, total_protein_g, nutritional_quality_json")
      .eq("user_id", userId)
      .gte("eaten_at", ymdDaysAgo(14)),
  ]);

  const summary = assessmentRes.data?.summary_json as
    | { overallLevel?: string; focusAreas?: { title: string }[] }
    | undefined;

  return {
    goals: (profileRes.data?.goals as string[]) ?? [],
    activityLevel: (profileRes.data?.activity_level as string | null) ?? null,
    assessment: assessmentRes.data
      ? {
          type: assessmentRes.data.type as string,
          date: (assessmentRes.data.created_at as string).slice(0, 10),
          overallLevel: summary?.overallLevel ?? "unknown",
          focusAreas: (summary?.focusAreas ?? []).map((f) => f.title),
        }
      : null,
    weights: (metricsRes.data ?? []).map((m) => ({
      date: m.date as string,
      kg: Number(m.weight_kg),
    })),
    workouts: (workoutsRes.data ?? []).map((w) => ({
      date: w.date as string,
      type: w.type as string,
    })),
    meals: (foodRes.data ?? []).map((f) => ({
      date: (f.eaten_at as string).slice(0, 10),
      calories: Number(f.total_calories),
      proteinG: Number(f.total_protein_g),
      quality: (f.nutritional_quality_json as { rating?: string } | null)?.rating ?? null,
    })),
    today,
  };
}

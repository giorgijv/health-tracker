import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { formatContext, type RecContextInput } from "../lib/recommendationContext.js";
import { RECOMMENDATIONS_MODEL, generateRecommendations } from "../lib/recommendations.js";

export const recommendationsRouter = Router();

recommendationsRouter.use(requireAuth);

function ymdDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function toRecommendation(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    runId: row.run_id,
    category: row.category,
    title: row.title,
    detail: row.detail,
    priority: row.priority,
    basis: row.basis,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function gatherContext(userId: string): Promise<RecContextInput> {
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

recommendationsRouter.post("/generate", async (req: AuthedRequest, res) => {
  const context = await gatherContext(req.userId!);

  let output;
  try {
    output = await generateRecommendations(formatContext(context));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY is not set")) {
      res.status(503).json({ error: "AI recommendations are not configured (missing API key)." });
      return;
    }
    console.error("Recommendation generation failed:", message);
    res.status(502).json({ error: "Failed to generate recommendations." });
    return;
  }

  const { data: run, error: runErr } = await supabaseAdmin
    .from("recommendation_runs")
    .insert({ user_id: req.userId, summary: output.summary, model: RECOMMENDATIONS_MODEL })
    .select()
    .single();

  if (runErr) {
    res.status(500).json({ error: runErr.message });
    return;
  }

  const rows = output.recommendations.map((r) => ({
    user_id: req.userId,
    run_id: run.id,
    category: r.category,
    title: r.title,
    detail: r.detail,
    priority: r.priority,
    basis: r.basis,
  }));

  const { data: recs, error: recsErr } = await supabaseAdmin
    .from("recommendations")
    .insert(rows)
    .select();

  if (recsErr) {
    res.status(500).json({ error: recsErr.message });
    return;
  }

  res.status(201).json({
    id: run.id,
    userId: run.user_id,
    summary: run.summary,
    model: run.model,
    createdAt: run.created_at,
    recommendations: recs.map(toRecommendation),
  });
});

recommendationsRouter.get("/latest", async (req: AuthedRequest, res) => {
  const { data: run, error: runErr } = await supabaseAdmin
    .from("recommendation_runs")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runErr) {
    res.status(500).json({ error: runErr.message });
    return;
  }
  if (!run) {
    res.json(null);
    return;
  }

  const { data: recs, error: recsErr } = await supabaseAdmin
    .from("recommendations")
    .select("*")
    .eq("user_id", req.userId)
    .eq("run_id", run.id)
    .order("priority", { ascending: true });

  if (recsErr) {
    res.status(500).json({ error: recsErr.message });
    return;
  }

  res.json({
    id: run.id,
    userId: run.user_id,
    summary: run.summary,
    model: run.model,
    createdAt: run.created_at,
    recommendations: (recs ?? []).map(toRecommendation),
  });
});

const patchSchema = z.object({ status: z.enum(["active", "done", "dismissed"]) });

recommendationsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .update({ status: parsed.data.status })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toRecommendation(data));
});

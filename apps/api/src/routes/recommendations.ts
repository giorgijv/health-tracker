import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { formatContext, gatherUserContext } from "../lib/userContext.js";
import { RECOMMENDATIONS_MODEL, generateRecommendations } from "../lib/recommendations.js";

export const recommendationsRouter = Router();

recommendationsRouter.use(requireAuth);

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

recommendationsRouter.post("/generate", async (req: AuthedRequest, res) => {
  const context = await gatherUserContext(req.userId!);

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

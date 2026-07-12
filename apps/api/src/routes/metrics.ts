import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { createMetricSchema, updateMetricSchema } from "./metrics.schema.js";

export const metricsRouter = Router();

metricsRouter.use(requireAuth);

function toBodyMetric(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    weightKg: row.weight_kg,
    bodyFatPctEst: row.body_fat_pct_est,
    waistCm: row.waist_cm,
    source: row.source,
    createdAt: row.created_at,
  };
}

metricsRouter.get("/", async (req: AuthedRequest, res) => {
  const { from, to } = req.query;

  let query = supabaseAdmin
    .from("body_metrics")
    .select("*")
    .eq("user_id", req.userId)
    .order("date", { ascending: false });

  if (typeof from === "string") query = query.gte("date", from);
  if (typeof to === "string") query = query.lte("date", to);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data.map(toBodyMetric));
});

metricsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createMetricSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { date, weightKg, bodyFatPctEst, waistCm, source } = parsed.data;
  const { data, error } = await supabaseAdmin
    .from("body_metrics")
    .insert({
      user_id: req.userId,
      date,
      weight_kg: weightKg,
      body_fat_pct_est: bodyFatPctEst,
      waist_cm: waistCm,
      source: source ?? "manual",
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(toBodyMetric(data));
});

metricsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = updateMetricSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { date, weightKg, bodyFatPctEst, waistCm, source } = parsed.data;
  const { data, error } = await supabaseAdmin
    .from("body_metrics")
    .update({
      ...(date !== undefined && { date }),
      ...(weightKg !== undefined && { weight_kg: weightKg }),
      ...(bodyFatPctEst !== undefined && { body_fat_pct_est: bodyFatPctEst }),
      ...(waistCm !== undefined && { waist_cm: waistCm }),
      ...(source !== undefined && { source }),
    })
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
  res.json(toBodyMetric(data));
});

metricsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const { error, count } = await supabaseAdmin
    .from("body_metrics")
    .delete({ count: "exact" })
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!count) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

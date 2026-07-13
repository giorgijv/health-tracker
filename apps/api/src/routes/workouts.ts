import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { createWorkoutSchema, updateWorkoutSchema } from "./workouts.schema.js";

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);

function toWorkout(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    type: row.type,
    count: row.count,
    durationMin: row.duration_min,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

workoutsRouter.get("/", async (req: AuthedRequest, res) => {
  const { from, to } = req.query;

  let query = supabaseAdmin
    .from("workouts")
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
  res.json(data.map(toWorkout));
});

workoutsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createWorkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { date, type, count, durationMin, notes } = parsed.data;
  const { data, error } = await supabaseAdmin
    .from("workouts")
    .insert({
      user_id: req.userId,
      date,
      type,
      count: count ?? 1,
      duration_min: durationMin,
      notes,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(toWorkout(data));
});

workoutsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = updateWorkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { date, type, count, durationMin, notes } = parsed.data;
  const { data, error } = await supabaseAdmin
    .from("workouts")
    .update({
      ...(date !== undefined && { date }),
      ...(type !== undefined && { type }),
      ...(count !== undefined && { count }),
      ...(durationMin !== undefined && { duration_min: durationMin }),
      ...(notes !== undefined && { notes }),
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
  res.json(toWorkout(data));
});

workoutsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const { error, count } = await supabaseAdmin
    .from("workouts")
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

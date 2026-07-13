import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { createWorkoutGoalSchema, updateWorkoutGoalSchema } from "./workoutGoals.schema.js";

export const workoutGoalsRouter = Router();

workoutGoalsRouter.use(requireAuth);

function toWorkoutGoal(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    workoutType: row.workout_type,
    targetPerWeek: row.target_per_week,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

workoutGoalsRouter.get("/", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("workout_goals")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data.map(toWorkoutGoal));
});

workoutGoalsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createWorkoutGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("workout_goals")
    .insert({
      user_id: req.userId,
      workout_type: parsed.data.workoutType,
      target_per_week: parsed.data.targetPerWeek,
    })
    .select()
    .single();

  if (error) {
    // Postgres unique_violation — a goal for this type already exists.
    if (error.code === "23505") {
      res.status(409).json({ error: "You already have a goal for this workout type — edit it instead." });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(toWorkoutGoal(data));
});

workoutGoalsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = updateWorkoutGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("workout_goals")
    .update({ target_per_week: parsed.data.targetPerWeek, updated_at: new Date().toISOString() })
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
  res.json(toWorkoutGoal(data));
});

workoutGoalsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const { error, count } = await supabaseAdmin
    .from("workout_goals")
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

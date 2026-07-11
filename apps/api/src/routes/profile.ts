import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", req.userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data ?? null);
});

const upsertProfileSchema = z.object({
  age: z.number().int().min(1).max(120).nullable().optional(),
  sex: z.enum(["male", "female", "other"]).nullable().optional(),
  heightCm: z.number().min(50).max(272).nullable().optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .nullable()
    .optional(),
  goals: z.array(z.string()).optional(),
});

profileRouter.put("/", async (req: AuthedRequest, res) => {
  const parsed = upsertProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { age, sex, heightCm, activityLevel, goals } = parsed.data;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: req.userId,
        age,
        sex,
        height_cm: heightCm,
        activity_level: activityLevel,
        goals,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

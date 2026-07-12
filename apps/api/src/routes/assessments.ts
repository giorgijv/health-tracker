import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { aiRateLimit } from "../middleware/rateLimit.js";
import { supabaseAdmin } from "../lib/supabase.js";
import {
  ASSESSMENT_MODEL,
  generateAssessment,
  generatePeriodicAssessment,
} from "../lib/assessment.js";
import { formatContext, gatherUserContext } from "../lib/userContext.js";

export const assessmentsRouter = Router();

assessmentsRouter.use(requireAuth);

function toAssessment(row: Record<string, unknown>) {
  // Periodic assessments store an auto-context object in intake_json rather than
  // a questionnaire; surface intake as null for those.
  const intakeJson = row.intake_json as { auto?: boolean } | null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    intake: intakeJson?.auto ? null : intakeJson,
    summary: row.summary_json,
    model: row.model,
    createdAt: row.created_at,
  };
}

assessmentsRouter.get("/", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("assessments")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data.map(toAssessment));
});

assessmentsRouter.get("/:id", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("assessments")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toAssessment(data));
});

const intakeSchema = z.object({
  age: z.number().int().min(1).max(120).nullable().optional(),
  sex: z.enum(["male", "female", "other"]).nullable().optional(),
  heightCm: z.number().min(50).max(272).nullable().optional(),
  weightKg: z.number().min(20).max(400).nullable().optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .nullable()
    .optional(),
  goals: z.array(z.string().max(200)).max(20).optional(),
  injuriesOrConditions: z.string().max(2000).optional(),
  currentExercise: z.string().max(2000).optional(),
  sleepHoursTypical: z.number().min(0).max(24).nullable().optional(),
  dietNotes: z.string().max(2000).optional(),
});

const createAssessmentSchema = z.object({
  type: z.enum(["initial", "periodic"]).optional(),
  intake: intakeSchema,
});

assessmentsRouter.post("/", aiRateLimit, async (req: AuthedRequest, res) => {
  const parsed = createAssessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const intake = {
    age: parsed.data.intake.age ?? null,
    sex: parsed.data.intake.sex ?? null,
    heightCm: parsed.data.intake.heightCm ?? null,
    weightKg: parsed.data.intake.weightKg ?? null,
    activityLevel: parsed.data.intake.activityLevel ?? null,
    goals: parsed.data.intake.goals ?? [],
    injuriesOrConditions: parsed.data.intake.injuriesOrConditions ?? "",
    currentExercise: parsed.data.intake.currentExercise ?? "",
    sleepHoursTypical: parsed.data.intake.sleepHoursTypical ?? null,
    dietNotes: parsed.data.intake.dietNotes ?? "",
  };

  let summary;
  try {
    summary = await generateAssessment(intake);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY is not set")) {
      res.status(503).json({ error: "AI assessment is not configured (missing API key)." });
      return;
    }
    console.error("Assessment generation failed:", message);
    res.status(502).json({ error: "Failed to generate assessment." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("assessments")
    .insert({
      user_id: req.userId,
      type: parsed.data.type ?? "initial",
      intake_json: intake,
      summary_json: summary,
      model: ASSESSMENT_MODEL,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(toAssessment(data));
});

// Periodic re-assessment: no questionnaire — pulls tracked history and the
// previous assessment automatically.
assessmentsRouter.post("/periodic", aiRateLimit, async (req: AuthedRequest, res) => {
  const { data: prevRow } = await supabaseAdmin
    .from("assessments")
    .select("id, summary_json")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevSummary = prevRow?.summary_json as
    | { overallLevel?: string; focusAreas?: { title: string }[] }
    | undefined;

  const contextText = formatContext(await gatherUserContext(req.userId!));

  let summary;
  try {
    summary = await generatePeriodicAssessment({
      contextText,
      previous: prevSummary
        ? {
            overallLevel: prevSummary.overallLevel ?? "unknown",
            focusAreas: prevSummary.focusAreas ?? [],
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY is not set")) {
      res.status(503).json({ error: "AI assessment is not configured (missing API key)." });
      return;
    }
    console.error("Periodic assessment failed:", message);
    res.status(502).json({ error: "Failed to generate re-assessment." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("assessments")
    .insert({
      user_id: req.userId,
      type: "periodic",
      intake_json: { auto: true, context: contextText, previousAssessmentId: prevRow?.id ?? null },
      summary_json: summary,
      model: ASSESSMENT_MODEL,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(toAssessment(data));
});

import { FOOD_PHOTOS_BUCKET, sumFoodItems, type FoodItem } from "@health-tracker/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { aiRateLimit, foodPhotoAiRateLimit } from "../middleware/rateLimit.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { classifyAiError } from "../lib/aiError.js";
import { downloadImage } from "../lib/imageDownload.js";
import { FOOD_ANALYSIS_MODEL, analyzeFoodPhoto } from "../lib/foodAnalysis.js";

export const foodLogsRouter = Router();

foodLogsRouter.use(requireAuth);

function toFoodLog(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    storagePath: row.storage_path,
    eatenAt: row.eaten_at,
    mealType: row.meal_type,
    items: row.items_json,
    totals: {
      calories: Number(row.total_calories),
      proteinG: Number(row.total_protein_g),
      carbsG: Number(row.total_carbs_g),
      fatG: Number(row.total_fat_g),
    },
    confidence: row.confidence ?? null,
    nutritionalQuality: row.nutritional_quality_json ?? null,
    model: row.model ?? null,
    createdAt: row.created_at,
  };
}

function ownsPath(userId: string, storagePath: string): boolean {
  return storagePath.startsWith(`${userId}/`);
}

// --- Analyze a photo without saving anything. The client edits the result,
// --- then calls POST / to persist. ---
const analyzeSchema = z.object({ storagePath: z.string().min(1) });

foodLogsRouter.post("/analyze", foodPhotoAiRateLimit, aiRateLimit, async (req: AuthedRequest, res) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!ownsPath(req.userId!, parsed.data.storagePath)) {
    res.status(403).json({ error: "storagePath must be within your own folder" });
    return;
  }

  const image = await downloadImage(FOOD_PHOTOS_BUCKET, parsed.data.storagePath);
  if (!image) {
    res.status(400).json({ error: "Could not read the uploaded image" });
    return;
  }

  try {
    const analysis = await analyzeFoodPhoto(image);
    res.json(analysis);
  } catch (err) {
    const info = classifyAiError(err);
    console.error(`Food analysis failed [${info.label}]:`, err);
    res.status(info.status).json({ error: info.message });
  }
});

const itemSchema = z.object({
  name: z.string().min(1).max(200),
  estGrams: z.number().min(0).max(5000),
  calories: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(1000),
});

const qualitySchema = z.object({
  rating: z.enum(["poor", "fair", "good", "excellent"]),
  notes: z.string().max(1000),
});

const createSchema = z.object({
  storagePath: z.string().min(1),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  eatenAt: z.string().datetime().optional(),
  items: z.array(itemSchema).min(1).max(50),
  confidence: z.enum(["low", "medium", "high"]).nullable().optional(),
  nutritionalQuality: qualitySchema.nullable().optional(),
  aiAnalysis: z.unknown().optional(),
});

foodLogsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!ownsPath(req.userId!, parsed.data.storagePath)) {
    res.status(403).json({ error: "storagePath must be within your own folder" });
    return;
  }

  // Recompute totals server-side from the final (edited) items — never trust
  // client-sent totals.
  const totals = sumFoodItems(parsed.data.items as FoodItem[]);

  const { data, error } = await supabaseAdmin
    .from("food_logs")
    .insert({
      user_id: req.userId,
      storage_path: parsed.data.storagePath,
      meal_type: parsed.data.mealType,
      eaten_at: parsed.data.eatenAt ?? new Date().toISOString(),
      items_json: parsed.data.items,
      ai_analysis_json: parsed.data.aiAnalysis ?? null,
      total_calories: totals.calories,
      total_protein_g: totals.proteinG,
      total_carbs_g: totals.carbsG,
      total_fat_g: totals.fatG,
      confidence: parsed.data.confidence ?? null,
      nutritional_quality_json: parsed.data.nutritionalQuality ?? null,
      model: parsed.data.aiAnalysis ? FOOD_ANALYSIS_MODEL : null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(toFoodLog(data));
});

foodLogsRouter.get("/", async (req: AuthedRequest, res) => {
  const { from, to } = req.query;

  let query = supabaseAdmin
    .from("food_logs")
    .select("*")
    .eq("user_id", req.userId)
    .order("eaten_at", { ascending: false });

  if (typeof from === "string") query = query.gte("eaten_at", from);
  if (typeof to === "string") query = query.lte("eaten_at", to);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data.map(toFoodLog));
});

foodLogsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const { data: row, error: findErr } = await supabaseAdmin
    .from("food_logs")
    .select("storage_path")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (findErr) {
    res.status(500).json({ error: findErr.message });
    return;
  }
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await supabaseAdmin.storage.from(FOOD_PHOTOS_BUCKET).remove([row.storage_path]);

  const { error: delErr } = await supabaseAdmin
    .from("food_logs")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (delErr) {
    res.status(500).json({ error: delErr.message });
    return;
  }
  res.status(204).end();
});

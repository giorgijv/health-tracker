import { BODY_PHOTOS_BUCKET } from "@health-tracker/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import {
  aiLimitOpts,
  aiRateLimit,
  bodyPhotoAiLimitOpts,
  bodyPhotoAiRateLimit,
  consumeRateLimit,
} from "../middleware/rateLimit.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { classifyAiError } from "../lib/aiError.js";
import { downloadImage, type MediaType } from "../lib/imageDownload.js";
import { BODY_ANALYSIS_MODEL, analyzeBodyPhoto } from "../lib/bodyAnalysis.js";

export const bodyPhotosRouter = Router();

bodyPhotosRouter.use(requireAuth);

function toBodyPhoto(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    storagePath: row.storage_path,
    angle: row.angle,
    takenAt: row.taken_at,
    analysis: row.analysis_json ?? null,
    model: row.model ?? null,
    createdAt: row.created_at,
  };
}

/** Analyze one photo row (finding a prior same-angle photo to compare), then persist the result. */
async function runAnalysis(
  userId: string,
  row: { id: string; storage_path: string; angle: string; taken_at: string },
) {
  const current = await downloadImage(BODY_PHOTOS_BUCKET, row.storage_path);
  if (!current) throw new Error("Could not read the uploaded image");

  const { data: priorRows } = await supabaseAdmin
    .from("body_photos")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("angle", row.angle)
    .neq("id", row.id)
    .lte("taken_at", row.taken_at)
    .order("taken_at", { ascending: false })
    .limit(1);

  let previous: { base64: string; mediaType: MediaType } | undefined;
  const priorPath = priorRows?.[0]?.storage_path;
  if (priorPath) {
    previous = (await downloadImage(BODY_PHOTOS_BUCKET, priorPath)) ?? undefined;
  }

  const analysis = await analyzeBodyPhoto({ current, previous, angle: row.angle });

  const { data: updated, error } = await supabaseAdmin
    .from("body_photos")
    .update({ analysis_json: analysis, model: BODY_ANALYSIS_MODEL })
    .eq("id", row.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return updated;
}

bodyPhotosRouter.get("/", async (req: AuthedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from("body_photos")
    .select("*")
    .eq("user_id", req.userId)
    .order("taken_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data.map(toBodyPhoto));
});

const createSchema = z.object({
  storagePath: z.string().min(1),
  angle: z.enum(["front", "side", "back"]),
  takenAt: z.string().datetime().optional(),
});

bodyPhotosRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { storagePath, angle, takenAt } = parsed.data;

  // The client uploads to "<user_id>/...". Enforce ownership so a user can't
  // register or analyze another user's object.
  if (!storagePath.startsWith(`${req.userId}/`)) {
    res.status(403).json({ error: "storagePath must be within your own folder" });
    return;
  }

  const { data: row, error } = await supabaseAdmin
    .from("body_photos")
    .insert({
      user_id: req.userId,
      storage_path: storagePath,
      angle,
      taken_at: takenAt ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // The photo is already saved at this point regardless of what happens next
  // — a hit budget or a failed AI call should never lose the upload, only
  // skip the analysis (the client can retry via POST /:id/analyze once it
  // resets, using the same "Analyze" button it shows for any failed analysis).
  const budget = consumeRateLimit(req.userId, bodyPhotoAiLimitOpts);
  if (budget.limited) {
    res.status(201).json({ ...toBodyPhoto(row), analysisError: budget.message });
    return;
  }
  const aiBudget = consumeRateLimit(req.userId, aiLimitOpts);
  if (aiBudget.limited) {
    res.status(201).json({ ...toBodyPhoto(row), analysisError: aiBudget.message });
    return;
  }

  try {
    const updated = await runAnalysis(req.userId!, row);
    res.status(201).json(toBodyPhoto(updated));
  } catch (err) {
    const info = classifyAiError(err);
    console.error(`Body photo analysis failed [${info.label}]:`, err);
    res.status(201).json({ ...toBodyPhoto(row), analysisError: info.message });
  }
});

bodyPhotosRouter.post("/:id/analyze", bodyPhotoAiRateLimit, aiRateLimit, async (req: AuthedRequest, res) => {
  const { data: row, error } = await supabaseAdmin
    .from("body_photos")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    const updated = await runAnalysis(req.userId!, row);
    res.json(toBodyPhoto(updated));
  } catch (err) {
    const info = classifyAiError(err);
    console.error(`Body photo analysis failed [${info.label}]:`, err);
    res.status(info.status).json({ error: info.message });
  }
});

bodyPhotosRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const { data: row, error: findErr } = await supabaseAdmin
    .from("body_photos")
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

  // Remove the image object first, then the row.
  await supabaseAdmin.storage.from(BODY_PHOTOS_BUCKET).remove([row.storage_path]);

  const { error: delErr } = await supabaseAdmin
    .from("body_photos")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (delErr) {
    res.status(500).json({ error: delErr.message });
    return;
  }
  res.status(204).end();
});

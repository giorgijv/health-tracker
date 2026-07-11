import { BODY_PHOTOS_BUCKET } from "@health-tracker/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { BODY_ANALYSIS_MODEL, analyzeBodyPhoto } from "../lib/bodyAnalysis.js";

export const bodyPhotosRouter = Router();

bodyPhotosRouter.use(requireAuth);

type MediaType = "image/jpeg" | "image/png" | "image/webp";

function mediaTypeFor(path: string): MediaType | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

async function downloadImage(
  storagePath: string,
): Promise<{ base64: string; mediaType: MediaType } | null> {
  const mediaType = mediaTypeFor(storagePath);
  if (!mediaType) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(BODY_PHOTOS_BUCKET)
    .download(storagePath);
  if (error || !data) return null;

  const buf = Buffer.from(await data.arrayBuffer());
  return { base64: buf.toString("base64"), mediaType };
}

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
  const current = await downloadImage(row.storage_path);
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
    previous = (await downloadImage(priorPath)) ?? undefined;
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

  // Analyze inline. If it fails (e.g. missing API key), keep the saved photo and
  // report the failure so the client can retry via POST /:id/analyze.
  try {
    const updated = await runAnalysis(req.userId!, row);
    res.status(201).json(toBodyPhoto(updated));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const analysisError = message.includes("ANTHROPIC_API_KEY is not set")
      ? "AI analysis is not configured (missing API key)."
      : "Analysis failed — you can retry.";
    console.error("Body photo analysis failed:", message);
    res.status(201).json({ ...toBodyPhoto(row), analysisError });
  }
});

bodyPhotosRouter.post("/:id/analyze", async (req: AuthedRequest, res) => {
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
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY is not set")) {
      res.status(503).json({ error: "AI analysis is not configured (missing API key)." });
      return;
    }
    console.error("Body photo analysis failed:", message);
    res.status(502).json({ error: "Analysis failed." });
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

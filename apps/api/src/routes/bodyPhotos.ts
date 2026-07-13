import { BODY_PHOTOS_BUCKET } from "@health-tracker/shared";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const bodyPhotosRouter = Router();

bodyPhotosRouter.use(requireAuth);

function toBodyPhoto(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    storagePath: row.storage_path,
    angle: row.angle,
    takenAt: row.taken_at,
    createdAt: row.created_at,
  };
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
  // register another user's object.
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
  res.status(201).json(toBodyPhoto(row));
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

import { BODY_PHOTOS_BUCKET, FOOD_PHOTOS_BUCKET } from "@health-tracker/shared";
import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const accountRouter = Router();

accountRouter.use(requireAuth);

/** Remove every object under the user's folder in a private bucket. */
async function purgeBucket(bucket: string, userId: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(userId, { limit: 1000 });
  if (error || !data || data.length === 0) return;
  const paths = data.map((f) => `${userId}/${f.name}`);
  await supabaseAdmin.storage.from(bucket).remove(paths);
}

// Full account + data deletion. Storage objects aren't covered by the DB's
// cascade, so purge them first; deleting the auth user then cascades every row
// (profiles, metrics, workouts, assessments, photos, food logs, chat, …).
accountRouter.delete("/", async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  try {
    await purgeBucket(BODY_PHOTOS_BUCKET, userId);
    await purgeBucket(FOOD_PHOTOS_BUCKET, userId);
  } catch (err) {
    console.error("Storage purge failed during account deletion:", err);
    // Continue — we still want to delete the account and DB rows.
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).end();
});

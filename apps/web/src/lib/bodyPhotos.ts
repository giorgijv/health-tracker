import { BODY_PHOTOS_BUCKET } from "@health-tracker/shared";
import { supabase } from "./supabase";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Upload an image to the user's private folder and return its storage path. */
export async function uploadBodyPhoto(userId: string, file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw new Error("Unsupported image type — use JPEG, PNG, or WebP.");
  }

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BODY_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(error.message);
  return path;
}

/** Short-lived signed URL for displaying a private photo. */
export async function signedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BODY_PHOTOS_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

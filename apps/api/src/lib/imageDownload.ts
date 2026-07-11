import { supabaseAdmin } from "./supabase.js";

export type MediaType = "image/jpeg" | "image/png" | "image/webp";

export function mediaTypeFor(path: string): MediaType | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

/** Download an image object from a private bucket and return it base64-encoded. */
export async function downloadImage(
  bucket: string,
  storagePath: string,
): Promise<{ base64: string; mediaType: MediaType } | null> {
  const mediaType = mediaTypeFor(storagePath);
  if (!mediaType) return null;

  const { data, error } = await supabaseAdmin.storage.from(bucket).download(storagePath);
  if (error || !data) return null;

  const buf = Buffer.from(await data.arrayBuffer());
  return { base64: buf.toString("base64"), mediaType };
}

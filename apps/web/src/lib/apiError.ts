// Kept dependency-free (no supabase import) so it can be unit-tested without
// pulling in a client that throws at import time when env vars aren't set.

/**
 * Route handlers return `{ error: parsed.error.flatten() }` on a 400 (zod
 * validation failure) — an object, not a string. Turn that into a readable
 * message instead of silently falling back to "Request failed (400)".
 */
export function describeError(body: unknown): string | null {
  if (body == null || typeof body !== "object" || !("error" in body)) return null;
  const err = (body as { error: unknown }).error;
  if (typeof err === "string") return err;
  if (err != null && typeof err === "object") {
    const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts: string[] = [...(flat.formErrors ?? [])];
    for (const [field, msgs] of Object.entries(flat.fieldErrors ?? {})) {
      if (msgs?.length) parts.push(`${field}: ${msgs.join(", ")}`);
    }
    if (parts.length) return parts.join("; ");
  }
  return null;
}

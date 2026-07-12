import { z } from "zod";

/** Shared across route validators. Kept dependency-free (no DB/auth imports)
 * so schemas can be unit-tested without pulling in the Supabase client. */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

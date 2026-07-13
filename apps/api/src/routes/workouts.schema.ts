import { z } from "zod";
import { isoDate } from "../lib/validation.js";

export const createWorkoutSchema = z.object({
  date: isoDate,
  type: z.string().min(1).max(60),
  /** How many units this entry represents (e.g. 10 push-ups). Defaults to 1. */
  count: z.number().int().min(1).max(100000).optional(),
  durationMin: z.number().int().min(0).max(1440).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateWorkoutSchema = createWorkoutSchema.partial();

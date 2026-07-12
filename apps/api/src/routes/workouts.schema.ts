import { z } from "zod";
import { isoDate } from "../lib/validation.js";

export const createWorkoutSchema = z.object({
  date: isoDate,
  type: z.string().min(1).max(60),
  durationMin: z.number().int().min(0).max(1440).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateWorkoutSchema = createWorkoutSchema.partial();

import { z } from "zod";
import { isoDate } from "../lib/validation.js";

export const createMetricSchema = z.object({
  date: isoDate,
  weightKg: z.number().min(20).max(400).nullable().optional(),
  bodyFatPctEst: z.number().min(1).max(70).nullable().optional(),
  waistCm: z.number().min(30).max(300).nullable().optional(),
  source: z.enum(["manual", "photo_est"]).optional(),
});

export const updateMetricSchema = createMetricSchema.partial();

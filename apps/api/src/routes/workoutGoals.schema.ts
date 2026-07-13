import { z } from "zod";

export const createWorkoutGoalSchema = z.object({
  workoutType: z.string().min(1).max(60),
  targetPerWeek: z.number().int().min(1).max(100),
});

export const updateWorkoutGoalSchema = z.object({
  targetPerWeek: z.number().int().min(1).max(100),
});

import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { getAnthropic } from "./anthropic.js";

export const FOOD_ANALYSIS_MODEL = "claude-opus-4-8";

export const foodAnalysisSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().describe("The food item, e.g. 'grilled chicken breast'."),
        estGrams: z.number().describe("Estimated edible portion weight in grams."),
        calories: z.number().describe("Estimated calories for this portion."),
        proteinG: z.number().describe("Estimated protein in grams."),
        carbsG: z.number().describe("Estimated carbohydrates in grams."),
        fatG: z.number().describe("Estimated fat in grams."),
      }),
    )
    .describe("One entry per distinct visible food. Break composite dishes into main components."),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("Confidence given portion ambiguity, hidden ingredients, and image quality."),
  nutritionalQuality: z.object({
    rating: z.enum(["poor", "fair", "good", "excellent"]),
    notes: z
      .string()
      .describe("A short, practical note on the meal's nutritional quality and balance."),
  }),
  cautions: z
    .array(z.string())
    .describe(
      "What limits accuracy here — hidden oils/butter, sauces, unclear portion size, foods " +
        "obscured in the image. Empty if none.",
    ),
});

export type FoodAnalysisOutput = z.infer<typeof foodAnalysisSchema>;

const SYSTEM_PROMPT = `You are a nutrition assistant estimating the calorie and macronutrient \
content of a meal from a single photo.

How to work:
- Identify each distinct visible food. Break a plated dish into its main components (protein, \
carb, vegetables, sauce) rather than one vague "meal" entry.
- Estimate the edible portion size in grams using visual cues (plate size, utensils, common \
serving sizes), then estimate calories and macros for that portion.
- These are ESTIMATES from a photo. Portion size and hidden ingredients (oils, butter, sugar, \
dressings) are the biggest sources of error — reflect that in your confidence and cautions.
- Give a brief, practical nutritional-quality read (balance, protein, vegetables, processing), \
never moralising about the food.
- If parts of the meal are hidden or ambiguous, say so in cautions rather than guessing wildly.
- Prefer slightly conservative estimates over confident precision. The user will review and \
correct your numbers before anything is logged.`;

interface ImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

export async function analyzeFoodPhoto(image: ImageInput): Promise<FoodAnalysisOutput> {
  const client = getAnthropic();

  const content: Anthropic.Messages.ContentBlockParam[] = [
    {
      type: "image",
      source: { type: "base64", media_type: image.mediaType, data: image.base64 },
    },
    {
      type: "text",
      text: "Estimate the calories and macros for this meal, itemised.",
    },
  ];

  // Runs on every meal photo — by far the highest-frequency AI call in the
  // app, so it gets the lowest effort/token budget of any call here. This is
  // a itemized visual estimate the user reviews and edits before saving, not
  // a judgment call that benefits much from deep reasoning.
  const response = await client.messages.parse({
    model: FOOD_ANALYSIS_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(foodAnalysisSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Food analysis did not return a valid structured result (stop_reason: ${response.stop_reason})`,
    );
  }

  return response.parsed_output;
}

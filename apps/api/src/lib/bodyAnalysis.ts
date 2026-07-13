import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { getAnthropic } from "./anthropic.js";

export const BODY_ANALYSIS_MODEL = "claude-opus-4-8";

export const bodyAnalysisSchema = z.object({
  observations: z
    .array(z.string())
    .describe(
      "Qualitative, respectful visual notes: posture, visible muscle definition, " +
        "overall composition cues. What you can actually see — no measurements.",
    ),
  comparisonToPrevious: z
    .string()
    .nullable()
    .describe(
      "If a previous photo is provided, what changed visually between then and now. " +
        "Null if no previous photo was given.",
    ),
  estimatedBodyFatRange: z
    .string()
    .nullable()
    .describe(
      "A ROUGH, wide body-fat range if you can reasonably estimate one (e.g. '18-24%'). " +
        "This is a coarse visual guess, never a measurement. Null if the photo doesn't " +
        "support even a rough estimate.",
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("Your confidence in this read, given photo quality, angle, and lighting."),
  cautions: z
    .array(z.string())
    .describe(
      "Factors limiting the read (poor lighting, baggy clothing, angle, distance), or " +
        "anything that warrants care. Empty if none.",
    ),
  encouragement: z
    .string()
    .describe("One short, genuine, non-judgmental line of encouragement."),
});

export type BodyAnalysisOutput = z.infer<typeof bodyAnalysisSchema>;

const SYSTEM_PROMPT = `You are a supportive fitness coach giving a qualitative visual read of a \
client's progress photo. This is subjective visual tracking, NOT a medical or body-composition \
measurement.

Hard rules:
- Be respectful, body-neutral, and encouraging. Never shaming, never fixated on flaws.
- You are describing what is visible in a photo. Do not diagnose, do not give medical advice, \
and never present estimates as measurements — always frame them as rough visual impressions.
- Body-fat percentage from a photo is inherently imprecise. Only give a range when the photo \
reasonably supports it, always as a wide range, always low/medium confidence unless the photo is \
genuinely clear.
- Call out anything limiting the read (lighting, clothing, angle) honestly in cautions.
- If a previous photo is included, focus on visible changes between the two; be specific but \
measured, and don't manufacture changes that aren't clearly there.`;

interface ImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

export async function analyzeBodyPhoto(params: {
  current: ImageInput;
  previous?: ImageInput;
  angle: string;
}): Promise<BodyAnalysisOutput> {
  const client = getAnthropic();

  const content: Anthropic.Messages.ContentBlockParam[] = [];

  if (params.previous) {
    content.push({ type: "text", text: "PREVIOUS photo (for comparison):" });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: params.previous.mediaType,
        data: params.previous.base64,
      },
    });
  }

  content.push({ type: "text", text: "CURRENT photo:" });
  content.push({
    type: "image",
    source: {
      type: "base64",
      media_type: params.current.mediaType,
      data: params.current.base64,
    },
  });
  content.push({
    type: "text",
    text:
      `This is a ${params.angle}-facing progress photo. Give your qualitative visual read` +
      (params.previous ? ", including what changed from the previous photo." : "."),
  });

  // Runs on every progress-photo upload (now rate-limited to a couple/week —
  // see bodyPhotoAiLimitOpts). Medium effort/lower token cap keeps this cheap
  // without losing the current-vs-previous comparison quality.
  const response = await client.messages.parse({
    model: BODY_ANALYSIS_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(bodyAnalysisSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Body analysis did not return a valid structured result (stop_reason: ${response.stop_reason})`,
    );
  }

  return response.parsed_output;
}

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { getAnthropic } from "./anthropic.js";

export const RECOMMENDATIONS_MODEL = "claude-opus-4-8";

export const recommendationsSchema = z.object({
  summary: z
    .string()
    .describe(
      "A 2-3 sentence honest read of how things are going right now, grounded in the data.",
    ),
  recommendations: z
    .array(
      z.object({
        category: z.enum([
          "nutrition",
          "training",
          "recovery",
          "consistency",
          "measurement",
          "general",
        ]),
        title: z.string().describe("A short, concrete action, e.g. 'Add a protein source to breakfast'."),
        detail: z.string().describe("One or two sentences on what to do and why it helps."),
        priority: z.enum(["high", "medium", "low"]),
        basis: z
          .string()
          .describe(
            "The specific data point this is grounded in, e.g. 'Only 3 workouts in the last 2 weeks'.",
          ),
      }),
    )
    .describe(
      "The 3-6 things that will move the needle most for THIS person right now, most important first.",
    ),
});

export type RecommendationsOutput = z.infer<typeof recommendationsSchema>;

const SYSTEM_PROMPT = `You are a health and fitness coach reviewing a client's recent tracked data \
and giving them concrete, prioritised recommendations.

Principles:
- Ground every recommendation in the data you were given. Reference the specific signal in 'basis'. \
Do not invent trends the data doesn't show.
- Prioritise ruthlessly. Surface the few things that will actually move the needle for this person \
right now, most important first. Fewer strong recommendations beat a long generic list.
- Be specific and actionable ("add ~30g protein at breakfast"), not vague ("eat healthier").
- Respect their stated goals and their assessment's focus areas.
- Where data is missing (e.g. no food logged), it's fine to recommend they start tracking it — but \
don't scold.
- You are a coach, not a doctor. Never diagnose. If the data suggests something medical (rapid \
unexplained weight change, signs of under-eating), gently suggest professional input.
- Encouraging and honest. Acknowledge what's going well before what needs work.`;

export async function generateRecommendations(contextText: string): Promise<RecommendationsOutput> {
  const client = getAnthropic();

  const response = await client.messages.parse({
    model: RECOMMENDATIONS_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // Medium effort: text synthesis over structured data — the sweet spot for
    // cost/quality here. Bump to high if recommendations feel shallow in testing.
    output_config: {
      effort: "medium",
      format: zodOutputFormat(recommendationsSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          "Here is my recent tracked data. Give me your read and your top recommendations.\n\n" +
          contextText,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Recommendation generation did not return a valid result (stop_reason: ${response.stop_reason})`,
    );
  }

  return response.parsed_output;
}

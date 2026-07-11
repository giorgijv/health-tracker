import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// The SDK's zodOutputFormat helper expects zod's v4 API (exported at zod/v4 in
// zod 3.25+). Request-body validators elsewhere use the plain "zod" (v3) import.
import * as z from "zod/v4";
import { getAnthropic } from "./anthropic.js";

export const ASSESSMENT_MODEL = "claude-opus-4-8";

// The structured write-up Claude returns. Kept free of string min/max length
// constraints — structured outputs don't enforce those, so we leave the shape
// simple and let the prompt guide content quality.
export const assessmentSummarySchema = z.object({
  narrative: z
    .string()
    .describe(
      "A warm, honest 2-4 paragraph overview of where the person stands today " +
        "and what matters most for them to focus on. Plain language, no jargon.",
    ),
  overallLevel: z
    .enum(["beginner", "intermediate", "advanced"])
    .describe("Overall current fitness level, judged from the intake."),
  focusAreas: z
    .array(
      z.object({
        title: z.string().describe("Short label, e.g. 'Build a consistent training base'."),
        rationale: z.string().describe("Why this matters for this specific person."),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe("The 2-5 things that will move the needle most, most important first."),
  strengths: z
    .array(z.string())
    .describe("Genuine strengths to build on, based on the intake."),
  cautions: z
    .array(z.string())
    .describe(
      "Safety flags: injuries, conditions, or patterns that warrant care or a " +
        "professional's input. Empty if none. Never diagnose.",
    ),
});

export type AssessmentSummaryOutput = z.infer<typeof assessmentSummarySchema>;

const SYSTEM_PROMPT = `You are a knowledgeable, encouraging health and fitness coach writing an \
initial assessment for a new client based on a short intake questionnaire.

Principles:
- Be honest and specific, not generically positive. Ground every observation in \
what the intake actually says.
- You are a coach, not a doctor. Do NOT diagnose, and do NOT give medical advice. \
If something in the intake (an injury, a condition, chest pain, extreme fatigue, \
rapid unexplained weight change, disordered-eating signals) warrants professional \
input, say so plainly in the cautions and, where relevant, in the narrative.
- Meet people where they are. A beginner needs encouragement and one or two simple \
starting points; an advanced person needs precision.
- Prioritise. The focus areas should be the few things that will actually move the \
needle for this person, ordered most important first.
- Keep the narrative readable and human: short paragraphs, plain language, no jargon \
dumps, no emoji.`;

function formatIntake(intake: {
  age: number | null;
  sex: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  goals: string[];
  injuriesOrConditions: string;
  currentExercise: string;
  sleepHoursTypical: number | null;
  dietNotes: string;
}): string {
  const lines = [
    `Age: ${intake.age ?? "not given"}`,
    `Sex: ${intake.sex ?? "not given"}`,
    `Height: ${intake.heightCm != null ? `${intake.heightCm} cm` : "not given"}`,
    `Weight: ${intake.weightKg != null ? `${intake.weightKg} kg` : "not given"}`,
    `Self-reported activity level: ${intake.activityLevel ?? "not given"}`,
    `Typical sleep: ${
      intake.sleepHoursTypical != null ? `${intake.sleepHoursTypical} hours/night` : "not given"
    }`,
    `Goals: ${intake.goals.length ? intake.goals.join("; ") : "not given"}`,
    `Current exercise routine: ${intake.currentExercise.trim() || "not given"}`,
    `Injuries / conditions: ${intake.injuriesOrConditions.trim() || "none reported"}`,
    `Diet notes: ${intake.dietNotes.trim() || "not given"}`,
  ];
  return lines.join("\n");
}

export async function generateAssessment(intake: Parameters<typeof formatIntake>[0]) {
  const client = getAnthropic();

  const response = await client.messages.parse({
    model: ASSESSMENT_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // High effort: this is a judgment-heavy synthesis where quality matters more
    // than latency or cost. Revisit per step 10 based on real usage.
    output_config: {
      effort: "high",
      format: zodOutputFormat(assessmentSummarySchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          "Here is my intake questionnaire. Write my initial assessment.\n\n" +
          formatIntake(intake),
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error(
      `Assessment generation did not return a valid structured result (stop_reason: ${response.stop_reason})`,
    );
  }

  return response.parsed_output;
}

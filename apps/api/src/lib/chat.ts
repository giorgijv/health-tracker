import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./anthropic.js";

export const CHAT_MODEL = "claude-opus-4-8";
export const NUDGE_MODEL = "claude-haiku-4-5";

const CHAT_SYSTEM = `You are the user's personal health and fitness coach, answering their questions \
in an ongoing conversation. You have their recent tracked data below.

- Answer using their actual data when the question relates to it. Be specific and reference the \
numbers you were given rather than speaking generically.
- Keep replies conversational and reasonably concise — this is a chat, not an essay. Expand when \
the question genuinely needs it.
- Be encouraging and honest. Don't invent data you weren't given; if you don't have the \
information, say so and suggest what to log.
- You are a coach, not a doctor. Don't diagnose or give medical advice; suggest professional input \
when something warrants it.`;

const NUDGE_SYSTEM = `You are a health coach writing a very short, friendly check-in for the user \
based on their recent tracked data. One or two sentences. Warm and specific — reference a real \
signal in their data (a trend, a streak, a gap). No medical advice, no lecturing. If there's \
little data, gently nudge them to log something.`;

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** Multi-turn coach reply. `messages` is the conversation so far (ending with the new user turn). */
export async function chatReply(
  contextText: string,
  messages: Anthropic.MessageParam[],
): Promise<string> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: `${CHAT_SYSTEM}\n\nThe user's recent tracked data:\n${contextText}`,
    messages,
  });

  return textOf(response);
}

/** Cheap proactive check-in. Haiku 4.5 does not accept the effort param, so it's omitted. */
export async function generateNudge(contextText: string): Promise<string> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: NUDGE_MODEL,
    max_tokens: 300,
    system: NUDGE_SYSTEM,
    messages: [
      { role: "user", content: `My recent tracked data:\n${contextText}\n\nWrite my check-in.` },
    ],
  });

  return textOf(response);
}

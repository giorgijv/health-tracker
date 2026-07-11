import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Lazily construct the Anthropic client so the API can still boot (and serve
 * the non-AI routes) when ANTHROPIC_API_KEY isn't set yet. AI endpoints call
 * this and surface a clear 503 if the key is missing.
 */
export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

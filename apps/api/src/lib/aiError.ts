import Anthropic from "@anthropic-ai/sdk";

export interface AiErrorInfo {
  /** HTTP status to return to the client. */
  status: number;
  /** User-facing message. Safe to surface in the browser (no secrets/internals). */
  message: string;
  /** Short label for server logs. */
  label: string;
}

/**
 * Turn a failure from an AI call into a clear, actionable HTTP response.
 * Previously every AI endpoint returned a generic "Failed to…" message, which
 * hid diagnosable causes (missing key, no credits, rate limit) and forced
 * log-spelunking. This maps the common cases to messages that say what to do.
 */
export function classifyAiError(err: unknown): AiErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);

  // Thrown by getAnthropic() before any network call.
  if (raw.includes("ANTHROPIC_API_KEY is not set")) {
    return {
      status: 503,
      message: "AI features aren't configured — the server is missing its ANTHROPIC_API_KEY.",
      label: "missing-key",
    };
  }

  // Insufficient credits arrives as a 400 invalid_request_error whose message
  // mentions the credit balance — it shares a type with ordinary validation
  // errors, so detect it by message.
  if (/credit balance|billing|too low/i.test(raw)) {
    return {
      status: 402,
      message:
        "The AI service is out of credits. Add credits to the Anthropic account at " +
        "console.anthropic.com → Plans & Billing, then try again.",
      label: "insufficient-credits",
    };
  }

  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    if (status === 401) {
      return {
        status: 503,
        message: "The AI service rejected the API key — check ANTHROPIC_API_KEY on the server.",
        label: "auth",
      };
    }
    if (status === 403) {
      return {
        status: 503,
        message: "The AI account doesn't have access to the model this feature uses.",
        label: "permission",
      };
    }
    if (status === 429) {
      return {
        status: 429,
        message: "The AI service is rate-limited right now. Wait a moment and try again.",
        label: "rate-limit",
      };
    }
    if (status === 529 || status >= 500) {
      return {
        status: 503,
        message: "The AI service is temporarily overloaded. Please try again in a moment.",
        label: "overloaded",
      };
    }
  }

  return {
    status: 502,
    message: "The AI request failed. Please try again.",
    label: "unknown",
  };
}

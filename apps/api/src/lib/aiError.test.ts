import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { classifyAiError } from "./aiError.js";

// Build a real SDK error with a given status + message, the way the SDK would.
function apiError(status: number, message: string) {
  const headers = new Headers();
  return new Anthropic.APIError(status, { type: "error", error: { message } }, message, headers);
}

describe("classifyAiError", () => {
  it("flags the missing-key case as 503 with a config message", () => {
    const info = classifyAiError(new Error("ANTHROPIC_API_KEY is not set"));
    expect(info.status).toBe(503);
    expect(info.label).toBe("missing-key");
  });

  it("detects insufficient credits (the real production failure) as 402", () => {
    const info = classifyAiError(
      apiError(400, "Your credit balance is too low to access the Anthropic API."),
    );
    expect(info.status).toBe(402);
    expect(info.label).toBe("insufficient-credits");
    expect(info.message).toMatch(/credits/i);
  });

  it("maps a 401 to an auth/config message", () => {
    expect(classifyAiError(apiError(401, "invalid x-api-key")).label).toBe("auth");
  });

  it("maps a 403 to a model-access message", () => {
    expect(classifyAiError(apiError(403, "forbidden")).label).toBe("permission");
  });

  it("maps a 429 to a rate-limit message with a 429 status", () => {
    const info = classifyAiError(apiError(429, "rate limit"));
    expect(info.status).toBe(429);
    expect(info.label).toBe("rate-limit");
  });

  it("treats 5xx / overloaded as transient (503)", () => {
    expect(classifyAiError(apiError(529, "overloaded")).label).toBe("overloaded");
    expect(classifyAiError(apiError(500, "server error")).label).toBe("overloaded");
  });

  it("falls back to a generic 502 for unknown errors", () => {
    const info = classifyAiError(new Error("something weird"));
    expect(info.status).toBe(502);
    expect(info.label).toBe("unknown");
  });
});

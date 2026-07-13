import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeRateLimit, rateLimit } from "./rateLimit.js";
import type { AuthedRequest } from "./auth.js";

// Mirrors the shape the middleware actually touches, without pulling in Express.
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then 429s", () => {
    const mw = rateLimit({ limit: 3, windowMs: 60_000, key: "test-a" });
    const req = { userId: "user-1" } as AuthedRequest;

    for (let i = 0; i < 3; i++) {
      const res = mockRes();
      const next = vi.fn();
      mw(req, res as never, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.statusCode).toBe(200);
    }

    const res = mockRes();
    const next = vi.fn();
    mw(req, res as never, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBeDefined();
  });

  it("tracks separate budgets per user", () => {
    const mw = rateLimit({ limit: 1, windowMs: 60_000, key: "test-b" });

    const res1 = mockRes();
    mw({ userId: "user-a" } as AuthedRequest, res1 as never, vi.fn());
    expect(res1.statusCode).toBe(200);

    // A different user must not be blocked by user-a's exhausted budget.
    const res2 = mockRes();
    const next2 = vi.fn();
    mw({ userId: "user-b" } as AuthedRequest, res2 as never, next2);
    expect(next2).toHaveBeenCalledOnce();
    expect(res2.statusCode).toBe(200);

    // user-a's second request in the same window is blocked.
    const res3 = mockRes();
    const next3 = vi.fn();
    mw({ userId: "user-a" } as AuthedRequest, res3 as never, next3);
    expect(next3).not.toHaveBeenCalled();
    expect(res3.statusCode).toBe(429);
  });

  it("resets the budget once the window elapses", () => {
    vi.useFakeTimers();
    const mw = rateLimit({ limit: 1, windowMs: 1000, key: "test-c" });
    const req = { userId: "user-1" } as AuthedRequest;

    const res1 = mockRes();
    mw(req, res1 as never, vi.fn());
    expect(res1.statusCode).toBe(200);

    const res2 = mockRes();
    const next2 = vi.fn();
    mw(req, res2 as never, next2);
    expect(next2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1001);

    const res3 = mockRes();
    const next3 = vi.fn();
    mw(req, res3 as never, next3);
    expect(next3).toHaveBeenCalledOnce();
    expect(res3.statusCode).toBe(200);

    vi.useRealTimers();
  });

  it("formats the retry message in a readable unit for day-scale windows", () => {
    const mw = rateLimit({
      limit: 1,
      windowMs: 24 * 60 * 60 * 1000,
      key: "test-d",
      message: "Daily limit hit.",
    });
    const req = { userId: "user-1" } as AuthedRequest;

    mw(req, mockRes() as never, vi.fn());

    const res = mockRes();
    mw(req, res as never, vi.fn());
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ error: expect.stringMatching(/^Daily limit hit\. Try again in about \d+h\.$/) });
    expect(res.headers["Retry-After"]).not.toMatch(/^-/);
  });
});

describe("consumeRateLimit", () => {
  it("lets a caller check a budget without blocking unrelated request logic", () => {
    const opts = { limit: 1, windowMs: 60_000, key: "test-inline" };

    const first = consumeRateLimit("user-1", opts);
    expect(first).toEqual({ limited: false });

    const second = consumeRateLimit("user-1", opts);
    expect(second.limited).toBe(true);
    if (second.limited) {
      expect(second.message).toContain("Try again in about");
    }

    // A different budget key for the same user is unaffected.
    const other = consumeRateLimit("user-1", { ...opts, key: "test-inline-2" });
    expect(other).toEqual({ limited: false });
  });
});

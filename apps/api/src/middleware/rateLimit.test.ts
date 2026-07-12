import { beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rateLimit.js";
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
});

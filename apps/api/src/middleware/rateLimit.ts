import type { NextFunction, Response } from "express";
import type { AuthedRequest } from "./auth.js";

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory sliding window. Fine for a single API instance; a multi-instance
// deployment would need a shared store (Redis) so the budget is enforced globally.
const buckets = new Map<string, Bucket>();

/** "82345s" is unreadable for day-scale windows — show the coarsest unit that fits. */
function friendlyDuration(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 90) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 90) return `${m}m`;
  const h = Math.ceil(m / 60);
  if (h < 36) return `${h}h`;
  return `${Math.ceil(h / 24)}d`;
}

export interface RateLimitOpts {
  limit: number;
  windowMs: number;
  key: string;
  message?: string;
}

export type ConsumeResult =
  | { limited: false }
  | { limited: true; message: string; retryAfterMs: number };

/**
 * Shared bucket-consume logic, usable either as Express middleware (below) or
 * inline inside a handler that wants to skip just one step (e.g. AI analysis)
 * without blocking the whole request. Both call sites for the same `key`
 * share one budget.
 */
export function consumeRateLimit(userId: string | undefined, opts: RateLimitOpts): ConsumeResult {
  const id = `${opts.key}:${userId}`;
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
    return { limited: false };
  }

  if (bucket.count >= opts.limit) {
    const remainingMs = bucket.resetAt - now;
    const base = opts.message ?? "You've hit the usage limit.";
    return {
      limited: true,
      retryAfterMs: remainingMs,
      message: `${base} Try again in about ${friendlyDuration(remainingMs)}.`,
    };
  }

  bucket.count += 1;
  return { limited: false };
}

/**
 * Per-user rate limit. Share one middleware instance across several routes to
 * give them a common budget (e.g. a single AI-spend cap per user).
 */
export function rateLimit(opts: RateLimitOpts) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const result = consumeRateLimit(req.userId, opts);
    if (result.limited) {
      res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      res.status(429).json({ error: result.message });
      return;
    }
    next();
  };
}

/**
 * Shared budget across all AI endpoints: caps a user's model spend per hour.
 * Photo analysis (the highest-frequency, highest-cost usage) has been removed
 * entirely, so this now only covers assessments, recommendations, and chat —
 * all text-only and comparatively rare.
 */
export const aiLimitOpts: RateLimitOpts = { limit: 40, windowMs: 60 * 60 * 1000, key: "ai" };
export const aiRateLimit = rateLimit(aiLimitOpts);

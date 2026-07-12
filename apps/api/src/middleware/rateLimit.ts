import type { NextFunction, Response } from "express";
import type { AuthedRequest } from "./auth.js";

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory sliding window. Fine for a single API instance; a multi-instance
// deployment would need a shared store (Redis) so the budget is enforced globally.
const buckets = new Map<string, Bucket>();

/**
 * Per-user rate limit. Share one middleware instance across several routes to
 * give them a common budget (e.g. a single AI-spend cap per user).
 */
export function rateLimit(opts: { limit: number; windowMs: number; key: string }) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const id = `${opts.key}:${req.userId}`;
    const now = Date.now();
    const bucket = buckets.get(id);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
      next();
      return;
    }

    if (bucket.count >= opts.limit) {
      const retryS = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryS));
      res
        .status(429)
        .json({ error: `You've hit the usage limit. Try again in about ${retryS}s.` });
      return;
    }

    bucket.count += 1;
    next();
  };
}

/** Shared budget across all AI endpoints: caps a user's model spend per hour. */
export const aiRateLimit = rateLimit({ limit: 40, windowMs: 60 * 60 * 1000, key: "ai" });

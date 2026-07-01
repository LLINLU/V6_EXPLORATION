import type { Request, Response, NextFunction } from "express";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;

// In-memory sliding window: userId → sorted array of request timestamps
const requestLog = new Map<string, number[]>();

export function rateLimitByUser(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = res.locals.userId as string;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (requestLog.get(userId) ?? []).filter(
    (t) => t > windowStart,
  );

  if (timestamps.length >= MAX_REQUESTS) {
    // oldest timestamp tells us when the window clears
    const retryAfterMs = timestamps[0] - windowStart;
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    res.status(429).json({
      error: `Too many requests — max ${MAX_REQUESTS} report generations per 10 minutes.`,
      retry_after_seconds: retryAfterSec,
    });
    return;
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);
  next();
}

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Caveat: this state lives in the serverless function's process memory, so
 * it is per-instance, not global — on Vercel with multiple concurrent
 * instances a client could get more than `max` requests by hitting
 * different instances. That's an acceptable tradeoff for a low-traffic
 * waitlist form; swap for a shared store (e.g. Upstash Redis) if abuse
 * ever becomes a real problem.
 */

const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

function rateLimit(key, { windowMs = WINDOW_MS, max = MAX_REQUESTS } = {}) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (bucket.count >= max) {
    return { success: false };
  }

  bucket.count += 1;
  return { success: true };
}

module.exports = { rateLimit };

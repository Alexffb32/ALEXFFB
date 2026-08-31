/**
 * Minimal in-memory sliding-window rate limiter for API routes.
 *
 * Caveat: this state lives in the serverless function's process memory, so it
 * is per-instance, not global — on Vercel/Netlify with multiple concurrent
 * instances or regions, a client could get more than `max` requests by
 * hitting different instances. That's an acceptable tradeoff for a low-traffic
 * waitlist form; if abuse becomes a real problem, swap this for a shared store
 * (e.g. Upstash Redis / @upstash/ratelimit) without changing the call site.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

// Periodically drop expired buckets so this map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, WINDOW_MS).unref?.();

export function rateLimit(
  key: string,
  { windowMs = WINDOW_MS, max = MAX_REQUESTS } = {},
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: max - 1, resetAt };
  }

  if (bucket.count >= max) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Server-side rate limiter for API routes.
 *
 * Uses a simple in-memory sliding window. For multi-instance deployments,
 * replace with Redis or Firestore-based counters.
 *
 * Usage in route handler:
 *   const rl = rateLimiter({ windowMs: 60_000, max: 10 });
 *   export async function POST(req: Request) {
 *     const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *     if (!rl.check(ip)) return new Response("Too many requests", { status: 429 });
 *     ...
 *   }
 */

interface Entry {
  timestamps: number[];
}

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

export function rateLimiter({ windowMs, max }: RateLimiterOptions) {
  const store = new Map<string, Entry>();

  function prune(key: string, now: number) {
    const entry = store.get(key);
    if (!entry) return;
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }

  return {
    check(key: string): boolean {
      const now = Date.now();
      prune(key, now);

      const entry = store.get(key);
      if (!entry) {
        store.set(key, { timestamps: [now] });
        return true;
      }
      if (entry.timestamps.length >= max) return false;
      entry.timestamps.push(now);
      return true;
    },

    /** Periodic cleanup — call from a setInterval if desired. */
    cleanup() {
      const now = Date.now();
      for (const key of store.keys()) {
        prune(key, now);
      }
    },
  };
}

/**
 * Pre-configured limiter for the session endpoint.
 * 10 requests per minute per IP.
 */
export const sessionRateLimiter = rateLimiter({ windowMs: 60_000, max: 10 });

/**
 * In-process sliding-window rate limiter for the /api/upload endpoint.
 *
 * Design rationale
 * ────────────────
 * This app runs as a single long-lived Node.js process on Hostinger (see
 * server.js). In-memory state is therefore consistent across all requests,
 * making a local LRU store the correct and simplest choice — no Redis, no
 * external service, no cold-start overhead.
 *
 * The LRU map is capped at MAX_ENTRIES so a flood of unique IPs can never
 * exhaust heap memory.
 */

/** How many uploads a single identity is allowed within WINDOW_MS */
const MAX_REQUESTS = 10;

/** Sliding-window duration in milliseconds (10 minutes) */
const WINDOW_MS = 10 * 60 * 1000;

/** Maximum number of distinct identities tracked before the oldest are evicted */
const MAX_ENTRIES = 5_000;

/** Each entry records the timestamps of recent requests within the window */
type Entry = { timestamps: number[] };

/** LRU Map: insertion-ordered, oldest key deleted when the cap is reached */
const store = new Map<string, Entry>();

/** Evict the oldest key to keep store size bounded */
function evictOldest(): void {
  const firstKey = store.keys().next().value;
  if (firstKey !== undefined) store.delete(firstKey);
}

/**
 * Check whether `identity` has exceeded the rate limit.
 *
 * @param identity - A stable per-requester key (userId or sanitised IP).
 * @returns `{ allowed: boolean; remaining: number; resetInMs: number }`
 */
export function checkRateLimit(identity: string): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();

  // Fetch or create the entry, then move it to "most recently used"
  let entry = store.get(identity);
  if (entry) {
    // Re-insert to refresh LRU position
    store.delete(identity);
  } else {
    entry = { timestamps: [] };
    if (store.size >= MAX_ENTRIES) evictOldest();
  }

  // Prune timestamps that have fallen outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  const count = entry.timestamps.length;
  const allowed = count < MAX_REQUESTS;

  if (allowed) {
    entry.timestamps.push(now);
  }

  // Re-insert (either updated or unchanged) — always at the "newest" position
  store.set(identity, entry);

  const oldest = entry.timestamps[0] ?? now;
  const resetInMs = Math.max(0, WINDOW_MS - (now - oldest));

  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS - entry.timestamps.length),
    resetInMs,
  };
}

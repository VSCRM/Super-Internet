/**
 * Generates unique, safe-integer ids (no fractional part).
 *
 * The previous approach (`Date.now() + Math.random()`) produced a
 * floating-point id with an unbounded number of decimal digits. Floating
 * point values round-trip correctly through `JSON.stringify`/`Number()` in
 * practice, but serializing such an id into other contexts (cookies, URL
 * query params, HTML attributes) invites subtle precision/formatting bugs
 * for no benefit. A monotonically-increasing counter folded into the
 * millisecond timestamp gives a value that is still time-ordered and unique
 * within a session, but is always a clean integer comfortably inside
 * `Number.MAX_SAFE_INTEGER`.
 */
let counter = 0;

export function createSafeId(): number {
	counter = (counter + 1) % 1000;
	return Date.now() * 1000 + counter;
}

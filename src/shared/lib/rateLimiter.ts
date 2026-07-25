/**
 * Generic attempt-counting lockout, keyed by an arbitrary string (email,
 * recovery-flow id, etc). Single responsibility: decide whether a given key
 * is currently locked out, and track failures towards that lockout.
 *
 * Important caveat: this state lives in memory in the browser tab, so it is
 * trivially reset by a page reload or bypassed by switching devices/IPs. It
 * is a UX-level speed bump for the Mock persistence layer only - it is NOT
 * a substitute for real, server-side rate limiting (per-IP and per-account)
 * that a production backend must enforce independently.
 */
export class RateLimiter {
	private readonly attempts = new Map<
		string,
		{ count: number; lockedUntil: number }
	>();
	private readonly maxAttempts: number;
	private readonly lockoutMs: number;

	public constructor(maxAttempts: number, lockoutMs: number) {
		this.maxAttempts = maxAttempts;
		this.lockoutMs = lockoutMs;
	}

	public isLocked(key: string): boolean {
		const entry = this.attempts.get(key);
		return entry !== undefined && entry.lockedUntil > Date.now();
	}

	public remainingLockoutSeconds(key: string): number {
		const entry = this.attempts.get(key);
		if (!entry) return 0;
		return Math.max(0, Math.ceil((entry.lockedUntil - Date.now()) / 1000));
	}

	public registerFailure(key: string): void {
		const entry = this.attempts.get(key) ?? { count: 0, lockedUntil: 0 };
		entry.count += 1;

		if (entry.count >= this.maxAttempts) {
			entry.lockedUntil = Date.now() + this.lockoutMs;
			entry.count = 0;
		}

		this.attempts.set(key, entry);
	}

	public reset(key: string): void {
		this.attempts.delete(key);
	}
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimiter } from "../../shared/lib/rateLimiter";

describe("RateLimiter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("is not locked before the failure threshold is reached", () => {
		const limiter = new RateLimiter(3, 60_000);
		limiter.registerFailure("user@test.com");
		limiter.registerFailure("user@test.com");
		expect(limiter.isLocked("user@test.com")).toBe(false);
	});

	it("locks the key once the failure threshold is reached", () => {
		const limiter = new RateLimiter(3, 60_000);
		limiter.registerFailure("user@test.com");
		limiter.registerFailure("user@test.com");
		limiter.registerFailure("user@test.com");
		expect(limiter.isLocked("user@test.com")).toBe(true);
	});

	it("does not affect unrelated keys", () => {
		const limiter = new RateLimiter(1, 60_000);
		limiter.registerFailure("attacker@test.com");
		expect(limiter.isLocked("victim@test.com")).toBe(false);
	});

	it("unlocks automatically once the lockout window passes", () => {
		const limiter = new RateLimiter(1, 60_000);
		limiter.registerFailure("user@test.com");
		expect(limiter.isLocked("user@test.com")).toBe(true);

		vi.advanceTimersByTime(60_001);
		expect(limiter.isLocked("user@test.com")).toBe(false);
	});

	it("reset() clears both the failure count and any active lockout", () => {
		const limiter = new RateLimiter(1, 60_000);
		limiter.registerFailure("user@test.com");
		expect(limiter.isLocked("user@test.com")).toBe(true);

		limiter.reset("user@test.com");
		expect(limiter.isLocked("user@test.com")).toBe(false);
	});

	it("reports a positive remaining lockout duration while locked", () => {
		const limiter = new RateLimiter(1, 30_000);
		limiter.registerFailure("user@test.com");
		expect(limiter.remainingLockoutSeconds("user@test.com")).toBeGreaterThan(0);
		expect(
			limiter.remainingLockoutSeconds("user@test.com")
		).toBeLessThanOrEqual(30);
	});

	it("reports zero remaining lockout duration for a key that was never locked", () => {
		const limiter = new RateLimiter(3, 60_000);
		expect(limiter.remainingLockoutSeconds("never-failed@test.com")).toBe(0);
	});
});

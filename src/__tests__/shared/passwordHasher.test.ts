import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../shared/lib/passwordHasher";

describe("passwordHasher", () => {
	it("never stores the plaintext password in the resulting hash", async () => {
		const { hash, salt } = await hashPassword("MySecret1");
		expect(hash).not.toContain("MySecret1");
		expect(salt).not.toContain("MySecret1");
	});

	it("produces a different hash for the same password on each call (random salt)", async () => {
		const first = await hashPassword("MySecret1");
		const second = await hashPassword("MySecret1");
		expect(first.hash).not.toBe(second.hash);
		expect(first.salt).not.toBe(second.salt);
	});

	it("verifies correctly against the matching password", async () => {
		const { hash, salt } = await hashPassword("MySecret1");
		expect(await verifyPassword("MySecret1", hash, salt)).toBe(true);
	});

	it("rejects an incorrect password", async () => {
		const { hash, salt } = await hashPassword("MySecret1");
		expect(await verifyPassword("WrongPassword1", hash, salt)).toBe(false);
	});
});

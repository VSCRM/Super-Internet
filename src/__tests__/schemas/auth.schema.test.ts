import { describe, expect, it } from "vitest";
import {
	PASSWORD_REQUIREMENTS,
	isPasswordValid,
	loginSchema,
	registerSchema,
} from "../../shared/schemas/auth.schema";

describe("PASSWORD_REQUIREMENTS / isPasswordValid", () => {
	it("flags each unmet requirement independently", () => {
		const results = PASSWORD_REQUIREMENTS.map((requirement) =>
			requirement.test("abc")
		);
		expect(results).toEqual([false, false, false]);
	});

	it("considers a password valid only once every requirement passes", () => {
		expect(isPasswordValid("abc")).toBe(false);
		expect(isPasswordValid("abcdef")).toBe(false); // length ok, missing digit + uppercase
		expect(isPasswordValid("abcdef1")).toBe(false); // length + digit ok, missing uppercase
		expect(isPasswordValid("Abcdef1")).toBe(true); // all three satisfied
	});
});

describe("loginSchema", () => {
	it("accepts any syntactically valid email, including non-whitelisted domains", () => {
		const result = loginSchema.safeParse({
			email: "admin@super.net",
			password: "admin123",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an empty password", () => {
		const result = loginSchema.safeParse({
			email: "admin@super.net",
			password: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a malformed email", () => {
		const result = loginSchema.safeParse({
			email: "not-an-email",
			password: "admin123",
		});
		expect(result.success).toBe(false);
	});
});

describe("registerSchema", () => {
	const validPayload = {
		email: "user@gmail.com",
		phone: "+380501234567",
		fio: "Іванов Іван Іванович",
		password: "Pass123",
		passwordConfirm: "Pass123",
	};

	it("accepts a fully valid registration payload", () => {
		expect(registerSchema.safeParse(validPayload).success).toBe(true);
	});

	it("rejects an email outside the registration whitelist", () => {
		const result = registerSchema.safeParse({
			...validPayload,
			email: "user@super.net",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a phone number not matching +380XXXXXXXXX", () => {
		const result = registerSchema.safeParse({
			...validPayload,
			phone: "0501234567",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a FIO that is not exactly three capitalized Ukrainian words", () => {
		const result = registerSchema.safeParse({
			...validPayload,
			fio: "Іван Іванов",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a password without a digit", () => {
		const result = registerSchema.safeParse({
			...validPayload,
			password: "Abcdef",
			passwordConfirm: "Abcdef",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a password without an uppercase letter", () => {
		const result = registerSchema.safeParse({
			...validPayload,
			password: "pass123",
			passwordConfirm: "pass123",
		});
		expect(result.success).toBe(false);
	});

	it("rejects mismatched password confirmation", () => {
		const result = registerSchema.safeParse({
			...validPayload,
			passwordConfirm: "different1",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.path).toContain("passwordConfirm");
		}
	});
});

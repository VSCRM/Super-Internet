import { describe, expect, it } from "vitest";
import {
	sanitizeEmail,
	sanitizeObject,
	sanitizePhone,
	sanitizeText,
} from "../../shared/lib/sanitize";

describe("sanitizeText", () => {
	it("strips HTML tags", () => {
		expect(sanitizeText("<script>alert(1)</script>hello")).toBe(
			"alert(1)hello"
		);
	});

	it("trims surrounding whitespace", () => {
		expect(sanitizeText("  hello  ")).toBe("hello");
	});
});

describe("sanitizeEmail", () => {
	it("lowercases and trims", () => {
		expect(sanitizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
	});
});

describe("sanitizePhone", () => {
	it("keeps a leading plus and digits only", () => {
		expect(sanitizePhone("+380 (50) 123-45-67")).toBe("+380501234567");
	});

	it("strips a leading plus if not present in source", () => {
		expect(sanitizePhone("050 123 45 67")).toBe("0501234567");
	});
});

describe("sanitizeObject", () => {
	it("sanitizes only string fields, leaving other types untouched", () => {
		const result = sanitizeObject({
			name: "<b>Bob</b>",
			age: 30,
			active: true,
		});
		expect(result).toEqual({ name: "Bob", age: 30, active: true });
	});
});

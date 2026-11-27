import { describe, expect, it } from "vitest";
import { readCardList, readPaymentMode } from "../../shared/config/env";

describe("readPaymentMode", () => {
	it("is real only when explicitly set to real", () => {
		expect(readPaymentMode("real")).toBe("real");
		expect(readPaymentMode(" REAL ")).toBe("real");
	});

	it("falls back to mock for anything else", () => {
		expect(readPaymentMode("mock")).toBe("mock");
		expect(readPaymentMode(undefined)).toBe("mock");
		expect(readPaymentMode("")).toBe("mock");
		expect(readPaymentMode("production")).toBe("mock");
	});
});

describe("readCardList", () => {
	it("parses a comma-separated list into digit-only numbers", () => {
		expect(readCardList("4111111111111111, 5555-5555-5555-4444 ,")).toEqual([
			"4111111111111111",
			"5555555555554444",
		]);
	});

	it("returns an empty list for missing or empty values", () => {
		expect(readCardList(undefined)).toEqual([]);
		expect(readCardList("")).toEqual([]);
	});
});

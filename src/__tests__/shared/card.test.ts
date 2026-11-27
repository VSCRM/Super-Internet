import { describe, expect, it } from "vitest";
import {
	detectCardBrand,
	formatCardNumber,
	formatExpiry,
	isExpiryValid,
	isLuhnValid,
} from "../../shared/lib/card";

describe("detectCardBrand", () => {
	it("recognises Visa and Mastercard by prefix", () => {
		expect(detectCardBrand("4111 1111")).toBe("visa");
		expect(detectCardBrand("5555")).toBe("mastercard");
		expect(detectCardBrand("51")).toBe("mastercard");
		expect(detectCardBrand("2221")).toBe("mastercard");
		expect(detectCardBrand("2720")).toBe("mastercard");
	});

	it("returns null for unknown or empty input", () => {
		expect(detectCardBrand("")).toBeNull();
		expect(detectCardBrand("3")).toBeNull();
		expect(detectCardBrand("2721")).toBeNull();
		expect(detectCardBrand("6011")).toBeNull();
	});
});

describe("input masks", () => {
	it("groups the card number by four and caps it at 16 digits", () => {
		expect(formatCardNumber("41111111")).toBe("4111 1111");
		expect(formatCardNumber("4111-1111-1111-1111-99")).toBe(
			"4111 1111 1111 1111"
		);
	});

	it("inserts the slash in the expiry and pads a leading 2-9", () => {
		expect(formatExpiry("1")).toBe("1");
		expect(formatExpiry("1228")).toBe("12/28");
		expect(formatExpiry("5")).toBe("05");
		expect(formatExpiry("12/2")).toBe("12/2");
	});
});

describe("validation helpers", () => {
	it("checks the Luhn checksum", () => {
		expect(isLuhnValid("4111 1111 1111 1111")).toBe(true);
		expect(isLuhnValid("5555 5555 5555 4444")).toBe(true);
		expect(isLuhnValid("4111 1111 1111 1112")).toBe(false);
	});

	it("accepts the current month and later, rejects past and malformed dates", () => {
		const now = new Date(2026, 10, 15); // November 2026
		expect(isExpiryValid("11/26", now)).toBe(true);
		expect(isExpiryValid("12/26", now)).toBe(true);
		expect(isExpiryValid("10/26", now)).toBe(false);
		expect(isExpiryValid("13/30", now)).toBe(false);
		expect(isExpiryValid("1/30", now)).toBe(false);
	});
});

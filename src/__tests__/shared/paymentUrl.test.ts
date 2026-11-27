import { describe, expect, it } from "vitest";
import { isSafePaymentUrl } from "../../shared/lib/paymentUrl";

describe("isSafePaymentUrl", () => {
	it("accepts https links", () => {
		expect(isSafePaymentUrl("https://www.privat24.ua/pay/abc")).toBe(true);
	});

	it("accepts http only for localhost", () => {
		expect(isSafePaymentUrl("http://localhost:8080/pay/1")).toBe(true);
		expect(isSafePaymentUrl("http://127.0.0.1/pay/1")).toBe(true);
		expect(isSafePaymentUrl("http://evil.example/pay/1")).toBe(false);
	});

	it("rejects dangerous schemes, junk and non-strings", () => {
		expect(isSafePaymentUrl("javascript:alert(1)")).toBe(false);
		expect(isSafePaymentUrl("data:text/html,hi")).toBe(false);
		expect(isSafePaymentUrl("not a url")).toBe(false);
		expect(isSafePaymentUrl("")).toBe(false);
		expect(isSafePaymentUrl(undefined)).toBe(false);
		expect(isSafePaymentUrl(42)).toBe(false);
	});
});

import { describe, expect, it } from "vitest";
import { MockPaymentGateway } from "../../services/payments/MockPaymentGateway";

describe("MockPaymentGateway", () => {
	it("charges a positive amount successfully", async () => {
		const gateway = new MockPaymentGateway();
		const result = await gateway.charge({
			amount: 300,
			currency: "UAH",
			description: "Test charge",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.amount).toBe(300);
			expect(result.value.gateway).toBe("mock");
		}
	});

	it("rejects a non-positive amount", async () => {
		const gateway = new MockPaymentGateway();
		const result = await gateway.charge({
			amount: 0,
			currency: "UAH",
			description: "Invalid",
		});

		expect(result.ok).toBe(false);
	});

	it("tokenizes a card and masks the PAN, never exposing it in full", async () => {
		const gateway = new MockPaymentGateway();
		const result = await gateway.tokenizeCard({
			cardNumber: "4111111111111111",
			expiryMonth: "12",
			expiryYear: "29",
			cvv: "123",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.maskedNumber).toBe("**** **** **** 1111");
			expect(result.value.maskedNumber).not.toContain("4111111111111111");
		}
	});
});

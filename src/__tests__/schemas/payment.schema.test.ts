import { describe, expect, it } from "vitest";
import {
	checkoutAmountSchema,
	checkoutSchema,
	createCheckoutSchema,
	parseAmount,
} from "../../shared/schemas/payment.schema";

const valid = {
	amount: "250",
	cardNumber: "4111 1111 1111 1111",
	expiry: "12/99",
	cvv: "123",
};

function firstMessage(input: Record<string, string>, field: string) {
	const result = checkoutSchema.safeParse(input);
	if (result.success) return undefined;
	return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("parseAmount", () => {
	it("accepts dot and comma decimals, rejects junk", () => {
		expect(parseAmount("250")).toBe(250);
		expect(parseAmount("250,5")).toBe(250.5);
		expect(parseAmount("12.34")).toBe(12.34);
		expect(Number.isNaN(parseAmount("abc"))).toBe(true);
		expect(Number.isNaN(parseAmount("1.234"))).toBe(true);
	});
});

describe("checkoutSchema", () => {
	it("accepts a valid form", () => {
		expect(checkoutSchema.safeParse(valid).success).toBe(true);
	});

	it("rejects a bad amount", () => {
		expect(firstMessage({ ...valid, amount: "0" }, "amount")).toBe(
			"validation.amount.positive"
		);
		expect(firstMessage({ ...valid, amount: "2000000" }, "amount")).toBe(
			"validation.amount.maxExceeded"
		);
	});

	it("rejects a short or Luhn-invalid card number", () => {
		expect(
			firstMessage({ ...valid, cardNumber: "4111 1111" }, "cardNumber")
		).toBe("validation.card.numberLength");
		expect(
			firstMessage(
				{ ...valid, cardNumber: "4111 1111 1111 1112" },
				"cardNumber"
			)
		).toBe("validation.card.numberInvalid");
	});

	it("rejects an expired date and a bad CVV", () => {
		expect(firstMessage({ ...valid, expiry: "01/20" }, "expiry")).toBe(
			"validation.card.expiryInvalid"
		);
		expect(firstMessage({ ...valid, cvv: "12" }, "cvv")).toBe(
			"validation.card.cvvInvalid"
		);
	});
});

describe("test cards restriction", () => {
	const schema = createCheckoutSchema(["4111111111111111"]);

	it("accepts a listed test card", () => {
		expect(schema.safeParse(valid).success).toBe(true);
	});

	it("rejects another valid card with a dedicated message", () => {
		const result = schema.safeParse({
			...valid,
			cardNumber: "5555 5555 5555 4444",
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.error.issues[0]?.message).toBe("validation.card.notTestCard");
	});

	it("accepts any valid card when the list is empty", () => {
		expect(
			createCheckoutSchema([]).safeParse({
				...valid,
				cardNumber: "5555 5555 5555 4444",
			}).success
		).toBe(true);
	});

	it("checkoutAmountSchema validates the amount alone", () => {
		expect(checkoutAmountSchema.safeParse("100").success).toBe(true);
		expect(checkoutAmountSchema.safeParse("0").success).toBe(false);
	});
});

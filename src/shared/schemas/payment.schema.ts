import { z } from "zod";
import {
	CARD_NUMBER_LENGTH,
	digitsOnly,
	isExpiryValid,
	isLuhnValid,
} from "../lib/card";

export const paymentRequestSchema = z.object({
	amount: z
		.number()
		.positive("validation.amount.positive")
		.max(1_000_000, "validation.amount.maxExceeded"),
	isRecurring: z.boolean(),
	cardId: z.string().optional(),
});

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;

/**
 * Tokenization request for saving a card. The PAN/CVV never reach application
 * state or any repository in plaintext — `PaymentGateway.tokenizeCard`
 * forwards them directly to the gateway and only the returned token/mask is
 * persisted. See services/payments/PaymentGateway.ts for the contract.
 */
export const cardTokenizationSchema = z.object({
	cardNumber: z
		.string()
		.regex(/^\d{16}$/, "Номер картки має складатись з 16 цифр"),
	expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Невірний місяць"),
	expiryYear: z.string().regex(/^\d{2}$/, "Невірний рік"),
	cvv: z.string().regex(/^\d{3,4}$/, "Невірний CVV"),
});

export type CardTokenizationInput = z.infer<typeof cardTokenizationSchema>;

/** Parses a typed amount ("250", "250,50") to a number; NaN when it is not one. */
export function parseAmount(value: string): number {
	const normalized = value.trim().replace(",", ".");
	return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN;
}

/**
 * The checkout form. Card fields are only checked here, in the form's own
 * state; the submit result carries just `amount` and `recurring`.
 */
const amountFieldSchema = z.string().superRefine((value, ctx) => {
	const amount = parseAmount(value);
	if (!(amount > 0)) {
		ctx.addIssue({ code: "custom", message: "validation.amount.positive" });
	} else if (amount > 1_000_000) {
		ctx.addIssue({ code: "custom", message: "validation.amount.maxExceeded" });
	}
});

/** Validates only the amount (the pay-in-the-app flow has no card fields). */
export const checkoutAmountSchema = amountFieldSchema;

export function createCheckoutSchema(allowedCards: readonly string[] = []) {
	return z.object({
		amount: amountFieldSchema,
		cardNumber: z.string().superRefine((value, ctx) => {
			const digits = digitsOnly(value);
			if (digits.length !== CARD_NUMBER_LENGTH) {
				ctx.addIssue({
					code: "custom",
					message: "validation.card.numberLength",
				});
			} else if (!isLuhnValid(digits)) {
				ctx.addIssue({
					code: "custom",
					message: "validation.card.numberInvalid",
				});
			} else if (allowedCards.length > 0 && !allowedCards.includes(digits)) {
				ctx.addIssue({
					code: "custom",
					message: "validation.card.notTestCard",
				});
			}
		}),
		expiry: z.string().refine((value) => isExpiryValid(value), {
			message: "validation.card.expiryInvalid",
		}),
		cvv: z.string().regex(/^\d{3}$/, "validation.card.cvvInvalid"),
	});
}

/** Accepts any card that passes the format and Luhn checks. */
export const checkoutSchema = createCheckoutSchema();

export type CheckoutInput = z.infer<typeof checkoutSchema>;

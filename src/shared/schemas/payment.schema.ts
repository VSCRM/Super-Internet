import { z } from "zod";

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

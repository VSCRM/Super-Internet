import type { AppError, Result } from "../../shared/lib/result";

export interface PaymentChargeRequest {
	readonly amount: number;
	readonly currency: "UAH";
	readonly cardId?: string;
	readonly description: string;
}

export interface PaymentChargeReceipt {
	readonly transactionId: string;
	readonly amount: number;
	readonly currency: "UAH";
	readonly processedAt: string;
	readonly gateway: "mock" | "privatbank";
}

export interface CardTokenizationRequest {
	readonly cardNumber: string;
	readonly expiryMonth: string;
	readonly expiryYear: string;
	readonly cvv: string;
}

/**
 * A tokenized card never carries the PAN/CVV - only a gateway-issued token
 * and a display mask. Encryption and storage of the real card data happen
 * exclusively on the payment gateway's (or backend's) side, never in this
 * application's state or repositories.
 */
export interface TokenizedCard {
	readonly token: string;
	readonly maskedNumber: string;
	readonly expiryMonth: string;
	readonly expiryYear: string;
}

/**
 * Strategy/Factory-friendly polymorphic interface for payment processing.
 * `MockPaymentGateway` fulfils it for local development; `PrivatBankPaymentGateway`
 * is the seam for the real PrivatBank Acquiring API.
 */
export interface PaymentGateway {
	readonly name: "mock" | "privatbank";
	charge(
		request: PaymentChargeRequest
	): Promise<Result<PaymentChargeReceipt, AppError>>;
	tokenizeCard(
		request: CardTokenizationRequest
	): Promise<Result<TokenizedCard, AppError>>;
}

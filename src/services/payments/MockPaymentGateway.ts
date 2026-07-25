import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import type {
	CardTokenizationRequest,
	PaymentChargeReceipt,
	PaymentChargeRequest,
	PaymentGateway,
	TokenizedCard,
} from "./PaymentGateway";
import i18n from "../../i18n";

function maskCardNumber(cardNumber: string): string {
	return `**** **** **** ${cardNumber.slice(-4)}`;
}

/** Simulates network latency so loading states are exercised during development. */
function simulateLatency(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 400));
}

export class MockPaymentGateway implements PaymentGateway {
	public readonly name = "mock";

	public async charge(
		request: PaymentChargeRequest
	): Promise<Result<PaymentChargeReceipt, AppError>> {
		await simulateLatency();

		if (request.amount <= 0) {
			return failure(
				appError("INVALID_AMOUNT", i18n.t("errors.invalidPaymentAmount"))
			);
		}

		return success({
			transactionId: `MOCK-${Date.now()}`,
			amount: request.amount,
			currency: request.currency,
			processedAt: new Date().toISOString(),
			gateway: "mock",
		});
	}

	public async tokenizeCard(
		request: CardTokenizationRequest
	): Promise<Result<TokenizedCard, AppError>> {
		await simulateLatency();

		return success({
			token: `mock-token-${Date.now()}`,
			maskedNumber: maskCardNumber(request.cardNumber),
			expiryMonth: request.expiryMonth,
			expiryYear: request.expiryYear,
		});
	}
}

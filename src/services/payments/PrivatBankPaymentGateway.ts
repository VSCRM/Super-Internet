import axios from "axios";
import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import { env, isPrivatBankConfigured } from "../../shared/config/env";
import type {
	PaymentChargeReceipt,
	PaymentChargeRequest,
	PaymentGateway,
	TokenizedCard,
} from "./PaymentGateway";
import i18n from "../../i18n";

/**
 * Real PrivatBank Acquiring integration seam.
 *
 * Security note: card PAN/CVV must never be sent from the browser directly
 * to our own backend or stored in our database. The compliant flow is:
 *   1. This client posts the raw card data directly to PrivatBank's hosted
 *      tokenization endpoint (PCI DSS scope stays with PrivatBank).
 *   2. PrivatBank returns a token; only that token + masked PAN are sent to
 *      our backend, which encrypts the token at rest (e.g. AES-256-GCM with
 *      a key held in a KMS/HSM, never in source control) before persisting it.
 *   3. Subsequent charges reference the stored token, never the PAN.
 *
 * This class is a structural placeholder: the merchant credentials and exact
 * endpoint contracts depend on the signed PrivatBank Acquiring agreement and
 * must be filled in by backend engineering before enabling this gateway.
 */
export class PrivatBankPaymentGateway implements PaymentGateway {
	public readonly name = "privatbank";

	private readonly client = axios.create({
		baseURL: env.privatBankApiBaseUrl ?? undefined,
	});

	public async charge(
		request: PaymentChargeRequest
	): Promise<Result<PaymentChargeReceipt, AppError>> {
		if (!isPrivatBankConfigured()) {
			return failure(
				appError(
					"PRIVATBANK_NOT_CONFIGURED",
					"PrivatBank gateway requires VITE_PRIVATBANK_API_BASE_URL and VITE_PRIVATBANK_MERCHANT_ID"
				)
			);
		}

		try {
			const response = await this.client.post<PaymentChargeReceipt>(
				"/payments/charge",
				{
					merchantId: env.privatBankMerchantId,
					amount: request.amount,
					currency: request.currency,
					cardId: request.cardId,
					description: request.description,
				}
			);
			return success({ ...response.data, gateway: "privatbank" });
		} catch {
			return failure(
				appError(
					"PRIVATBANK_CHARGE_FAILED",
					i18n.t("errors.privatBankChargeFailed")
				)
			);
		}
	}

	public async tokenizeCard(): Promise<Result<TokenizedCard, AppError>> {
		return failure(
			appError(
				"NOT_IMPLEMENTED",
				"Card tokenization must go through PrivatBank's hosted PCI-compliant form, not this SDK method."
			)
		);
	}
}

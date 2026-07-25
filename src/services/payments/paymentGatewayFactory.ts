import { env, isPrivatBankConfigured } from "../../shared/config/env";
import { MockPaymentGateway } from "./MockPaymentGateway";
import type { PaymentGateway } from "./PaymentGateway";
import { PrivatBankPaymentGateway } from "./PrivatBankPaymentGateway";

let cachedGateway: PaymentGateway | null = null;

/**
 * Factory pattern: chooses PrivatBank only when both `VITE_BACKEND_MODE=true`
 * and PrivatBank credentials are configured; falls back to the mock gateway
 * otherwise so local development never depends on real banking credentials.
 */
export function getPaymentGateway(): PaymentGateway {
	if (!cachedGateway) {
		cachedGateway =
			env.backendMode && isPrivatBankConfigured()
				? new PrivatBankPaymentGateway()
				: new MockPaymentGateway();
	}
	return cachedGateway;
}

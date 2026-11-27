import { MockPaymentGateway } from "./MockPaymentGateway";
import type { PaymentGateway } from "./PaymentGateway";

let cachedGateway: PaymentGateway | null = null;

/**
 * Gateway for the local (no-backend) mode: always the mock one. Real payments
 * are made by the backend through LiqPay (`VITE_PAYMENT_MODE=real`), so the
 * frontend has no bank gateway of its own.
 */
export function getPaymentGateway(): PaymentGateway {
	cachedGateway ??= new MockPaymentGateway();
	return cachedGateway;
}

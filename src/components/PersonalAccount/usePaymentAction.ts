import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import type { ClientUser } from "../../types/models";
import { env } from "../../shared/config/env";
import { isFailure } from "../../shared/lib/result";
import { SERVICE_NAMES, SERVICE_PRICES } from "../../types/models";

export interface PaymentActions {
	readonly pay: () => Promise<void>;
	readonly toggleRecurring: () => Promise<void>;
}

/** Single responsibility: prompt for a payment amount, charge it, and toggle recurring billing. */
export function usePaymentAction(client: ClientUser): PaymentActions {
	const app = useApp();
	const modal = useModal();
	const { t } = useTranslation();

	const pay = async (): Promise<void> => {
		if (!client.connectionApproved) {
			await modal.show(
				t("payment.notApprovedTitle"),
				t("payment.notApprovedMessage"),
				"warning"
			);
			return;
		}

		const serviceType = client.contract?.serviceType ?? "internet";
		const checkout = await modal.checkout(
			t("payment.promptTitle"),
			SERVICE_PRICES[serviceType],
			t(SERVICE_NAMES[serviceType]),
			env.mockCards,
			env.paymentMode === "real"
		);
		if (checkout === null) return;
		const { amount, recurring: isRecurring, method } = checkout;

		if (env.paymentMode === "real") {
			// Real payment: never credit the balance from the frontend. The backend
			// starts the Privat24 payment and we send the user to its page; the
			// balance is credited by the backend once the bank confirms.
			const started = await app.startPrivat24Payment(amount, isRecurring);
			if (isFailure(started)) {
				await modal.show(t("modal.error"), started.error.message, "error");
				return;
			}
			window.location.assign(started.value);
			return;
		}

		if (method === "privat24-app") {
			// The real flow needs a payment link from the backend; here the user
			// confirms that the payment was approved in the Privat24 app.
			const confirmed = await modal.confirm(
				t("payment.appConfirmTitle"),
				t("payment.appConfirmMessage", { amount: amount.toFixed(2) })
			);
			if (!confirmed) return;
		}

		const result = await app.makePayment(client.id, amount, isRecurring);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		await modal.show(
			t("payment.successTitle"),
			t("payment.successMessage", { amount: amount.toFixed(2) }) +
				(isRecurring ? t("payment.recurringActivatedLine") : "") +
				t("payment.newBalance", { balance: result.value.toFixed(2) }),
			"success"
		);
	};

	const toggleRecurring = async (): Promise<void> => {
		const result = await app.toggleRecurringPayment(client.id);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}
		await modal.show(
			t("modal.success"),
			result.value
				? t("payment.recurringToggledOn")
				: t("payment.recurringToggledOff"),
			"success"
		);
	};

	return { pay, toggleRecurring };
}

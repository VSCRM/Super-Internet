import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import type { ClientUser } from "../../types/models";
import { isFailure } from "../../shared/lib/result";
import { paymentRequestSchema } from "../../shared/schemas/payment.schema";

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

		const amountStr = await modal.prompt(
			t("payment.promptTitle"),
			t("payment.promptMessage"),
			"300"
		);
		if (amountStr === null) return;

		const amountValidation = paymentRequestSchema.shape.amount.safeParse(
			parseFloat(amountStr)
		);
		if (!amountValidation.success) {
			const messageKey = amountValidation.error.issues[0]?.message;
			await modal.show(
				t("modal.error"),
				messageKey ? t(messageKey) : t("payment.invalidAmount"),
				"error"
			);
			return;
		}
		const amount = amountValidation.data;

		const isRecurring = await modal.confirm(
			t("payment.recurringPromptTitle"),
			t("payment.recurringPromptMessage")
		);

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
		const next = await app.toggleRecurringPayment(client.id);
		await modal.show(
			t("modal.success"),
			next ? t("payment.recurringToggledOn") : t("payment.recurringToggledOff"),
			"success"
		);
	};

	return { pay, toggleRecurring };
}

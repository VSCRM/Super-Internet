import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AppError, Result } from "../shared/lib/result";
import { appError, failure, isSuccess, success } from "../shared/lib/result";
import type { UserRepository } from "../services/repositories/UserRepository";
import type { PaymentGateway } from "../services/payments/PaymentGateway";
import type { UpdateClient } from "./useClientMutation";

export interface PaymentActions {
	makePayment: (
		clientId: number,
		amount: number,
		isRecurring: boolean
	) => Promise<Result<number, AppError>>;
	toggleRecurringPayment: (clientId: number) => Promise<boolean>;
}

export function usePaymentActions(
	repository: UserRepository,
	paymentGateway: PaymentGateway,
	updateClient: UpdateClient
): PaymentActions {
	const { t } = useTranslation();

	const makePayment = useCallback(
		async (
			clientId: number,
			amount: number,
			isRecurring: boolean
		): Promise<Result<number, AppError>> => {
			const lookup = await repository.findById(clientId);
			if (!lookup.ok) return failure(lookup.error);
			const clientBeforeCharge = lookup.value;
			if (!clientBeforeCharge || clientBeforeCharge.role !== "client") {
				return failure(appError("NOT_FOUND", t("errors.clientNotFound")));
			}

			const chargeResult = await paymentGateway.charge({
				amount,
				currency: "UAH",
				description: t("payment.chargeDescription", {
					contractId: clientBeforeCharge.contract?.id ?? "—",
				}),
			});
			if (!isSuccess(chargeResult)) return failure(chargeResult.error);

			let resultingBalance = 0;
			const result = await updateClient(clientId, (client) => {
				resultingBalance = client.balance + amount;
				const contract =
					client.contract && resultingBalance >= 0 && client.connectionApproved
						? { ...client.contract, status: "active" as const }
						: client.contract;

				return {
					...client,
					balance: resultingBalance,
					isRecurring: isRecurring || client.isRecurring,
					contract,
				};
			});
			if (!result.ok) return failure(result.error);
			return success(resultingBalance);
		},
		[paymentGateway, repository, updateClient, t]
	);

	const toggleRecurringPayment = useCallback(
		async (clientId: number): Promise<boolean> => {
			let nextValue = false;
			await updateClient(clientId, (client) => {
				nextValue = !client.isRecurring;
				return { ...client, isRecurring: nextValue };
			});
			return nextValue;
		},
		[updateClient]
	);

	return { makePayment, toggleRecurringPayment };
}

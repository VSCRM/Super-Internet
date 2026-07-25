import { useEffect } from "react";
import { isSuccess } from "../shared/lib/result";
import { SERVICE_PRICES } from "../types/models";
import type { UserRepository } from "../services/repositories/UserRepository";

const MONTH_MS = 1000 * 60 * 60 * 24 * 30;
const DAY_MS = 1000 * 60 * 60 * 24;

function isDueForBilling(lastPaymentDateIso: string): boolean {
	const daysSincePayment =
		(Date.now() - new Date(lastPaymentDateIso).getTime()) / DAY_MS;
	return daysSincePayment >= 30;
}

async function billOneMonthlyContract(
	repository: UserRepository,
	clientId: number
): Promise<void> {
	const lookup = await repository.findById(clientId);
	if (!isSuccess(lookup) || !lookup.value || lookup.value.role !== "client")
		return;

	const client = lookup.value;
	if (
		!client.contract ||
		!client.connectionApproved ||
		!isDueForBilling(client.lastPaymentDate)
	)
		return;

	const amount = SERVICE_PRICES[client.contract.serviceType];
	const balance = client.balance - amount;

	await repository.save({
		...client,
		balance,
		lastPaymentDate: new Date().toISOString(),
		contract: { ...client.contract, status: balance < 0 ? "debt" : "active" },
	});
}

async function runMonthlyBillingPass(
	repository: UserRepository
): Promise<void> {
	const result = await repository.findAll();
	if (!isSuccess(result)) return;

	const clientIds = result.value
		.filter((user) => user.role === "client")
		.map((user) => user.id);
	for (const clientId of clientIds) {
		await billOneMonthlyContract(repository, clientId);
	}
}

/**
 * Automatic monthly billing for active, approved contracts. Runs entirely
 * client-side in Mock mode as a stand-in for a real backend cron job.
 */
export function useMonthlyBilling(
	repository: UserRepository,
	onBillingApplied: () => void
): void {
	useEffect(() => {
		const intervalId = window.setInterval(() => {
			void runMonthlyBillingPass(repository).then(onBillingApplied);
		}, MONTH_MS);

		return () => window.clearInterval(intervalId);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- onBillingApplied is a stable setState wrapper from the caller
	}, [repository]);
}

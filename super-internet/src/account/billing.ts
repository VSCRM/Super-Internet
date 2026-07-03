import type {Client} from "./types";

export function applyPayment(
	client: Client,
	amount: number,
	isRecurring: boolean,
): Client {
	const next: Client = {
		...client,
		balance: client.balance + amount,
		isRecurring: isRecurring ? true : client.isRecurring,
	};

	if (next.balance >= 0 && next.contract && next.connectionApproved) {
		next.contract = {...next.contract, status: "active"};
	}

	return next;
}

export function toggleRecurring(client: Client): Client {
	return {...client, isRecurring: !client.isRecurring};
}

export function processMonthlyPayments(clients: Client[]): Client[] {
	const now = Date.now();

	return clients.map((client) => {
		if (!client.contract || !client.connectionApproved) return client;

		const lastPayment = new Date(client.lastPaymentDate).getTime();
		const daysSincePayment = (now - lastPayment) / (1000 * 60 * 60 * 24);

		if (daysSincePayment < 30) return client;

		const amount = client.contract.serviceType === "internet" ? 300 : 450;
		const balance = client.balance - amount;
		const status = balance < 0 ? "debt" : "active";

		return {
			...client,
			balance,
			lastPaymentDate: new Date(now).toISOString(),
			contract: {...client.contract, status},
		};
	});
}

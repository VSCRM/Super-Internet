import type {Client, Support, Admin, Contract, ServiceType} from "./types";

// (User constructor: this.id = Date.now() + Math.random()).
export function genId(): number {
	return Date.now() + Math.random();
}

export function createClient(
	email: string,
	password: string,
	phone: string,
	fio: string,
): Client {
	return {
		id: genId(),
		email,
		password,
		role: "client",
		phone,
		fio,
		contract: null,
		balance: 0,
		messages: [],
		lastPaymentDate: new Date().toISOString(),
		connectionApproved: false,
	};
}

export function createSupport(
	email: string,
	password: string,
	name: string,
): Support {
	return {
		id: genId(),
		email,
		password,
		role: "support",
		name,
	};
}

export function createAdmin(email: string, password: string): Admin {
	return {
		id: genId(),
		email,
		password,
		role: "admin",
	};
}

export function createContract(
	userId: number,
	fio: string,
	phone: string,
	email: string,
	serviceType: ServiceType,
	address: string,
): Contract {
	return {
		id: "CNT" + Date.now(),
		userId,
		fio,
		phone,
		email,
		address: address || "Не вказано",
		serviceType,
		equipmentId: "EQ" + Math.floor(Math.random() * 10000),
		status: "pending",
		createdAt: new Date().toISOString(),
	};
}

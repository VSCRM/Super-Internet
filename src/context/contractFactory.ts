import type { Contract, ServiceType } from "../types/models";
import i18n from "../i18n";

/** Single responsibility: build a brand-new contract for a client who just selected a service. */
export function createContract(
	userId: number,
	fio: string,
	phone: string,
	email: string,
	serviceType: ServiceType,
	address: string
): Contract {
	return {
		id: "CNT" + Date.now(),
		userId,
		fio,
		phone,
		email,
		address: address || i18n.t("contract.addressNotSpecified"),
		serviceType,
		equipmentId: "EQ" + Math.floor(Math.random() * 10000),
		status: "pending",
		createdAt: new Date().toISOString(),
	};
}

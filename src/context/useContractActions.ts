import { useCallback } from "react";
import type { AppError, Result } from "../shared/lib/result";
import type {
	ClientUser,
	Contract,
	EquipmentStatus,
	ServiceType,
} from "../types/models";
import { createContract } from "./contractFactory";
import type { UpdateClient } from "./useClientMutation";

export interface ContractActions {
	selectService: (
		clientId: number,
		serviceType: ServiceType,
		address: string
	) => Promise<void>;
	updateContractAddress: (clientId: number, address: string) => Promise<void>;
	updateContractFields: (
		clientId: number,
		fields: Partial<Contract>
	) => Promise<Result<ClientUser, AppError>>;
	deleteContract: (clientId: number) => Promise<void>;
	approveConnection: (clientId: number) => Promise<void>;
	setEquipmentStatus: (
		clientId: number,
		status: EquipmentStatus
	) => Promise<void>;
}

export function useContractActions(
	updateClient: UpdateClient
): ContractActions {
	const selectService = useCallback(
		async (clientId: number, serviceType: ServiceType, address: string) => {
			await updateClient(clientId, (client) => ({
				...client,
				contract: createContract(
					client.id,
					client.fio,
					client.phone,
					client.email,
					serviceType,
					address
				),
			}));
		},
		[updateClient]
	);

	const updateContractAddress = useCallback(
		async (clientId: number, address: string) => {
			await updateClient(clientId, (client) =>
				client.contract
					? { ...client, contract: { ...client.contract, address } }
					: client
			);
		},
		[updateClient]
	);

	const updateContractFields = useCallback(
		(clientId: number, fields: Partial<Contract>) =>
			updateClient(clientId, (client) =>
				client.contract
					? { ...client, contract: { ...client.contract, ...fields } }
					: client
			),
		[updateClient]
	);

	const deleteContract = useCallback(
		async (clientId: number) => {
			await updateClient(clientId, (client) => ({
				...client,
				contract: null,
				connectionApproved: false,
				balance: 0,
				equipmentStatus: undefined,
			}));
		},
		[updateClient]
	);

	const approveConnection = useCallback(
		async (clientId: number) => {
			await updateClient(clientId, (client) =>
				client.contract
					? {
							...client,
							connectionApproved: true,
							equipmentStatus: "online",
							contract: { ...client.contract, status: "active" },
						}
					: client
			);
		},
		[updateClient]
	);

	const setEquipmentStatus = useCallback(
		async (clientId: number, status: EquipmentStatus) => {
			await updateClient(clientId, (client) => ({
				...client,
				equipmentStatus: status,
			}));
		},
		[updateClient]
	);

	return {
		selectService,
		updateContractAddress,
		updateContractFields,
		deleteContract,
		approveConnection,
		setEquipmentStatus,
	};
}

import { useCallback } from "react";
import type { AppError, Result } from "../shared/lib/result";
import { failure, success } from "../shared/lib/result";
import type {
	ClientUser,
	Contract,
	EquipmentStatus,
	ServiceType,
} from "../types/models";
import { createContract } from "./contractFactory";
import type { ContractContactDetails } from "./appContextCore";
import type { UpdateClient } from "./useClientMutation";

/** Collapses a client-returning mutation into the value-less Result the context exposes. */
function toVoid(result: Result<ClientUser, AppError>): Result<void, AppError> {
	return result.ok ? success(undefined) : failure(result.error);
}

export interface ContractActions {
	selectService: (
		clientId: number,
		serviceType: ServiceType,
		address: string,
		details?: ContractContactDetails
	) => Promise<Result<void, AppError>>;
	updateContractAddress: (
		clientId: number,
		address: string
	) => Promise<Result<void, AppError>>;
	updateContractFields: (
		clientId: number,
		fields: Partial<Contract>
	) => Promise<Result<ClientUser, AppError>>;
	deleteContract: (clientId: number) => Promise<Result<void, AppError>>;
	approveConnection: (clientId: number) => Promise<Result<void, AppError>>;
	setEquipmentStatus: (
		clientId: number,
		status: EquipmentStatus
	) => Promise<Result<void, AppError>>;
}

export function useContractActions(
	updateClient: UpdateClient
): ContractActions {
	const selectService = useCallback(
		async (
			clientId: number,
			serviceType: ServiceType,
			address: string
		): Promise<Result<void, AppError>> =>
			toVoid(
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
				}))
			),
		[updateClient]
	);

	const updateContractAddress = useCallback(
		async (
			clientId: number,
			address: string
		): Promise<Result<void, AppError>> =>
			toVoid(
				await updateClient(clientId, (client) =>
					client.contract
						? { ...client, contract: { ...client.contract, address } }
						: client
				)
			),
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
		async (clientId: number): Promise<Result<void, AppError>> =>
			toVoid(
				await updateClient(clientId, (client) => ({
					...client,
					contract: null,
					connectionApproved: false,
					balance: 0,
					equipmentStatus: undefined,
				}))
			),
		[updateClient]
	);

	const approveConnection = useCallback(
		async (clientId: number): Promise<Result<void, AppError>> =>
			toVoid(
				await updateClient(clientId, (client) =>
					client.contract
						? {
								...client,
								connectionApproved: true,
								equipmentStatus: "online",
								contract: { ...client.contract, status: "active" },
							}
						: client
				)
			),
		[updateClient]
	);

	const setEquipmentStatus = useCallback(
		async (
			clientId: number,
			status: EquipmentStatus
		): Promise<Result<void, AppError>> =>
			toVoid(
				await updateClient(clientId, (client) => ({
					...client,
					equipmentStatus: status,
				}))
			),
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

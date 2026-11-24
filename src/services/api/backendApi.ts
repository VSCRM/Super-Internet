import axios from "axios";
import i18n from "../../i18n";
import type { AppError, Result } from "../../shared/lib/result";
import { failure, success } from "../../shared/lib/result";
import { apiClient, call, toAppError } from "./apiClient";
import type {
	AuthDto,
	ContractDto,
	ConversationDto,
	CreateContractDto,
	EquipmentStatusDto,
	MessageDto,
	PaymentDto,
	RecurringDto,
	RegisterRequestDto,
	RoleDto,
	UserDto,
} from "./dto";

type Res<T> = Promise<Result<T, AppError>>;

/**
 * One function per backend endpoint, nothing else: no state, no mapping.
 * Paths are relative to `env.apiBaseUrl` (`/api`).
 */
export const backendApi = {
	/* ---------------------------- auth ---------------------------- */
	login(email: string, password: string): Res<AuthDto> {
		return call(
			() => apiClient.post<AuthDto>("/auth/login", { email, password }),
			{
				401: i18n.t("errors.invalidCredentials"),
			}
		);
	},

	register(payload: RegisterRequestDto): Res<AuthDto> {
		return call(() => apiClient.post<AuthDto>("/auth/register", payload), {
			409: i18n.t("errors.emailTaken"),
		});
	},

	me(): Res<UserDto> {
		return call(() => apiClient.get<UserDto>("/auth/me"));
	},

	/* ---------------------- password recovery ---------------------- */
	requestRecovery(email: string): Res<void> {
		return call(() =>
			apiClient.post<void>("/auth/password-recovery/request", { email })
		);
	},

	verifyRecovery(email: string, code: string): Res<void> {
		return call(
			() =>
				apiClient.post<void>("/auth/password-recovery/verify", { email, code }),
			{ 401: i18n.t("errors.invalidCode") }
		);
	},

	resetPassword(
		email: string,
		code: string,
		newPassword: string
	): Res<AuthDto> {
		return call(
			() =>
				apiClient.post<AuthDto>("/auth/password-recovery/reset", {
					email,
					code,
					newPassword,
				}),
			{ 401: i18n.t("errors.invalidCode") }
		);
	},

	/* ---------------------------- users ---------------------------- */
	listUsers(role?: RoleDto): Res<UserDto[]> {
		return call(() =>
			apiClient.get<UserDto[]>("/users", {
				params: role ? { role } : undefined,
			})
		);
	},

	setEquipmentStatus(
		userId: number,
		equipmentStatus: EquipmentStatusDto
	): Res<UserDto> {
		return call(() =>
			apiClient.patch<UserDto>(`/users/${userId}/equipment-status`, {
				equipmentStatus,
			})
		);
	},

	createStaff(payload: RegisterRequestDto): Res<UserDto> {
		return call(() => apiClient.post<UserDto>("/admin/staff", payload), {
			409: i18n.t("errors.emailTaken"),
		});
	},

	updateProfile(payload: { fio: string; phone: string }): Res<UserDto> {
		return call(() => apiClient.patch<UserDto>("/users/me", payload));
	},

	/** Deletes the signed-in client's own account and all its data. */
	deleteOwnAccount(): Res<void> {
		return call(() => apiClient.delete<void>("/users/me"));
	},

	/** Admin only: deletes a client or a support account (admins are protected). */
	deleteUser(userId: number): Res<void> {
		return call(() => apiClient.delete<void>(`/users/${userId}`));
	},

	/* -------------------------- contracts -------------------------- */
	/** `null` (not an error) when the client has no contract yet - the backend answers 404. */
	async ownContract(): Res<ContractDto | null> {
		try {
			const response = await apiClient.get<ContractDto>("/contracts/me");
			return success(response.data);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				return success(null);
			}
			return failure(toAppError(error));
		}
	},

	createContract(payload: CreateContractDto): Res<ContractDto> {
		return call(() => apiClient.post<ContractDto>("/contracts", payload), {
			409: i18n.t("errors.contractExists"),
		});
	},

	updateOwnAddress(address: string): Res<ContractDto> {
		return call(() =>
			apiClient.patch<ContractDto>("/contracts/me", { address })
		);
	},

	cancelOwnContract(): Res<void> {
		return call(() => apiClient.delete<void>("/contracts/me"));
	},

	/** Staff correction of fio / phone / email / address. */
	updateContract(
		contractId: string,
		payload: { fio: string; phone: string; email: string; address: string }
	): Res<ContractDto> {
		return call(() =>
			apiClient.patch<ContractDto>(`/contracts/${contractId}`, payload)
		);
	},

	listContracts(): Res<ContractDto[]> {
		return call(() => apiClient.get<ContractDto[]>("/contracts"));
	},

	approveContract(contractId: string): Res<ContractDto> {
		return call(() =>
			apiClient.post<ContractDto>(`/contracts/${contractId}/approve`)
		);
	},

	/* ---------------------------- payments ---------------------------- */
	topUp(amount: number, recurring?: boolean): Res<PaymentDto> {
		return call(() =>
			apiClient.post<PaymentDto>("/payments", {
				amount,
				...(recurring === undefined ? {} : { recurring }),
			})
		);
	},

	setRecurring(recurring: boolean): Res<RecurringDto> {
		return call(() =>
			apiClient.patch<RecurringDto>("/payments/recurring", { recurring })
		);
	},

	/* ------------------------------ chat ------------------------------ */
	/** Also marks the support replies as read on the server. */
	ownMessages(): Res<MessageDto[]> {
		return call(() => apiClient.get<MessageDto[]>("/chat/messages"));
	},

	sendOwnMessage(body: string): Res<MessageDto> {
		return call(() => apiClient.post<MessageDto>("/chat/messages", { body }));
	},

	/** Also marks the client's messages as read on the server. */
	clientMessages(clientId: number): Res<MessageDto[]> {
		return call(() =>
			apiClient.get<MessageDto[]>(`/chat/clients/${clientId}/messages`)
		);
	},

	replyToClient(clientId: number, body: string): Res<MessageDto> {
		return call(() =>
			apiClient.post<MessageDto>(`/chat/clients/${clientId}/messages`, { body })
		);
	},

	/** Closing a ticket deletes the client's whole thread. */
	closeTicket(clientId: number): Res<void> {
		return call(() =>
			apiClient.delete<void>(`/chat/clients/${clientId}/messages`)
		);
	},

	conversations(): Res<ConversationDto[]> {
		return call(() => apiClient.get<ConversationDto[]>("/chat/conversations"));
	},
};

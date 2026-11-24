/**
 * Wire types of the Spring backend (see its `dto/` package). Kept 1:1 with
 * the Java records so a contract change shows up here first.
 * `BigDecimal` is serialized as a JSON number, `Instant` as an ISO-8601 string.
 */
export type RoleDto = "CLIENT" | "SUPPORT" | "ADMIN";
export type ServiceTypeDto = "INTERNET" | "INTERNET_TV";
export type ContractStatusDto = "PENDING" | "ACTIVE" | "DEBT";
export type EquipmentStatusDto = "ONLINE" | "OFFLINE" | "PENDING";
export type SenderRoleDto = "CLIENT" | "SUPPORT";

export interface UserDto {
	readonly id: number;
	readonly email: string;
	readonly role: RoleDto;
	readonly fio: string | null;
	readonly phone: string | null;
	readonly balance: number;
	readonly lastPaymentDate: string | null;
	readonly recurring: boolean;
	/** For a CLIENT: replies from support that the client has not opened yet. */
	readonly unreadMessages: number;
	readonly equipmentStatus: EquipmentStatusDto | null;
	readonly connectionApproved: boolean;
}

export interface AuthDto {
	readonly token: string;
	readonly tokenType: string;
	readonly expiresIn: number;
	readonly user: UserDto;
}

export interface ContractDto {
	readonly id: string;
	readonly userId: number;
	readonly fio: string;
	readonly phone: string;
	readonly email: string;
	readonly address: string;
	readonly serviceType: ServiceTypeDto;
	readonly equipmentId: string;
	readonly status: ContractStatusDto;
	readonly createdAt: string;
}

export interface CreateContractDto {
	readonly fio: string;
	readonly phone: string;
	readonly email: string;
	readonly address: string;
	readonly serviceType: ServiceTypeDto;
}

export interface MessageDto {
	readonly id: number;
	readonly clientId: number;
	readonly senderRole: SenderRoleDto;
	readonly senderId: number | null;
	readonly body: string;
	readonly sentAt: string;
	readonly read: boolean;
}

export interface ConversationDto {
	readonly clientId: number;
	readonly clientEmail: string;
	readonly clientFio: string | null;
	readonly lastMessage: string;
	readonly lastMessageAt: string;
	readonly lastSenderRole: SenderRoleDto;
	/** Client messages the staff has not opened yet. */
	readonly unreadFromClient: number;
}

export interface PaymentDto {
	readonly id: string;
	readonly userId: number;
	readonly amount: number;
	readonly balanceAfter: number;
	readonly currency: string;
	readonly gateway: "MOCK" | "PRIVATBANK";
	readonly transactionId: string;
	readonly createdAt: string;
}

/** Answer of `PATCH /payments/recurring` (the backend's BalanceResponse). */
export interface RecurringDto {
	readonly balance: number;
	readonly currency: string;
	readonly lastPaymentDate: string | null;
	readonly recurring: boolean;
}

export interface RegisterRequestDto {
	readonly email: string;
	readonly phone: string;
	readonly fio: string;
	readonly password: string;
}

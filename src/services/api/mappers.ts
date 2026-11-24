import type {
	AppUser,
	ChatMessage,
	ClientUser,
	Contract,
	ContractStatus,
	EquipmentStatus,
	ServiceType,
	UserRole,
} from "../../types/models";
import type {
	ContractDto,
	ContractStatusDto,
	ConversationDto,
	EquipmentStatusDto,
	MessageDto,
	RoleDto,
	ServiceTypeDto,
	UserDto,
} from "./dto";

/* ---------- enums: backend UPPER_CASE  <->  frontend lower_case ---------- */

export function mapRole(role: RoleDto): UserRole {
	return role.toLowerCase() as UserRole;
}

export function mapServiceType(type: ServiceTypeDto): ServiceType {
	return type === "INTERNET_TV" ? "internet_tv" : "internet";
}

export function toServiceTypeDto(type: ServiceType): ServiceTypeDto {
	return type === "internet_tv" ? "INTERNET_TV" : "INTERNET";
}

export function mapContractStatus(status: ContractStatusDto): ContractStatus {
	return status.toLowerCase() as ContractStatus;
}

export function mapEquipmentStatus(
	status: EquipmentStatusDto | null
): EquipmentStatus | undefined {
	return status ? (status.toLowerCase() as EquipmentStatus) : undefined;
}

export function toEquipmentStatusDto(
	status: EquipmentStatus
): EquipmentStatusDto {
	return status.toUpperCase() as EquipmentStatusDto;
}

/* ---------- entities ---------- */

export function mapContract(dto: ContractDto): Contract {
	return {
		id: dto.id,
		userId: dto.userId,
		fio: dto.fio,
		phone: dto.phone,
		email: dto.email,
		address: dto.address,
		serviceType: mapServiceType(dto.serviceType),
		equipmentId: dto.equipmentId,
		status: mapContractStatus(dto.status),
		createdAt: dto.createdAt,
	};
}

export function mapMessage(dto: MessageDto, clientEmail: string): ChatMessage {
	const fromClient = dto.senderRole === "CLIENT";
	return {
		from: fromClient ? clientEmail : "support",
		to: fromClient ? "support" : clientEmail,
		text: dto.body,
		timestamp: dto.sentAt,
		read: dto.read,
	};
}

/** One-line stand-in for a thread the staff has not opened (the list endpoint returns only the last message). */
export function mapConversationPreview(dto: ConversationDto): ChatMessage {
	const fromClient = dto.lastSenderRole === "CLIENT";
	return {
		from: fromClient ? dto.clientEmail : "support",
		to: fromClient ? "support" : dto.clientEmail,
		text: dto.lastMessage,
		timestamp: dto.lastMessageAt,
		read: fromClient ? dto.unreadFromClient === 0 : true,
	};
}

export interface ClientExtras {
	readonly contract?: Contract | null;
	readonly messages?: ChatMessage[];
}

/**
 * Backend user -> the app's `AppUser`.
 * The backend never exposes password material, so those (required, mock-mode)
 * fields stay empty strings and are never read in backend mode.
 */
export function mapUser(dto: UserDto, extras: ClientExtras = {}): AppUser {
	const base = {
		id: dto.id,
		email: dto.email,
		passwordHash: "",
		passwordSalt: "",
	};

	switch (dto.role) {
		case "CLIENT": {
			const client: ClientUser = {
				...base,
				role: "client",
				phone: dto.phone ?? "",
				fio: dto.fio ?? "",
				contract: extras.contract ?? null,
				balance: dto.balance,
				messages: extras.messages ?? [],
				lastPaymentDate: dto.lastPaymentDate ?? "",
				connectionApproved: dto.connectionApproved,
				unreadMessages: dto.unreadMessages,
				isRecurring: dto.recurring,
				equipmentStatus: mapEquipmentStatus(dto.equipmentStatus),
			};
			return client;
		}
		case "SUPPORT":
			return { ...base, role: "support", name: dto.fio ?? dto.email };
		case "ADMIN":
			return { ...base, role: "admin" };
	}
}

export type UserRole = "client" | "support" | "admin";

export type ServiceType = "internet" | "internet_tv";

export type ContractStatus = "pending" | "active" | "debt";

export type EquipmentStatus = "online" | "offline" | "pending";

export interface ChatMessage {
	from: string;
	to: string;
	text: string;
	timestamp: string;
	read: boolean;
}

export interface Contract {
	id: string;
	userId: number;
	fio: string;
	phone: string;
	email: string;
	address: string;
	serviceType: ServiceType;
	equipmentId: string;
	status: ContractStatus;
	createdAt: string;
}

interface BaseUser {
	id: number;
	email: string;
	/** PBKDF2 hash of the password - see shared/lib/passwordHasher.ts. Never plaintext. */
	passwordHash: string;
	passwordSalt: string;
	role: UserRole;
}

export interface ClientUser extends BaseUser {
	role: "client";
	phone: string;
	fio: string;
	contract: Contract | null;
	balance: number;
	messages: ChatMessage[];
	lastPaymentDate: string;
	connectionApproved: boolean;
	unreadMessages: number;
	isRecurring?: boolean;
	equipmentStatus?: EquipmentStatus;
	tempCode?: string | null;
	codeExpiry?: number | null;
}

export interface SupportUser extends BaseUser {
	role: "support";
	name: string;
}

export interface AdminUser extends BaseUser {
	role: "admin";
}

export type AppUser = ClientUser | SupportUser | AdminUser;

/** Translation keys (not literal text) - callers must run these through i18next's t(). */
export const SERVICE_NAMES: Record<ServiceType, string> = {
	internet: "service.internetTitle",
	internet_tv: "service.internetTvTitle",
};

export const SERVICE_PRICES: Record<ServiceType, number> = {
	internet: 300,
	internet_tv: 450,
};

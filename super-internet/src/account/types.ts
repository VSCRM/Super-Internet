export type Role = "client" | "support" | "admin";

export type ServiceType = "internet" | "internet_tv";

export type ContractStatus = "pending" | "active" | "debt";

export type EquipmentStatus = "online" | "offline" | "pending";

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

export interface ChatMessage {
	from: string;
	to: string;
	text: string;
	timestamp: string;
	read: boolean;
}

interface BaseUser {
	id: number;
	email: string;
	password: string;
	tempCode?: string | null;
	codeExpiry?: number | null;
}

export interface Client extends BaseUser {
	role: "client";
	phone: string;
	fio: string;
	contract: Contract | null;
	balance: number;
	messages: ChatMessage[];
	lastPaymentDate: string;
	connectionApproved: boolean;
	isRecurring?: boolean;
	equipmentStatus?: EquipmentStatus;
}

export interface Support extends BaseUser {
	role: "support";
	name: string;
}

export interface Admin extends BaseUser {
	role: "admin";
}

export type AppUser = Client | Support | Admin;

export const isClient = (user: AppUser): user is Client =>
	user.role === "client";
export const isSupport = (user: AppUser): user is Support =>
	user.role === "support";
export const isAdmin = (user: AppUser): user is Admin => user.role === "admin";

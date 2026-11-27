import { createContext, useContext } from "react";
import type {
	AppUser,
	ClientUser,
	Contract,
	EquipmentStatus,
	ServiceType,
	SupportUser,
} from "../types/models";
import type { AppError, Result } from "../shared/lib/result";
import type { EditableProfileInput } from "../shared/schemas/profile.schema";

/**
 * What the active data layer can actually do. Both the Mock layer and the
 * backend support every feature, so the only difference is `isBackend`.
 */
export interface AppCapabilities {
	readonly isBackend: boolean;
	readonly canEditProfile: boolean;
	readonly canEditContract: boolean;
	readonly canDeleteContract: boolean;
	readonly canDeleteAccounts: boolean;
	readonly canCloseTicket: boolean;
	readonly canToggleRecurring: boolean;
}

export const LOCAL_CAPABILITIES: AppCapabilities = {
	isBackend: false,
	canEditProfile: true,
	canEditContract: true,
	canDeleteContract: true,
	canDeleteAccounts: true,
	canCloseTicket: true,
	canToggleRecurring: true,
};

export const BACKEND_CAPABILITIES: AppCapabilities = {
	...LOCAL_CAPABILITIES,
	isBackend: true,
};

/** Contact details the contract needs when the account itself has none (e.g. a Google sign-up). */
export interface ContractContactDetails {
	readonly fio: string;
	readonly phone: string;
}

export interface AppContextValue {
	users: AppUser[];
	currentUser: AppUser | null;
	isInitializing: boolean;
	capabilities: AppCapabilities;
	login: (
		email: string,
		password: string
	) => Promise<Result<AppUser, AppError>>;
	register: (
		email: string,
		password: string,
		phone: string,
		fio: string
	) => Promise<Result<ClientUser, AppError>>;
	logout: () => Promise<void>;
	adoptSession: (user: AppUser) => void;
	updateUser: (user: AppUser) => Promise<Result<AppUser, AppError>>;
	deleteUser: (userId: number) => Promise<Result<void, AppError>>;
	getUserById: (id: number) => AppUser | undefined;
	/** `phone` is required by the real backend and ignored by the Mock layer. */
	addStaff: (
		email: string,
		password: string,
		name: string,
		phone?: string
	) => Promise<Result<SupportUser, AppError>>;
	deleteStaff: (email: string) => Promise<Result<void, AppError>>;
	updateProfile: (
		clientId: number,
		input: EditableProfileInput
	) => Promise<Result<ClientUser, AppError>>;
	/**
	 * Backend mode: creates a password (Google account, no `currentPassword`)
	 * or changes it (`currentPassword` required). Unsupported in Mock mode.
	 */
	setPassword: (
		newPassword: string,
		currentPassword?: string
	) => Promise<Result<void, AppError>>;
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
	makePayment: (
		clientId: number,
		amount: number,
		isRecurring: boolean
	) => Promise<Result<number, AppError>>;
	/**
	 * Real payment (`VITE_PAYMENT_MODE=real`, backend only): asks the backend to
	 * start a Privat24 payment and returns the page URL to send the user to.
	 */
	startPrivat24Payment: (
		amount: number,
		isRecurring: boolean
	) => Promise<Result<string, AppError>>;
	toggleRecurringPayment: (
		clientId: number
	) => Promise<Result<boolean, AppError>>;
	approveConnection: (clientId: number) => Promise<Result<void, AppError>>;
	setEquipmentStatus: (
		clientId: number,
		status: EquipmentStatus
	) => Promise<Result<void, AppError>>;
	sendClientMessage: (
		clientId: number,
		text: string
	) => Promise<Result<void, AppError>>;
	sendSupportMessage: (
		clientId: number,
		text: string
	) => Promise<Result<void, AppError>>;
	markClientMessagesRead: (clientId: number) => Promise<void>;
	markSupportMessagesRead: (clientId: number) => Promise<void>;
	closeTicket: (clientId: number) => Promise<Result<void, AppError>>;
	/** Backend mode: fetches a client's full chat thread (the list only carries the last message). No-op in Mock mode. */
	loadThread: (clientId: number) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useApp must be used within AppProvider");
	return ctx;
}

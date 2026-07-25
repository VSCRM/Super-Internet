import { createContext, useCallback, useContext, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type {
	AppUser,
	ClientUser,
	Contract,
	EquipmentStatus,
	ServiceType,
	SupportUser,
} from "../types/models";
import { isSuccess } from "../shared/lib/result";
import type { AppError, Result } from "../shared/lib/result";
import { getAuthStrategy } from "../services/auth/authStrategyFactory";
import { getUserRepository } from "../services/repositories/userRepositoryFactory";
import { getPaymentGateway } from "../services/payments/paymentGatewayFactory";
import type { EditableProfileInput } from "../shared/schemas/profile.schema";
import { useSessionBootstrap } from "./useSessionBootstrap";
import { useMonthlyBilling } from "./useMonthlyBilling";
import { useClientMutation } from "./useClientMutation";
import { useAuthActions } from "./useAuthActions";
import { useUserActions } from "./useUserActions";
import { useProfileActions } from "./useProfileActions";
import { useContractActions } from "./useContractActions";
import { usePaymentActions } from "./usePaymentActions";
import { useChatActions } from "./useChatActions";

export interface AppContextValue {
	users: AppUser[];
	currentUser: AppUser | null;
	isInitializing: boolean;
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
	deleteUser: (userId: number) => Promise<void>;
	getUserById: (id: number) => AppUser | undefined;
	addStaff: (
		email: string,
		password: string,
		name: string
	) => Promise<Result<SupportUser, AppError>>;
	deleteStaff: (email: string) => Promise<void>;
	updateProfile: (
		clientId: number,
		input: EditableProfileInput
	) => Promise<Result<ClientUser, AppError>>;
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
	makePayment: (
		clientId: number,
		amount: number,
		isRecurring: boolean
	) => Promise<Result<number, AppError>>;
	toggleRecurringPayment: (clientId: number) => Promise<boolean>;
	approveConnection: (clientId: number) => Promise<void>;
	setEquipmentStatus: (
		clientId: number,
		status: EquipmentStatus
	) => Promise<void>;
	sendClientMessage: (clientId: number, text: string) => Promise<void>;
	sendSupportMessage: (clientId: number, text: string) => Promise<void>;
	markClientMessagesRead: (clientId: number) => Promise<void>;
	markSupportMessagesRead: (clientId: number) => Promise<void>;
	closeTicket: (clientId: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error("useApp must be used within AppProvider");
	return ctx;
}

/**
 * Composition root for application state. Every concern that used to live
 * here directly (bootstrap/migration, session resolution, billing, auth,
 * user CRUD, contracts, payments, chat) is now a focused single-responsibility
 * hook in its own file under `src/context/` - this component's only job is
 * wiring those hooks together and exposing the combined surface as one context.
 */
export function AppProvider({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	const [users, setUsers] = useState<AppUser[]>([]);
	const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

	const repository = getUserRepository();
	const authStrategy = getAuthStrategy();
	const paymentGateway = getPaymentGateway();

	const refreshUsers = useCallback(async () => {
		const result = await repository.findAll();
		if (isSuccess(result)) setUsers(result.value);
	}, [repository]);

	const isInitializing = useSessionBootstrap(
		authStrategy,
		repository,
		setUsers,
		setCurrentUser
	);

	useMonthlyBilling(repository, refreshUsers);

	const { updateUser, deleteUser, getUserById, addStaff, deleteStaff } =
		useUserActions(repository, users, setUsers, setCurrentUser, refreshUsers);
	const { login, register, logout, adoptSession } = useAuthActions(
		authStrategy,
		setCurrentUser,
		refreshUsers
	);

	const updateClient = useClientMutation(repository, updateUser);
	const { updateProfile } = useProfileActions(updateClient);
	const {
		selectService,
		updateContractAddress,
		updateContractFields,
		deleteContract,
		approveConnection,
		setEquipmentStatus,
	} = useContractActions(updateClient);
	const { makePayment, toggleRecurringPayment } = usePaymentActions(
		repository,
		paymentGateway,
		updateClient
	);
	const {
		sendClientMessage,
		sendSupportMessage,
		markClientMessagesRead,
		markSupportMessagesRead,
		closeTicket,
	} = useChatActions(updateClient);

	const value: AppContextValue = {
		users,
		currentUser,
		isInitializing,
		login,
		register,
		logout,
		adoptSession,
		updateUser,
		deleteUser,
		getUserById,
		addStaff,
		deleteStaff,
		updateProfile,
		selectService,
		updateContractAddress,
		updateContractFields,
		deleteContract,
		makePayment,
		toggleRecurringPayment,
		approveConnection,
		setEquipmentStatus,
		sendClientMessage,
		sendSupportMessage,
		markClientMessagesRead,
		markSupportMessagesRead,
		closeTicket,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

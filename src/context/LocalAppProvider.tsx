import { useCallback, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type { AppUser } from "../types/models";
import { useTranslation } from "react-i18next";
import { appError, failure, isSuccess } from "../shared/lib/result";
import { getAuthStrategy } from "../services/auth/authStrategyFactory";
import { getUserRepository } from "../services/repositories/userRepositoryFactory";
import { getPaymentGateway } from "../services/payments/paymentGatewayFactory";
import { AppContext, LOCAL_CAPABILITIES } from "./appContextCore";
import type { AppContextValue } from "./appContextCore";
import { useSessionBootstrap } from "./useSessionBootstrap";
import { useMonthlyBilling } from "./useMonthlyBilling";
import { useClientMutation } from "./useClientMutation";
import { useAuthActions } from "./useAuthActions";
import { useUserActions } from "./useUserActions";
import { useProfileActions } from "./useProfileActions";
import { useContractActions } from "./useContractActions";
import { usePaymentActions } from "./usePaymentActions";
import { useChatActions } from "./useChatActions";

/**
 * Composition root for application state. Every concern that used to live
 * here directly (bootstrap/migration, session resolution, billing, auth,
 * user CRUD, contracts, payments, chat) is now a focused single-responsibility
 * hook in its own file under `src/context/` - this component's only job is
 * wiring those hooks together and exposing the combined surface as one context.
 */
export function LocalAppProvider({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	const { t } = useTranslation();
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

	const loadThread = useCallback(async () => undefined, []);

	const startPrivat24Payment = useCallback<
		AppContextValue["startPrivat24Payment"]
	>(
		async () => failure(appError("UNSUPPORTED", t("payment.realNeedsBackend"))),
		[t]
	);

	const setPassword = useCallback<AppContextValue["setPassword"]>(
		async () =>
			failure(appError("UNSUPPORTED", t("errors.notSupportedByBackend"))),
		[t]
	);

	const value: AppContextValue = {
		users,
		currentUser,
		isInitializing,
		capabilities: LOCAL_CAPABILITIES,
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
		setPassword,
		selectService,
		updateContractAddress,
		updateContractFields,
		deleteContract,
		makePayment,
		startPrivat24Payment,
		toggleRecurringPayment,
		approveConnection,
		setEquipmentStatus,
		sendClientMessage,
		sendSupportMessage,
		markClientMessagesRead,
		markSupportMessagesRead,
		closeTicket,
		loadThread,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

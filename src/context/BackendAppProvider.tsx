import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
	AppUser,
	ChatMessage,
	ClientUser,
	EquipmentStatus,
	ServiceType,
	SupportUser,
} from "../types/models";
import type { AppError, Result } from "../shared/lib/result";
import { isSafePaymentUrl } from "../shared/lib/paymentUrl";
import { appError, failure, success } from "../shared/lib/result";
import { getAuthStrategy } from "../services/auth/authStrategyFactory";
import { backendApi } from "../services/api/backendApi";
import { SESSION_EXPIRED_EVENT } from "../services/api/apiClient";
import { fetchCurrentUser } from "../services/api/backendSession";
import type { ContractDto } from "../services/api/dto";
import { composeStaffView } from "../services/api/staffView";
import {
	mapContract,
	mapMessage,
	mapUser,
	toEquipmentStatusDto,
	toServiceTypeDto,
} from "../services/api/mappers";
import { AppContext, BACKEND_CAPABILITIES } from "./appContextCore";
import type { AppContextValue } from "./appContextCore";

/** How often the open dashboard re-reads server state (new chat messages, approvals, balance). */
const POLL_INTERVAL_MS = 5_000;

function unsupported<T>(message: string): Result<T, AppError> {
	return failure(appError("NOT_SUPPORTED", message));
}

function notFound<T>(message: string): Result<T, AppError> {
	return failure(appError("NOT_FOUND", message));
}

/**
 * Application state backed by the real Spring API. It exposes exactly the
 * same context shape as `LocalAppProvider`, so no component knows which one
 * it runs on.
 */
export function BackendAppProvider({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	const { t } = useTranslation();
	const authStrategy = getAuthStrategy();

	const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
	const [users, setUsers] = useState<AppUser[]>([]);
	const [isInitializing, setIsInitializing] = useState(true);

	// Latest values for callbacks that must stay referentially stable.
	const currentUserRef = useRef<AppUser | null>(null);
	const usersRef = useRef<AppUser[]>([]);
	useEffect(() => {
		currentUserRef.current = currentUser;
		usersRef.current = users;
	}, [currentUser, users]);

	/** Full chat threads staff have opened, keyed by client id. */
	const threadsRef = useRef(new Map<number, ChatMessage[]>());

	/* ------------------------- data loading ------------------------- */

	const refreshStaffData = useCallback(async (): Promise<AppUser[] | null> => {
		const [usersRes, contractsRes, conversationsRes] = await Promise.all([
			backendApi.listUsers(),
			backendApi.listContracts(),
			backendApi.conversations(),
		]);
		// A failed poll must never blank the screen - keep what is already shown.
		if (!usersRes.ok || !contractsRes.ok || !conversationsRes.ok) return null;

		const contracts = new Map(
			contractsRes.value.map((dto: ContractDto) => [
				dto.userId,
				mapContract(dto),
			])
		);
		const conversations = new Map(
			conversationsRes.value.map((dto) => [dto.clientId, dto])
		);

		const composed = usersRes.value.map((dto) =>
			composeStaffView(dto, contracts, conversations, threadsRef.current)
		);
		setUsers(composed);
		return composed;
	}, []);

	/** Re-reads the signed-in user, keeping the chat that is already loaded. */
	const refreshSelf = useCallback(async (): Promise<void> => {
		const result = await fetchCurrentUser();
		if (!result.ok) return;

		setCurrentUser((previous) => {
			// Logged out, or a different account signed in, while the request was in flight.
			if (!previous || previous.id !== result.value.id) return previous;

			const next: AppUser =
				previous.role === "client" && result.value.role === "client"
					? { ...result.value, messages: previous.messages }
					: result.value;
			return JSON.stringify(next) === JSON.stringify(previous)
				? previous
				: next;
		});
	}, []);

	const loadOwnThread = useCallback(async (): Promise<void> => {
		const result = await backendApi.ownMessages();
		if (!result.ok) return;

		setCurrentUser((previous) =>
			previous?.role === "client"
				? {
						...previous,
						// The server just marked the replies as read.
						unreadMessages: 0,
						messages: result.value.map((dto) =>
							mapMessage(dto, previous.email)
						),
					}
				: previous
		);
	}, []);

	const loadThread = useCallback(
		async (clientId: number): Promise<void> => {
			const client = usersRef.current.find(
				(user) => user.id === clientId && user.role === "client"
			);
			if (!client) return;

			const result = await backendApi.clientMessages(clientId);
			if (!result.ok) return;

			threadsRef.current.set(
				clientId,
				result.value.map((dto) => mapMessage(dto, client.email))
			);
			await refreshStaffData();
		},
		[refreshStaffData]
	);

	/* --------------------- session lifecycle --------------------- */

	useEffect(() => {
		let isMounted = true;

		void (async () => {
			const session = await authStrategy.getSession();
			if (isMounted && session.ok) setCurrentUser(session.value);
			if (isMounted) setIsInitializing(false);
		})();

		return () => {
			isMounted = false;
		};
	}, [authStrategy]);

	// Token expired or was rejected on any request: fall back to the login screen.
	useEffect(() => {
		const onExpired = (): void => {
			threadsRef.current.clear();
			setCurrentUser(null);
			setUsers([]);
		};
		window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
		return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
	}, []);

	const userId = currentUser?.id ?? null;
	const role = currentUser?.role ?? null;

	// Staff need the whole client list; load it as soon as they are signed in.
	useEffect(() => {
		if (role === "support" || role === "admin") void refreshStaffData();
	}, [userId, role, refreshStaffData]);

	// Keep balance / approval / equipment / chat badges fresh without a reload.
	useEffect(() => {
		if (userId === null) return;

		const intervalId = window.setInterval(() => {
			if (document.hidden) return;
			if (role === "client") void refreshSelf();
			else void refreshStaffData();
		}, POLL_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, [userId, role, refreshSelf, refreshStaffData]);

	/* ----------------------------- auth ----------------------------- */

	const login = useCallback<AppContextValue["login"]>(
		async (email, password) => {
			const result = await authStrategy.login(email, password);
			if (result.ok) setCurrentUser(result.value);
			return result;
		},
		[authStrategy]
	);

	const register = useCallback<AppContextValue["register"]>(
		async (email, password, phone, fio) => {
			const result = await authStrategy.register({
				email,
				password,
				phone,
				fio,
			});
			if (result.ok) setCurrentUser(result.value);
			return result;
		},
		[authStrategy]
	);

	const logout = useCallback(async (): Promise<void> => {
		await authStrategy.logout();
		threadsRef.current.clear();
		setCurrentUser(null);
		setUsers([]);
	}, [authStrategy]);

	const adoptSession = useCallback((user: AppUser): void => {
		setCurrentUser(user);
	}, []);

	/* ------------------------------ users ------------------------------ */

	const getUserById = useCallback(
		(id: number): AppUser | undefined =>
			usersRef.current.find((user) => user.id === id) ??
			(currentUserRef.current?.id === id ? currentUserRef.current : undefined),
		[]
	);

	const addStaff = useCallback<AppContextValue["addStaff"]>(
		async (email, password, name, phone) => {
			if (!phone) {
				return failure(appError("VALIDATION", t("errors.phoneRequired")));
			}
			const result = await backendApi.createStaff({
				email: email.trim(),
				password,
				fio: name.trim(),
				phone: phone.trim(),
			});
			if (!result.ok) return failure(result.error);

			await refreshStaffData();
			return success(mapUser(result.value) as SupportUser);
		},
		[refreshStaffData, t]
	);

	/* ----------------------------- contracts ----------------------------- */

	const selectService = useCallback<AppContextValue["selectService"]>(
		async (_clientId, serviceType: ServiceType, address, details) => {
			const me = currentUserRef.current;
			if (me?.role !== "client") {
				return notFound<void>(t("errors.clientNotFound"));
			}

			const result = await backendApi.createContract({
				fio: (details?.fio ?? me.fio).trim(),
				phone: (details?.phone ?? me.phone).trim(),
				email: me.email,
				address: address.trim(),
				serviceType: toServiceTypeDto(serviceType),
			});
			if (!result.ok) return failure(result.error);

			const contract = mapContract(result.value);
			setCurrentUser((previous) =>
				previous?.role === "client" ? { ...previous, contract } : previous
			);
			return success(undefined);
		},
		[t]
	);

	const approveConnection = useCallback<AppContextValue["approveConnection"]>(
		async (clientId) => {
			const client = usersRef.current.find(
				(user): user is ClientUser =>
					user.id === clientId && user.role === "client"
			);
			if (!client?.contract) {
				return notFound<void>(t("contract.notIssued"));
			}

			const result = await backendApi.approveContract(client.contract.id);
			if (!result.ok) return failure(result.error);

			await refreshStaffData();
			return success(undefined);
		},
		[refreshStaffData, t]
	);

	const setEquipmentStatus = useCallback<AppContextValue["setEquipmentStatus"]>(
		async (clientId, status: EquipmentStatus) => {
			const result = await backendApi.setEquipmentStatus(
				clientId,
				toEquipmentStatusDto(status)
			);
			if (!result.ok) return failure(result.error);

			await refreshStaffData();
			return success(undefined);
		},
		[refreshStaffData]
	);

	/* ----------------------------- payments ----------------------------- */

	const makePayment = useCallback<AppContextValue["makePayment"]>(
		async (_clientId, amount, isRecurring) => {
			// `recurring` is only ever switched ON here, same as the Mock layer;
			// omitting it leaves the stored flag untouched.
			const result = await backendApi.topUp(amount, isRecurring || undefined);
			if (!result.ok) return failure(result.error);

			// A top-up can settle a debt and reactivate the contract.
			await refreshSelf();
			return success(result.value.balanceAfter);
		},
		[refreshSelf]
	);

	const startPrivat24Payment = useCallback<
		AppContextValue["startPrivat24Payment"]
	>(
		async (amount, isRecurring) => {
			const result = await backendApi.startPrivat24Checkout(
				amount,
				isRecurring
			);
			if (!result.ok) {
				// The endpoint does not exist / is not enabled on this backend.
				const notAvailable = ["HTTP_404", "HTTP_405", "HTTP_501"].includes(
					result.error.code
				);
				return failure(
					notAvailable
						? { ...result.error, message: t("payment.realNotAvailable") }
						: result.error
				);
			}
			if (!isSafePaymentUrl(result.value.paymentUrl)) {
				return failure(appError("BAD_PAYMENT_URL", t("payment.realBadUrl")));
			}
			return success(result.value.paymentUrl);
		},
		[t]
	);

	/* ---------------- profile, contract edits, account deletion ---------------- */

	const updateProfile = useCallback<AppContextValue["updateProfile"]>(
		async (_clientId, input) => {
			const result = await backendApi.updateProfile({
				fio: input.fio.trim(),
				phone: input.phone.trim(),
			});
			if (!result.ok) return failure(result.error);

			const me = currentUserRef.current;
			if (me?.role !== "client")
				return notFound<ClientUser>(t("errors.clientNotFound"));

			const updated: ClientUser = {
				...me,
				fio: result.value.fio ?? "",
				phone: result.value.phone ?? "",
			};
			setCurrentUser(updated);
			return success(updated);
		},
		[t]
	);

	const setPassword = useCallback<AppContextValue["setPassword"]>(
		async (newPassword, currentPassword) => {
			const result = await backendApi.setPassword(newPassword, currentPassword);
			if (!result.ok) {
				// A 400 here is either a wrong current password or a weak new one; the form
				// validates strength itself, so a plain 400 (no field errors) is the former.
				const wrongCurrent =
					result.error.code === "HTTP_400" &&
					currentPassword !== undefined &&
					!result.error.details?.fieldErrors;
				return failure(
					wrongCurrent
						? { ...result.error, message: t("password.wrongCurrent") }
						: result.error
				);
			}

			setCurrentUser((previous) =>
				previous?.role === "client"
					? { ...previous, hasPassword: true }
					: previous
			);
			return success(undefined);
		},
		[t]
	);

	const updateContractAddress = useCallback<
		AppContextValue["updateContractAddress"]
	>(async (_clientId, address) => {
		const result = await backendApi.updateOwnAddress(address.trim());
		if (!result.ok) return failure(result.error);

		const contract = mapContract(result.value);
		setCurrentUser((previous) =>
			previous?.role === "client" ? { ...previous, contract } : previous
		);
		return success(undefined);
	}, []);

	const deleteContract = useCallback<
		AppContextValue["deleteContract"]
	>(async () => {
		const result = await backendApi.cancelOwnContract();
		if (!result.ok) return failure(result.error);

		// The server switches the connection off and keeps the balance.
		setCurrentUser((previous) =>
			previous?.role === "client"
				? {
						...previous,
						contract: null,
						connectionApproved: false,
						equipmentStatus: undefined,
					}
				: previous
		);
		return success(undefined);
	}, []);

	const updateContractFields = useCallback<
		AppContextValue["updateContractFields"]
	>(
		async (clientId, fields) => {
			const client = usersRef.current.find(
				(user): user is ClientUser =>
					user.id === clientId && user.role === "client"
			);
			if (!client?.contract)
				return notFound<ClientUser>(t("contract.notIssued"));

			const result = await backendApi.updateContract(client.contract.id, {
				fio: (fields.fio ?? client.contract.fio).trim(),
				phone: (fields.phone ?? client.contract.phone).trim(),
				email: (fields.email ?? client.contract.email).trim(),
				address: (fields.address ?? client.contract.address).trim(),
			});
			if (!result.ok) return failure(result.error);

			const composed = await refreshStaffData();
			const fresh = composed?.find(
				(user): user is ClientUser =>
					user.id === clientId && user.role === "client"
			);
			return success(fresh ?? client);
		},
		[refreshStaffData, t]
	);

	const deleteUser = useCallback<AppContextValue["deleteUser"]>(
		async (userId) => {
			const isSelf = currentUserRef.current?.id === userId;
			const result = isSelf
				? await backendApi.deleteOwnAccount()
				: await backendApi.deleteUser(userId);
			if (!result.ok) return failure(result.error);

			if (isSelf) {
				// The account is gone, so the token is worthless now.
				await authStrategy.logout();
				threadsRef.current.clear();
				setCurrentUser(null);
				setUsers([]);
			} else {
				threadsRef.current.delete(userId);
				await refreshStaffData();
			}
			return success(undefined);
		},
		[authStrategy, refreshStaffData]
	);

	const deleteStaff = useCallback<AppContextValue["deleteStaff"]>(
		async (email) => {
			const member = usersRef.current.find(
				(user) =>
					user.role === "support" &&
					user.email.toLowerCase() === email.toLowerCase()
			);
			if (!member) return notFound<void>(t("errors.userNotFound"));
			return deleteUser(member.id);
		},
		[deleteUser, t]
	);

	const toggleRecurringPayment = useCallback<
		AppContextValue["toggleRecurringPayment"]
	>(async () => {
		const me = currentUserRef.current;
		if (me?.role !== "client")
			return notFound<boolean>(t("errors.clientNotFound"));

		const next = !me.isRecurring;
		const result = await backendApi.setRecurring(next);
		if (!result.ok) return failure(result.error);

		setCurrentUser((previous) =>
			previous?.role === "client"
				? { ...previous, isRecurring: result.value.recurring }
				: previous
		);
		return success(result.value.recurring);
	}, [t]);

	const closeTicket = useCallback<AppContextValue["closeTicket"]>(
		async (clientId) => {
			const result = await backendApi.closeTicket(clientId);
			if (!result.ok) return failure(result.error);

			threadsRef.current.delete(clientId);
			await refreshStaffData();
			return success(undefined);
		},
		[refreshStaffData]
	);

	/* ------------------------------- chat ------------------------------- */

	const sendClientMessage = useCallback<AppContextValue["sendClientMessage"]>(
		async (_clientId, text) => {
			const result = await backendApi.sendOwnMessage(text.trim());
			if (!result.ok) return failure(result.error);

			await loadOwnThread();
			return success(undefined);
		},
		[loadOwnThread]
	);

	const sendSupportMessage = useCallback<AppContextValue["sendSupportMessage"]>(
		async (clientId, text) => {
			const result = await backendApi.replyToClient(clientId, text.trim());
			if (!result.ok) return failure(result.error);

			await loadThread(clientId);
			return success(undefined);
		},
		[loadThread]
	);

	const markClientMessagesRead = useCallback(
		async (): Promise<void> => loadOwnThread(),
		[loadOwnThread]
	);

	const markSupportMessagesRead = useCallback(
		async (clientId: number): Promise<void> => loadThread(clientId),
		[loadThread]
	);

	const notSupported = t("errors.notSupportedByBackend");

	const value = useMemo<AppContextValue>(
		() => ({
			users,
			currentUser,
			isInitializing,
			capabilities: BACKEND_CAPABILITIES,
			login,
			register,
			logout,
			adoptSession,
			updateUser: async () => unsupported<AppUser>(notSupported),
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
		}),
		[
			users,
			currentUser,
			isInitializing,
			login,
			register,
			logout,
			adoptSession,
			getUserById,
			addStaff,
			deleteUser,
			deleteStaff,
			updateProfile,
			setPassword,
			updateContractAddress,
			updateContractFields,
			deleteContract,
			toggleRecurringPayment,
			closeTicket,
			selectService,
			makePayment,
			startPrivat24Payment,
			approveConnection,
			setEquipmentStatus,
			sendClientMessage,
			sendSupportMessage,
			markClientMessagesRead,
			markSupportMessagesRead,
			loadThread,
			notSupported,
		]
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

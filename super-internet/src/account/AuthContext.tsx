import {createContext, useContext, useEffect, useMemo, useState} from "react";
import type {ReactNode} from "react";
import type {AppUser, Client, EquipmentStatus, ServiceType} from "./types";
import {isClient} from "./types";
import {loadUsers, saveUsers, withDefaultUsers} from "./storage";
import {createClient, createContract, createSupport} from "./factories";
import {applyPayment, processMonthlyPayments, toggleRecurring} from "./billing";
import {validatePassword} from "./validation";

const BILLING_INTERVAL_MS = 86_400_000;
const SESSION_KEY = "superInternetSession";

export interface ClientProfileData {
	fio: string;
	phone: string;
	email: string;
	address: string;
	serviceType: ServiceType;
}

interface AuthContextValue {
	users: AppUser[];
	currentUser: AppUser | null;
	login: (email: string, password: string) => void;
	register: (
		email: string,
		password: string,
		phone: string,
		fio: string,
	) => void;
	logout: () => void;
	getUserById: (id: number) => AppUser | undefined;
	requestPasswordReset: (email: string) => string;
	verifyResetCode: (email: string, code: string) => void;
	resetPassword: (email: string, newPassword: string) => void;
	selectService: (serviceType: ServiceType, address: string) => void;
	updateClientProfile: (data: ClientProfileData) => void;
	deleteContract: () => void;
	deleteAccount: () => void;
	makePayment: (amount: number, isRecurring: boolean) => void;
	toggleRecurringPayment: () => void;
	sendClientMessage: (text: string) => void;
	sendAutoSupportReply: (text: string) => void;
	markSupportMessagesRead: () => void;
	editClientInfo: (
		clientId: number,
		data: Partial<Pick<Client, "fio" | "phone" | "email"> & {address: string}>,
	) => void;
	markClientMessagesRead: (clientId: number) => void;
	sendSupportMessage: (clientId: number, text: string) => void;
	closeTicket: (clientId: number) => void;
	addStaff: (email: string, password: string, name: string) => void;
	deleteStaff: (email: string) => void;
	deleteClient: (clientId: number) => void;
	approveConnection: (clientId: number) => void;
	setEquipmentStatus: (clientId: number, status: EquipmentStatus) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
	const [users, setUsers] = useState<AppUser[]>(() =>
		withDefaultUsers(loadUsers()),
	);
	const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
		const saved = window.localStorage.getItem(SESSION_KEY);
		return saved ? (JSON.parse(saved) as number) : null;
	});

	useEffect(() => {
		saveUsers(users);
	}, [users]);
	useEffect(() => {
		if (currentUserId !== null) {
			window.localStorage.setItem(SESSION_KEY, JSON.stringify(currentUserId));
		} else {
			window.localStorage.removeItem(SESSION_KEY);
		}
	}, [currentUserId]);
	useEffect(() => {
		const id = window.setInterval(() => {
			setUsers((prev) =>
				prev.map((u) => (isClient(u) ? processMonthlyPayments([u])[0] : u)),
			);
		}, BILLING_INTERVAL_MS);
		return () => window.clearInterval(id);
	}, []);

	const currentUser = useMemo(
		() => users.find((u) => u.id === currentUserId) ?? null,
		[users, currentUserId],
	);

	const getUserById = (id: number) => users.find((u) => u.id === id);
	const updateUserInList = (id: number, updater: (u: AppUser) => AppUser) =>
		setUsers((prev) => prev.map((u) => (u.id === id ? updater(u) : u)));
	const requireCurrentClient = (): Client => {
		if (!currentUser || !isClient(currentUser))
			throw new Error("Дія доступна лише для клієнта");
		return currentUser;
	};

	const login = (email: string, password: string) => {
		const user = users.find(
			(u) => u.email === email && u.password === password,
		);
		if (!user) throw new Error("Невірний email або пароль");
		setCurrentUserId(user.id);
	};
	const register = (
		email: string,
		password: string,
		phone: string,
		fio: string,
	) => {
		if (users.find((u) => u.email === email))
			throw new Error("Користувач з таким email вже існує");
		const client = createClient(email, password, phone, fio);
		setUsers((prev) => [...prev, client]);
		setCurrentUserId(client.id);
	};
	const logout = () => setCurrentUserId(null);
	const requestPasswordReset = (email: string): string => {
		const user = users.find((u) => u.email === email);
		if (!user) throw new Error("Email не знайдено");
		const code = Math.floor(100_000 + Math.random() * 900_000).toString();
		updateUserInList(user.id, (u) => ({
			...u,
			tempCode: code,
			codeExpiry: Date.now() + 5 * 60 * 1000,
		}));
		console.log(`[AUTH MOCK] Reset code for ${email}: ${code}`);
		return code;
	};
	const verifyResetCode = (email: string, code: string) => {
		const user = users.find((u) => u.email === email);
		if (
			!user ||
			user.tempCode !== code ||
			!user.codeExpiry ||
			Date.now() > user.codeExpiry
		) {
			throw new Error("Невірний або прострочений код");
		}
	};
	const resetPassword = (email: string, newPassword: string) => {
		const user = users.find((u) => u.email === email);
		if (!user) throw new Error("Користувача не знайдено");
		if (!validatePassword(newPassword))
			throw new Error(
				"Пароль має містити мінімум 6 символів та хоча б 1 цифру",
			);
		updateUserInList(user.id, (u) => ({
			...u,
			password: newPassword,
			tempCode: null,
			codeExpiry: null,
		}));
	};

	const selectService = (serviceType: ServiceType, address: string) => {
		const client = requireCurrentClient();
		const contract = createContract(
			client.id,
			client.fio,
			client.phone,
			client.email,
			serviceType,
			address,
		);
		updateUserInList(client.id, (u) => ({...u, contract}) as Client);
	};
	const updateClientProfile = (data: ClientProfileData) => {
		const client = requireCurrentClient();
		updateUserInList(client.id, (u) => {
			if (!isClient(u)) return u;
			const updatedUser: Client = {
				...u,
				fio: data.fio,
				phone: data.phone,
				email: data.email,
			};
			if (u.contract) {
				updatedUser.contract = {
					...u.contract,
					fio: data.fio,
					phone: data.phone,
					email: data.email,
					address: data.address,
					serviceType: data.serviceType,
				};
			}
			return updatedUser;
		});
	};
	const deleteContract = () => {
		const client = requireCurrentClient();
		updateUserInList(client.id, (u) =>
			isClient(u)
				? {
						...u,
						contract: null,
						connectionApproved: false,
						balance: 0,
						equipmentStatus: undefined,
					}
				: u,
		);
	};
	const deleteAccount = () => {
		const client = requireCurrentClient();
		setUsers((prev) => prev.filter((u) => u.id !== client.id));
		setCurrentUserId(null);
	};
	const makePayment = (amount: number, isRecurring: boolean) => {
		const client = requireCurrentClient();
		updateUserInList(client.id, (u) =>
			isClient(u) ? applyPayment(u, amount, isRecurring) : u,
		);
	};
	const toggleRecurringPayment = () => {
		const client = requireCurrentClient();
		updateUserInList(client.id, (u) => (isClient(u) ? toggleRecurring(u) : u));
	};
	const sendClientMessage = (text: string) => {
		const client = requireCurrentClient();
		const message = {
			from: client.email,
			to: "support",
			text,
			timestamp: new Date().toISOString(),
			read: false,
		};
		updateUserInList(client.id, (u) =>
			isClient(u) ? {...u, messages: [...u.messages, message]} : u,
		);
	};
	const sendAutoSupportReply = (text: string) => {
		const client = requireCurrentClient();
		const message = {
			from: "support",
			to: client.email,
			text,
			timestamp: new Date().toISOString(),
			read: true,
		};
		updateUserInList(client.id, (u) =>
			isClient(u) ? {...u, messages: [...u.messages, message]} : u,
		);
	};
	const markSupportMessagesRead = () => {
		const client = requireCurrentClient();
		updateUserInList(client.id, (u) =>
			isClient(u)
				? {
						...u,
						messages: u.messages.map((m) =>
							m.from === "support" ? {...m, read: true} : m,
						),
					}
				: u,
		);
	};

	const editClientInfo = (
		clientId: number,
		data: Partial<Pick<Client, "fio" | "phone" | "email"> & {address: string}>,
	) => {
		updateUserInList(clientId, (u) => {
			if (!isClient(u)) return u;
			const updated: Client = {
				...u,
				...(data.fio !== undefined && {fio: data.fio}),
				...(data.phone !== undefined && {phone: data.phone}),
				...(data.email !== undefined && {email: data.email}),
			};
			if (u.contract) {
				updated.contract = {
					...u.contract,
					...(data.fio !== undefined && {fio: data.fio}),
					...(data.phone !== undefined && {phone: data.phone}),
					...(data.email !== undefined && {email: data.email}),
					...(data.address !== undefined && {address: data.address}),
				};
			}
			return updated;
		});
	};
	const markClientMessagesRead = (clientId: number) => {
		updateUserInList(clientId, (u) =>
			isClient(u)
				? {
						...u,
						messages: u.messages.map((m) =>
							m.from !== "support" ? {...m, read: true} : m,
						),
					}
				: u,
		);
	};
	const sendSupportMessage = (clientId: number, text: string) => {
		const target = getUserById(clientId);
		if (!target || !isClient(target)) return;
		const message = {
			from: "support",
			to: target.email,
			text,
			timestamp: new Date().toISOString(),
			read: false,
		};
		updateUserInList(clientId, (u) =>
			isClient(u) ? {...u, messages: [...u.messages, message]} : u,
		);
	};
	const closeTicket = (clientId: number) => {
		updateUserInList(clientId, (u) => (isClient(u) ? {...u, messages: []} : u));
	};

	const addStaff = (email: string, password: string, name: string) => {
		if (users.find((u) => u.email === email))
			throw new Error("Користувач з таким email вже існує");
		setUsers((prev) => [...prev, createSupport(email, password, name)]);
	};
	const deleteStaff = (email: string) =>
		setUsers((prev) => prev.filter((u) => u.email !== email));
	const deleteClient = (clientId: number) =>
		setUsers((prev) => prev.filter((u) => u.id !== clientId));
	const approveConnection = (clientId: number) => {
		updateUserInList(clientId, (u) =>
			isClient(u) && u.contract
				? {
						...u,
						connectionApproved: true,
						contract: {...u.contract, status: "active"},
						equipmentStatus: "online",
					}
				: u,
		);
	};
	const setEquipmentStatus = (clientId: number, status: EquipmentStatus) =>
		updateUserInList(clientId, (u) =>
			isClient(u) ? {...u, equipmentStatus: status} : u,
		);

	const value: AuthContextValue = {
		users,
		currentUser,
		login,
		register,
		logout,
		getUserById,
		requestPasswordReset,
		verifyResetCode,
		resetPassword,
		selectService,
		updateClientProfile,
		deleteContract,
		deleteAccount,
		makePayment,
		toggleRecurringPayment,
		sendClientMessage,
		sendAutoSupportReply,
		markSupportMessagesRead,
		editClientInfo,
		markClientMessagesRead,
		sendSupportMessage,
		closeTicket,
		addStaff,
		deleteStaff,
		deleteClient,
		approveConnection,
		setEquipmentStatus,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

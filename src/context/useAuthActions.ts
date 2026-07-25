import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AppUser, ClientUser } from "../types/models";
import type { AppError, Result } from "../shared/lib/result";
import { isSuccess } from "../shared/lib/result";
import type { AuthStrategy } from "../services/auth/AuthStrategy";

export interface AuthActions {
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
}

export function useAuthActions(
	authStrategy: AuthStrategy,
	setCurrentUser: Dispatch<SetStateAction<AppUser | null>>,
	refreshUsers: () => Promise<void>
): AuthActions {
	const login = useCallback(
		async (email: string, password: string) => {
			const result = await authStrategy.login(email, password);
			if (isSuccess(result)) {
				setCurrentUser(result.value);
				await refreshUsers();
			}
			return result;
		},
		[authStrategy, refreshUsers, setCurrentUser]
	);

	const register = useCallback(
		async (email: string, password: string, phone: string, fio: string) => {
			const result = await authStrategy.register({
				email,
				password,
				phone,
				fio,
			});
			if (isSuccess(result)) {
				setCurrentUser(result.value);
				await refreshUsers();
			}
			return result;
		},
		[authStrategy, refreshUsers, setCurrentUser]
	);

	const logout = useCallback(async () => {
		await authStrategy.logout();
		setCurrentUser(null);
	}, [authStrategy, setCurrentUser]);

	const adoptSession = useCallback(
		(user: AppUser) => {
			setCurrentUser(user);
		},
		[setCurrentUser]
	);

	return { login, register, logout, adoptSession };
}

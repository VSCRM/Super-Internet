import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Dispatch, SetStateAction } from "react";
import type { AppUser, SupportUser } from "../types/models";
import type { AppError, Result } from "../shared/lib/result";
import { appError, failure, isSuccess, success } from "../shared/lib/result";
import { sanitizeText } from "../shared/lib/sanitize";
import { createSafeId } from "../shared/lib/id";
import { hashPassword } from "../shared/lib/passwordHasher";
import type { UserRepository } from "../services/repositories/UserRepository";

export interface UserActions {
	updateUser: (user: AppUser) => Promise<Result<AppUser, AppError>>;
	deleteUser: (userId: number) => Promise<Result<void, AppError>>;
	getUserById: (id: number) => AppUser | undefined;
	addStaff: (
		email: string,
		password: string,
		name: string
	) => Promise<Result<SupportUser, AppError>>;
	deleteStaff: (email: string) => Promise<Result<void, AppError>>;
}

export function useUserActions(
	repository: UserRepository,
	users: readonly AppUser[],
	setUsers: Dispatch<SetStateAction<AppUser[]>>,
	setCurrentUser: Dispatch<SetStateAction<AppUser | null>>,
	refreshUsers: () => Promise<void>
): UserActions {
	const { t } = useTranslation();
	const updateUser = useCallback(
		async (user: AppUser): Promise<Result<AppUser, AppError>> => {
			const result = await repository.save(user);
			if (isSuccess(result)) {
				setUsers((prev) =>
					prev.map((existing) => (existing.id === user.id ? user : existing))
				);
				setCurrentUser((prev) => (prev?.id === user.id ? user : prev));
			}
			return result;
		},
		[repository, setCurrentUser, setUsers]
	);

	const deleteUser = useCallback(
		async (userId: number): Promise<Result<void, AppError>> => {
			await repository.remove(userId);
			setUsers((prev) => prev.filter((user) => user.id !== userId));
			setCurrentUser((prev) => (prev?.id === userId ? null : prev));
			return success(undefined);
		},
		[repository, setCurrentUser, setUsers]
	);

	const getUserById = useCallback(
		(id: number) => users.find((user) => user.id === id),
		[users]
	);

	const addStaff = useCallback(
		async (
			email: string,
			password: string,
			name: string
		): Promise<Result<SupportUser, AppError>> => {
			const existing = await repository.findByEmail(email);
			if (isSuccess(existing) && existing.value) {
				return failure(appError("EMAIL_TAKEN", t("errors.emailTaken")));
			}

			const { hash, salt } = await hashPassword(password);
			const support: SupportUser = {
				id: createSafeId(),
				email: email.trim().toLowerCase(),
				passwordHash: hash,
				passwordSalt: salt,
				role: "support",
				name: sanitizeText(name),
			};
			const saved = await repository.save(support);
			if (isSuccess(saved)) await refreshUsers();
			return saved as Result<SupportUser, AppError>;
		},
		[refreshUsers, repository, t]
	);

	const deleteStaff = useCallback(
		async (email: string): Promise<Result<void, AppError>> => {
			const lookup = await repository.findByEmail(email);
			if (isSuccess(lookup) && lookup.value) {
				await repository.remove(lookup.value.id);
				await refreshUsers();
			}
			return success(undefined);
		},
		[refreshUsers, repository]
	);

	return { updateUser, deleteUser, getUserById, addStaff, deleteStaff };
}

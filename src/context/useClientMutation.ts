import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AppError, Result } from "../shared/lib/result";
import { appError, failure } from "../shared/lib/result";
import type { AppUser, ClientUser } from "../types/models";
import type { UserRepository } from "../services/repositories/UserRepository";

export type ClientUpdater = (client: ClientUser) => ClientUser;
export type UpdateClient = (
	clientId: number,
	updater: ClientUpdater
) => Promise<Result<ClientUser, AppError>>;

/**
 * Reads the client straight from the repository (never from the `users`
 * React-state closure) immediately before applying `updater` and saving.
 *
 * This matters specifically for handlers invoked after an async gap (e.g. a
 * `setTimeout`-delayed auto-reply, or two chat messages sent in quick
 * succession): a closure that captured `users` from an earlier render would
 * overwrite whatever was written in the meantime, silently dropping the
 * other write. Re-reading fresh data right before the read-modify-write
 * removes that race entirely.
 */
export function useClientMutation(
	repository: UserRepository,
	updateUser: (user: AppUser) => Promise<Result<AppUser, AppError>>
): UpdateClient {
	const { t } = useTranslation();
	return useCallback(
		async (clientId, updater) => {
			const lookup = await repository.findById(clientId);
			if (!lookup.ok) return failure(lookup.error);

			const client = lookup.value;
			if (!client || client.role !== "client") {
				return failure(appError("NOT_FOUND", t("errors.clientNotFound")));
			}

			const updated = updater(client);
			const result = await updateUser(updated);
			return result as Result<ClientUser, AppError>;
		},
		[repository, updateUser, t]
	);
}

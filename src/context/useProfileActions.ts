import { useCallback } from "react";
import type { AppError, Result } from "../shared/lib/result";
import type { ClientUser } from "../types/models";
import { sanitizeText } from "../shared/lib/sanitize";
import type { EditableProfileInput } from "../shared/schemas/profile.schema";
import type { UpdateClient } from "./useClientMutation";

export interface ProfileActions {
	updateProfile: (
		clientId: number,
		input: EditableProfileInput
	) => Promise<Result<ClientUser, AppError>>;
}

export function useProfileActions(updateClient: UpdateClient): ProfileActions {
	const updateProfile = useCallback(
		(clientId: number, input: EditableProfileInput) =>
			// Contract number and equipment id are intentionally never touched here:
			// they are immutable business identifiers, not user-editable profile data.
			updateClient(clientId, (client) => ({
				...client,
				fio: sanitizeText(input.fio),
				phone: input.phone,
			})),
		[updateClient]
	);

	return { updateProfile };
}

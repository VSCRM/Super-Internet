import type { AppUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";
import { failure, success } from "../../shared/lib/result";
import { backendApi } from "./backendApi";
import type { UserDto } from "./dto";
import { mapContract, mapUser } from "./mappers";

/**
 * Backend `UserDto` -> ready-to-use `AppUser`. For a client this also loads
 * the contract (a separate endpoint), which the whole UI reads from
 * `client.contract`. Staff have nothing extra to load here.
 */
export async function hydrateUser(
	dto: UserDto
): Promise<Result<AppUser, AppError>> {
	if (dto.role !== "CLIENT") return success(mapUser(dto));

	const contract = await backendApi.ownContract();
	if (!contract.ok) return failure(contract.error);

	return success(
		mapUser(dto, {
			contract: contract.value ? mapContract(contract.value) : null,
		})
	);
}

/** Re-reads `/auth/me` (+ the contract) for the logged-in user. */
export async function fetchCurrentUser(): Promise<Result<AppUser, AppError>> {
	const me = await backendApi.me();
	if (!me.ok) return failure(me.error);
	return hydrateUser(me.value);
}

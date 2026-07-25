import { env } from "../../shared/config/env";
import { ApiUserRepository, LocalUserRepository } from "./LocalUserRepository";
import type { UserRepository } from "./UserRepository";

let cachedRepository: UserRepository | null = null;

/**
 * Factory pattern: the rest of the application asks for "the current user
 * repository" without knowing or caring whether it is backed by
 * localStorage (mock mode) or a real HTTP API.
 */
export function getUserRepository(): UserRepository {
	if (!cachedRepository) {
		cachedRepository = env.backendMode
			? new ApiUserRepository()
			: new LocalUserRepository();
	}
	return cachedRepository;
}

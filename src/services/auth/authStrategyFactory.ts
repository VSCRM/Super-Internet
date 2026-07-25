import { env } from "../../shared/config/env";
import { getUserRepository } from "../repositories/userRepositoryFactory";
import { ApiAuthStrategy } from "./ApiAuthStrategy";
import type { AuthStrategy } from "./AuthStrategy";
import { LocalAuthStrategy } from "./LocalAuthStrategy";

let cachedStrategy: AuthStrategy | null = null;

/**
 * Factory pattern: callers ask for "the active auth strategy" without
 * branching on `env.backendMode` themselves. Flipping the env var swaps the
 * entire authentication mechanism with zero changes to consuming code.
 */
export function getAuthStrategy(): AuthStrategy {
	if (!cachedStrategy) {
		cachedStrategy = env.backendMode
			? new ApiAuthStrategy()
			: new LocalAuthStrategy(getUserRepository());
	}
	return cachedStrategy;
}

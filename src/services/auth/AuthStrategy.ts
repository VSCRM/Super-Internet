import type { AppUser, ClientUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";

export interface RegisterPayload {
	readonly email: string;
	readonly password: string;
	readonly phone: string;
	readonly fio: string;
}

/**
 * Strategy pattern: the UI layer (AuthScreen, AppContext) depends only on
 * this interface. `LocalAuthStrategy` simulates a session entirely in the
 * browser (Mock mode). `ApiAuthStrategy` is architected for a real backend
 * that issues a JWT inside an HttpOnly cookie - the strategy never reads or
 * stores the token itself, it only asks the browser to send credentials
 * (`withCredentials: true`) and asks the server "who am I" on boot.
 */
export interface AuthStrategy {
	login(email: string, password: string): Promise<Result<AppUser, AppError>>;
	register(payload: RegisterPayload): Promise<Result<ClientUser, AppError>>;
	logout(): Promise<Result<void, AppError>>;
	/** Resolves the currently authenticated user from the active session, if any. */
	getSession(): Promise<Result<AppUser | null, AppError>>;
}

import type { AppUser, ClientUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";
import { failure, success } from "../../shared/lib/result";
import { backendApi } from "../api/backendApi";
import { fetchCurrentUser, hydrateUser } from "../api/backendSession";
import { clearToken, readToken, writeToken } from "../api/tokenStore";
import type { AuthDto } from "../api/dto";
import type { AuthStrategy, RegisterPayload } from "./AuthStrategy";

/**
 * Turns a successful `{ token, user }` response into a session: stores the
 * token, then loads whatever else the UI needs for that user.
 */
async function startSession(auth: AuthDto): Promise<Result<AppUser, AppError>> {
	writeToken(auth.token);
	const user = await hydrateUser(auth.user);
	if (!user.ok) clearToken();
	return user;
}

/**
 * Real-backend authentication (Spring Boot, stateless JWT).
 *
 * Contract with the backend:
 *  - POST /api/auth/login     { email, password }              -> { token, user }
 *  - POST /api/auth/register  { email, phone, fio, password }  -> { token, user }
 *  - GET  /api/auth/me        (Authorization: Bearer <token>)  -> user, or 401
 *  - Google: browser navigates to <backend>/oauth2/authorization/google and
 *    comes back to /oauth-callback#token=<jwt> (see OAuthCallbackPage).
 *
 * There is no logout endpoint: a JWT is stateless, so logging out simply
 * means forgetting the token.
 */
export class ApiAuthStrategy implements AuthStrategy {
	public async login(
		email: string,
		password: string
	): Promise<Result<AppUser, AppError>> {
		const response = await backendApi.login(email.trim(), password);
		if (!response.ok) return failure(response.error);
		return startSession(response.value);
	}

	public async register(
		payload: RegisterPayload
	): Promise<Result<ClientUser, AppError>> {
		const response = await backendApi.register({
			email: payload.email.trim(),
			phone: payload.phone.trim(),
			fio: payload.fio.trim(),
			password: payload.password,
		});
		if (!response.ok) return failure(response.error);

		const user = await startSession(response.value);
		if (!user.ok) return failure(user.error);
		return success(user.value as ClientUser);
	}

	public async logout(): Promise<Result<void, AppError>> {
		clearToken();
		return success(undefined);
	}

	public async getSession(): Promise<Result<AppUser | null, AppError>> {
		if (!readToken()) return success(null);

		const user = await fetchCurrentUser();
		if (user.ok) return user;

		// 401 / 403: the token is expired or no longer valid - not an error to show, just "logged out".
		if (user.error.code === "HTTP_401" || user.error.code === "HTTP_403") {
			clearToken();
			return success(null);
		}
		return failure(user.error);
	}
}

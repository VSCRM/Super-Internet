import axios from "axios";
import type { AppUser, ClientUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import { env } from "../../shared/config/env";
import i18n from "../../i18n";
import type { AuthStrategy, RegisterPayload } from "./AuthStrategy";

const apiClient = axios.create({
	baseURL: env.apiBaseUrl,
	// Required so the browser sends/receives the HttpOnly session cookie set
	// by the server on `/auth/login`. The JWT itself is never visible to this
	// code - it lives only in the cookie jar managed by the browser.
	withCredentials: true,
	// Double-submit-cookie CSRF protection: the backend is expected to set a
	// separate, readable `XSRF-TOKEN` cookie (NOT HttpOnly - the whole point
	// is that JS can read it back). Axios automatically echoes its value in
	// the `X-XSRF-TOKEN` header on every request, and the server rejects any
	// state-changing request where the header doesn't match the cookie. This
	// is required even though the session cookie is HttpOnly and SameSite,
	// because relying on SameSite alone is not a complete CSRF defense
	// (e.g. top-level navigations, older browsers, some cross-site GETs).
	xsrfCookieName: "XSRF-TOKEN",
	xsrfHeaderName: "X-XSRF-TOKEN",
});

function toAppError(error: unknown): AppError {
	if (axios.isAxiosError(error)) {
		const message =
			(error.response?.data as { message?: string } | undefined)?.message ??
			error.message;
		return appError(`HTTP_${error.response?.status ?? "NETWORK"}`, message);
	}
	return appError("UNKNOWN", i18n.t("errors.unknownServerError"));
}

/**
 * Production authentication strategy. The backend contract this strategy
 * expects:
 *  - POST /auth/login        { email, password }  -> sets HttpOnly cookie, returns AppUser
 *  - POST /auth/register     RegisterPayload       -> sets HttpOnly cookie, returns ClientUser
 *  - POST /auth/logout       -> clears the cookie server-side
 *  - GET  /auth/session      -> returns the current AppUser or 401
 *
 * No token is ever read, stored, or attached to headers manually - the
 * browser does that automatically for `withCredentials` requests, which is
 * exactly what makes the HttpOnly approach resistant to XSS-based token theft.
 */
export class ApiAuthStrategy implements AuthStrategy {
	public async login(
		email: string,
		password: string
	): Promise<Result<AppUser, AppError>> {
		try {
			const response = await apiClient.post<AppUser>("/auth/login", {
				email,
				password,
			});
			return success(response.data);
		} catch (error) {
			return failure(toAppError(error));
		}
	}

	public async register(
		payload: RegisterPayload
	): Promise<Result<ClientUser, AppError>> {
		try {
			const response = await apiClient.post<ClientUser>(
				"/auth/register",
				payload
			);
			return success(response.data);
		} catch (error) {
			return failure(toAppError(error));
		}
	}

	public async logout(): Promise<Result<void, AppError>> {
		try {
			await apiClient.post("/auth/logout");
			return success(undefined);
		} catch (error) {
			return failure(toAppError(error));
		}
	}

	public async getSession(): Promise<Result<AppUser | null, AppError>> {
		try {
			const response = await apiClient.get<AppUser>("/auth/session");
			return success(response.data);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				return success(null);
			}
			return failure(toAppError(error));
		}
	}
}

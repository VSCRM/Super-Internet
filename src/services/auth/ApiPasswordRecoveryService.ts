import type { AppUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";
import { failure } from "../../shared/lib/result";
import { backendApi } from "../api/backendApi";
import { hydrateUser } from "../api/backendSession";
import { clearToken, writeToken } from "../api/tokenStore";
import type { PasswordRecovery } from "./PasswordRecoveryService";

/**
 * Password recovery against the Spring backend:
 *  - POST /auth/password-recovery/request  { email }                    (backend emails or logs the code)
 *  - POST /auth/password-recovery/verify   { email, code }              (does not consume the code)
 *  - POST /auth/password-recovery/reset    { email, code, newPassword } -> { token, user }
 *
 * Attempt limiting, code expiry and "unknown email" handling are enforced by
 * the server, so none of that is duplicated here.
 */
export class ApiPasswordRecoveryService implements PasswordRecovery {
	public requestCode(email: string): Promise<Result<void, AppError>> {
		return backendApi.requestRecovery(email.trim());
	}

	public verifyCode(
		email: string,
		code: string
	): Promise<Result<void, AppError>> {
		return backendApi.verifyRecovery(email.trim(), code.trim());
	}

	public async resetPasswordAndLogin(
		email: string,
		code: string,
		newPassword: string
	): Promise<Result<AppUser, AppError>> {
		const response = await backendApi.resetPassword(
			email.trim(),
			code.trim(),
			newPassword.trim()
		);
		if (!response.ok) return failure(response.error);

		writeToken(response.value.token);
		const user = await hydrateUser(response.value.user);
		if (!user.ok) clearToken();
		return user;
	}
}

import type { AppError, Result } from "../../shared/lib/result";
import { success } from "../../shared/lib/result";
import type { EmailService, RecoveryCodeEmail } from "./EmailService";

/**
 * Safe local fallback: logs the recovery code instead of sending an email.
 * Used automatically whenever EmailJS credentials are not configured, so
 * the password-recovery flow remains fully testable offline.
 */
export class ConsoleEmailService implements EmailService {
	public async sendRecoveryCode(
		payload: RecoveryCodeEmail
	): Promise<Result<void, AppError>> {
		console.info(
			`[ConsoleEmailService] Recovery code for ${payload.toEmail}: ${payload.code}`
		);
		return success(undefined);
	}
}

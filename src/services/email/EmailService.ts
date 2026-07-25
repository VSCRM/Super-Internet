import type { AppError, Result } from "../../shared/lib/result";

export interface RecoveryCodeEmail {
	readonly toEmail: string;
	readonly recipientName: string;
	readonly code: string;
	/** ISO timestamp of when the code stops being valid. */
	readonly expiresAt: string;
}

/**
 * Abstraction over the email delivery mechanism. `EmailJsService` sends a
 * real email through EmailJS whenever credentials are configured -
 * regardless of VITE_BACKEND_MODE, since sending a real recovery email is
 * independent from whether the rest of the app talks to a mock or real
 * backend. `ConsoleEmailService` is the fallback used only when EmailJS
 * credentials are absent, so development never depends on live
 * credentials or a real mailbox.
 */
export interface EmailService {
	sendRecoveryCode(payload: RecoveryCodeEmail): Promise<Result<void, AppError>>;
}

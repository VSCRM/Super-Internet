import emailjs from "@emailjs/browser";
import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import { env } from "../../shared/config/env";
import type { EmailService, RecoveryCodeEmail } from "./EmailService";
import i18n from "../../i18n";

const DATE_LOCALES: Record<string, string> = { uk: "uk-UA", en: "en-US" };

function formatExpiryTime(isoTimestamp: string): string {
	const locale = DATE_LOCALES[i18n.language] ?? "uk-UA";
	return new Date(isoTimestamp).toLocaleTimeString(locale, {
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Sends the password-recovery code via EmailJS (https://www.emailjs.com/).
 * Requires VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and
 * VITE_EMAILJS_PUBLIC_KEY. The configured template is expected to expose
 * `{{to_email}}`, `{{to_name}}`, `{{passcode}}` and `{{time}}` placeholders
 * (see emailjs-template/recovery-code.html in this repository for a
 * ready-to-import template matching the product's visual style).
 */
export class EmailJsService implements EmailService {
	public async sendRecoveryCode(
		payload: RecoveryCodeEmail
	): Promise<Result<void, AppError>> {
		if (
			!env.emailJsServiceId ||
			!env.emailJsTemplateId ||
			!env.emailJsPublicKey
		) {
			return failure(
				appError(
					"EMAILJS_NOT_CONFIGURED",
					"EmailJS credentials are not configured"
				)
			);
		}

		try {
			await emailjs.send(
				env.emailJsServiceId,
				env.emailJsTemplateId,
				{
					to_email: payload.toEmail,
					to_name: payload.recipientName,
					passcode: payload.code,
					time: formatExpiryTime(payload.expiresAt),
				},
				{ publicKey: env.emailJsPublicKey }
			);
			return success(undefined);
		} catch {
			return failure(
				appError("EMAILJS_SEND_FAILED", i18n.t("errors.emailSendFailed"))
			);
		}
	}
}

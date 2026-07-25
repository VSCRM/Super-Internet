import { isEmailJsConfigured } from "../../shared/config/env";
import { ConsoleEmailService } from "./ConsoleEmailService";
import { EmailJsService } from "./EmailJsService";
import type { EmailService } from "./EmailService";

/**
 * EmailJS is used whenever credentials are configured, regardless of
 * VITE_BACKEND_MODE - the email delivery mechanism is independent of
 * whether the rest of the app uses a real backend or the local mock.
 *
 * No module-level singleton here: the factory is cheap and environment
 * variables are read once at module load time from `env.ts`, so a fresh
 * call on every page load is fine and avoids stale-credential bugs during
 * hot-module-replacement in development.
 */
export function getEmailService(): EmailService {
	return isEmailJsConfigured()
		? new EmailJsService()
		: new ConsoleEmailService();
}

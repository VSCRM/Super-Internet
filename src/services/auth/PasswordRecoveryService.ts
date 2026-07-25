import type { AppUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import { sanitizeEmail } from "../../shared/lib/sanitize";
import { hashPassword } from "../../shared/lib/passwordHasher";
import { RateLimiter } from "../../shared/lib/rateLimiter";
import type { UserRepository } from "../repositories/UserRepository";
import type { EmailService } from "../email/EmailService";
import { setMockSessionCookie } from "./mockSessionCookie";
import i18n from "../../i18n";

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const CODE_LOCKOUT_MS = 60_000;

function generateSixDigitCode(): string {
	return Math.floor(100_000 + Math.random() * 900_000).toString();
}

function displayName(user: AppUser): string {
	if (user.role === "client") return user.fio;
	if (user.role === "support") return user.name;
	return user.email;
}

/**
 * Encapsulates the full password-recovery flow as a single cohesive service
 * (Single Responsibility), independent from UI state. The recovery code and
 * its expiry are persisted on the user record via the repository so the
 * flow survives a page reload between steps.
 */
export class PasswordRecoveryService {
	private readonly userRepository: UserRepository;
	private readonly emailService: EmailService;
	// A 6-digit code is only 1,000,000 combinations - without a lockout an
	// attacker could brute-force it well within the 5-minute TTL. Same
	// in-memory caveat as LocalAuthStrategy's login limiter applies.
	private readonly codeLimiter = new RateLimiter(
		MAX_CODE_ATTEMPTS,
		CODE_LOCKOUT_MS
	);

	public constructor(
		userRepository: UserRepository,
		emailService: EmailService
	) {
		this.userRepository = userRepository;
		this.emailService = emailService;
	}

	public async requestCode(email: string): Promise<Result<void, AppError>> {
		const normalizedEmail = sanitizeEmail(email);
		this.codeLimiter.reset(normalizedEmail);

		const lookup = await this.userRepository.findByEmail(normalizedEmail);
		if (!lookup.ok) return failure(lookup.error);

		const user = lookup.value;
		if (!user) {
			return failure(
				appError("USER_NOT_FOUND", i18n.t("errors.userNotFoundByEmail"))
			);
		}

		const code = generateSixDigitCode();
		const expiresAt = Date.now() + CODE_TTL_MS;
		const updated: AppUser = {
			...user,
			tempCode: code,
			codeExpiry: expiresAt,
		} as AppUser;

		const saveResult = await this.userRepository.save(updated);
		if (!saveResult.ok) return failure(saveResult.error);

		return this.emailService.sendRecoveryCode({
			toEmail: user.email,
			recipientName: displayName(user),
			code,
			expiresAt: new Date(expiresAt).toISOString(),
		});
	}

	public async verifyCode(
		email: string,
		code: string
	): Promise<Result<void, AppError>> {
		const normalizedEmail = sanitizeEmail(email);

		if (this.codeLimiter.isLocked(normalizedEmail)) {
			const seconds = this.codeLimiter.remainingLockoutSeconds(normalizedEmail);
			return failure(
				appError("LOCKED_OUT", i18n.t("errors.lockedOutCode", { seconds }))
			);
		}

		const lookup = await this.userRepository.findByEmail(normalizedEmail);
		if (!lookup.ok) return failure(lookup.error);

		const user = lookup.value;
		const storedCode = user && "tempCode" in user ? user.tempCode : null;
		const expiry = user && "codeExpiry" in user ? user.codeExpiry : null;

		if (!user || storedCode !== code.trim() || !expiry || Date.now() > expiry) {
			this.codeLimiter.registerFailure(normalizedEmail);
			return failure(appError("INVALID_CODE", i18n.t("errors.invalidCode")));
		}

		this.codeLimiter.reset(normalizedEmail);
		return success(undefined);
	}

	/** Verifies the code, sets the new password, clears the code, and starts a session (auto-login). */
	public async resetPasswordAndLogin(
		email: string,
		code: string,
		newPassword: string
	): Promise<Result<AppUser, AppError>> {
		const verification = await this.verifyCode(email, code);
		if (!verification.ok) return failure(verification.error);

		const lookup = await this.userRepository.findByEmail(sanitizeEmail(email));
		if (!lookup.ok) return failure(lookup.error);
		if (!lookup.value)
			return failure(appError("USER_NOT_FOUND", i18n.t("errors.userNotFound")));

		const { hash, salt } = await hashPassword(newPassword.trim());
		const updated: AppUser = {
			...lookup.value,
			passwordHash: hash,
			passwordSalt: salt,
			tempCode: null,
			codeExpiry: null,
		} as AppUser;

		const saveResult = await this.userRepository.save(updated);
		if (!saveResult.ok) return failure(saveResult.error);

		setMockSessionCookie(updated.id);
		return success(updated);
	}
}

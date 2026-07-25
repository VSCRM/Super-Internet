import type { AppUser, ClientUser } from "../../types/models";
import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import {
	sanitizeEmail,
	sanitizePhone,
	sanitizeText,
} from "../../shared/lib/sanitize";
import { createSafeId } from "../../shared/lib/id";
import { hashPassword, verifyPassword } from "../../shared/lib/passwordHasher";
import { RateLimiter } from "../../shared/lib/rateLimiter";
import type { UserRepository } from "../repositories/UserRepository";
import type { AuthStrategy, RegisterPayload } from "./AuthStrategy";
import {
	clearMockSessionCookie,
	readMockSessionCookie,
	setMockSessionCookie,
} from "./mockSessionCookie";
import i18n from "../../i18n";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 60_000;

async function createClientUser(payload: RegisterPayload): Promise<ClientUser> {
	const { hash, salt } = await hashPassword(payload.password);

	return {
		id: createSafeId(),
		email: sanitizeEmail(payload.email),
		passwordHash: hash,
		passwordSalt: salt,
		role: "client",
		phone: sanitizePhone(payload.phone),
		fio: sanitizeText(payload.fio),
		contract: null,
		balance: 0,
		messages: [],
		lastPaymentDate: new Date().toISOString(),
		connectionApproved: false,
		unreadMessages: 0,
	};
}

export class LocalAuthStrategy implements AuthStrategy {
	private readonly userRepository: UserRepository;
	// See RateLimiter's own doc comment: in-memory only, a UX speed bump for
	// Mock mode - a real backend must enforce this independently (per-account
	// AND per-IP), since this state resets on every page reload.
	private readonly loginLimiter = new RateLimiter(
		MAX_LOGIN_ATTEMPTS,
		LOGIN_LOCKOUT_MS
	);

	public constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	public async login(
		email: string,
		password: string
	): Promise<Result<AppUser, AppError>> {
		const normalizedEmail = sanitizeEmail(email);

		if (this.loginLimiter.isLocked(normalizedEmail)) {
			const seconds =
				this.loginLimiter.remainingLockoutSeconds(normalizedEmail);
			return failure(
				appError("LOCKED_OUT", i18n.t("errors.lockedOutLogin", { seconds }))
			);
		}

		const lookup = await this.userRepository.findByEmail(normalizedEmail);
		if (!lookup.ok) return failure(lookup.error);

		const user = lookup.value;
		if (!user) {
			this.loginLimiter.registerFailure(normalizedEmail);
			return failure(
				appError("INVALID_CREDENTIALS", i18n.t("errors.invalidCredentials"))
			);
		}

		const isPasswordCorrect = await verifyPassword(
			password.trim(),
			user.passwordHash,
			user.passwordSalt
		);
		if (!isPasswordCorrect) {
			this.loginLimiter.registerFailure(normalizedEmail);
			return failure(
				appError("INVALID_CREDENTIALS", i18n.t("errors.invalidCredentials"))
			);
		}

		this.loginLimiter.reset(normalizedEmail);
		setMockSessionCookie(user.id);
		return success(user);
	}

	public async register(
		payload: RegisterPayload
	): Promise<Result<ClientUser, AppError>> {
		const existing = await this.userRepository.findByEmail(payload.email);
		if (!existing.ok) return failure(existing.error);

		if (existing.value) {
			return failure(appError("EMAIL_TAKEN", i18n.t("errors.emailTaken")));
		}

		const client = await createClientUser(payload);
		const saved = await this.userRepository.save(client);
		if (!saved.ok) return failure(saved.error);

		setMockSessionCookie(client.id);
		return success(client);
	}

	public async logout(): Promise<Result<void, never>> {
		clearMockSessionCookie();
		return success(undefined);
	}

	public async getSession(): Promise<Result<AppUser | null, AppError>> {
		const sessionUserId = readMockSessionCookie();
		if (sessionUserId === null) return success(null);

		const lookup = await this.userRepository.findById(sessionUserId);
		if (!lookup.ok) return failure(lookup.error);

		return success(lookup.value);
	}
}

import { beforeEach, describe, expect, it } from "vitest";
import { LocalUserRepository } from "../../services/repositories/LocalUserRepository";
import { LocalAuthStrategy } from "../../services/auth/LocalAuthStrategy";
import { PasswordRecoveryService } from "../../services/auth/PasswordRecoveryService";
import { ConsoleEmailService } from "../../services/email/ConsoleEmailService";
import { clearMockSessionCookie } from "../../services/auth/mockSessionCookie";

describe("PasswordRecoveryService", () => {
	beforeEach(() => {
		window.localStorage.clear();
		clearMockSessionCookie();
	});

	async function registerTestUser(repository: LocalUserRepository) {
		const authStrategy = new LocalAuthStrategy(repository);
		await authStrategy.register({
			email: "recover@gmail.com",
			password: "old12345",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});
		await authStrategy.logout();
	}

	it("rejects a code request for an email that does not exist", async () => {
		const repository = new LocalUserRepository();
		const service = new PasswordRecoveryService(
			repository,
			new ConsoleEmailService()
		);

		const result = await service.requestCode("ghost@gmail.com");
		expect(result.ok).toBe(false);
	});

	it("completes the full recovery flow and auto-logs in with the new password", async () => {
		const repository = new LocalUserRepository();
		await registerTestUser(repository);

		const service = new PasswordRecoveryService(
			repository,
			new ConsoleEmailService()
		);
		await service.requestCode("recover@gmail.com");

		const stored = await repository.findByEmail("recover@gmail.com");
		const code =
			stored.ok && stored.value && "tempCode" in stored.value
				? stored.value.tempCode
				: null;
		expect(code).toBeTruthy();

		const verify = await service.verifyCode(
			"recover@gmail.com",
			code as string
		);
		expect(verify.ok).toBe(true);

		const reset = await service.resetPasswordAndLogin(
			"recover@gmail.com",
			code as string,
			"newpass99"
		);
		expect(reset.ok).toBe(true);
		if (reset.ok) {
			expect(reset.value.passwordHash).toBeTruthy();
			expect(reset.value.passwordHash).not.toBe(
				stored.ok && stored.value && "passwordHash" in stored.value
					? stored.value.passwordHash
					: null
			);
		}

		const authStrategy = new LocalAuthStrategy(repository);
		const session = await authStrategy.getSession();
		expect(session.ok && session.value?.email).toBe("recover@gmail.com");

		await authStrategy.logout();
		const loginWithNewPassword = await authStrategy.login(
			"recover@gmail.com",
			"newpass99"
		);
		expect(loginWithNewPassword.ok).toBe(true);

		const loginWithOldPassword = await authStrategy.login(
			"recover@gmail.com",
			"old12345"
		);
		expect(loginWithOldPassword.ok).toBe(false);
	});

	it("rejects verification with an incorrect code", async () => {
		const repository = new LocalUserRepository();
		await registerTestUser(repository);

		const service = new PasswordRecoveryService(
			repository,
			new ConsoleEmailService()
		);
		await service.requestCode("recover@gmail.com");

		const result = await service.verifyCode("recover@gmail.com", "000000");
		expect(result.ok).toBe(false);
	});

	it("locks out code verification after repeated wrong guesses, even with the correct code", async () => {
		const repository = new LocalUserRepository();
		await registerTestUser(repository);

		const service = new PasswordRecoveryService(
			repository,
			new ConsoleEmailService()
		);
		await service.requestCode("recover@gmail.com");

		const stored = await repository.findByEmail("recover@gmail.com");
		const code =
			stored.ok && stored.value && "tempCode" in stored.value
				? stored.value.tempCode
				: null;
		expect(code).toBeTruthy();

		for (let i = 0; i < 5; i += 1) {
			await service.verifyCode("recover@gmail.com", "000000");
		}

		const result = await service.verifyCode(
			"recover@gmail.com",
			code as string
		);
		expect(result.ok).toBe(false);
		expect(!result.ok && result.error.code).toBe("LOCKED_OUT");
	});
});

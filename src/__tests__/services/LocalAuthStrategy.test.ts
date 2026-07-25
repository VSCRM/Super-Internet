import { beforeEach, describe, expect, it } from "vitest";
import { LocalUserRepository } from "../../services/repositories/LocalUserRepository";
import { LocalAuthStrategy } from "../../services/auth/LocalAuthStrategy";
import { clearMockSessionCookie } from "../../services/auth/mockSessionCookie";

describe("LocalAuthStrategy", () => {
	beforeEach(() => {
		window.localStorage.clear();
		clearMockSessionCookie();
	});

	it("registers a new client and starts a session", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		const result = await strategy.register({
			email: "new@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});

		expect(result.ok).toBe(true);

		const session = await strategy.getSession();
		expect(session.ok && session.value?.email).toBe("new@gmail.com");
	});

	it("rejects registration when the email is already taken", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		await strategy.register({
			email: "dup@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});

		const second = await strategy.register({
			email: "dup@gmail.com",
			password: "other123",
			phone: "+380509999999",
			fio: "Петров Петро Петрович",
		});

		expect(second.ok).toBe(false);
		if (!second.ok) expect(second.error.code).toBe("EMAIL_TAKEN");
	});

	it("logs in successfully with correct credentials regardless of email case", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		await strategy.register({
			email: "case@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});
		await strategy.logout();

		const result = await strategy.login("CASE@gmail.com", "pass123");
		expect(result.ok).toBe(true);
	});

	it("rejects login with an incorrect password", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		await strategy.register({
			email: "wrongpass@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});
		await strategy.logout();

		const result = await strategy.login("wrongpass@gmail.com", "incorrect1");
		expect(result.ok).toBe(false);
	});

	it("clears the session on logout", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		await strategy.register({
			email: "logout@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});

		await strategy.logout();

		const session = await strategy.getSession();
		expect(session.ok && session.value).toBeNull();
	});

	it("locks out login after repeated failed attempts, even with the correct password", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		await strategy.register({
			email: "lockout@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});
		await strategy.logout();

		for (let i = 0; i < 5; i += 1) {
			await strategy.login("lockout@gmail.com", "wrongpassword");
		}

		const result = await strategy.login("lockout@gmail.com", "pass123");
		expect(result.ok).toBe(false);
		expect(!result.ok && result.error.code).toBe("LOCKED_OUT");
	});

	it("resets the failure counter after a successful login", async () => {
		const repository = new LocalUserRepository();
		const strategy = new LocalAuthStrategy(repository);

		await strategy.register({
			email: "reset@gmail.com",
			password: "pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});
		await strategy.logout();

		await strategy.login("reset@gmail.com", "wrongpassword");
		await strategy.login("reset@gmail.com", "wrongpassword");
		const successful = await strategy.login("reset@gmail.com", "pass123");
		expect(successful.ok).toBe(true);

		// Two prior failures should not carry over and count towards a lockout now.
		await strategy.logout();
		await strategy.login("reset@gmail.com", "wrongpassword");
		const stillWorks = await strategy.login("reset@gmail.com", "pass123");
		expect(stillWorks.ok).toBe(true);
	});
});

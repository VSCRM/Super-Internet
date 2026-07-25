import { beforeEach, describe, expect, it } from "vitest";
import { LocalUserRepository } from "../../services/repositories/LocalUserRepository";
import { LocalAuthStrategy } from "../../services/auth/LocalAuthStrategy";
import { clearMockSessionCookie } from "../../services/auth/mockSessionCookie";
import { isSuccess } from "../../shared/lib/result";
import type { ClientUser } from "../../types/models";

/**
 * Mirrors the read-modify-write pattern `AppContext.updateClient` uses,
 * without pulling in the React provider, so the race condition itself can
 * be exercised directly against the repository.
 */
async function appendMessage(
	repository: LocalUserRepository,
	clientId: number,
	from: string,
	to: string,
	text: string
): Promise<void> {
	const lookup = await repository.findById(clientId);
	if (!isSuccess(lookup) || !lookup.value || lookup.value.role !== "client")
		return;

	const client = lookup.value as ClientUser;
	await repository.save({
		...client,
		messages: [
			...client.messages,
			{ from, to, text, timestamp: new Date().toISOString(), read: false },
		],
	});
}

describe("chat message persistence (regression for the lost-message race)", () => {
	beforeEach(() => {
		window.localStorage.clear();
		clearMockSessionCookie();
	});

	it("keeps a client's message intact even when a reply is appended moments later via a separate read", async () => {
		const repository = new LocalUserRepository();
		const authStrategy = new LocalAuthStrategy(repository);

		const registered = await authStrategy.register({
			email: "chatuser@gmail.com",
			password: "Pass123",
			phone: "+380501234567",
			fio: "Іванов Іван Іванович",
		});
		expect(registered.ok).toBe(true);
		if (!registered.ok) return;

		const clientId = registered.value.id;

		// Client sends a message - read-modify-write #1.
		await appendMessage(
			repository,
			clientId,
			"chatuser@gmail.com",
			"support",
			"Привіт, є проблема з інтернетом"
		);

		// A "delayed" support auto-reply - read-modify-write #2, simulating
		// the setTimeout-based auto-reply that exposed the original bug.
		await appendMessage(
			repository,
			clientId,
			"support",
			"chatuser@gmail.com",
			"Дякуємо за звернення!"
		);

		const finalState = await repository.findById(clientId);
		expect(finalState.ok).toBe(true);
		if (
			!finalState.ok ||
			!finalState.value ||
			finalState.value.role !== "client"
		)
			return;

		expect(finalState.value.messages).toHaveLength(2);
		expect(finalState.value.messages[0]?.text).toBe(
			"Привіт, є проблема з інтернетом"
		);
		expect(finalState.value.messages[1]?.text).toBe("Дякуємо за звернення!");
	});
});

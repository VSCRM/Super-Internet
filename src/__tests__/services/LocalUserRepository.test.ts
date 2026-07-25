import { beforeEach, describe, expect, it } from "vitest";
import { LocalUserRepository } from "../../services/repositories/LocalUserRepository";
import type { ClientUser } from "../../types/models";

function buildClient(overrides: Partial<ClientUser> = {}): ClientUser {
	return {
		id: 1,
		email: "client@gmail.com",
		passwordHash: "test-hash",
		passwordSalt: "test-salt",
		role: "client",
		phone: "+380501234567",
		fio: "Іванов Іван Іванович",
		contract: null,
		balance: 0,
		messages: [],
		lastPaymentDate: new Date().toISOString(),
		connectionApproved: false,
		unreadMessages: 0,
		...overrides,
	};
}

describe("LocalUserRepository", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("returns an empty list when nothing has been persisted yet", async () => {
		const repository = new LocalUserRepository();
		const result = await repository.findAll();
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toEqual([]);
	});

	it("persists a saved user and can find it by id and email", async () => {
		const repository = new LocalUserRepository();
		const client = buildClient();

		await repository.save(client);

		const byId = await repository.findById(client.id);
		const byEmail = await repository.findByEmail("CLIENT@gmail.com");

		expect(byId.ok && byId.value?.email).toBe("client@gmail.com");
		expect(byEmail.ok && byEmail.value?.id).toBe(client.id);
	});

	it("overwrites an existing user with the same id instead of duplicating it", async () => {
		const repository = new LocalUserRepository();
		const client = buildClient();

		await repository.save(client);
		await repository.save({ ...client, balance: 500 });

		const all = await repository.findAll();
		const savedUser = all.ok ? all.value[0] : undefined;
		expect(all.ok && all.value).toHaveLength(1);
		expect(savedUser?.role === "client" ? savedUser.balance : null).toBe(500);
	});

	it("removes a user by id", async () => {
		const repository = new LocalUserRepository();
		const client = buildClient();
		await repository.save(client);

		await repository.remove(client.id);

		const all = await repository.findAll();
		expect(all.ok && all.value).toHaveLength(0);
	});
});

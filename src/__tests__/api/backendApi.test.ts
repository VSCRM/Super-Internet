import { afterEach, describe, expect, it } from "vitest";
import { backendApi } from "../../services/api/backendApi";
import { clearToken, writeToken } from "../../services/api/tokenStore";
import { bodyOf, restoreBackend, stubBackend } from "./httpStub";

describe("backendApi request shapes", () => {
	afterEach(() => {
		restoreBackend();
		clearToken();
	});

	it("sends the Bearer token on every call", async () => {
		writeToken("tok");
		const { calls } = stubBackend(() => ({ status: 200, data: [] }));
		await backendApi.listUsers();
		expect(calls[0].headers.get("Authorization")).toBe("Bearer tok");
	});

	it("filters users by upper-case role", async () => {
		const { calls } = stubBackend(() => ({ status: 200, data: [] }));
		await backendApi.listUsers("SUPPORT");
		expect(calls[0].url).toBe("/users");
		expect(calls[0].params).toEqual({ role: "SUPPORT" });
	});

	it("tops up with an amount and only sends `recurring` when asked", async () => {
		const { calls } = stubBackend(() => ({ status: 201, data: {} }));
		await backendApi.topUp(250);
		await backendApi.topUp(250, true);
		expect(bodyOf(calls[0])).toEqual({ amount: 250 });
		expect(bodyOf(calls[1])).toEqual({ amount: 250, recurring: true });
	});

	it("starts a Privat24 checkout and returns the payment URL", async () => {
		const { calls } = stubBackend(() => ({
			status: 200,
			data: { paymentUrl: "https://www.liqpay.ua/api/3/checkout/?data=x" },
		}));
		const result = await backendApi.startPrivat24Checkout(250, false);
		await backendApi.startPrivat24Checkout(250, true);

		expect(calls[0].url).toBe("/payments/privat24/checkout");
		expect(result).toEqual({
			ok: true,
			value: { paymentUrl: "https://www.liqpay.ua/api/3/checkout/?data=x" },
		});
		// `recurring: false` would switch off a recurring payment the client already has
		expect(bodyOf(calls[0])).toEqual({ amount: 250 });
		expect(bodyOf(calls[1])).toEqual({ amount: 250, recurring: true });
	});

	it("reports 501 from the checkout when the bank keys are not set on the backend", async () => {
		stubBackend(() => ({ status: 501, data: { title: "Not Implemented" } }));
		const result = await backendApi.startPrivat24Checkout(250, false);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.code).toBe("HTTP_501");
	});

	it("treats a 404 on /contracts/me as 'no contract yet', not as an error", async () => {
		stubBackend(() => ({ status: 404, data: { title: "Not Found" } }));
		const result = await backendApi.ownContract();
		expect(result).toEqual({ ok: true, value: null });
	});

	it("reports other contract errors as failures", async () => {
		stubBackend(() => ({ status: 500 }));
		const result = await backendApi.ownContract();
		expect(result.ok).toBe(false);
	});

	it("maps a duplicate contract (409) and a duplicate email (409) to translated texts", async () => {
		stubBackend(() => ({
			status: 409,
			data: { title: "Conflict", detail: "x" },
		}));
		const contract = await backendApi.createContract({
			fio: "Іваненко Іван Іванович",
			phone: "+380501234567",
			email: "a@gmail.com",
			address: "Київ",
			serviceType: "INTERNET",
		});
		const register = await backendApi.register({
			email: "a@gmail.com",
			phone: "+380501234567",
			fio: "Іваненко Іван Іванович",
			password: "Passw0rd",
		});
		expect(!contract.ok && contract.error.message).not.toBe("x");
		expect(!register.ok && register.error.message).not.toBe("x");
	});

	it("uses the documented paths for profile, contract, account, recurring and ticket endpoints", async () => {
		const { calls } = stubBackend(() => ({ status: 200, data: {} }));
		await backendApi.updateProfile({ fio: "A", phone: "B" });
		await backendApi.deleteOwnAccount();
		await backendApi.deleteUser(5);
		await backendApi.updateOwnAddress("Львів");
		await backendApi.cancelOwnContract();
		await backendApi.updateContract("c-1", {
			fio: "A",
			phone: "B",
			email: "e",
			address: "C",
		});
		await backendApi.setRecurring(false);
		await backendApi.closeTicket(7);

		expect(calls.map((c) => `${c.method?.toUpperCase()} ${c.url}`)).toEqual([
			"PATCH /users/me",
			"DELETE /users/me",
			"DELETE /users/5",
			"PATCH /contracts/me",
			"DELETE /contracts/me",
			"PATCH /contracts/c-1",
			"PATCH /payments/recurring",
			"DELETE /chat/clients/7/messages",
		]);
		expect(bodyOf(calls[6])).toEqual({ recurring: false });
	});

	it("sends chat bodies as { body }", async () => {
		const { calls } = stubBackend(() => ({ status: 201, data: {} }));
		await backendApi.sendOwnMessage("hi");
		await backendApi.replyToClient(3, "hello");
		expect(bodyOf(calls[0])).toEqual({ body: "hi" });
		expect(calls[1].url).toBe("/chat/clients/3/messages");
		expect(bodyOf(calls[1])).toEqual({ body: "hello" });
	});
});

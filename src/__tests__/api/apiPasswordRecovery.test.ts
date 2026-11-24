import { afterEach, describe, expect, it } from "vitest";
import { clearToken, readToken } from "../../services/api/tokenStore";
import { ApiPasswordRecoveryService } from "../../services/auth/ApiPasswordRecoveryService";
import { bodyOf, restoreBackend, stubBackend } from "./httpStub";

const userDto = {
	id: 1,
	email: "c@gmail.com",
	role: "CLIENT",
	fio: "Іваненко Іван Іванович",
	phone: "+380501234567",
	balance: 0,
	lastPaymentDate: null,
	recurring: false,
	unreadMessages: 0,
	equipmentStatus: null,
	connectionApproved: false,
};

describe("ApiPasswordRecoveryService", () => {
	afterEach(() => {
		restoreBackend();
		clearToken();
	});

	it("requests and verifies a code with trimmed input", async () => {
		const { calls } = stubBackend(() => ({ status: 200 }));
		const service = new ApiPasswordRecoveryService();
		expect((await service.requestCode(" c@gmail.com ")).ok).toBe(true);
		expect((await service.verifyCode("c@gmail.com", " 123456 ")).ok).toBe(true);

		expect(calls[0].url).toBe("/auth/password-recovery/request");
		expect(bodyOf(calls[0])).toEqual({ email: "c@gmail.com" });
		expect(bodyOf(calls[1])).toEqual({ email: "c@gmail.com", code: "123456" });
	});

	it("reports a wrong code as a failure", async () => {
		stubBackend(() => ({ status: 401, data: { title: "Unauthorized" } }));
		const result = await new ApiPasswordRecoveryService().verifyCode(
			"c@gmail.com",
			"000000"
		);
		expect(result.ok).toBe(false);
	});

	it("reset logs the user in: stores the new token and returns the user", async () => {
		stubBackend((c) => {
			if (c.url === "/auth/password-recovery/reset")
				return {
					status: 200,
					data: {
						token: "new-jwt",
						tokenType: "Bearer",
						expiresIn: 3600,
						user: userDto,
					},
				};
			if (c.url === "/contracts/me") return { status: 404 };
			return { status: 500 };
		});
		const result = await new ApiPasswordRecoveryService().resetPasswordAndLogin(
			"c@gmail.com",
			"123456",
			"NewPassw0rd"
		);
		expect(result.ok && result.value.email).toBe("c@gmail.com");
		expect(readToken()).toBe("new-jwt");
	});

	it("does not keep a token when the reset is rejected", async () => {
		stubBackend(() => ({ status: 401, data: { title: "Unauthorized" } }));
		const result = await new ApiPasswordRecoveryService().resetPasswordAndLogin(
			"c@gmail.com",
			"bad",
			"NewPassw0rd"
		);
		expect(result.ok).toBe(false);
		expect(readToken()).toBeNull();
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, toAppError } from "../../services/api/apiClient";
import { ApiAuthStrategy } from "../../services/auth/ApiAuthStrategy";
import {
	clearToken,
	readToken,
	writeToken,
} from "../../services/api/tokenStore";
import type {
	AxiosAdapter,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import { AxiosError } from "axios";

const userDto = {
	id: 1,
	email: "c@gmail.com",
	role: "CLIENT",
	fio: "Іванов Іван Іванович",
	phone: "+380501234567",
	balance: 0,
	lastPaymentDate: null,
	recurring: false,
	unreadMessages: 0,
	equipmentStatus: null,
	connectionApproved: false,
};

type Handler = (config: InternalAxiosRequestConfig) => {
	status: number;
	data?: unknown;
};

function stub(handler: Handler): { calls: InternalAxiosRequestConfig[] } {
	const calls: InternalAxiosRequestConfig[] = [];
	const adapter: AxiosAdapter = async (config) => {
		calls.push(config);
		const { status, data } = handler(config);
		const response = {
			data,
			status,
			statusText: "",
			headers: {},
			config,
		} as AxiosResponse;
		if (status >= 400)
			throw new AxiosError("fail", String(status), config, null, response);
		return response;
	};
	apiClient.defaults.adapter = adapter;
	return { calls };
}

describe("ApiAuthStrategy against the Bearer backend", () => {
	beforeEach(() => clearToken());
	afterEach(() => {
		apiClient.defaults.adapter = undefined;
		clearToken();
	});

	it("login stores the token, loads the contract and sends Bearer afterwards", async () => {
		const { calls } = stub((c) => {
			if (c.url === "/auth/login")
				return {
					status: 200,
					data: {
						token: "jwt-1",
						tokenType: "Bearer",
						expiresIn: 3600,
						user: userDto,
					},
				};
			if (c.url === "/contracts/me") return { status: 404 };
			return { status: 500 };
		});

		const result = await new ApiAuthStrategy().login("c@gmail.com", "Passw0rd");

		expect(result.ok && result.value.role).toBe("client");
		expect(readToken()).toBe("jwt-1");
		const contractCall = calls.find((c) => c.url === "/contracts/me");
		expect(contractCall?.headers.get("Authorization")).toBe("Bearer jwt-1");
		// no cookies / CSRF machinery any more
		expect(calls[0].withCredentials).toBeFalsy();
	});

	it("maps a wrong password to the translated message", async () => {
		stub(() => ({
			status: 401,
			data: { title: "Unauthorized", detail: "Invalid email or password" },
		}));
		const result = await new ApiAuthStrategy().login("c@gmail.com", "x");
		expect(result.ok).toBe(false);
		expect(!result.ok && result.error.code).toBe("HTTP_401");
		expect(readToken()).toBeNull();
	});

	it("getSession is null without a token and drops an expired one", async () => {
		const strategy = new ApiAuthStrategy();
		stub(() => ({ status: 500 }));
		expect(await strategy.getSession()).toEqual({ ok: true, value: null });

		writeToken("old");
		stub(() => ({ status: 401, data: { title: "Unauthorized" } }));
		expect(await strategy.getSession()).toEqual({ ok: true, value: null });
		expect(readToken()).toBeNull();
	});

	it("logout just forgets the token", async () => {
		writeToken("jwt");
		await new ApiAuthStrategy().logout();
		expect(readToken()).toBeNull();
	});
});

describe("toAppError", () => {
	const make = (status: number, data?: unknown) => {
		const config = { url: "/x" } as InternalAxiosRequestConfig;
		return new AxiosError("e", String(status), config, null, {
			data,
			status,
			statusText: "",
			headers: {},
			config,
		} as AxiosResponse);
	};

	it("joins backend field errors", () => {
		const err = toAppError(
			make(400, {
				title: "Validation failed",
				fieldErrors: { phone: "Phone is invalid", fio: "Bad name" },
			})
		);
		expect(err.message).toBe("Phone is invalid; Bad name");
	});

	it("treats a body-less 5xx (dead proxy target) as 'backend unavailable'", () => {
		const err = toAppError(make(502));
		expect(err.code).toBe("HTTP_502");
		expect(err.message).toMatch(/\S/);
	});

	it("uses the problem detail otherwise", () => {
		expect(
			toAppError(
				make(409, { title: "Conflict", detail: "Contract already exists" })
			).message
		).toBe("Contract already exists");
	});

	it("reports no response as a network error", () => {
		const config = { url: "/x" } as InternalAxiosRequestConfig;
		expect(
			toAppError(new AxiosError("Network Error", "ERR_NETWORK", config)).code
		).toBe("NETWORK");
	});

	it("is safe on non-axios values", () => {
		expect(toAppError(new Error("boom")).code).toBe("UNKNOWN");
		vi.fn();
	});
});

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "../../types/models";

const mocks = vi.hoisted(() => ({
	env: { paymentMode: "mock" as "mock" | "real", mockCards: [] as string[] },
	app: {
		makePayment: vi.fn(),
		startPrivat24Payment: vi.fn(),
		toggleRecurringPayment: vi.fn(),
	},
	modal: { checkout: vi.fn(), show: vi.fn(), confirm: vi.fn() },
}));

vi.mock("../../shared/config/env", () => ({ env: mocks.env }));
vi.mock("../../context/AppContext", () => ({ useApp: () => mocks.app }));
vi.mock("../../context/ModalContext", () => ({ useModal: () => mocks.modal }));

import { usePaymentAction } from "../../components/PersonalAccount/usePaymentAction";

const client = {
	id: 1,
	role: "client",
	connectionApproved: true,
	contract: { serviceType: "internet" },
} as unknown as ClientUser;

const assign = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	Object.defineProperty(window, "location", {
		value: { assign },
		writable: true,
	});
	mocks.modal.show.mockResolvedValue(undefined);
	mocks.modal.checkout.mockResolvedValue({
		amount: 250,
		recurring: false,
		method: "privat24-app",
	});
});

describe("usePaymentAction", () => {
	it("real mode: asks the backend and redirects, never credits the balance itself", async () => {
		mocks.env.paymentMode = "real";
		mocks.app.startPrivat24Payment.mockResolvedValue({
			ok: true,
			value: "https://www.privat24.ua/pay/abc",
		});
		const { result } = renderHook(() => usePaymentAction(client));

		await act(() => result.current.pay());

		expect(mocks.modal.checkout.mock.calls[0]?.[4]).toBe(true);
		expect(mocks.app.startPrivat24Payment).toHaveBeenCalledWith(250, false);
		expect(assign).toHaveBeenCalledWith("https://www.privat24.ua/pay/abc");
		expect(mocks.app.makePayment).not.toHaveBeenCalled();
		expect(mocks.modal.confirm).not.toHaveBeenCalled();
	});

	it("real mode: shows the error and does not redirect when the backend fails", async () => {
		mocks.env.paymentMode = "real";
		mocks.app.startPrivat24Payment.mockResolvedValue({
			ok: false,
			error: { code: "HTTP_404", message: "not set up" },
		});
		const { result } = renderHook(() => usePaymentAction(client));

		await act(() => result.current.pay());

		expect(mocks.modal.show).toHaveBeenCalledWith(
			expect.anything(),
			"not set up",
			"error"
		);
		expect(assign).not.toHaveBeenCalled();
		expect(mocks.app.makePayment).not.toHaveBeenCalled();
	});

	it("mock mode: confirms the app payment, then charges through makePayment", async () => {
		mocks.env.paymentMode = "mock";
		mocks.modal.confirm.mockResolvedValue(true);
		mocks.app.makePayment.mockResolvedValue({ ok: true, value: 500 });
		const { result } = renderHook(() => usePaymentAction(client));

		await act(() => result.current.pay());

		expect(mocks.modal.confirm).toHaveBeenCalledOnce();
		expect(mocks.app.makePayment).toHaveBeenCalledWith(1, 250, false);
		expect(mocks.app.startPrivat24Payment).not.toHaveBeenCalled();
		expect(assign).not.toHaveBeenCalled();
	});

	it("mock mode: does nothing when the app payment is not confirmed", async () => {
		mocks.env.paymentMode = "mock";
		mocks.modal.confirm.mockResolvedValue(false);
		const { result } = renderHook(() => usePaymentAction(client));

		await act(() => result.current.pay());

		expect(mocks.app.makePayment).not.toHaveBeenCalled();
	});
});

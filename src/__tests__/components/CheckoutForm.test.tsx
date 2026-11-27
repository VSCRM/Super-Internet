import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "../../components/organisms/CheckoutForm/CheckoutForm";

function setup(allowedCards?: readonly string[], realPayment = false) {
	const onSubmit = vi.fn();
	const onCancel = vi.fn();
	render(
		<CheckoutForm
			monthlyPrice={250}
			tariffLabel="Інтернет"
			onSubmit={onSubmit}
			onCancel={onCancel}
			allowedCards={allowedCards}
			realPayment={realPayment}
		/>
	);
	return { onSubmit, onCancel };
}

describe("CheckoutForm", () => {
	it("shows both pay buttons and prefills the amount", () => {
		setup();
		expect(
			screen.getByRole("button", { name: "Оплатити карткою" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Оплатити через додаток Приват24" })
		).toBeInTheDocument();
		expect(screen.getByDisplayValue("250")).toBeInTheDocument();
	});

	it("pays in the Privat24 app without any card data", async () => {
		const { onSubmit } = setup();
		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити через додаток Приват24" })
		);
		expect(onSubmit).toHaveBeenCalledWith({
			amount: 250,
			recurring: false,
			method: "privat24-app",
		});
	});

	it("does not pay in the app with an invalid amount", async () => {
		const { onSubmit } = setup();
		await userEvent.clear(screen.getByLabelText("Сума (грн)"));
		await userEvent.type(screen.getByLabelText("Сума (грн)"), "0");
		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити через додаток Приват24" })
		);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("rejects other valid cards when restricted, without revealing the test cards", async () => {
		const { onSubmit } = setup(["4111111111111111"]);
		expect(screen.queryByText(/Тестові картки/)).not.toBeInTheDocument();
		expect(screen.queryByText(/4111 1111 1111 1111/)).not.toBeInTheDocument();

		await userEvent.type(
			screen.getByLabelText("Номер картки"),
			"5555555555554444"
		);
		await userEvent.type(screen.getByLabelText("Термін дії"), "1299");
		await userEvent.type(screen.getByLabelText("CVV"), "123");
		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити карткою" })
		);

		expect(onSubmit).not.toHaveBeenCalled();
		expect(
			await screen.findByText(
				"У тестовому режимі приймаються лише тестові картки"
			)
		).toBeInTheDocument();
	});

	it("shows the client's tariff and price-based presets", async () => {
		setup();
		expect(
			screen.getByText("Ваш тариф: Інтернет — 250 грн/міс")
		).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "3 міс · 750" }));
		expect(screen.getByDisplayValue("750")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "3 міс · 750" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		expect(screen.getByRole("button", { name: "1 міс · 250" })).toHaveAttribute(
			"aria-pressed",
			"false"
		);
	});

	it("pays the preset amount", async () => {
		const { onSubmit } = setup();
		await userEvent.click(screen.getByRole("button", { name: "6 міс · 1500" }));
		await userEvent.type(
			screen.getByLabelText("Номер картки"),
			"5555555555554444"
		);
		await userEvent.type(screen.getByLabelText("Термін дії"), "1299");
		await userEvent.type(screen.getByLabelText("CVV"), "123");
		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити карткою" })
		);
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				amount: 1500,
				recurring: false,
				method: "card",
			})
		);
	});

	it("detects the card brand while typing", async () => {
		setup();
		const brand = screen.getByTestId("card-brand");
		const input = screen.getByLabelText("Номер картки");

		expect(brand).toHaveTextContent("");
		await userEvent.type(input, "4111");
		expect(brand).toHaveTextContent("VISA");

		await userEvent.clear(input);
		await userEvent.type(input, "5555");
		expect(brand).toHaveTextContent("Mastercard");
	});

	it("formats the card number and expiry as you type", async () => {
		setup();
		await userEvent.type(
			screen.getByLabelText("Номер картки"),
			"4111111111111111"
		);
		await userEvent.type(screen.getByLabelText("Термін дії"), "1299");
		expect(screen.getByDisplayValue("4111 1111 1111 1111")).toBeInTheDocument();
		expect(screen.getByDisplayValue("12/99")).toBeInTheDocument();
	});

	it("does not submit an invalid form and shows the errors", async () => {
		const { onSubmit } = setup();
		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити карткою" })
		);
		expect(onSubmit).not.toHaveBeenCalled();
		expect(
			await screen.findByText("Номер картки має містити 16 цифр")
		).toBeInTheDocument();
	});

	it("submits only the amount and recurring flag, never the card data", async () => {
		const { onSubmit } = setup();
		await userEvent.type(
			screen.getByLabelText("Номер картки"),
			"4111111111111111"
		);
		await userEvent.type(screen.getByLabelText("Термін дії"), "1299");
		await userEvent.type(screen.getByLabelText("CVV"), "123");
		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити карткою" })
		);

		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		expect(onSubmit).toHaveBeenCalledWith({
			amount: 250,
			recurring: false,
			method: "card",
		});
	});

	it("calls onCancel", async () => {
		const { onCancel } = setup();
		await userEvent.click(screen.getByRole("button", { name: "Скасувати" }));
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it("real payment: no card fields or card button, only the Privat24 button", async () => {
		const { onSubmit } = setup(["4111111111111111"], true);
		expect(screen.queryByLabelText("Номер картки")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("CVV")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Оплатити карткою" })
		).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Оплатити через додаток Приват24" })
		);
		expect(onSubmit).toHaveBeenCalledWith({
			amount: 250,
			recurring: false,
			method: "privat24-app",
		});
	});
});

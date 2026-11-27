import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	PRIVAT24_LOGO_SRC,
	Privat24Button,
} from "../../components/molecules/Privat24Button/Privat24Button";

describe("Privat24Button", () => {
	it("shows the round Privat24 logo with an accessible name and caption", () => {
		const { container } = render(<Privat24Button />);
		const button = screen.getByRole("button", {
			name: "Оплатити через додаток Приват24",
		});
		expect(screen.getByText("Оплатити через додаток")).toBeInTheDocument();
		expect(button).toHaveAttribute("title", "Оплатити через додаток Приват24");
		expect(container.querySelector("img")).toHaveAttribute(
			"src",
			PRIVAT24_LOGO_SRC
		);
	});

	it("falls back to a round 24 badge when the logo file is missing", () => {
		const { container } = render(<Privat24Button />);
		fireEvent.error(container.querySelector("img")!);
		expect(container.querySelector("img")).toBeNull();
		expect(screen.getByRole("button")).toHaveTextContent("24");
	});

	it("is a plain button that calls onClick", async () => {
		const onClick = vi.fn();
		render(<Privat24Button onClick={onClick} />);
		await userEvent.click(screen.getByRole("button"));
		expect(onClick).toHaveBeenCalledOnce();
		expect(screen.getByRole("button")).toHaveAttribute("type", "button");
	});
});

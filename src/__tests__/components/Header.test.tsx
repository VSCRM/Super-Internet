import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import { Header } from "../../components/Header";
import i18n from "../../i18n";

describe("Header language switching", () => {
	afterEach(async () => {
		// Reset back to the default language so this test doesn't leak state
		// into other test files running in the same module instance.
		await act(async () => {
			await i18n.changeLanguage("uk");
		});
	});

	it("switches the nav and login button text when EN is selected", async () => {
		render(
			<MemoryRouter>
				<Header activeIndex={0} onMenuSelect={() => {}} />
			</MemoryRouter>
		);

		expect(screen.getByText("Головна")).toBeInTheDocument();
		expect(screen.getByText("Увійти")).toBeInTheDocument();

		await userEvent.click(screen.getByText("EN"));

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("About us")).toBeInTheDocument();
		expect(screen.getByText("Pricing")).toBeInTheDocument();
		expect(screen.getByText("Contacts")).toBeInTheDocument();
		expect(screen.getByText("Log in")).toBeInTheDocument();
	});

	it("switches back to Ukrainian when UA is selected again", async () => {
		render(
			<MemoryRouter>
				<Header activeIndex={0} onMenuSelect={() => {}} />
			</MemoryRouter>
		);

		await userEvent.click(screen.getByText("EN"));
		expect(screen.getByText("Home")).toBeInTheDocument();

		await userEvent.click(screen.getByText("UA"));
		expect(screen.getByText("Головна")).toBeInTheDocument();
	});

	it("renders the language switcher outside the nav row (regression: it must never compete with the nav for width)", () => {
		const { container } = render(
			<MemoryRouter>
				<Header activeIndex={0} onMenuSelect={() => {}} />
			</MemoryRouter>
		);

		const langWrapper = container.querySelector(".top-line__lang");
		const navRow = container.querySelector(".col--lead");
		expect(langWrapper).not.toBeNull();
		expect(navRow?.contains(langWrapper)).toBe(false);
	});
});

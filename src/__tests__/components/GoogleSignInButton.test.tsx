import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleSignInButton } from "../../components/molecules/GoogleSignInButton/GoogleSignInButton";
import { googleLoginUrl } from "../../shared/config/env";

describe("GoogleSignInButton", () => {
	const original = window.location;
	afterEach(() => {
		Object.defineProperty(window, "location", {
			value: original,
			writable: true,
		});
	});

	it("points at the backend's OAuth2 entry, not at the JSON API", () => {
		expect(googleLoginUrl()).toMatch(/\/oauth2\/authorization\/google$/);
		expect(googleLoginUrl()).not.toContain("/api/");
	});

	it("navigates the whole page to the backend when clicked", async () => {
		const assign = vi.fn();
		Object.defineProperty(window, "location", {
			value: { ...original, assign },
			writable: true,
		});

		render(<GoogleSignInButton />);
		await userEvent.click(screen.getByRole("button", { name: /google/i }));

		expect(assign).toHaveBeenCalledWith(googleLoginUrl());
	});
});

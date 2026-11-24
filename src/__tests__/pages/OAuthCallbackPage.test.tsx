import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { OAuthCallbackPage } from "../../pages/OAuthCallbackPage";
import { clearToken, readToken } from "../../services/api/tokenStore";

function Where() {
	const { pathname, search } = useLocation();
	return <div data-testid="where">{pathname + search}</div>;
}

function renderCallback() {
	return render(
		<MemoryRouter initialEntries={["/oauth-callback"]}>
			<Routes>
				<Route path="/oauth-callback" element={<OAuthCallbackPage />} />
				<Route path="*" element={<Where />} />
			</Routes>
		</MemoryRouter>
	);
}

describe("OAuthCallbackPage", () => {
	beforeEach(() => clearToken());
	afterEach(() => {
		clearToken();
		window.history.replaceState(null, "", "/");
	});

	it("stores the token from the URL fragment, scrubs it from the address bar and opens the account", async () => {
		window.history.replaceState(null, "", "/oauth-callback#token=abc.def.ghi");
		renderCallback();

		await waitFor(() =>
			expect(screen.getByTestId("where")).toHaveTextContent("/account")
		);
		expect(screen.getByTestId("where").textContent).not.toContain("error");
		expect(readToken()).toBe("abc.def.ghi");
		expect(window.location.hash).toBe("");
	});

	it("goes to the login screen with an error when there is no token", async () => {
		window.history.replaceState(null, "", "/oauth-callback");
		renderCallback();

		await waitFor(() =>
			expect(screen.getByTestId("where")).toHaveTextContent(
				"/account?error=google"
			)
		);
		expect(readToken()).toBeNull();
	});
});

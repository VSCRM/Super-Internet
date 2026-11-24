import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { writeToken } from "../services/api/tokenStore";

/**
 * Landing page of the Google sign-in. The backend finishes the OAuth2
 * handshake and redirects the browser to `/oauth-callback#token=<JWT>`.
 *
 * The token is in the URL *fragment*, so it is never sent to any server or
 * written to access logs. It is read once, removed from the address bar and
 * history immediately, stored, and the user is sent on to the account page,
 * whose normal session bootstrap (`GET /api/auth/me`) takes it from there.
 */
export function OAuthCallbackPage(): ReactElement {
	const navigate = useNavigate();
	const { t } = useTranslation();
	// React StrictMode runs effects twice in dev; the fragment can only be read once.
	const handled = useRef(false);

	useEffect(() => {
		if (handled.current) return;
		handled.current = true;

		const fragment = new URLSearchParams(window.location.hash.slice(1));
		const token = fragment.get("token");

		window.history.replaceState(
			null,
			"",
			window.location.pathname + window.location.search
		);

		if (token) {
			writeToken(token);
			navigate("/account", { replace: true });
		} else {
			navigate("/account?error=google", { replace: true });
		}
	}, [navigate]);

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "rgb(55, 25, 77)",
				color: "var(--white-color, #fff)",
				display: "grid",
				placeItems: "center",
			}}
			aria-busy="true"
		>
			{t("auth.googleSigningIn")}
		</div>
	);
}

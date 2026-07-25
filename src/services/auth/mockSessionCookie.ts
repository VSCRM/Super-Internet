/**
 * Minimal cookie helpers for the Mock auth strategy.
 *
 * IMPORTANT: a cookie set from client-side JavaScript can never carry the
 * `HttpOnly` flag - that flag only has meaning when set by a server via the
 * `Set-Cookie` response header, specifically to make the cookie invisible to
 * JavaScript. In Mock mode there is no server, so this module stores a
 * non-sensitive session marker (the current user id) in a regular cookie
 * purely to mirror the *shape* of a cookie-based session for local
 * development. `ApiAuthStrategy` is the strategy that gets the real
 * HttpOnly + Secure + SameSite cookie issued by the backend; it never reads
 * this cookie and never touches `document.cookie` at all.
 */

const SESSION_COOKIE_NAME = "si_mock_session";

export function setMockSessionCookie(userId: number): void {
	document.cookie = `${SESSION_COOKIE_NAME}=${userId}; path=/; SameSite=Lax; max-age=2592000`;
}

export function readMockSessionCookie(): number | null {
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`)
	);
	if (!match) return null;
	const id = Number(match[1]);
	return Number.isFinite(id) ? id : null;
}

export function clearMockSessionCookie(): void {
	document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}

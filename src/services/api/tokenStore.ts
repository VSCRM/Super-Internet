/**
 * Holds the backend's JWT between page loads.
 *
 * The backend is a stateless Bearer-token API (it never sets a cookie), so the
 * token has to live somewhere the SPA can read it. localStorage survives
 * reloads and is what the Google sign-in callback writes to as well.
 * Every access is wrapped in try/catch: storage can be unavailable (private
 * mode, blocked cookies) and the app must then simply behave as "logged out".
 */
const TOKEN_STORAGE_KEY = "si_access_token";

export function readToken(): string | null {
	try {
		return window.localStorage.getItem(TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function writeToken(token: string): void {
	try {
		window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
	} catch {
		/* storage unavailable - the session just won't survive a reload */
	}
}

export function clearToken(): void {
	try {
		window.localStorage.removeItem(TOKEN_STORAGE_KEY);
	} catch {
		/* nothing to clear */
	}
}

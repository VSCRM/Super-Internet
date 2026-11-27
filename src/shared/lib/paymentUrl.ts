/**
 * A payment page URL from the backend is followed with a full-page redirect, so
 * only `https:` is accepted (plain `http:` just for localhost during development);
 * `javascript:`, `data:` and the like are rejected.
 */
export function isSafePaymentUrl(value: unknown): value is string {
	if (typeof value !== "string") return false;
	try {
		const url = new URL(value);
		if (url.protocol === "https:") return true;
		return (
			url.protocol === "http:" &&
			(url.hostname === "localhost" || url.hostname === "127.0.0.1")
		);
	} catch {
		return false;
	}
}

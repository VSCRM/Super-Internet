/**
 * Centralized environment configuration.
 * All `import.meta.env` access in the application must go through this module
 * so that environment contracts are validated and typed in a single place.
 */

function readBoolean(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined) return fallback;
	return value === "true" || value === "1";
}

function readPrice(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface AppEnv {
	/** When true, the app talks to the real Spring backend instead of the local Mock layer. */
	readonly backendMode: boolean;
	/** Base path of the JSON API. Relative (`/api`) goes through the Vite dev proxy. */
	readonly apiBaseUrl: string;
	/**
	 * Origin of the backend, used ONLY for the browser redirect that starts
	 * the Google sign-in (`<origin>/oauth2/authorization/google`). That is a
	 * full-page navigation, not an XHR, so it cannot use `apiBaseUrl`.
	 */
	readonly backendOrigin: string;
	/** Monthly tariff prices in UAH. Must match the tariff prices used by the backend. */
	readonly priceInternet: number;
	readonly priceInternetTv: number;
	readonly emailJsServiceId: string | null;
	readonly emailJsTemplateId: string | null;
	readonly emailJsPublicKey: string | null;
	/** `mock` = test payments (only the `VITE_MOCK_CARDS` are accepted); `real` = real card payments. */
	readonly paymentMode: PaymentMode;
	/**
	 * Test cards (digits only) the checkout form accepts. Taken from
	 * `VITE_MOCK_CARDS` and only in `mock` payment mode; always empty in `real`
	 * mode (any valid card is accepted and sent for real processing).
	 */
	readonly mockCards: readonly string[];
}

export type PaymentMode = "mock" | "real";

/** Anything but an explicit "real" is `mock`, so a missing .env never charges real cards. */
export function readPaymentMode(value: string | undefined): PaymentMode {
	return (value ?? "").trim().toLowerCase() === "real" ? "real" : "mock";
}

/** "4111 1111 1111 1111, 5555-5555-5555-4444" -> digits-only card numbers. */
export function readCardList(value: string | undefined): readonly string[] {
	return (value ?? "")
		.split(",")
		.map((card) => card.replace(/\D/g, ""))
		.filter((card) => card.length > 0);
}

function readString(value: string | undefined): string | null {
	const trimmed = (value ?? "").trim();
	return trimmed.length > 0 ? trimmed : null;
}

const paymentMode = readPaymentMode(import.meta.env.VITE_PAYMENT_MODE);

export const env: AppEnv = {
	backendMode: readBoolean(import.meta.env.VITE_BACKEND_MODE, false),
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || "/api",
	backendOrigin: (
		import.meta.env.VITE_BACKEND_ORIGIN?.trim() || "http://localhost:8080"
	).replace(/\/+$/, ""),
	priceInternet: readPrice(import.meta.env.VITE_PRICE_INTERNET, 250),
	priceInternetTv: readPrice(import.meta.env.VITE_PRICE_INTERNET_TV, 350),
	emailJsServiceId: readString(import.meta.env.VITE_EMAILJS_SERVICE_ID),
	emailJsTemplateId: readString(import.meta.env.VITE_EMAILJS_TEMPLATE_ID),
	emailJsPublicKey: readString(import.meta.env.VITE_EMAILJS_PUBLIC_KEY),
	paymentMode,
	mockCards:
		paymentMode === "mock" ? readCardList(import.meta.env.VITE_MOCK_CARDS) : [],
};

/** Full URL that starts the Google OAuth2 handshake on the backend. */
export function googleLoginUrl(): string {
	return `${env.backendOrigin}/oauth2/authorization/google`;
}

export function isEmailJsConfigured(): boolean {
	return Boolean(
		env.emailJsServiceId && env.emailJsTemplateId && env.emailJsPublicKey
	);
}

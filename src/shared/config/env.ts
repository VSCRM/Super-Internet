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
	readonly privatBankApiBaseUrl: string | null;
	readonly privatBankMerchantId: string | null;
}

function readString(value: string | undefined): string | null {
	const trimmed = (value ?? "").trim();
	return trimmed.length > 0 ? trimmed : null;
}

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
	privatBankApiBaseUrl: readString(
		import.meta.env.VITE_PRIVATBANK_API_BASE_URL
	),
	privatBankMerchantId: readString(import.meta.env.VITE_PRIVATBANK_MERCHANT_ID),
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

export function isPrivatBankConfigured(): boolean {
	return Boolean(env.privatBankApiBaseUrl && env.privatBankMerchantId);
}

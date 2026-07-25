/**
 * Centralized environment configuration.
 * All `import.meta.env` access in the application must go through this module
 * so that environment contracts are validated and typed in a single place.
 */

function readBoolean(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined) return fallback;
	return value === "true" || value === "1";
}

export interface AppEnv {
	/** When true, the app talks to a real backend via ApiAuthStrategy/ApiUserRepository. */
	readonly backendMode: boolean;
	readonly apiBaseUrl: string;
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
	emailJsServiceId: readString(import.meta.env.VITE_EMAILJS_SERVICE_ID),
	emailJsTemplateId: readString(import.meta.env.VITE_EMAILJS_TEMPLATE_ID),
	emailJsPublicKey: readString(import.meta.env.VITE_EMAILJS_PUBLIC_KEY),
	privatBankApiBaseUrl: readString(
		import.meta.env.VITE_PRIVATBANK_API_BASE_URL
	),
	privatBankMerchantId: readString(import.meta.env.VITE_PRIVATBANK_MERCHANT_ID),
};

export function isEmailJsConfigured(): boolean {
	return Boolean(
		env.emailJsServiceId && env.emailJsTemplateId && env.emailJsPublicKey
	);
}

export function isPrivatBankConfigured(): boolean {
	return Boolean(env.privatBankApiBaseUrl && env.privatBankMerchantId);
}

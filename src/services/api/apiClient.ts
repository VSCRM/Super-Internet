import axios from "axios";
import type { AxiosResponse } from "axios";
import i18n from "../../i18n";
import { env } from "../../shared/config/env";
import type { AppError, Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import { clearToken, readToken } from "./tokenStore";

/** Fired when an authenticated request comes back 401 (expired / revoked token). */
export const SESSION_EXPIRED_EVENT = "si:session-expired";

/** Endpoints where a 401 means "wrong credentials/code", not "your session expired". */
const PUBLIC_AUTH_PATH = /^\/auth\/(login|register|password-recovery\/)/;

export const apiClient = axios.create({
	baseURL: env.apiBaseUrl,
	timeout: 15_000,
	headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
	const token = readToken();
	if (token) config.headers.set("Authorization", `Bearer ${token}`);
	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		if (
			axios.isAxiosError(error) &&
			error.response?.status === 401 &&
			readToken() &&
			!PUBLIC_AUTH_PATH.test(error.config?.url ?? "")
		) {
			clearToken();
			window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
		}
		return Promise.reject(error);
	}
);

/** RFC 9457 body the Spring backend returns for every error. */
interface ProblemDetail {
	readonly title?: string;
	readonly detail?: string;
	readonly fieldErrors?: Readonly<Record<string, string>>;
}

export type StatusMessages = Readonly<Partial<Record<number, string>>>;

/**
 * Turns any thrown value into the app's `AppError`.
 * `overrides` lets a caller replace the backend's (English) text for a
 * specific status with a translated, context-specific message.
 */
export function toAppError(
	error: unknown,
	overrides: StatusMessages = {}
): AppError {
	if (!axios.isAxiosError(error)) {
		return appError("UNKNOWN", i18n.t("errors.unknownServerError"));
	}

	const response = error.response;
	if (!response) {
		return appError("NETWORK", i18n.t("errors.networkError"));
	}

	const status = response.status;
	const override = overrides[status];
	if (override) return appError(`HTTP_${status}`, override);

	const problem =
		typeof response.data === "object" && response.data !== null
			? (response.data as ProblemDetail)
			: undefined;

	// A gateway/proxy error has no problem+json body: the backend is down or unreachable.
	if (!problem?.title && [500, 502, 503, 504].includes(status)) {
		return appError(`HTTP_${status}`, i18n.t("errors.backendUnavailable"));
	}

	if (problem?.fieldErrors && Object.keys(problem.fieldErrors).length > 0) {
		return appError(
			`HTTP_${status}`,
			Object.values(problem.fieldErrors).join("; "),
			{ fieldErrors: problem.fieldErrors }
		);
	}

	if (status === 401) {
		return appError("HTTP_401", i18n.t("errors.sessionExpired"));
	}
	if (status === 403) {
		return appError("HTTP_403", i18n.t("errors.forbidden"));
	}

	return appError(
		`HTTP_${status}`,
		problem?.detail ?? i18n.t("errors.unknownServerError")
	);
}

/** Runs one request and folds success/failure into a `Result`, never throwing. */
export async function call<T>(
	request: () => Promise<AxiosResponse<T>>,
	overrides?: StatusMessages
): Promise<Result<T, AppError>> {
	try {
		const response = await request();
		return success(response.data);
	} catch (error) {
		return failure(toAppError(error, overrides));
	}
}

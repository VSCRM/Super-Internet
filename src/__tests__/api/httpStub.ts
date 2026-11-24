import type {
	AxiosAdapter,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import { AxiosError } from "axios";
import { apiClient } from "../../services/api/apiClient";

export type StubHandler = (config: InternalAxiosRequestConfig) => {
	status: number;
	data?: unknown;
};

/** Replaces the HTTP transport of `apiClient`; returns every request it saw. */
export function stubBackend(handler: StubHandler): {
	calls: InternalAxiosRequestConfig[];
} {
	const calls: InternalAxiosRequestConfig[] = [];
	const adapter: AxiosAdapter = async (config) => {
		calls.push(config);
		const { status, data } = handler(config);
		const response = {
			data,
			status,
			statusText: "",
			headers: {},
			config,
		} as AxiosResponse;
		if (status >= 400) {
			throw new AxiosError("fail", String(status), config, null, response);
		}
		return response;
	};
	apiClient.defaults.adapter = adapter;
	return { calls };
}

export function restoreBackend(): void {
	apiClient.defaults.adapter = undefined;
}

/** Request body as an object (axios serializes JSON bodies to strings). */
export function bodyOf(config: InternalAxiosRequestConfig): unknown {
	return typeof config.data === "string"
		? JSON.parse(config.data)
		: config.data;
}

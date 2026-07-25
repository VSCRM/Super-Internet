/**
 * Discriminated-union Result type used across services and repositories so that
 * failure paths are part of the type signature instead of relying on thrown
 * exceptions, which are easy to forget to catch at call sites.
 */
export type Result<TValue, TError = AppError> =
	Success<TValue> | Failure<TError>;

export interface Success<TValue> {
	readonly ok: true;
	readonly value: TValue;
}

export interface Failure<TError> {
	readonly ok: false;
	readonly error: TError;
}

export interface AppError {
	readonly code: string;
	readonly message: string;
	readonly details?: Readonly<Record<string, unknown>>;
}

export function success<TValue>(value: TValue): Success<TValue> {
	return { ok: true, value };
}

export function failure<TError = AppError>(error: TError): Failure<TError> {
	return { ok: false, error };
}

export function appError(
	code: string,
	message: string,
	details?: Record<string, unknown>
): AppError {
	return { code, message, details };
}

/** Type guard narrowing a Result to its Success branch. */
export function isSuccess<TValue, TError>(
	result: Result<TValue, TError>
): result is Success<TValue> {
	return result.ok;
}

/** Type guard narrowing a Result to its Failure branch. */
export function isFailure<TValue, TError>(
	result: Result<TValue, TError>
): result is Failure<TError> {
	return !result.ok;
}

/** Unwraps a Result, throwing the contained error's message if it is a Failure. Use only at UI boundaries. */
export function unwrapOrThrow<TValue>(
	result: Result<TValue, AppError>
): TValue {
	if (isSuccess(result)) return result.value;
	throw new Error(result.error.message);
}

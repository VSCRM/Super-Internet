/**
 * Lightweight sanitization utilities. These are intentionally dependency-free
 * (no DOMPurify) because the application never renders user input as raw HTML
 * (React escapes text content by default); the goal here is defense-in-depth
 * for data that is persisted (localStorage / future API) and may later be
 * displayed in contexts we do not fully control (e.g. exported reports, emails).
 */

const HTML_TAG_PATTERN = /<[^>]*>/g;
// eslint-disable-next-line no-control-regex -- intentional: stripping control characters is the purpose of this pattern.
const CONTROL_CHARACTERS_PATTERN = /[\u0000-\u001F\u007F]/g;

/** Strips HTML tags and control characters, then trims surrounding whitespace. */
export function sanitizeText(input: string): string {
	return input
		.replace(HTML_TAG_PATTERN, "")
		.replace(CONTROL_CHARACTERS_PATTERN, "")
		.trim();
}

/** Normalizes an email address: trims, lowercases, strips disallowed characters. */
export function sanitizeEmail(input: string): string {
	return sanitizeText(input).toLowerCase();
}

/** Keeps only digits and a leading plus sign, used for phone numbers. */
export function sanitizePhone(input: string): string {
	const trimmed = sanitizeText(input);
	const hasLeadingPlus = trimmed.startsWith("+");
	const digitsOnly = trimmed.replace(/\D/g, "");
	return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

/** Recursively sanitizes every string field of a plain object, leaving other types untouched. */
export function sanitizeObject<T extends Record<string, unknown>>(value: T): T {
	const result = { ...value };
	for (const key of Object.keys(result) as Array<keyof T>) {
		const fieldValue = result[key];
		if (typeof fieldValue === "string") {
			result[key] = sanitizeText(fieldValue) as T[keyof T];
		}
	}
	return result;
}

/**
 * Pure helpers for the card form: brand detection, input masks and checks.
 * Nothing here stores or sends card data.
 */
export type CardBrand = "visa" | "mastercard" | null;

export const CARD_NUMBER_LENGTH = 16;

export function digitsOnly(value: string): string {
	return value.replace(/\D/g, "");
}

/** Visa starts with 4; Mastercard with 51-55 or 2221-2720. */
export function detectCardBrand(value: string): CardBrand {
	const digits = digitsOnly(value);
	if (digits.startsWith("4")) return "visa";
	if (/^5[1-5]/.test(digits)) return "mastercard";
	if (digits.length >= 2 && digits.length < 4) {
		const two = Number(digits.slice(0, 2));
		if (two >= 22 && two <= 27) return "mastercard";
	}
	if (digits.length >= 4) {
		const four = Number(digits.slice(0, 4));
		if (four >= 2221 && four <= 2720) return "mastercard";
	}
	return null;
}

/** "4111111111111111" -> "4111 1111 1111 1111" (max 16 digits). */
export function formatCardNumber(value: string): string {
	return (
		digitsOnly(value)
			.slice(0, CARD_NUMBER_LENGTH)
			.match(/.{1,4}/g)
			?.join(" ") ?? ""
	);
}

/** "1228" -> "12/28"; a leading 2-9 becomes "02".."09". */
export function formatExpiry(value: string): string {
	let digits = digitsOnly(value).slice(0, 4);
	if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
	return digits.length > 2
		? `${digits.slice(0, 2)}/${digits.slice(2)}`
		: digits;
}

export function isLuhnValid(value: string): boolean {
	const digits = digitsOnly(value);
	if (digits.length < 2) return false;
	let sum = 0;
	let double = false;
	for (let i = digits.length - 1; i >= 0; i--) {
		let n = Number(digits[i]);
		if (double) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		double = !double;
	}
	return sum % 10 === 0;
}

/** `MM/YY`: a real month and not earlier than the current one. */
export function isExpiryValid(value: string, now: Date = new Date()): boolean {
	const match = /^(\d{2})\/(\d{2})$/.exec(value);
	if (!match) return false;
	const month = Number(match[1]);
	const year = 2000 + Number(match[2]);
	if (month < 1 || month > 12) return false;
	const currentMonth = now.getFullYear() * 12 + now.getMonth();
	return year * 12 + (month - 1) >= currentMonth;
}

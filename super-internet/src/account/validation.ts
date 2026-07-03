// Pure validation functions + granular rule definitions for real-time UI hints.

export interface ValidationRule {
	label: string;
	test: (value: string) => boolean;
}

// ── Field validators ───────────────────────────────────────────────────────

export function validateEmail(email: string): boolean {
	return /^[^\s@]+@(gmail|ukr|yahoo|outlook|meta)\.(com|ua|net)$/i.test(email);
}

export function validatePhone(phone: string): boolean {
	return /^\+380\d{9}$/.test(phone);
}

export function validatePassword(password: string): boolean {
	return passwordRules.every((r) => r.test(password));
}

export function validateFIO(fio: string): boolean {
	const words = fio.trim().split(/\s+/);
	if (words.length !== 3) return false;
	return words.every((w) => /^[А-ЯІЇЄҐ][а-яіїєґ']+$/.test(w));
}

export function validateAddress(address: string): boolean {
	const t = address.trim();
	return (
		t.length >= 15 &&
		/[а-яіїєґА-ЯІЇЄҐ]/.test(t) &&
		/\d/.test(t) &&
		/(вул\.?|вулиця|пров\.?|провулок|просп\.?|проспект|бульв\.?|бульвар|площа|майдан)/i.test(
			t,
		)
	);
}

// ── Rule lists (used by FieldWithRules for per-rule coloring) ─────────────

export const emailRules: ValidationRule[] = [
	{
		label: "Формат: name@gmail.com / @ukr.net / @yahoo.com тощо",
		test: validateEmail,
	},
];

export const phoneRules: ValidationRule[] = [
	{label: "Починається з +380", test: (v) => v.startsWith("+380")},
	{
		label: "Рівно 13 символів (+380XXXXXXXXX)",
		test: (v) => /^\+380\d{9}$/.test(v),
	},
];

export const passwordRules: ValidationRule[] = [
	{label: "Мінімум 6 символів", test: (v) => v.length >= 6},
	{label: "Містить хоча б 1 цифру", test: (v) => /\d/.test(v)},
	{
		label: "Містить хоча б 1 велику літеру",
		test: (v) => /[A-ZА-ЯІЇЄҐ]/.test(v),
	},
];

export const fioRules: ValidationRule[] = [
	{label: "Рівно 3 слова", test: (v) => v.trim().split(/\s+/).length === 3},
	{
		label: "Кожне слово з великої літери (кирилиця)",
		test: (v) =>
			v
				.trim()
				.split(/\s+/)
				.every((w) => /^[А-ЯІЇЄҐ][а-яіїєґ']+$/.test(w)),
	},
];

export const addressRules: ValidationRule[] = [
	{label: "Мінімум 15 символів", test: (v) => v.trim().length >= 15},
	{label: "Містить українські літери", test: (v) => /[а-яіїєґА-ЯІЇЄҐ]/.test(v)},
	{label: "Містить номер будинку", test: (v) => /\d/.test(v)},
	{
		label: "Містить тип вулиці (вул., просп., пров. тощо)",
		test: (v) =>
			/(вул\.?|вулиця|пров\.?|провулок|просп\.?|проспект|бульв\.?|бульвар|площа|майдан)/i.test(
				v,
			),
	},
];

export const confirmPasswordRules = (password: string): ValidationRule[] => [
	{label: "Паролі співпадають", test: (v) => v.length > 0 && v === password},
];

export const staffNameRules: ValidationRule[] = [
	{label: "Мінімум 2 символи", test: (v) => v.trim().length >= 2},
	{
		label: "Тільки літери та пробіли",
		test: (v) => /^[\p{L}\s'-]+$/u.test(v.trim()),
	},
];

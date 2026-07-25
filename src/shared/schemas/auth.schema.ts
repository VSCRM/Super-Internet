import { z } from "zod";

/**
 * A small set of common Ukrainian email providers accepted by the legacy
 * business rule. Kept as a regex (not a static list) so that subdomains and
 * additional TLDs are still covered.
 */
const EMAIL_PATTERN = /^[^\s@]+@(gmail|ukr|yahoo|outlook|meta)\.(com|ua|net)$/i;
const PHONE_PATTERN = /^\+380\d{9}$/;
const FIO_WORD_PATTERN = /^[А-ЯІЇЄҐ][а-яіїєґ']+$/;

export const emailSchema = z
	.string()
	.trim()
	.min(1, "validation.email.required")
	.regex(EMAIL_PATTERN, "validation.email.domainFormat");

export const phoneSchema = z
	.string()
	.trim()
	.regex(PHONE_PATTERN, "validation.phone.format");

const UPPERCASE_PATTERN = /[A-ZА-ЯІЇЄҐ]/;
const DIGIT_PATTERN = /\d/;
const MIN_PASSWORD_LENGTH = 6;
export { MIN_PASSWORD_LENGTH };

export interface PasswordRequirement {
	readonly id: string;
	readonly label: string;
	readonly test: (value: string) => boolean;
}

/**
 * Single source of truth for password strength, consumed two ways:
 *  - `passwordSchema` below folds all of these into one Zod validator for
 *    final form submission.
 *  - The `PasswordField` molecule renders each requirement as its own
 *    real-time red/green row, computed straight from this same list, so the
 *    UI can never drift out of sync with the actual validation rule.
 */
export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
	{
		id: "length",
		label: `Мінімум ${MIN_PASSWORD_LENGTH} символів`,
		test: (value) => value.length >= MIN_PASSWORD_LENGTH,
	},
	{
		id: "digit",
		label: "Хоча б одна цифра",
		test: (value) => DIGIT_PATTERN.test(value),
	},
	{
		id: "uppercase",
		label: "Хоча б одна велика буква",
		test: (value) => UPPERCASE_PATTERN.test(value),
	},
];

export function isPasswordValid(value: string): boolean {
	return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(value));
}

export const passwordSchema = z.string().superRefine((value, ctx) => {
	for (const requirement of PASSWORD_REQUIREMENTS) {
		if (!requirement.test(value)) {
			ctx.addIssue({ code: "custom", message: requirement.label });
		}
	}
});

export const fioSchema = z
	.string()
	.trim()
	.superRefine((value, ctx) => {
		const words = value.split(/\s+/).filter(Boolean);
		if (
			words.length !== 3 ||
			!words.every((word) => FIO_WORD_PATTERN.test(word))
		) {
			ctx.addIssue({
				code: "custom",
				message: "validation.fio.format",
			});
		}
	});

export const loginEmailSchema = z
	.string()
	.trim()
	.min(1, "validation.email.required")
	.email("validation.email.invalid");

export const loginSchema = z.object({
	email: loginEmailSchema,
	password: z.string().min(1, "validation.password.required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
	.object({
		email: emailSchema,
		phone: phoneSchema,
		fio: fioSchema,
		password: passwordSchema,
		passwordConfirm: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.passwordConfirm) {
			ctx.addIssue({
				code: "custom",
				message: "validation.password.mismatch",
				path: ["passwordConfirm"],
			});
		}
	});

export type RegisterInput = z.infer<typeof registerSchema>;

export const requestRecoveryCodeSchema = z.object({
	email: loginEmailSchema,
});

export const verifyRecoveryCodeSchema = z.object({
	email: loginEmailSchema,
	code: z
		.string()
		.trim()
		.length(6, "validation.code.length")
		.regex(/^\d{6}$/, "validation.code.digitsOnly"),
});

export const resetPasswordSchema = z
	.object({
		email: loginEmailSchema,
		code: verifyRecoveryCodeSchema.shape.code,
		newPassword: passwordSchema,
		confirmPassword: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.newPassword !== data.confirmPassword) {
			ctx.addIssue({
				code: "custom",
				message: "validation.password.mismatch",
				path: ["confirmPassword"],
			});
		}
	});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const staffNameSchema = z
	.string()
	.trim()
	.min(2, "validation.staffName.format");

export const addStaffSchema = z.object({
	name: staffNameSchema,
	email: loginEmailSchema,
	password: passwordSchema,
});

export type AddStaffInput = z.infer<typeof addStaffSchema>;

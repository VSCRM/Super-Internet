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

/** The backend rejects passwords longer than this. */
export const MAX_PASSWORD_LENGTH = 72;

const newPasswordSchema = passwordSchema.refine(
	(value) => value.length <= MAX_PASSWORD_LENGTH,
	{ message: "validation.password.tooLong" }
);

/** Google-only account: there is no current password yet. */
export const createPasswordSchema = z
	.object({
		newPassword: newPasswordSchema,
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

export type CreatePasswordInput = z.infer<typeof createPasswordSchema>;

/** Account that already has a password: the current one is required. */
export const changePasswordSchema = z
	.object({
		currentPassword: z
			.string()
			.min(1, "validation.password.required")
			.max(MAX_PASSWORD_LENGTH, "validation.password.tooLong"),
		newPassword: newPasswordSchema,
		confirmPassword: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.currentPassword && data.newPassword === data.currentPassword) {
			ctx.addIssue({
				code: "custom",
				message: "validation.password.sameAsCurrent",
				path: ["newPassword"],
			});
		}
		if (data.newPassword !== data.confirmPassword) {
			ctx.addIssue({
				code: "custom",
				message: "validation.password.mismatch",
				path: ["confirmPassword"],
			});
		}
	});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const staffNameSchema = z
	.string()
	.trim()
	.min(2, "validation.staffName.format");

/** Mock mode: a name, an email and a password are enough (`phone` is unused there). */
export const addStaffSchema = z.object({
	name: staffNameSchema,
	email: loginEmailSchema,
	password: passwordSchema,
	phone: z.string().trim(),
});

/**
 * Real backend: a staff account is created through the same endpoint and
 * validation as a client sign-up, so it needs a three-word full name, a
 * supported-provider email and a +380 phone.
 */
export const addStaffBackendSchema = z.object({
	name: fioSchema,
	email: emailSchema,
	password: passwordSchema,
	phone: phoneSchema,
});

export type AddStaffInput = z.infer<typeof addStaffSchema>;

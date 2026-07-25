import { z } from "zod";
import { emailSchema, fioSchema, phoneSchema } from "./auth.schema";

const STREET_KEYWORDS_PATTERN =
	/(вул\.?|вулиця|пров\.?|провулок|просп\.?|проспект|бульв\.?|бульвар|площа|майдан)/i;
const CYRILLIC_PATTERN = /[а-яіїєґА-ЯІЇЄҐ]/;

export const addressSchema = z
	.string()
	.trim()
	.min(15, "Адреса має містити щонайменше 15 символів")
	.superRefine((value, ctx) => {
		if (!CYRILLIC_PATTERN.test(value)) {
			ctx.addIssue({
				code: "custom",
				message: "Адреса має бути написана українською",
			});
			return;
		}
		if (!/\d/.test(value)) {
			ctx.addIssue({ code: "custom", message: "Вкажіть номер будинку" });
			return;
		}
		if (!STREET_KEYWORDS_PATTERN.test(value)) {
			ctx.addIssue({
				code: "custom",
				message:
					"Вкажіть тип вулиці (вул./просп./пров./бульв.) та номер будинку",
			});
		}
	});

/**
 * Editable profile fields. Contract number and equipment identifier are
 * deliberately excluded from this schema (and therefore from any update
 * payload built from it) because they are immutable business identifiers
 * managed exclusively by back-office/administrative flows.
 */
export const editableProfileSchema = z.object({
	fio: fioSchema,
	phone: phoneSchema,
});

export type EditableProfileInput = z.infer<typeof editableProfileSchema>;

export const serviceSelectionSchema = z.object({
	serviceType: z.enum(["internet", "internet_tv"]),
	address: addressSchema,
});

export type ServiceSelectionInput = z.infer<typeof serviceSelectionSchema>;

/**
 * Equipment ID is intentionally excluded: it is a hardware identifier
 * assigned by the provisioning system and must never be changed via the
 * support UI. Only ПІБ, phone, email and address are support-editable.
 */
export const supportContractEditSchema = z.object({
	fio: fioSchema,
	phone: phoneSchema,
	email: emailSchema,
	address: addressSchema,
});

export type SupportContractEditInput = z.infer<
	typeof supportContractEditSchema
>;

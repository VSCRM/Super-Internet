import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";
import { useTranslation } from "react-i18next";

type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>;
type TouchedFields<TValues> = Partial<Record<keyof TValues, boolean>>;

export interface UseZodFormResult<TValues extends Record<string, unknown>> {
	readonly values: TValues;
	readonly errors: FieldErrors<TValues>;
	readonly touched: TouchedFields<TValues>;
	readonly isValid: boolean;
	setValue: <TKey extends keyof TValues>(
		key: TKey,
		value: TValues[TKey]
	) => void;
	touchField: (key: keyof TValues) => void;
	reset: (nextValues?: TValues) => void;
	/** Validates the whole form; returns parsed data on success or null after populating `errors`. */
	validate: () => z.infer<z.ZodType<TValues>> | null;
}

/**
 * Generic hook (Generics + type guards per architectural requirements) that
 * wires a Zod schema to React form state without any third-party form
 * library, keeping the dependency surface minimal while still providing
 * field-level validation feedback.
 *
 * Schema messages (see `shared/schemas/*.ts`) are i18next translation keys,
 * not literal text - built once at module-load time, they can't react to a
 * language switch on their own. Translating them here, at the point they're
 * surfaced to a component, is what makes them respond to the active
 * language like everything else.
 */
export function useZodForm<TSchema extends z.ZodType<Record<string, unknown>>>(
	schema: TSchema,
	initialValues: z.infer<TSchema>
): UseZodFormResult<z.infer<TSchema>> {
	type TValues = z.infer<TSchema>;
	const { t } = useTranslation();

	const [values, setValues] = useState<TValues>(initialValues);
	const [touched, setTouched] = useState<TouchedFields<TValues>>({});

	const errors = useMemo<FieldErrors<TValues>>(() => {
		const parsed = schema.safeParse(values);
		if (parsed.success) return {};

		const fieldErrors: FieldErrors<TValues> = {};
		for (const issue of parsed.error.issues) {
			const key = issue.path[0] as keyof TValues | undefined;
			if (key !== undefined && !(key in fieldErrors)) {
				fieldErrors[key] = t(issue.message);
			}
		}
		return fieldErrors;
	}, [schema, values, t]);

	const isValid = useMemo(
		() => schema.safeParse(values).success,
		[schema, values]
	);

	const setValue = useCallback(
		<TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => {
			setValues((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const touchField = useCallback((key: keyof TValues) => {
		setTouched((prev) => ({ ...prev, [key]: true }));
	}, []);

	const reset = useCallback(
		(nextValues?: TValues) => {
			setValues(nextValues ?? initialValues);
			setTouched({});
		},
		[initialValues]
	);

	const validate = useCallback((): TValues | null => {
		const parsed = schema.safeParse(values);
		if (parsed.success) return parsed.data as TValues;

		const allTouched: TouchedFields<TValues> = {};
		for (const key of Object.keys(values) as Array<keyof TValues>) {
			allTouched[key] = true;
		}
		setTouched(allTouched);
		return null;
	}, [schema, values]);

	return {
		values,
		errors,
		touched,
		isValid,
		setValue,
		touchField,
		reset,
		validate,
	};
}

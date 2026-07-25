import type { InputHTMLAttributes, ReactElement } from "react";
import { Input } from "../../atoms/Input/Input";
import styles from "./FormField.module.scss";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	readonly label: string;
	readonly errorMessage?: string;
	/**
	 * Kept for the one remaining real use case: showing a "this field is
	 * required" message after the user leaves an empty required field.
	 * It no longer gates real-time validity feedback - see `hasError` below.
	 */
	readonly touched?: boolean;
}

/**
 * Atomic Design: molecule. Combines the Input atom with a label and a
 * real-time error message driven by a Zod validation result.
 *
 * Validation feedback is intentionally live: as soon as the field has any
 * content, an invalid value turns the border red and shows the message
 * immediately - the user does not have to blur the field first. A field is
 * only ever shown as "idle" (neutral) while it is empty, so a fresh,
 * untouched form does not greet the user with a wall of red.
 */
export function FormField({
	label,
	errorMessage,
	touched = false,
	id,
	...inputProps
}: FormFieldProps): ReactElement {
	const hasValue = Boolean(inputProps.value);
	const hasError = hasValue
		? Boolean(errorMessage)
		: touched && Boolean(errorMessage);
	const isValid = hasValue && !errorMessage;

	return (
		<div className={styles["form-field"]}>
			<label className={styles["form-field__label"]} htmlFor={id}>
				{label}
			</label>
			<Input
				id={id}
				validationState={hasError ? "invalid" : isValid ? "valid" : "idle"}
				{...inputProps}
			/>
			{hasError && (
				<span className={styles["form-field__error"]}>{errorMessage}</span>
			)}
		</div>
	);
}

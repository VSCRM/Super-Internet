import type { InputHTMLAttributes, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../atoms/Input/Input";
import styles from "./EmailField.module.scss";

export interface EmailFieldProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type"
> {
	readonly label: string;
	readonly value: string;
	readonly errorMessage?: string;
	/**
	 * Kept for the one remaining real use case: showing a "this field is
	 * required" message after the user leaves an empty required field.
	 * Mirrors `FormField` - it does not gate real-time validity feedback.
	 */
	readonly touched?: boolean;
}

/** A handful of accepted formats shown to the user whenever their input is rejected. */
const EMAIL_EXAMPLES: readonly string[] = [
	"ivan.petrenko@gmail.com",
	"user2024@ukr.net",
	"office@outlook.com",
];

/**
 * Atomic Design: molecule. Same live-feedback pattern as `PasswordField` and
 * `AddressField`, but for email: instead of a per-character requirement
 * checklist (which doesn't map well to "is this a real email"), an invalid,
 * non-empty value shows a short list of accepted formats right under the
 * field, so the user isn't just told "wrong" with no idea what "right"
 * looks like.
 */
export function EmailField({
	label,
	value,
	id,
	errorMessage,
	touched = false,
	...inputProps
}: EmailFieldProps): ReactElement {
	const { t } = useTranslation();
	const hasValue = value.length > 0;
	const hasError = hasValue
		? Boolean(errorMessage)
		: touched && Boolean(errorMessage);
	const isValid = hasValue && !errorMessage;

	return (
		<div className={styles["email-field"]}>
			<label className={styles["email-field__label"]} htmlFor={id}>
				{label}
			</label>
			<Input
				id={id}
				type="email"
				value={value}
				validationState={hasError ? "invalid" : isValid ? "valid" : "idle"}
				{...inputProps}
			/>
			{hasError && (
				<span className={styles["email-field__error"]}>{errorMessage}</span>
			)}
			{hasError && (
				<div className={styles["email-field__examples"]}>
					<span className={styles["email-field__examples-label"]}>
						{t("email.examplesLabel")}
					</span>
					<ul className={styles["email-field__examples-list"]}>
						{EMAIL_EXAMPLES.map((example) => (
							<li key={example} className={styles["email-field__example"]}>
								{example}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

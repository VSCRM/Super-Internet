import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactElement } from "react";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Input.module.scss";

export type InputValidationState = "idle" | "valid" | "invalid";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	readonly validationState?: InputValidationState;
}

/**
 * Atomic Design: atom. Pure presentational input with a validation-state
 * visual affordance.
 *
 * When `type="password"`, an eye icon is rendered inside the field so the
 * user can reveal/hide what they typed - this applies everywhere a password
 * is entered (login, registration, profile-password forms, recovery)
 * because every one of those forms is built on top of this same atom.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ validationState = "idle", className, type, ...rest },
	ref
): ReactElement {
	const generatedId = useId();
	const [isRevealed, setIsRevealed] = useState(false);
	const isPassword = type === "password";
	const { t } = useTranslation();

	const classNames = [
		styles.input,
		styles[`input--${validationState}`],
		isPassword ? styles["input--with-toggle"] : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	if (!isPassword) {
		return <input ref={ref} type={type} className={classNames} {...rest} />;
	}

	return (
		<div className={styles["input-wrapper"]}>
			<input
				ref={ref}
				type={isRevealed ? "text" : "password"}
				className={classNames}
				{...rest}
			/>
			<button
				type="button"
				className={styles["input-wrapper__toggle"]}
				onClick={() => setIsRevealed((revealed) => !revealed)}
				aria-label={
					isRevealed ? t("input.hidePassword") : t("input.showPassword")
				}
				aria-pressed={isRevealed}
				tabIndex={-1}
				data-testid={`password-toggle-${generatedId}`}
			>
				{isRevealed ? (
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
						<line x1="1" y1="1" x2="23" y2="23" />
					</svg>
				) : (
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				)}
			</button>
		</div>
	);
});

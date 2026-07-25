import type { InputHTMLAttributes, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../atoms/Input/Input";
import {
	PASSWORD_REQUIREMENTS,
	MIN_PASSWORD_LENGTH,
} from "../../../shared/schemas/auth.schema";
import styles from "./PasswordField.module.scss";

export interface PasswordFieldProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type"
> {
	readonly label: string;
	readonly value: string;
}

/**
 * Real-time password strength field.
 *
 * Requirements are shown only after the user starts typing (value.length > 0).
 * An untouched empty field renders as idle (neutral border, no requirement rows),
 * so the form does not greet the user with a wall of red on first render.
 * Once the user begins typing, the border turns red/green live and every
 * requirement flips from red to green the moment it is individually satisfied.
 */
export function PasswordField({
	label,
	value,
	id,
	...inputProps
}: PasswordFieldProps): ReactElement {
	const { t } = useTranslation();
	const isEmpty = value.length === 0;
	const allSatisfied = PASSWORD_REQUIREMENTS.every((requirement) =>
		requirement.test(value)
	);

	return (
		<div className={styles["password-field"]}>
			<label className={styles["password-field__label"]} htmlFor={id}>
				{label}
			</label>
			<Input
				id={id}
				type="password"
				value={value}
				validationState={isEmpty ? "idle" : allSatisfied ? "valid" : "invalid"}
				{...inputProps}
			/>

			{!isEmpty && (
				<ul className={styles["password-field__requirements"]}>
					{PASSWORD_REQUIREMENTS.map((requirement) => {
						const isSatisfied = requirement.test(value);
						return (
							<li
								key={requirement.id}
								className={`${styles["password-field__requirement"]} ${
									isSatisfied
										? styles["password-field__requirement--met"]
										: styles["password-field__requirement--unmet"]
								}`}
							>
								<span
									className={styles["password-field__requirement-icon"]}
									aria-hidden="true"
								>
									{isSatisfied ? "✓" : "✕"}
								</span>
								{t(`password.requirements.${requirement.id}`, {
									min: MIN_PASSWORD_LENGTH,
								})}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

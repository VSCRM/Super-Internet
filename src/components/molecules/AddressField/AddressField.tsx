import type { InputHTMLAttributes, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../atoms/Input/Input";
import { ADDRESS_REQUIREMENTS, isAddressValid } from "./addressRequirements";
import styles from "./AddressField.module.scss";

export interface AddressFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	readonly label: string;
	readonly value: string;
}

/**
 * Atomic Design: molecule. Real-time address validation mirroring
 * `PasswordField` UX: each requirement flips red/green independently
 * as the user types. Requirements only appear once the user starts typing.
 */
export function AddressField({
	label,
	value,
	id,
	...inputProps
}: AddressFieldProps): ReactElement {
	const { t } = useTranslation();
	const isEmpty = value.trim().length === 0;
	const allSatisfied = isAddressValid(value);

	return (
		<div className={styles["address-field"]}>
			<label className={styles["address-field__label"]} htmlFor={id}>
				{label}
			</label>
			<Input
				id={id}
				type="text"
				value={value}
				placeholder={t("address.placeholder")}
				validationState={isEmpty ? "idle" : allSatisfied ? "valid" : "invalid"}
				{...inputProps}
			/>
			{!isEmpty && (
				<ul className={styles["address-field__requirements"]}>
					{ADDRESS_REQUIREMENTS.map((req) => {
						const met = req.test(value);
						return (
							<li
								key={req.id}
								className={`${styles["address-field__requirement"]} ${
									met
										? styles["address-field__requirement--met"]
										: styles["address-field__requirement--unmet"]
								}`}
							>
								<span
									className={styles["address-field__requirement-icon"]}
									aria-hidden="true"
								>
									{met ? "✓" : "✕"}
								</span>
								{t(`address.requirements.${req.id}`)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

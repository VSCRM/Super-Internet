import type { ReactElement } from "react";
import styles from "./ToggleSwitch.module.scss";

export interface ToggleSwitchProps {
	readonly checked: boolean;
	readonly onChange: () => void;
	readonly label?: string;
}

/** Atomic Design: atom. Accessible on/off switch used for the recurring-payment toggle. */
export function ToggleSwitch({
	checked,
	onChange,
	label,
}: ToggleSwitchProps): ReactElement {
	return (
		<label className={styles["toggle-switch"]} aria-label={label}>
			<input type="checkbox" checked={checked} onChange={onChange} />
			<span className={styles["toggle-switch__track"]} />
		</label>
	);
}

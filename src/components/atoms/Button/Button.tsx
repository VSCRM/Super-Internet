import type { ButtonHTMLAttributes, ReactElement } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant =
	"primary" | "secondary" | "danger" | "ghost" | "success";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	readonly variant?: ButtonVariant;
	readonly size?: ButtonSize;
	readonly fullWidth?: boolean;
	readonly isLoading?: boolean;
}

/**
 * Atomic Design: atom. The smallest reusable interactive unit - no business
 * logic, only presentation and a thin loading-state affordance.
 */
export function Button({
	variant = "primary",
	size = "md",
	fullWidth = false,
	isLoading = false,
	disabled,
	className,
	children,
	...rest
}: ButtonProps): ReactElement {
	const classNames = [
		styles.button,
		styles[`button--${variant}`],
		styles[`button--${size}`],
		fullWidth ? styles["button--full-width"] : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button className={classNames} disabled={disabled || isLoading} {...rest}>
			{isLoading ? (
				<span className={styles.button__spinner} aria-hidden="true" />
			) : (
				children
			)}
		</button>
	);
}

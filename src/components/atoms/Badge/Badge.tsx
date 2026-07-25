import type { ReactElement, ReactNode } from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant = "active" | "debt" | "pending";

export interface BadgeProps {
	readonly variant: BadgeVariant;
	readonly children: ReactNode;
}

/** Atomic Design: atom. Small status pill reused across client/admin/support views. */
export function Badge({ variant, children }: BadgeProps): ReactElement {
	return (
		<span className={`${styles.badge} ${styles[`badge--${variant}`]}`}>
			{children}
		</span>
	);
}

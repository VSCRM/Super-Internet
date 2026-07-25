import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Pagination.module.scss";

export interface PaginationProps {
	readonly page: number;
	readonly pageCount: number;
	readonly onPageChange: (page: number) => void;
}

/** Single responsibility: prev/next + page-number controls. Renders nothing for a single page. */
export function Pagination({
	page,
	pageCount,
	onPageChange,
}: PaginationProps): ReactElement | null {
	const { t } = useTranslation();
	if (pageCount <= 1) return null;

	return (
		<nav
			className={styles["pagination"]}
			aria-label={t("pagination.ariaLabel")}
		>
			<button
				className={styles["pagination__button"]}
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				aria-label={t("pagination.prevAriaLabel")}
			>
				←
			</button>
			<span className={styles["pagination__status"]}>
				{t("pagination.status", { page, count: pageCount })}
			</span>
			<button
				className={styles["pagination__button"]}
				disabled={page >= pageCount}
				onClick={() => onPageChange(page + 1)}
				aria-label={t("pagination.nextAriaLabel")}
			>
				→
			</button>
		</nav>
	);
}

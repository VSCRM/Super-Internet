import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import type { AppUser } from "../../types/models";
import { Button } from "../atoms/Button/Button";
import { LanguageSwitcher } from "../molecules/LanguageSwitcher/LanguageSwitcher";
import styles from "./DashboardHeader.module.scss";

export function DashboardHeader({ user }: { user: AppUser }): ReactElement {
	const { logout } = useApp();
	const { t } = useTranslation();
	const displayName =
		user.role === "client"
			? user.fio
			: user.role === "support"
				? user.name
				: user.email;

	return (
		<div className={styles["dashboard-header"]}>
			<div className={styles["user-info"]}>
				<h2>{t("dashboard.welcome", { name: displayName })}</h2>
				<span>({t(`dashboard.roles.${user.role}`)})</span>
			</div>
			<div className={styles["dashboard-header__actions"]}>
				<LanguageSwitcher />
				<Button variant="secondary" onClick={() => void logout()}>
					{t("dashboard.logout")}
				</Button>
			</div>
		</div>
	);
}

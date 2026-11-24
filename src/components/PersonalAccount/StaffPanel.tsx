import { useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import type { SupportUser } from "../../types/models";
import { Button } from "../atoms/Button/Button";
import { AddStaffForm } from "./AddStaffForm";
import shared from "./dashboardShared.module.scss";
import styles from "./AdminDashboard.module.scss";

/** Single responsibility: list support staff and let the admin add/remove them. */
export function StaffPanel(): ReactElement {
	const { users, deleteStaff, capabilities } = useApp();
	const { runResult } = useConfirmedAction();
	const { t } = useTranslation();
	const [isAdding, setIsAdding] = useState(false);
	const staff = users.filter((u): u is SupportUser => u.role === "support");

	const handleDeleteStaff = (email: string): Promise<boolean> =>
		runResult({
			confirmTitle: t("staff.deleteConfirmTitle"),
			confirmMessage: t("staff.deleteConfirmMessage"),
			successMessage: t("staff.deletedMessage"),
			action: () => deleteStaff(email),
		});

	return (
		<div className={shared["service-card"]}>
			<h3>{t("staff.panelTitle")}</h3>

			{isAdding ? (
				<AddStaffForm onDone={() => setIsAdding(false)} />
			) : (
				<Button onClick={() => setIsAdding(true)}>{t("staff.add")}</Button>
			)}

			<div>
				<h4 style={{ marginTop: "2rem" }}>{t("staff.listTitle")}</h4>
				{staff.map((member) => (
					<div key={member.id} className={styles["staff-card"]}>
						<div className={styles["staff-card__row"]}>
							<div>
								<strong>{member.name}</strong>
								<br />
								<small>{member.email}</small>
							</div>
							{capabilities.canDeleteAccounts && (
								<Button
									variant="secondary"
									onClick={() => void handleDeleteStaff(member.email)}
								>
									{t("staff.delete")}
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

import { useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { NavTabs } from "../molecules/NavTabs/NavTabs";
import { StaffPanel } from "./StaffPanel";
import { EquipmentPanel } from "./EquipmentPanel";
import { ClientsPanel } from "./ClientsPanel";
import shared from "./dashboardShared.module.scss";

type AdminTab = "staff" | "equipment" | "clients";

/** Composition root for the admin's personal account: only owns which tab is active. */
export function AdminDashboard(): ReactElement {
	const { t } = useTranslation();
	const [tab, setTab] = useState<AdminTab>("staff");

	return (
		<div>
			<NavTabs
				tabs={[
					{ id: "staff", label: t("dashboard.nav.staff") },
					{ id: "equipment", label: t("dashboard.nav.equipment") },
					{ id: "clients", label: t("dashboard.nav.clients") },
				]}
				active={tab}
				onSelect={setTab}
			/>

			{tab === "staff" && (
				<div className={shared["tab-content"]}>
					<StaffPanel />
				</div>
			)}
			{tab === "equipment" && (
				<div className={shared["tab-content"]}>
					<EquipmentPanel />
				</div>
			)}
			{tab === "clients" && (
				<div className={shared["tab-content"]}>
					<ClientsPanel />
				</div>
			)}
		</div>
	);
}

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import { usePagination } from "../../hooks/usePagination";
import type { ClientUser, EquipmentStatus } from "../../types/models";
import { Pagination } from "../molecules/Pagination/Pagination";
import { EquipmentItemCard } from "./EquipmentItemCard";
import shared from "./dashboardShared.module.scss";
import styles from "./AdminDashboard.module.scss";

function resolveEquipmentStatus(client: ClientUser): EquipmentStatus {
	return (
		client.equipmentStatus ?? (client.connectionApproved ? "online" : "pending")
	);
}

/** Single responsibility: approve pending connections and toggle equipment on/off (paginated). */
export function EquipmentPanel(): ReactElement {
	const { users, approveConnection, setEquipmentStatus } = useApp();
	const { runVoid } = useConfirmedAction();
	const { t } = useTranslation();
	const clients = users.filter(
		(u): u is ClientUser => u.role === "client" && !!u.contract
	);
	const { page, pageCount, pageItems, goToPage } = usePagination(clients);

	const handleApprove = (client: ClientUser): Promise<boolean> => {
		if (!client.contract) return Promise.resolve(false);
		const serviceLabel =
			client.contract.serviceType === "internet"
				? t("equipment.serviceInternet")
				: t("equipment.serviceInternetTv");

		return runVoid({
			confirmTitle: t("equipment.approveConfirmTitle"),
			confirmMessage: t("equipment.approveConfirmMessage", {
				fio: client.fio,
				address: client.contract.address,
				service: serviceLabel,
			}),
			successMessage: t("equipment.approvedMessage"),
			action: () => approveConnection(client.id),
		});
	};

	const handleStatusChange = (
		client: ClientUser,
		newStatus: EquipmentStatus
	): Promise<boolean> => {
		if (!client.contract) return Promise.resolve(false);
		const actionLabel =
			newStatus === "online" ? t("equipment.turnOn") : t("equipment.turnOff");

		return runVoid({
			confirmTitle: t("equipment.statusChangeConfirmTitle"),
			confirmMessage: t("equipment.statusChangeConfirmMessage", {
				action: actionLabel,
				equipmentId: client.contract.equipmentId,
				fio: client.fio,
			}),
			successMessage:
				newStatus === "online"
					? t("equipment.turnedOnMessage")
					: t("equipment.turnedOffMessage"),
			action: () => setEquipmentStatus(client.id, newStatus),
		});
	};

	return (
		<div className={shared["service-card"]}>
			<h3>{t("equipment.panelTitle")}</h3>
			<div className={styles["equipment-grid"]}>
				{clients.length === 0 ? (
					<p className={styles["empty-state"]}>{t("equipment.empty")}</p>
				) : (
					pageItems.map((client) => (
						<EquipmentItemCard
							key={client.id}
							client={client}
							status={resolveEquipmentStatus(client)}
							onApprove={(c) => void handleApprove(c)}
							onStatusChange={(c, status) => void handleStatusChange(c, status)}
						/>
					))
				)}
			</div>
			<Pagination page={page} pageCount={pageCount} onPageChange={goToPage} />
		</div>
	);
}

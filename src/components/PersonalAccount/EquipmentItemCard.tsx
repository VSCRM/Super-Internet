import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser, EquipmentStatus } from "../../types/models";
import { SERVICE_NAMES } from "../../types/models";
import { Badge } from "../atoms/Badge/Badge";
import styles from "./AdminDashboard.module.scss";

export interface EquipmentItemCardProps {
	readonly client: ClientUser;
	readonly status: EquipmentStatus;
	readonly onApprove: (client: ClientUser) => void;
	readonly onStatusChange: (
		client: ClientUser,
		status: EquipmentStatus
	) => void;
}

const STATUS_KEYS: Record<EquipmentStatus, string> = {
	online: "equipment.statusOnline",
	offline: "equipment.statusOffline",
	pending: "equipment.statusPending",
};
const STATUS_BADGE_VARIANTS: Record<
	EquipmentStatus,
	"active" | "debt" | "pending"
> = {
	online: "active",
	offline: "debt",
	pending: "pending",
};

/** Single responsibility: one client's equipment tile, with approve/online/offline controls. */
export function EquipmentItemCard({
	client,
	status,
	onApprove,
	onStatusChange,
}: EquipmentItemCardProps): ReactElement {
	const { t } = useTranslation();
	const serviceName = client.contract
		? t(SERVICE_NAMES[client.contract.serviceType])
		: "";

	return (
		<div
			className={`${styles["equipment-item"]} ${styles[`equipment-item--${status}`]}`}
			title={t("equipment.tooltip", {
				fio: client.fio,
				address: client.contract?.address,
				service: serviceName,
				status: t(STATUS_KEYS[status]),
			})}
		>
			<strong>{client.contract?.equipmentId}</strong>
			<br />
			<small>{client.fio}</small>
			<br />
			<span className={styles["equipment-status-badge"]}>
				<Badge variant={STATUS_BADGE_VARIANTS[status]}>
					{t(STATUS_KEYS[status])}
				</Badge>
			</span>
			<div className={styles["equipment-actions"]}>
				{!client.connectionApproved && (
					<button
						className={styles["approve-button"]}
						onClick={() => onApprove(client)}
					>
						{t("equipment.approve")}
					</button>
				)}
				{client.connectionApproved && (
					<>
						{status !== "online" && (
							<button
								className={`${styles["status-control-button"]} ${styles["status-control-button--online"]}`}
								onClick={() => onStatusChange(client, "online")}
							>
								{t("equipment.turnOn")}
							</button>
						)}
						{status !== "offline" && (
							<button
								className={`${styles["status-control-button"]} ${styles["status-control-button--offline"]}`}
								onClick={() => onStatusChange(client, "offline")}
							>
								{t("equipment.turnOff")}
							</button>
						)}
					</>
				)}
			</div>
		</div>
	);
}

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import { SERVICE_NAMES } from "../../types/models";
import { Button } from "../atoms/Button/Button";
import { Badge } from "../atoms/Badge/Badge";
import shared from "./dashboardShared.module.scss";
import styles from "./ClientDashboard.module.scss";

export interface ClientContractTabProps {
	readonly client: ClientUser;
	readonly onEditAddress: () => void;
	readonly onDeleteContract: () => void;
	readonly onDeleteAccount: () => void;
}

function ContractStatusBadge({ client }: { client: ClientUser }): ReactElement {
	const { t } = useTranslation();
	if (!client.connectionApproved)
		return <Badge variant="pending">{t("contract.statusPending")}</Badge>;
	if (client.contract?.status === "active")
		return <Badge variant="active">{t("contract.statusActive")}</Badge>;
	return <Badge variant="debt">{t("contract.statusDebt")}</Badge>;
}

/** Single responsibility: read-only contract details plus edit/delete/delete-account actions. */
export function ClientContractTab({
	client,
	onEditAddress,
	onDeleteContract,
	onDeleteAccount,
}: ClientContractTabProps): ReactElement {
	const { t } = useTranslation();

	if (!client.contract) {
		return (
			<div className={shared["tab-content"]}>
				<Badge variant="pending">{t("contract.noContract")}</Badge>
			</div>
		);
	}

	return (
		<div className={shared["tab-content"]}>
			<div className={shared["contract-view"]}>
				<h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
					{t("contract.title", { id: client.contract.id })}
				</h2>
				<div className={shared["contract-field"]}>
					<label>{t("contract.fio")}</label>
					<span>{client.contract.fio}</span>
				</div>
				<div className={shared["contract-field"]}>
					<label>{t("contract.phone")}</label>
					<span>{client.contract.phone}</span>
				</div>
				<div className={shared["contract-field"]}>
					<label>{t("contract.email")}</label>
					<span>{client.contract.email}</span>
				</div>
				<div className={shared["contract-field"]}>
					<label>{t("contract.address")}</label>
					<span>{client.contract.address}</span>
				</div>
				<div className={shared["contract-field"]}>
					<label>{t("contract.serviceType")}</label>
					<span>{t(SERVICE_NAMES[client.contract.serviceType])}</span>
				</div>
				<div className={shared["contract-field"]}>
					<label>{t("contract.equipmentId")}</label>
					<span>{client.contract.equipmentId}</span>
				</div>
				<div className={shared["contract-field"]}>
					<label>{t("contract.status")}</label>
					<span>
						<ContractStatusBadge client={client} />
					</span>
				</div>
			</div>

			<div className={styles["contract-actions"]}>
				<Button
					className={styles["contract-actions__button"]}
					onClick={onEditAddress}
				>
					{t("contract.edit")}
				</Button>
				<Button
					variant="secondary"
					className={styles["contract-actions__button"]}
					onClick={onDeleteContract}
				>
					{t("contract.delete")}
				</Button>
				<Button
					variant="danger"
					className={styles["contract-actions__button"]}
					onClick={onDeleteAccount}
				>
					{t("contract.deleteAccount")}
				</Button>
			</div>
		</div>
	);
}

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import { SERVICE_NAMES } from "../../types/models";
import { ServiceStatusBadge } from "../molecules/ServiceStatusBadge/ServiceStatusBadge";
import shared from "./dashboardShared.module.scss";

export interface ProfileStatusTabProps {
	readonly client: ClientUser;
}

/** Single responsibility: read-only service/status summary shown to a support agent. */
export function ProfileStatusTab({
	client,
}: ProfileStatusTabProps): ReactElement {
	const { t } = useTranslation();

	return (
		<div className={shared["service-card"]}>
			<h3>{t("service.currentService")}</h3>
			{client.contract ? (
				<>
					<div className={shared["contract-field"]}>
						<span>{t("contract.serviceType")}</span>
						<span>{t(SERVICE_NAMES[client.contract.serviceType])}</span>
					</div>
					<div className={shared["contract-field"]}>
						<span>{t("contract.status")}</span>
						<span>
							<ServiceStatusBadge client={client} />
						</span>
					</div>
					<div className={shared["contract-field"]}>
						<span>{t("service.balance")}</span>
						<span>
							{t("service.balanceValue", { amount: client.balance.toFixed(2) })}
						</span>
					</div>
					<div className={shared["contract-field"]}>
						<span>{t("contract.equipmentIdImmutable")}</span>
						<span>{client.contract.equipmentId}</span>
					</div>
					<div className={shared["contract-field"]}>
						<span>{t("contract.address")}</span>
						<span>{client.contract.address}</span>
					</div>
				</>
			) : (
				<p>{t("contract.notIssued")}</p>
			)}
		</div>
	);
}

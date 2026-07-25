import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser, ServiceType } from "../../types/models";
import { SERVICE_NAMES } from "../../types/models";
import { Button } from "../atoms/Button/Button";
import { ToggleSwitch } from "../atoms/ToggleSwitch/ToggleSwitch";
import { ServiceStatusBadge } from "../molecules/ServiceStatusBadge/ServiceStatusBadge";
import shared from "./dashboardShared.module.scss";
import styles from "./ClientDashboard.module.scss";

export interface ClientStatusTabProps {
	readonly client: ClientUser;
	readonly onSelectService: (serviceType: ServiceType) => void;
	readonly onPay: () => void;
	readonly onToggleRecurring: () => void;
}

const DATE_LOCALES: Record<string, string> = { uk: "uk-UA", en: "en-US" };

function nextPaymentDate(): Date {
	const date = new Date();
	date.setMonth(date.getMonth() + 1);
	return date;
}

/** Single responsibility: let a client without a contract pick a service, or show the active service's status/payment card. */
export function ClientStatusTab({
	client,
	onSelectService,
	onPay,
	onToggleRecurring,
}: ClientStatusTabProps): ReactElement {
	const { t, i18n } = useTranslation();

	if (!client.contract) {
		return (
			<div className={shared["tab-content"]}>
				<div className={shared["service-selection"]}>
					<div
						className={shared["service-option"]}
						onClick={() => onSelectService("internet")}
					>
						<h3>{t("service.internetTitle")}</h3>
						<p>{t("service.internetDesc")}</p>
						<p>
							<strong>{t("service.internetPrice")}</strong>
						</p>
					</div>
					<div
						className={shared["service-option"]}
						onClick={() => onSelectService("internet_tv")}
					>
						<h3>{t("service.internetTvTitle")}</h3>
						<p>{t("service.internetTvDesc")}</p>
						<p>
							<strong>{t("service.internetTvPrice")}</strong>
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={shared["tab-content"]}>
			<div className={shared["service-card"]}>
				<h3>{t("service.currentService")}</h3>
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
					<span>{t("service.nextPayment")}</span>
					<span>
						{nextPaymentDate().toLocaleDateString(
							DATE_LOCALES[i18n.language] ?? "uk-UA"
						)}
					</span>
				</div>

				<div className={styles["recurring-payment"]}>
					<h4>{t("service.recurringPayment")}</h4>
					<div className={styles["recurring-payment__row"]}>
						<ToggleSwitch
							checked={!!client.isRecurring}
							onChange={onToggleRecurring}
							label={t("service.recurringPayment")}
						/>
						<span className={styles["recurring-payment__status"]}>
							{client.isRecurring
								? t("service.recurringActive")
								: t("service.recurringInactive")}
						</span>
					</div>
				</div>

				<Button onClick={onPay} style={{ marginTop: "1rem" }}>
					{t("service.pay")}
				</Button>
			</div>
		</div>
	);
}

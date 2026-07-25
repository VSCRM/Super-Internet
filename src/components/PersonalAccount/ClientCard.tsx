import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import { Button } from "../atoms/Button/Button";
import { Badge } from "../atoms/Badge/Badge";
import shared from "./dashboardShared.module.scss";

export interface ClientCardProps {
	readonly client: ClientUser;
	readonly onDelete: (client: ClientUser) => void;
}

/** Single responsibility: one client's summary tile in the admin's client list. */
export function ClientCard({
	client,
	onDelete,
}: ClientCardProps): ReactElement {
	const { t } = useTranslation();
	return (
		<div className={shared["ticket-card"]}>
			<h4>{client.fio}</h4>
			<p>
				{t("auth.fields.email")}: {client.email}
			</p>
			<p>{t("clients.phone", { phone: client.phone })}</p>
			<p>{t("clients.balance", { amount: client.balance.toFixed(2) })}</p>
			<p style={{ marginTop: "0.5rem" }}>
				{client.contract ? (
					<Badge variant={client.connectionApproved ? "active" : "pending"}>
						{client.connectionApproved
							? t("clients.connected")
							: t("clients.pending")}
					</Badge>
				) : (
					<Badge variant="debt">{t("clients.noContract")}</Badge>
				)}
			</p>
			<Button
				variant="danger"
				style={{ marginTop: "0.5rem", width: "100%" }}
				onClick={() => onDelete(client)}
			>
				{t("clients.delete")}
			</Button>
		</div>
	);
}

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import { Badge } from "../atoms/Badge/Badge";
import shared from "./dashboardShared.module.scss";
import styles from "./SupportDashboard.module.scss";

export interface TicketCardProps {
	readonly client: ClientUser;
	readonly onOpen: (clientId: number) => void;
}

/** Single responsibility: one client's ticket summary tile in the support queue. */
export function TicketCard({ client, onOpen }: TicketCardProps): ReactElement {
	const { t } = useTranslation();
	// Count only client-sent messages (not support replies).
	const clientMessageCount = client.messages.filter(
		(m) => m.from !== "support"
	).length;
	const hasUnread = client.unreadMessages > 0;

	return (
		<div
			className={`${shared["ticket-card"]} ${hasUnread ? styles["ticket-card--unread"] : ""}`}
			onClick={() => onOpen(client.id)}
		>
			{hasUnread && (
				<span className={styles["ticket-unread-badge"]}>
					{client.unreadMessages}
				</span>
			)}
			<h4>{client.fio}</h4>
			<p>
				{t("auth.fields.email")}: {client.email}
			</p>
			<p>{t("clients.phone", { phone: client.phone })}</p>
			<p>{t("tickets.messagesFromClient", { count: clientMessageCount })}</p>
			<p style={{ marginTop: "0.5rem" }}>
				<Badge variant={hasUnread ? "debt" : "pending"}>
					{hasUnread ? t("tickets.newMessages") : t("tickets.activeStatus")}
				</Badge>
			</p>
		</div>
	);
}

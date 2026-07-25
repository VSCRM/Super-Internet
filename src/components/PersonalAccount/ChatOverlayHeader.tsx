import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import styles from "./SupportChatOverlay.module.scss";

export interface ChatOverlayHeaderProps {
	readonly client: ClientUser;
	readonly onViewProfile: () => void;
	readonly onCloseTicket: () => void;
	readonly onClose: () => void;
}

/** Single responsibility: the overlay's title bar and its three actions. */
export function ChatOverlayHeader({
	client,
	onViewProfile,
	onCloseTicket,
	onClose,
}: ChatOverlayHeaderProps): ReactElement {
	const { t } = useTranslation();
	return (
		<div className={styles["chat-header"]}>
			<div>
				<h3 className={styles["chat-header__title"]}>{client.fio}</h3>
				<p className={styles["chat-header__subtitle"]}>{client.email}</p>
			</div>
			<div className={styles["chat-header__actions"]}>
				<button
					className={styles["view-client-button"]}
					onClick={onViewProfile}
				>
					{t("tickets.viewProfile")}
				</button>
				<button
					className={styles["close-ticket-button"]}
					onClick={onCloseTicket}
				>
					{t("tickets.closeTicket")}
				</button>
				<button
					className={styles["icon-button"]}
					onClick={onClose}
					aria-label={t("tickets.closeAria")}
				>
					✕
				</button>
			</div>
		</div>
	);
}

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import { ChatThread } from "./ChatThread";
import { ChatInput } from "../molecules/ChatInput/ChatInput";
import shared from "./dashboardShared.module.scss";
import styles from "./ClientDashboard.module.scss";

export interface ClientSupportTabProps {
	readonly client: ClientUser;
	readonly onSendMessage: (text: string) => void;
}

/** Single responsibility: the client-side view of their support chat thread. */
export function ClientSupportTab({
	client,
	onSendMessage,
}: ClientSupportTabProps): ReactElement {
	const { t } = useTranslation();
	return (
		<div className={shared["tab-content"]}>
			<div className={styles["support-chat"]}>
				<h3>{t("support.chatTitle")}</h3>
				<ChatThread
					messages={client.messages}
					selfEmail={client.email}
					variant="embedded"
				/>
				<ChatInput onSend={onSendMessage} />
			</div>
		</div>
	);
}

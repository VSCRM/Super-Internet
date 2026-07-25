import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import type { ClientUser } from "../../types/models";
import { ChatThread } from "./ChatThread";
import { ChatOverlayHeader } from "./ChatOverlayHeader";
import { ClientProfileModal } from "./ClientProfileModal";
import { ChatInput } from "../molecules/ChatInput/ChatInput";
import styles from "./SupportChatOverlay.module.scss";

interface SupportChatOverlayProps {
	readonly client: ClientUser;
	readonly onClose: () => void;
	readonly onTicketClosed: () => void;
}

const OPEN_ANIMATION_DELAY_MS = 10;
const CLOSE_ANIMATION_DURATION_MS = 300;

/**
 * Composition root for the support agent's chat overlay. Owns only the
 * open/close animation state and the "view profile" toggle; the header,
 * message thread, and input are each their own single-responsibility piece.
 */
export function SupportChatOverlay({
	client,
	onClose,
	onTicketClosed,
}: SupportChatOverlayProps): ReactElement {
	const app = useApp();
	const { runVoid } = useConfirmedAction();
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);
	const [showProfile, setShowProfile] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const id = window.setTimeout(
			() => setVisible(true),
			OPEN_ANIMATION_DELAY_MS
		);
		return () => window.clearTimeout(id);
	}, []);

	// Mark client->support messages as read whenever new ones arrive while
	// the overlay is open (mirrors the same pattern in ClientDashboard).
	useEffect(() => {
		const hasUnread = client.messages.some(
			(m) => m.from !== "support" && !m.read
		);
		if (hasUnread) void app.markSupportMessagesRead(client.id);
	}, [client.messages, client.id, app]);

	const close = (): void => {
		setVisible(false);
		window.setTimeout(onClose, CLOSE_ANIMATION_DURATION_MS);
	};

	// Disabled while the nested profile modal is open, so Escape/Tab are
	// handled by that (topmost) dialog only, not both at once.
	useDialogA11y(dialogRef, close, !showProfile);

	const handleCloseTicket = async (): Promise<void> => {
		const wasClosed = await runVoid({
			confirmTitle: t("tickets.closeConfirmTitle"),
			confirmMessage: t("tickets.closeConfirmMessage", { fio: client.fio }),
			successMessage: t("tickets.closedMessage"),
			action: () => app.closeTicket(client.id),
		});
		if (!wasClosed) return;

		setVisible(false);
		window.setTimeout(() => {
			onClose();
			onTicketClosed();
		}, CLOSE_ANIMATION_DURATION_MS);
	};

	return (
		<>
			<div
				className={`${styles["chat-overlay"]} ${visible ? styles["chat-overlay--show"] : ""}`}
			>
				<div
					ref={dialogRef}
					role="dialog"
					aria-modal="true"
					aria-label={t("tickets.chatWith", { fio: client.fio })}
					className={styles["chat-window"]}
				>
					<ChatOverlayHeader
						client={client}
						onViewProfile={() => setShowProfile(true)}
						onCloseTicket={() => void handleCloseTicket()}
						onClose={close}
					/>

					<ChatThread
						messages={client.messages}
						selfEmail="support"
						variant="overlay"
					/>

					<div className={styles["chat-input-wrapper"]}>
						<ChatInput
							onSend={(text) => void app.sendSupportMessage(client.id, text)}
						/>
					</div>
				</div>
			</div>

			{showProfile && (
				<ClientProfileModal
					client={client}
					onClose={() => setShowProfile(false)}
				/>
			)}
		</>
	);
}

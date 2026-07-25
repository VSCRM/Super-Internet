import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import type { ClientUser } from "../../types/models";

const AUTO_REPLY_DELAY_MS = 1000;

/** Single responsibility: send a client chat message and schedule (with proper cleanup) the canned auto-reply. */
export function useSupportChatAction(
	client: ClientUser
): (text: string) => Promise<void> {
	const app = useApp();
	const { t } = useTranslation();
	const timeoutRef = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
		},
		[]
	);

	return async (text: string): Promise<void> => {
		await app.sendClientMessage(client.id, text);
		timeoutRef.current = window.setTimeout(() => {
			void app.sendSupportMessage(client.id, t("chat.autoReply"));
		}, AUTO_REPLY_DELAY_MS);
	};
}

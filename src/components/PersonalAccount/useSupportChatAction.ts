import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import type { ClientUser } from "../../types/models";
import { isFailure } from "../../shared/lib/result";

const AUTO_REPLY_DELAY_MS = 1000;

/**
 * Single responsibility: send a client chat message. In Mock mode it also
 * schedules (with proper cleanup) a canned auto-reply; with the real backend
 * there is no auto-reply - a support agent answers (and a client cannot post
 * as support anyway).
 */
export function useSupportChatAction(
	client: ClientUser
): (text: string) => Promise<void> {
	const app = useApp();
	const modal = useModal();
	const { t } = useTranslation();
	const timeoutRef = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
		},
		[]
	);

	return async (text: string): Promise<void> => {
		const result = await app.sendClientMessage(client.id, text);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		if (app.capabilities.isBackend) return;
		timeoutRef.current = window.setTimeout(() => {
			void app.sendSupportMessage(client.id, t("chat.autoReply"));
		}, AUTO_REPLY_DELAY_MS);
	};
}

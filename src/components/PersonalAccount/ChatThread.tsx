import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "../../types/models";
import styles from "./ChatThread.module.scss";

export type ChatThreadVariant = "embedded" | "overlay";

interface ChatThreadProps {
	readonly messages: ChatMessage[];
	readonly selfEmail: string;
	readonly variant: ChatThreadVariant;
}

export function ChatThread({
	messages,
	selfEmail,
	variant,
}: ChatThreadProps): ReactElement {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const prevLengthRef = useRef(messages.length);
	const containerClass =
		variant === "embedded"
			? styles["chat-thread--embedded"]
			: styles["chat-thread--overlay"];

	// Instant scroll on first mount (no animation - avoids the "jump")
	useLayoutEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "auto" });
		}
		prevLengthRef.current = messages.length;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Smooth scroll only for genuinely new messages after mount
	useEffect(() => {
		if (messages.length > prevLengthRef.current) {
			prevLengthRef.current = messages.length;
			if (bottomRef.current) {
				bottomRef.current.scrollIntoView({ behavior: "smooth" });
			}
		}
	}, [messages.length]);

	if (messages.length === 0) {
		return (
			<div ref={containerRef} className={containerClass}>
				<p className={styles["empty-state"]}>{t("support.noMessagesYet")}</p>
			</div>
		);
	}

	return (
		<div ref={containerRef} className={containerClass}>
			{messages.map((msg, index) => (
				<div
					key={index}
					className={`${styles.message} ${
						msg.from === selfEmail
							? styles["message--self"]
							: styles["message--other"]
					}`}
				>
					<small>{new Date(msg.timestamp).toLocaleString("uk-UA")}</small>
					<br />
					{msg.text}
				</div>
			))}
			{/* Sentinel element used as scroll target - always in view after new messages */}
			<div ref={bottomRef} style={{ height: 1 }} aria-hidden="true" />
		</div>
	);
}

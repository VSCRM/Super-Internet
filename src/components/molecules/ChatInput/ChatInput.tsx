import { useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../atoms/Button/Button";
import styles from "./ChatInput.module.scss";

export interface ChatInputProps {
	readonly onSend: (text: string) => void;
	readonly placeholder?: string;
}

/**
 * Single responsibility: a text field + send button pair that clears itself
 * after sending. Used identically by the client's own support tab and the
 * support agent's chat overlay - previously duplicated in both places.
 */
export function ChatInput({
	onSend,
	placeholder,
}: ChatInputProps): ReactElement {
	const { t } = useTranslation();
	const [value, setValue] = useState("");

	const send = (): void => {
		const text = value.trim();
		if (!text) return;
		onSend(text);
		setValue("");
	};

	return (
		<div className={styles["chat-input"]}>
			<input
				type="text"
				placeholder={placeholder ?? t("chat.placeholder")}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") send();
				}}
			/>
			<Button className={styles["chat-input__send"]} onClick={send}>
				{t("chat.send")}
			</Button>
		</div>
	);
}

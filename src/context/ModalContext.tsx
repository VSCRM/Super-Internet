import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AddressField } from "../components/molecules/AddressField/AddressField";
import { isAddressValid } from "../components/molecules/AddressField/addressRequirements";
import { useDialogA11y } from "../hooks/useDialogA11y";
import styles from "./ModalContext.module.scss";

type ModalKind = "info" | "success" | "error" | "warning";

interface InfoModalState {
	type: "info";
	title: string;
	message: string;
	kind: ModalKind;
}

interface ConfirmModalState {
	type: "confirm";
	title: string;
	message: string;
}

interface PromptModalState {
	type: "prompt";
	title: string;
	message: string;
	placeholder: string;
	defaultValue: string;
}

interface PromptAddressModalState {
	type: "promptAddress";
	title: string;
	message: string;
	defaultValue: string;
}

type ModalState =
	| InfoModalState
	| ConfirmModalState
	| PromptModalState
	| PromptAddressModalState
	| null;

interface ModalContextValue {
	show: (title: string, message: string, kind?: ModalKind) => Promise<void>;
	confirm: (title: string, message: string) => Promise<boolean>;
	prompt: (
		title: string,
		message: string,
		placeholder?: string,
		defaultValue?: string
	) => Promise<string | null>;
	/**
	 * Same shape as `prompt`, but renders the field through `AddressField` so
	 * the person sees the same live, per-requirement red/green checklist and
	 * placeholder example used everywhere else addresses are entered -
	 * instead of a bare text box that only reports "invalid" after submit.
	 */
	promptAddress: (
		title: string,
		message: string,
		defaultValue?: string
	) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useModal(): ModalContextValue {
	const ctx = useContext(ModalContext);
	if (!ctx) throw new Error("useModal must be used within ModalProvider");
	return ctx;
}

export function ModalProvider({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	const { t } = useTranslation();
	const [modal, setModal] = useState<ModalState>(null);
	const [visible, setVisible] = useState(false);
	const [promptValue, setPromptValue] = useState("");
	const resolverRef = useRef<((value: unknown) => void) | null>(null);

	const close = useCallback((result: unknown) => {
		setVisible(false);
		setTimeout(() => {
			setModal(null);
			if (resolverRef.current) {
				resolverRef.current(result);
				resolverRef.current = null;
			}
		}, 300);
	}, []);

	const open = useCallback(<T,>(state: ModalState): Promise<T> => {
		return new Promise<T>((resolve) => {
			resolverRef.current = resolve as (value: unknown) => void;
			setModal(state);
			setPromptValue(
				state && (state.type === "prompt" || state.type === "promptAddress")
					? state.defaultValue
					: ""
			);
			setTimeout(() => setVisible(true), 10);
		});
	}, []);

	const show = useCallback(
		(title: string, message: string, kind: ModalKind = "info") =>
			open<void>({ type: "info", title, message, kind }),
		[open]
	);

	const confirm = useCallback(
		(title: string, message: string) =>
			open<boolean>({ type: "confirm", title, message }),
		[open]
	);

	const prompt = useCallback(
		(title: string, message: string, placeholder = "", defaultValue = "") =>
			open<string | null>({
				type: "prompt",
				title,
				message,
				placeholder,
				defaultValue,
			}),
		[open]
	);

	const promptAddress = useCallback(
		(title: string, message: string, defaultValue = "") =>
			open<string | null>({
				type: "promptAddress",
				title,
				message,
				defaultValue,
			}),
		[open]
	);

	const isPromptValueValid =
		modal?.type === "promptAddress" ? isAddressValid(promptValue) : true;

	const dialogRef = useRef<HTMLDivElement>(null);
	const escapeResult: unknown =
		modal?.type === "confirm"
			? false
			: modal?.type === "prompt" || modal?.type === "promptAddress"
				? null
				: undefined;
	useDialogA11y(dialogRef, () => close(escapeResult), modal !== null);

	const titleId = "modal-title";
	const messageId = "modal-message";

	return (
		<ModalContext.Provider value={{ show, confirm, prompt, promptAddress }}>
			{children}
			{modal && (
				<div
					className={`${styles["modal-overlay"]} ${visible ? styles["modal-overlay--show"] : ""}`}
				>
					{modal.type === "info" && (
						<div
							ref={dialogRef}
							role="dialog"
							aria-modal="true"
							aria-labelledby={titleId}
							aria-describedby={messageId}
							className={`${styles["modal-content"]} ${styles[`modal-content--${modal.kind}`]}`}
						>
							<h3 id={titleId}>{modal.title}</h3>
							<p id={messageId}>{modal.message}</p>
							<button
								className={styles["modal-button"]}
								onClick={() => close(undefined)}
							>
								{t("modal.ok")}
							</button>
						</div>
					)}

					{modal.type === "confirm" && (
						<div
							ref={dialogRef}
							role="dialog"
							aria-modal="true"
							aria-labelledby={titleId}
							aria-describedby={messageId}
							className={`${styles["modal-content"]} ${styles["modal-content--warning"]}`}
						>
							<h3 id={titleId}>{modal.title}</h3>
							<p id={messageId}>{modal.message}</p>
							<div className={styles["modal-actions"]}>
								<button
									className={`${styles["modal-button"]} ${styles["modal-button--cancel"]}`}
									onClick={() => close(false)}
								>
									{t("modal.no")}
								</button>
								<button
									className={`${styles["modal-button"]} ${styles["modal-button--confirm"]}`}
									onClick={() => close(true)}
								>
									{t("modal.yes")}
								</button>
							</div>
						</div>
					)}

					{modal.type === "prompt" && (
						<div
							ref={dialogRef}
							role="dialog"
							aria-modal="true"
							aria-labelledby={titleId}
							aria-describedby={messageId}
							className={styles["modal-content"]}
						>
							<h3 id={titleId}>{modal.title}</h3>
							<p id={messageId}>{modal.message}</p>
							<input
								autoFocus
								type="text"
								className={styles["modal-input"]}
								placeholder={modal.placeholder}
								value={promptValue}
								onChange={(e) => setPromptValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") close(promptValue.trim());
								}}
							/>
							<div className={styles["modal-actions"]}>
								<button
									className={`${styles["modal-button"]} ${styles["modal-button--cancel"]}`}
									onClick={() => close(null)}
								>
									{t("modal.cancel")}
								</button>
								<button
									className={`${styles["modal-button"]} ${styles["modal-button--confirm"]}`}
									onClick={() => close(promptValue.trim())}
								>
									{t("modal.confirm")}
								</button>
							</div>
						</div>
					)}
					{modal.type === "promptAddress" && (
						<div
							ref={dialogRef}
							role="dialog"
							aria-modal="true"
							aria-labelledby={titleId}
							aria-describedby={messageId}
							className={styles["modal-content"]}
						>
							<h3 id={titleId}>{modal.title}</h3>
							<p id={messageId}>{modal.message}</p>
							<AddressField
								id="modalAddressPrompt"
								label={t("address.label")}
								autoFocus
								value={promptValue}
								onChange={(e) => setPromptValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && isPromptValueValid)
										close(promptValue.trim());
								}}
							/>
							<div className={styles["modal-actions"]}>
								<button
									className={`${styles["modal-button"]} ${styles["modal-button--cancel"]}`}
									onClick={() => close(null)}
								>
									{t("modal.cancel")}
								</button>
								<button
									className={`${styles["modal-button"]} ${styles["modal-button--confirm"]}`}
									disabled={!isPromptValueValid}
									onClick={() => close(promptValue.trim())}
								>
									{t("modal.confirm")}
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</ModalContext.Provider>
	);
}

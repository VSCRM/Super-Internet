import {createContext, useContext, useState} from "react";
import type {ReactNode} from "react";
import {AlertModal} from "./AlertModal";
import {ConfirmModal} from "./ConfirmModal";
import {PromptModal} from "./PromptModal";

export type ModalType = "info" | "success" | "error" | "warning";

interface AlertRequest {
	kind: "alert";
	title: string;
	message: string;
	type: ModalType;
	resolve: () => void;
}

interface ConfirmRequest {
	kind: "confirm";
	title: string;
	message: string;
	resolve: (value: boolean) => void;
}

interface PromptRequest {
	kind: "prompt";
	title: string;
	message: string;
	placeholder: string;
	resolve: (value: string | null) => void;
}

type ModalRequest = AlertRequest | ConfirmRequest | PromptRequest;

interface ModalContextValue {
	alert: (title: string, message: string, type?: ModalType) => Promise<void>;
	confirm: (title: string, message: string) => Promise<boolean>;
	prompt: (
		title: string,
		message: string,
		placeholder?: string,
	) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({children}: {children: ReactNode}) {
	const [request, setRequest] = useState<ModalRequest | null>(null);

	const alert = (title: string, message: string, type: ModalType = "info") =>
		new Promise<void>((resolve) => {
			setRequest({kind: "alert", title, message, type, resolve});
		});

	const confirm = (title: string, message: string) =>
		new Promise<boolean>((resolve) => {
			setRequest({kind: "confirm", title, message, resolve});
		});

	const prompt = (title: string, message: string, placeholder = "") =>
		new Promise<string | null>((resolve) => {
			setRequest({kind: "prompt", title, message, placeholder, resolve});
		});

	const close = () => setRequest(null);

	return (
		<ModalContext.Provider value={{alert, confirm, prompt}}>
			{children}
			{request?.kind === "alert" && (
				<AlertModal
					title={request.title}
					message={request.message}
					type={request.type}
					onClose={() => {
						request.resolve();
						close();
					}}
				/>
			)}
			{request?.kind === "confirm" && (
				<ConfirmModal
					title={request.title}
					message={request.message}
					onResult={(value) => {
						request.resolve(value);
						close();
					}}
				/>
			)}
			{request?.kind === "prompt" && (
				<PromptModal
					title={request.title}
					message={request.message}
					placeholder={request.placeholder}
					onResult={(value) => {
						request.resolve(value);
						close();
					}}
				/>
			)}
		</ModalContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModal(): ModalContextValue {
	const ctx = useContext(ModalContext);
	if (!ctx) throw new Error("useModal must be used within ModalProvider");
	return ctx;
}

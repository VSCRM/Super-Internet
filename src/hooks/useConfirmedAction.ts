import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../context/ModalContext";
import type { AppError, Result } from "../shared/lib/result";
import { isFailure } from "../shared/lib/result";

interface ConfirmedVoidActionParams {
	readonly confirmTitle: string;
	readonly confirmMessage: string;
	readonly successMessage: string;
	readonly action: () => Promise<void>;
}

interface ConfirmedResultActionParams<TValue> {
	readonly confirmTitle: string;
	readonly confirmMessage: string;
	readonly successMessage: string | ((value: TValue) => string);
	readonly action: () => Promise<Result<TValue, AppError>>;
}

export interface UseConfirmedAction {
	/** For actions that cannot fail once confirmed (e.g. local repository writes). */
	readonly runVoid: (params: ConfirmedVoidActionParams) => Promise<boolean>;
	/** For actions that return a `Result` and may fail with a user-facing message. */
	readonly runResult: <TValue>(
		params: ConfirmedResultActionParams<TValue>
	) => Promise<boolean>;
}

/**
 * Single responsibility: the "confirm → perform → notify" flow every
 * destructive or state-changing admin/support action follows. Extracted
 * because five separate handlers (delete client, delete staff, delete
 * contract, approve connection, close ticket, ...) each hand-rolled this
 * exact three-step sequence. Returns whether the action actually ran, so
 * callers can chain a follow-up (e.g. closing a modal) only on success.
 */
export function useConfirmedAction(): UseConfirmedAction {
	const modal = useModal();
	const { t } = useTranslation();

	const runVoid = useCallback(
		async ({
			confirmTitle,
			confirmMessage,
			successMessage,
			action,
		}: ConfirmedVoidActionParams): Promise<boolean> => {
			const confirmed = await modal.confirm(confirmTitle, confirmMessage);
			if (!confirmed) return false;

			await action();
			await modal.show(t("modal.success"), successMessage, "success");
			return true;
		},
		[modal, t]
	);

	const runResult = useCallback(
		async <TValue>({
			confirmTitle,
			confirmMessage,
			successMessage,
			action,
		}: ConfirmedResultActionParams<TValue>): Promise<boolean> => {
			const confirmed = await modal.confirm(confirmTitle, confirmMessage);
			if (!confirmed) return false;

			const result = await action();
			if (isFailure(result)) {
				await modal.show(t("modal.error"), result.error.message, "error");
				return false;
			}

			const message =
				typeof successMessage === "function"
					? successMessage(result.value)
					: successMessage;
			await modal.show(t("modal.success"), message, "success");
			return true;
		},
		[modal, t]
	);

	return { runVoid, runResult };
}

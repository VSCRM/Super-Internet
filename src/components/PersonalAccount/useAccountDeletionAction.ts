import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import type { ClientUser } from "../../types/models";

/** Single responsibility: the client's own "delete my account" action. */
export function useAccountDeletionAction(
	client: ClientUser
): () => Promise<boolean> {
	const { deleteUser } = useApp();
	const { runVoid } = useConfirmedAction();
	const { t } = useTranslation();

	return () =>
		runVoid({
			confirmTitle: t("account.deleteConfirmTitle"),
			confirmMessage: t("account.deleteConfirmMessage"),
			successMessage: t("account.deletedMessage"),
			action: () => deleteUser(client.id),
		});
}

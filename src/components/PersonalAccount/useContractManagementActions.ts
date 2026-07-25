import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import type { ClientUser } from "../../types/models";

export interface ContractManagementActions {
	readonly editAddress: () => Promise<void>;
	readonly deleteContract: () => Promise<boolean>;
}

/** Single responsibility: edit a contract's address, or delete the contract entirely. */
export function useContractManagementActions(
	client: ClientUser
): ContractManagementActions {
	const app = useApp();
	const modal = useModal();
	const { runVoid } = useConfirmedAction();
	const { t } = useTranslation();

	const editAddress = async (): Promise<void> => {
		if (!client.contract) return;
		const address = await modal.promptAddress(
			t("address.editTitle"),
			t("address.editMessage"),
			client.contract.address
		);
		if (!address) return;

		await app.updateContractAddress(client.id, address);
		await modal.show(
			t("modal.success"),
			t("address.updatedMessage"),
			"success"
		);
	};

	const deleteContract = (): Promise<boolean> =>
		runVoid({
			confirmTitle: t("address.deleteConfirmTitle"),
			confirmMessage: t("address.deleteConfirmMessage"),
			successMessage: t("address.deletedMessage"),
			action: () => app.deleteContract(client.id),
		});

	return { editAddress, deleteContract };
}

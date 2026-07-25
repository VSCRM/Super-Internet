import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import type { ClientUser, ServiceType } from "../../types/models";

export type SelectServiceAction = (serviceType: ServiceType) => Promise<void>;

/** Single responsibility: prompt for an address and create a contract for the chosen service. */
export function useServiceSelectionAction(
	client: ClientUser
): SelectServiceAction {
	const app = useApp();
	const modal = useModal();
	const { t } = useTranslation();

	return async (serviceType: ServiceType): Promise<void> => {
		const address = await modal.promptAddress(
			t("address.promptTitle"),
			t("address.promptMessage")
		);
		if (!address) return;

		await app.selectService(client.id, serviceType, address);
		await modal.show(
			t("address.acceptedTitle"),
			t("address.acceptedMessage", { address }),
			"success"
		);
	};
}

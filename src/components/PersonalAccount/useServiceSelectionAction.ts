import type { ZodType } from "zod";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import type { ContractContactDetails } from "../../context/appContextCore";
import { useModal } from "../../context/ModalContext";
import type { ClientUser, ServiceType } from "../../types/models";
import { isFailure } from "../../shared/lib/result";
import { fioSchema, phoneSchema } from "../../shared/schemas/auth.schema";

export type SelectServiceAction = (serviceType: ServiceType) => Promise<void>;

/** Single responsibility: prompt for an address and create a contract for the chosen service. */
export function useServiceSelectionAction(
	client: ClientUser
): SelectServiceAction {
	const app = useApp();
	const modal = useModal();
	const { t } = useTranslation();

	/** Re-asks until the answer passes `schema`; `null` means the person cancelled. */
	const askUntilValid = async (
		title: string,
		message: string,
		placeholder: string,
		schema: ZodType<string>
	): Promise<string | null> => {
		let shownMessage = message;
		for (;;) {
			const answer = await modal.prompt(title, shownMessage, placeholder);
			if (answer === null) return null;

			const parsed = schema.safeParse(answer);
			if (parsed.success) return parsed.data;

			const issue = parsed.error.issues[0]?.message;
			shownMessage = issue ? `${message}\n${t(issue)}` : message;
		}
	};

	/**
	 * The backend validates the contract's own fio/phone strictly. An account
	 * created through Google has neither, so ask for whatever is missing or invalid.
	 */
	const collectContactDetails =
		async (): Promise<ContractContactDetails | null> => {
			let fio = client.fio;
			if (!fioSchema.safeParse(fio).success) {
				const answer = await askUntilValid(
					t("contract.fioPromptTitle"),
					t("contract.fioPromptMessage"),
					t("contract.fioPlaceholder"),
					fioSchema
				);
				if (answer === null) return null;
				fio = answer;
			}

			let phone = client.phone;
			if (!phoneSchema.safeParse(phone).success) {
				const answer = await askUntilValid(
					t("contract.phonePromptTitle"),
					t("contract.phonePromptMessage"),
					"+380XXXXXXXXX",
					phoneSchema
				);
				if (answer === null) return null;
				phone = answer;
			}

			return { fio, phone };
		};

	return async (serviceType: ServiceType): Promise<void> => {
		const address = await modal.promptAddress(
			t("address.promptTitle"),
			t("address.promptMessage")
		);
		if (!address) return;

		let details: ContractContactDetails | undefined;
		if (app.capabilities.isBackend) {
			const collected = await collectContactDetails();
			if (!collected) return;
			details = collected;
		}

		const result = await app.selectService(
			client.id,
			serviceType,
			address,
			details
		);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		await modal.show(
			t("address.acceptedTitle"),
			t("address.acceptedMessage", { address }),
			"success"
		);
	};
}

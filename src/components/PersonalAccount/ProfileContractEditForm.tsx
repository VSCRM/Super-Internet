import { useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import type { ClientUser } from "../../types/models";
import { useZodForm } from "../../hooks/useZodForm";
import { supportContractEditSchema } from "../../shared/schemas/profile.schema";
import { isFailure } from "../../shared/lib/result";
import { Button } from "../atoms/Button/Button";
import { FormField } from "../molecules/FormField/FormField";
import { EmailField } from "../molecules/EmailField/EmailField";
import { AddressField } from "../molecules/AddressField/AddressField";
import shared from "./dashboardShared.module.scss";
import styles from "./ClientProfileModal.module.scss";

export interface ProfileContractEditFormProps {
	readonly client: ClientUser;
	readonly onSaved: () => void;
}

/** Single responsibility: support-agent editable contract fields (equipment id stays read-only, by design). */
export function ProfileContractEditForm({
	client,
	onSaved,
}: ProfileContractEditFormProps): ReactElement {
	const app = useApp();
	const modal = useModal();
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// equipmentId intentionally excluded - it is a read-only hardware identifier
	const form = useZodForm(supportContractEditSchema, {
		fio: client.contract?.fio ?? "",
		phone: client.contract?.phone ?? "",
		email: client.contract?.email ?? "",
		address: client.contract?.address ?? "",
	});

	if (!client.contract) {
		return <p style={{ textAlign: "center" }}>{t("contract.notIssued")}</p>;
	}

	const handleSave = async (): Promise<void> => {
		const data = form.validate();
		if (!data) return;

		setIsSubmitting(true);
		const result = await app.updateContractFields(client.id, data);
		setIsSubmitting(false);

		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		await modal.show(
			t("modal.success"),
			t("profile.contractUpdatedMessage"),
			"success"
		);
		onSaved();
	};

	return (
		<div className={styles["contract-form"]}>
			<h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
				{t("contract.title", { id: client.contract.id })}
			</h2>

			<FormField
				id="contractFio"
				label={t("auth.fields.fio")}
				type="text"
				value={form.values.fio}
				errorMessage={form.errors.fio}
				touched={form.touched.fio}
				onChange={(e) => form.setValue("fio", e.target.value)}
				onBlur={() => form.touchField("fio")}
			/>
			<FormField
				id="contractPhone"
				label={t("auth.fields.phone")}
				type="tel"
				value={form.values.phone}
				errorMessage={form.errors.phone}
				touched={form.touched.phone}
				onChange={(e) => form.setValue("phone", e.target.value)}
				onBlur={() => form.touchField("phone")}
			/>
			<EmailField
				id="contractEmail"
				label={t("auth.fields.email")}
				value={form.values.email}
				errorMessage={form.errors.email}
				touched={form.touched.email}
				onChange={(e) => form.setValue("email", e.target.value)}
				onBlur={() => form.touchField("email")}
			/>
			<AddressField
				id="contractAddress"
				label={t("address.label")}
				value={form.values.address}
				onChange={(e) => form.setValue("address", e.target.value)}
			/>

			{/* Equipment ID is display-only - never editable from support UI */}
			<div
				className={shared["contract-field"]}
				style={{ marginBottom: "1.5rem" }}
			>
				<span>{t("contract.equipmentIdImmutable")}</span>
				<strong>{client.contract.equipmentId}</strong>
			</div>

			<Button
				className={styles["save-button"]}
				isLoading={isSubmitting}
				onClick={() => void handleSave()}
			>
				{t("profile.save")}
			</Button>
		</div>
	);
}

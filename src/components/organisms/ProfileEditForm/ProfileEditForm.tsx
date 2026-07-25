import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useModal } from "../../../context/ModalContext";
import type { ClientUser } from "../../../types/models";
import { useZodForm } from "../../../hooks/useZodForm";
import { editableProfileSchema } from "../../../shared/schemas/profile.schema";
import { isFailure } from "../../../shared/lib/result";
import { Button } from "../../atoms/Button/Button";
import { FormField } from "../../molecules/FormField/FormField";

interface ProfileEditFormProps {
	readonly client: ClientUser;
}

/**
 * Contract number and equipment identifier are rendered as read-only text,
 * never as form inputs - they are immutable business identifiers owned by
 * back-office processes, not user-editable profile data (see
 * `EditableProfileInput` / `AppContext.updateProfile`).
 */
export function ProfileEditForm({
	client,
}: ProfileEditFormProps): ReactElement {
	const { updateProfile } = useApp();
	const modal = useModal();
	const { t } = useTranslation();

	const form = useZodForm(editableProfileSchema, {
		fio: client.fio,
		phone: client.phone,
	});

	const handleSubmit = async () => {
		const data = form.validate();
		if (!data) return;

		const result = await updateProfile(client.id, data);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		await modal.show(
			t("modal.success"),
			t("profile.updatedMessage"),
			"success"
		);
	};

	return (
		<div className="service-card">
			<h3>{t("profile.myProfile")}</h3>

			<FormField
				id="profileFio"
				label={t("auth.fields.fio")}
				type="text"
				value={form.values.fio}
				errorMessage={form.errors.fio}
				touched={form.touched.fio}
				onChange={(e) => form.setValue("fio", e.target.value)}
				onBlur={() => form.touchField("fio")}
			/>
			<FormField
				id="profilePhone"
				label={t("auth.fields.phone")}
				type="tel"
				value={form.values.phone}
				errorMessage={form.errors.phone}
				touched={form.touched.phone}
				onChange={(e) => form.setValue("phone", e.target.value)}
				onBlur={() => form.touchField("phone")}
			/>

			<div className="contract-field">
				<span>{t("contract.contractNumberImmutable")}</span>
				<span>{client.contract?.id ?? "—"}</span>
			</div>
			<div className="contract-field">
				<span>{t("contract.equipmentIdImmutable")}</span>
				<span>{client.contract?.equipmentId ?? "—"}</span>
			</div>

			<Button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
				{t("profile.save")}
			</Button>
		</div>
	);
}

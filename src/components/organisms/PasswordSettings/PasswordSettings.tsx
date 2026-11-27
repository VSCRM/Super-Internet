import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useModal } from "../../../context/ModalContext";
import type { ClientUser } from "../../../types/models";
import { useZodForm } from "../../../hooks/useZodForm";
import {
	changePasswordSchema,
	createPasswordSchema,
} from "../../../shared/schemas/auth.schema";
import { isFailure } from "../../../shared/lib/result";
import { Button } from "../../atoms/Button/Button";
import { FormField } from "../../molecules/FormField/FormField";
import { PasswordField } from "../../molecules/PasswordField/PasswordField";

interface PasswordSettingsProps {
	readonly client: ClientUser;
}

/**
 * Backend mode only (the Mock layer has no such endpoint). Shows "create a
 * password" for an account without one (Google sign-up) and "change password"
 * - which also asks for the current password - for an account that has one.
 */
export function PasswordSettings({
	client,
}: PasswordSettingsProps): ReactElement | null {
	const { capabilities } = useApp();
	if (!capabilities.isBackend || client.hasPassword === undefined) return null;
	return client.hasPassword ? <ChangePasswordForm /> : <CreatePasswordForm />;
}

function CreatePasswordForm(): ReactElement {
	const { setPassword } = useApp();
	const modal = useModal();
	const { t } = useTranslation();
	const empty = { newPassword: "", confirmPassword: "" };
	const form = useZodForm(createPasswordSchema, empty);

	const handleSubmit = async () => {
		const data = form.validate();
		if (!data) return;

		const result = await setPassword(data.newPassword);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}
		form.reset(empty);
		await modal.show(
			t("modal.success"),
			t("password.createdMessage"),
			"success"
		);
	};

	return (
		<div className="service-card" style={{ marginTop: "2rem" }}>
			<h3>{t("password.createTitle")}</h3>
			<p style={{ color: "var(--gray-color)" }}>{t("password.createHint")}</p>

			<PasswordField
				id="createPasswordNew"
				label={t("password.newLabel")}
				value={form.values.newPassword}
				autoComplete="new-password"
				onChange={(e) => form.setValue("newPassword", e.target.value)}
			/>
			<FormField
				id="createPasswordConfirm"
				label={t("password.confirmLabel")}
				type="password"
				autoComplete="new-password"
				value={form.values.confirmPassword}
				errorMessage={form.errors.confirmPassword}
				touched={form.touched.confirmPassword}
				onChange={(e) => form.setValue("confirmPassword", e.target.value)}
				onBlur={() => form.touchField("confirmPassword")}
			/>

			<Button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
				{t("password.createSubmit")}
			</Button>
		</div>
	);
}

function ChangePasswordForm(): ReactElement {
	const { setPassword } = useApp();
	const modal = useModal();
	const { t } = useTranslation();
	const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
	const form = useZodForm(changePasswordSchema, empty);

	const sameAsCurrent =
		form.values.newPassword !== "" &&
		form.values.newPassword === form.values.currentPassword;

	const handleSubmit = async () => {
		const data = form.validate();
		if (!data) return;

		const result = await setPassword(data.newPassword, data.currentPassword);
		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}
		form.reset(empty);
		await modal.show(
			t("modal.success"),
			t("password.changedMessage"),
			"success"
		);
	};

	return (
		<div className="service-card" style={{ marginTop: "2rem" }}>
			<h3>{t("password.changeTitle")}</h3>

			<FormField
				id="changePasswordCurrent"
				label={t("password.currentLabel")}
				type="password"
				autoComplete="current-password"
				value={form.values.currentPassword}
				errorMessage={form.errors.currentPassword}
				touched={form.touched.currentPassword}
				onChange={(e) => form.setValue("currentPassword", e.target.value)}
				onBlur={() => form.touchField("currentPassword")}
			/>
			<PasswordField
				id="changePasswordNew"
				label={t("password.newLabel")}
				value={form.values.newPassword}
				errorMessage={
					sameAsCurrent ? t("validation.password.sameAsCurrent") : undefined
				}
				autoComplete="new-password"
				onChange={(e) => form.setValue("newPassword", e.target.value)}
			/>
			<FormField
				id="changePasswordConfirm"
				label={t("password.confirmLabel")}
				type="password"
				autoComplete="new-password"
				value={form.values.confirmPassword}
				errorMessage={form.errors.confirmPassword}
				touched={form.touched.confirmPassword}
				onChange={(e) => form.setValue("confirmPassword", e.target.value)}
				onBlur={() => form.touchField("confirmPassword")}
			/>

			<Button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
				{t("password.changeSubmit")}
			</Button>
		</div>
	);
}

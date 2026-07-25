import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useModal } from "../../context/ModalContext";
import { addStaffSchema } from "../../shared/schemas/auth.schema";
import { useZodForm } from "../../hooks/useZodForm";
import { isFailure } from "../../shared/lib/result";
import { Button } from "../atoms/Button/Button";
import { FormField } from "../molecules/FormField/FormField";
import { EmailField } from "../molecules/EmailField/EmailField";
import { PasswordField } from "../molecules/PasswordField/PasswordField";
import styles from "./AdminDashboard.module.scss";

export interface AddStaffFormProps {
	readonly onDone: () => void;
}

/** Single responsibility: validated form for creating a new support-staff account. */
export function AddStaffForm({ onDone }: AddStaffFormProps): ReactElement {
	const { addStaff } = useApp();
	const modal = useModal();
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const form = useZodForm(addStaffSchema, {
		name: "",
		email: "",
		password: "",
	});

	const handleSubmit = async (event: FormEvent): Promise<void> => {
		event.preventDefault();
		const data = form.validate();
		if (!data) return;

		setIsSubmitting(true);
		const result = await addStaff(data.email, data.password, data.name);
		setIsSubmitting(false);

		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		await modal.show(t("modal.success"), t("staff.addedMessage"), "success");
		onDone();
	};

	return (
		<form
			className={styles["add-staff-form"]}
			onSubmit={(e) => void handleSubmit(e)}
		>
			<FormField
				id="staffName"
				label={t("staff.fioLabel")}
				type="text"
				value={form.values.name}
				errorMessage={form.errors.name}
				touched={form.touched.name}
				onChange={(e) => form.setValue("name", e.target.value)}
				onBlur={() => form.touchField("name")}
			/>
			<EmailField
				id="staffEmail"
				label={t("auth.fields.email")}
				value={form.values.email}
				errorMessage={form.errors.email}
				touched={form.touched.email}
				onChange={(e) => form.setValue("email", e.target.value)}
				onBlur={() => form.touchField("email")}
			/>
			<PasswordField
				id="staffPassword"
				label={t("staff.passwordLabel")}
				value={form.values.password}
				onChange={(e) => form.setValue("password", e.target.value)}
			/>
			<div className={styles["add-staff-form__actions"]}>
				<Button type="submit" isLoading={isSubmitting}>
					{t("staff.save")}
				</Button>
				<Button type="button" variant="ghost" onClick={onDone}>
					{t("staff.cancel")}
				</Button>
			</div>
		</form>
	);
}

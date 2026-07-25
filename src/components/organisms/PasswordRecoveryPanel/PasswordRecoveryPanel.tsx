import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { Button } from "../../atoms/Button/Button";
import { FormField } from "../../molecules/FormField/FormField";
import { EmailField } from "../../molecules/EmailField/EmailField";
import { PasswordField } from "../../molecules/PasswordField/PasswordField";
import { isFailure } from "../../../shared/lib/result";
import {
	loginEmailSchema,
	isPasswordValid,
	verifyRecoveryCodeSchema,
} from "../../../shared/schemas/auth.schema";
import { getPasswordRecoveryService } from "../../../services/auth/passwordRecoveryServiceFactory";
import styles from "./PasswordRecoveryPanel.module.scss";

type RecoveryStep = "email" | "code" | "newPassword" | "success";

const passwordRecoveryService = getPasswordRecoveryService();

interface PasswordRecoveryPanelProps {
	readonly onCancel: () => void;
}

/**
 * Multi-step password recovery flow rendered as real React form state
 * instead of a chain of `window.prompt`-style modal dialogs.
 *
 * Key behavioral fix: an invalid code or an unmet password requirement
 * shows an inline error on the *same* step and lets the user correct it in
 * place - it never throws the user back to "request a new code" just
 * because a requirement was not yet satisfied.
 */
export function PasswordRecoveryPanel({
	onCancel,
}: PasswordRecoveryPanelProps): ReactElement {
	const { adoptSession } = useApp();
	const { t } = useTranslation();

	const [step, setStep] = useState<RecoveryStep>("email");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const emailValidation = loginEmailSchema.safeParse(email);
	const emailErrorKey =
		email.length > 0 && !emailValidation.success
			? emailValidation.error.issues[0]?.message
			: undefined;
	const emailError = emailErrorKey ? t(emailErrorKey) : undefined;

	const codeSchema = verifyRecoveryCodeSchema.shape.code;
	const codeValidation = codeSchema.safeParse(code);
	const codeErrorKey =
		code.length > 0 && !codeValidation.success
			? codeValidation.error.issues[0]?.message
			: undefined;
	const codeError = codeErrorKey ? t(codeErrorKey) : undefined;

	const passwordsMatch =
		confirmPassword.length === 0 || confirmPassword === newPassword;
	const confirmError = !passwordsMatch
		? t("recovery.passwordsMismatch")
		: undefined;

	const canSubmitEmail = emailValidation.success;
	const canSubmitCode = codeValidation.success;
	const canSubmitNewPassword =
		isPasswordValid(newPassword) &&
		passwordsMatch &&
		confirmPassword.length > 0;

	const handleRequestCode = async (event: FormEvent) => {
		event.preventDefault();
		if (!canSubmitEmail) return;

		setIsSubmitting(true);
		setFormError(null);
		const result = await passwordRecoveryService.requestCode(email);
		setIsSubmitting(false);

		if (isFailure(result)) {
			setFormError(result.error.message);
			return;
		}

		setStep("code");
	};

	const handleVerifyCode = async (event: FormEvent) => {
		event.preventDefault();
		if (!canSubmitCode) return;

		setIsSubmitting(true);
		setFormError(null);
		const result = await passwordRecoveryService.verifyCode(email, code);
		setIsSubmitting(false);

		if (isFailure(result)) {
			// Stays on the same step - the user corrects the code without
			// being forced to request a brand new one.
			setFormError(result.error.message);
			return;
		}

		setStep("newPassword");
	};

	const handleResendCode = async () => {
		setIsSubmitting(true);
		setFormError(null);
		const result = await passwordRecoveryService.requestCode(email);
		setIsSubmitting(false);

		if (isFailure(result)) {
			setFormError(result.error.message);
			return;
		}

		setFormError(null);
	};

	const handleResetPassword = async (event: FormEvent) => {
		event.preventDefault();
		if (!canSubmitNewPassword) return;

		setIsSubmitting(true);
		setFormError(null);
		const result = await passwordRecoveryService.resetPasswordAndLogin(
			email,
			code,
			newPassword
		);
		setIsSubmitting(false);

		if (isFailure(result)) {
			setFormError(result.error.message);
			return;
		}

		adoptSession(result.value);
		setStep("success");
	};

	return (
		<div className={styles["recovery-panel"]}>
			<h3 className={styles["recovery-panel__title"]}>{t("recovery.title")}</h3>

			{step === "email" && (
				<form onSubmit={handleRequestCode}>
					<p className={styles["recovery-panel__hint"]}>
						{t("recovery.emailHint")}
					</p>
					<EmailField
						id="recoveryEmail"
						label={t("auth.fields.email")}
						value={email}
						errorMessage={emailError}
						onChange={(e) => setEmail(e.target.value)}
					/>
					{formError && (
						<p className={styles["recovery-panel__error"]}>{formError}</p>
					)}
					<Button
						type="submit"
						fullWidth
						isLoading={isSubmitting}
						disabled={!canSubmitEmail}
					>
						{t("recovery.sendCode")}
					</Button>
					<Button type="button" variant="ghost" fullWidth onClick={onCancel}>
						{t("recovery.cancel")}
					</Button>
				</form>
			)}

			{step === "code" && (
				<form onSubmit={handleVerifyCode}>
					<p className={styles["recovery-panel__hint"]}>
						{t("recovery.codeHint", { email })}
					</p>
					<FormField
						id="recoveryCode"
						label={t("recovery.codeLabel")}
						type="text"
						inputMode="numeric"
						maxLength={6}
						value={code}
						errorMessage={codeError ?? formError ?? undefined}
						onChange={(e) => {
							setCode(e.target.value.replace(/\D/g, ""));
							setFormError(null);
						}}
					/>
					<Button
						type="submit"
						fullWidth
						isLoading={isSubmitting}
						disabled={!canSubmitCode}
					>
						{t("recovery.verifyCode")}
					</Button>
					<Button
						type="button"
						variant="ghost"
						fullWidth
						onClick={() => void handleResendCode()}
						disabled={isSubmitting}
					>
						{t("recovery.resendCode")}
					</Button>
					<Button type="button" variant="ghost" fullWidth onClick={onCancel}>
						{t("recovery.cancel")}
					</Button>
				</form>
			)}

			{step === "newPassword" && (
				<form onSubmit={handleResetPassword}>
					<p className={styles["recovery-panel__hint"]}>
						{t("recovery.codeVerifiedHint")}
					</p>
					<PasswordField
						id="recoveryNewPassword"
						label={t("recovery.newPasswordLabel")}
						autoComplete="new-password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
					<FormField
						id="recoveryConfirmPassword"
						label={t("recovery.passwordConfirmLabel")}
						type="password"
						autoComplete="new-password"
						value={confirmPassword}
						errorMessage={confirmError}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
					{formError && (
						<p className={styles["recovery-panel__error"]}>{formError}</p>
					)}
					<Button
						type="submit"
						fullWidth
						isLoading={isSubmitting}
						disabled={!canSubmitNewPassword}
					>
						{t("recovery.resetAndLogin")}
					</Button>
				</form>
			)}

			{step === "success" && (
				<p className={styles["recovery-panel__hint"]}>
					{t("recovery.successHint")}
				</p>
			)}
		</div>
	);
}

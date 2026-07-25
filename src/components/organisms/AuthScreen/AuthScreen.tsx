import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/AppContext";
import { useModal } from "../../../context/ModalContext";
import { Button } from "../../atoms/Button/Button";
import { FormField } from "../../molecules/FormField/FormField";
import { EmailField } from "../../molecules/EmailField/EmailField";
import { PasswordField } from "../../molecules/PasswordField/PasswordField";
import { PasswordRecoveryPanel } from "../PasswordRecoveryPanel/PasswordRecoveryPanel";
import { LanguageSwitcher } from "../../molecules/LanguageSwitcher/LanguageSwitcher";
import { useZodForm } from "../../../hooks/useZodForm";
import { isFailure } from "../../../shared/lib/result";
import {
	loginSchema,
	registerSchema,
} from "../../../shared/schemas/auth.schema";
import styles from "./AuthScreen.module.scss";

type AuthMode = "login" | "register" | "recovery";

export function AuthScreen(): ReactElement {
	const { login, register } = useApp();
	const modal = useModal();
	const { t } = useTranslation();

	const [mode, setMode] = useState<AuthMode>("login");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const loginForm = useZodForm(loginSchema, { email: "", password: "" });
	const registerForm = useZodForm(registerSchema, {
		email: "",
		phone: "",
		fio: "",
		password: "",
		passwordConfirm: "",
	});

	const handleLogin = async (event: FormEvent) => {
		event.preventDefault();
		const data = loginForm.validate();
		if (!data) return;

		setIsSubmitting(true);
		const result = await login(data.email, data.password);
		setIsSubmitting(false);

		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
		}
	};

	const handleRegister = async (event: FormEvent) => {
		event.preventDefault();
		const data = registerForm.validate();
		if (!data) return;

		setIsSubmitting(true);
		const result = await register(
			data.email,
			data.password,
			data.phone,
			data.fio
		);
		setIsSubmitting(false);

		if (isFailure(result)) {
			await modal.show(t("modal.error"), result.error.message, "error");
			return;
		}

		await modal.show(
			t("auth.registrationSuccessTitle"),
			t("auth.registrationSuccessMessage"),
			"success"
		);
		registerForm.reset();
	};

	if (mode === "recovery") {
		return (
			<div className={styles["auth-screen"]}>
				<div className={styles["auth-screen__top"]}>
					<div className={styles["auth-screen__logo"]}>
						<img
							src={`${import.meta.env.BASE_URL}Logo.png`}
							alt="Super Internet"
						/>
					</div>
					<div className={styles["auth-screen__lang"]}>
						<LanguageSwitcher />
					</div>
				</div>
				<PasswordRecoveryPanel onCancel={() => setMode("login")} />
			</div>
		);
	}

	return (
		<div className={styles["auth-screen"]}>
			<div className={styles["auth-screen__top"]}>
				<div className={styles["auth-screen__logo"]}>
					<img
						src={`${import.meta.env.BASE_URL}Logo.png`}
						alt="Super Internet"
					/>
				</div>
				<div className={styles["auth-screen__lang"]}>
					<LanguageSwitcher />
				</div>
			</div>

			<div className={styles["auth-screen__tabs"]}>
				<button
					className={`${styles["auth-screen__tab"]} ${mode === "login" ? styles["auth-screen__tab--active"] : ""}`}
					onClick={() => setMode("login")}
				>
					{t("auth.tabs.login")}
				</button>
				<button
					className={`${styles["auth-screen__tab"]} ${mode === "register" ? styles["auth-screen__tab--active"] : ""}`}
					onClick={() => setMode("register")}
				>
					{t("auth.tabs.register")}
				</button>
			</div>

			{mode === "login" && (
				<form className={styles["auth-screen__form"]} onSubmit={handleLogin}>
					<EmailField
						id="loginEmail"
						label={t("auth.fields.email")}
						autoComplete="email"
						required
						value={loginForm.values.email}
						errorMessage={loginForm.errors.email}
						touched={loginForm.touched.email}
						onChange={(e) => loginForm.setValue("email", e.target.value)}
						onBlur={() => loginForm.touchField("email")}
					/>
					<FormField
						id="loginPassword"
						label={t("auth.fields.password")}
						type="password"
						autoComplete="current-password"
						required
						value={loginForm.values.password}
						errorMessage={loginForm.errors.password}
						touched={loginForm.touched.password}
						onChange={(e) => loginForm.setValue("password", e.target.value)}
						onBlur={() => loginForm.touchField("password")}
					/>

					<Button
						type="button"
						variant="ghost"
						onClick={() => setMode("recovery")}
					>
						{t("auth.forgotPassword")}
					</Button>

					<Button
						type="submit"
						fullWidth
						isLoading={isSubmitting}
						style={{ marginTop: "1rem" }}
					>
						{t("auth.submitLogin")}
					</Button>
				</form>
			)}

			{mode === "register" && (
				<form className={styles["auth-screen__form"]} onSubmit={handleRegister}>
					<EmailField
						id="regEmail"
						label={t("auth.fields.email")}
						autoComplete="email"
						required
						value={registerForm.values.email}
						errorMessage={registerForm.errors.email}
						touched={registerForm.touched.email}
						onChange={(e) => registerForm.setValue("email", e.target.value)}
						onBlur={() => registerForm.touchField("email")}
					/>
					<FormField
						id="regPhone"
						label={t("auth.fields.phone")}
						type="tel"
						autoComplete="tel"
						placeholder="+380XXXXXXXXX"
						required
						value={registerForm.values.phone}
						errorMessage={registerForm.errors.phone}
						touched={registerForm.touched.phone}
						onChange={(e) => registerForm.setValue("phone", e.target.value)}
						onBlur={() => registerForm.touchField("phone")}
					/>
					<FormField
						id="regFIO"
						label={t("auth.fields.fio")}
						type="text"
						autoComplete="name"
						required
						value={registerForm.values.fio}
						errorMessage={registerForm.errors.fio}
						touched={registerForm.touched.fio}
						onChange={(e) => registerForm.setValue("fio", e.target.value)}
						onBlur={() => registerForm.touchField("fio")}
					/>
					<PasswordField
						id="regPassword"
						label={t("auth.fields.password")}
						autoComplete="new-password"
						required
						value={registerForm.values.password}
						onChange={(e) => registerForm.setValue("password", e.target.value)}
					/>
					<FormField
						id="regPasswordConfirm"
						label={t("auth.fields.passwordConfirm")}
						type="password"
						autoComplete="new-password"
						required
						value={registerForm.values.passwordConfirm}
						errorMessage={registerForm.errors.passwordConfirm}
						touched={registerForm.touched.passwordConfirm}
						onChange={(e) =>
							registerForm.setValue("passwordConfirm", e.target.value)
						}
						onBlur={() => registerForm.touchField("passwordConfirm")}
					/>

					<Button type="submit" fullWidth isLoading={isSubmitting}>
						{t("auth.submitRegister")}
					</Button>
				</form>
			)}
		</div>
	);
}

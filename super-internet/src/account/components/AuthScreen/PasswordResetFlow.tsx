import {useState} from "react";
import type {FormEvent} from "react";
import {CheckCircle} from "lucide-react";
import {useAuth} from "../../AuthContext";
import {FieldWithRules} from "../../shared/FieldWithRules";
import {
	emailRules,
	passwordRules,
	confirmPasswordRules,
	validatePassword,
} from "../../validation";

type Step = "email" | "code" | "newPassword" | "done";
interface PasswordResetFlowProps {
	onCancel: () => void;
}

export function PasswordResetFlow({onCancel}: PasswordResetFlowProps) {
	const {requestPasswordReset, verifyResetCode, resetPassword} = useAuth();
	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");
	const [mockCode, setMockCode] = useState("");
	const [code, setCode] = useState("");
	const [codeError, setCodeError] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");

	const emailValid = emailRules.every((r) => r.test(email));
	const codeValid = code.length === 6;
	const passwordValid = validatePassword(newPassword);
	const confirmValid =
		newPassword.length > 0 && confirmPassword === newPassword;

	const handleEmailSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!emailValid) return;
		try {
			const c = requestPasswordReset(email);
			setMockCode(c);
			setStep("code");
			setError("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Помилка");
		}
	};

	const handleCodeSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!codeValid) return;
		try {
			verifyResetCode(email, code);
			setStep("newPassword");
			setCodeError("");
		} catch {
			setCodeError(
				"Невірний або прострочений код. Перевірте і спробуйте ще раз.",
			);
		}
	};

	const handlePasswordSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!passwordValid || !confirmValid) return;
		try {
			resetPassword(email, newPassword);
			setStep("done");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Помилка");
		}
	};

	return (
		<div className="auth-form active" style={{marginTop: "1rem"}}>
			{step === "email" && (
				<form onSubmit={handleEmailSubmit}>
					<p
						style={{
							color: "var(--gray-color)",
							marginBottom: "1.5rem",
							fontSize: "0.9rem",
						}}>
						Введіть email вашого акаунту. Ми надішлемо тимчасовий код.
					</p>
					<FieldWithRules
						id="resetEmail"
						label="Email"
						type="email"
						value={email}
						onChange={setEmail}
						rules={emailRules}
						autoFocus
					/>
					{error && (
						<p style={{color: "var(--error-color)", marginBottom: "1rem"}}>
							{error}
						</p>
					)}
					<div style={{display: "flex", gap: "1rem", marginTop: "1rem"}}>
						<button
							type="submit"
							className="submit-btn"
							style={{flex: 1}}
							disabled={!emailValid}>
							Надіслати код
						</button>
						<button
							type="button"
							className="submit-btn"
							onClick={onCancel}
							style={{
								flex: 1,
								background: "transparent",
								border: "2px solid var(--gray-color)",
							}}>
							Скасувати
						</button>
					</div>
				</form>
			)}

			{step === "code" && (
				<form onSubmit={handleCodeSubmit}>
					<p
						style={{
							color: "var(--gray-color)",
							marginBottom: "0.5rem",
							fontSize: "0.9rem",
						}}>
						Код надіслано на{" "}
						<strong style={{color: "var(--white-color)"}}>{email}</strong>
					</p>
					{mockCode && (
						<p
							style={{
								color: "var(--warning-color)",
								fontSize: "0.85rem",
								marginBottom: "1rem",
							}}>
							[Mock] Ваш код: <strong>{mockCode}</strong>
						</p>
					)}
					<div className="form-group">
						<label htmlFor="resetCode">6-значний код</label>
						<input
							id="resetCode"
							type="text"
							maxLength={6}
							value={code}
							autoFocus
							className={
								code.length > 0 ? (codeValid ? "success" : "error") : ""
							}
							onChange={(e) => {
								setCode(e.target.value.replace(/\D/g, ""));
								setCodeError("");
							}}
							placeholder="000000"
						/>
						{codeError && (
							<p
								style={{
									color: "var(--error-color)",
									fontSize: "0.85rem",
									marginTop: "0.5rem",
								}}>
								{codeError}
							</p>
						)}
					</div>
					<div style={{display: "flex", gap: "1rem", marginTop: "1rem"}}>
						<button
							type="submit"
							className="submit-btn"
							style={{flex: 1}}
							disabled={!codeValid}>
							Підтвердити код
						</button>
						<button
							type="button"
							className="submit-btn"
							onClick={() => {
								setStep("email");
								setCode("");
								setCodeError("");
							}}
							style={{
								flex: 1,
								background: "transparent",
								border: "2px solid var(--gray-color)",
							}}>
							Назад
						</button>
					</div>
				</form>
			)}

			{step === "newPassword" && (
				<form onSubmit={handlePasswordSubmit}>
					<p
						style={{
							color: "var(--gray-color)",
							marginBottom: "1.5rem",
							fontSize: "0.9rem",
						}}>
						Придумайте новий пароль. Усі вимоги мають бути зеленими.
					</p>
					<FieldWithRules
						id="resetNewPwd"
						label="Новий пароль"
						type="password"
						value={newPassword}
						onChange={setNewPassword}
						rules={passwordRules}
						autoFocus
						autoComplete="new-password"
					/>
					<FieldWithRules
						id="resetConfirmPwd"
						label="Підтвердження паролю"
						type="password"
						value={confirmPassword}
						onChange={setConfirmPassword}
						rules={confirmPasswordRules(newPassword)}
						autoComplete="new-password"
					/>
					{error && (
						<p style={{color: "var(--error-color)", marginBottom: "1rem"}}>
							{error}
						</p>
					)}
					<button
						type="submit"
						className="submit-btn"
						style={{marginTop: "1rem"}}
						disabled={!passwordValid || !confirmValid}>
						Змінити пароль
					</button>
				</form>
			)}

			{step === "done" && (
				<div style={{textAlign: "center"}}>
					<CheckCircle
						size={56}
						strokeWidth={1.5}
						style={{color: "var(--success-color)", marginBottom: "1rem"}}
					/>
					<p
						style={{
							color: "var(--success-color)",
							marginBottom: "1.5rem",
							fontWeight: 700,
							fontSize: "1.1rem",
						}}>
						Пароль успішно змінено!
					</p>
					<p
						style={{
							color: "var(--gray-color)",
							marginBottom: "1.5rem",
							fontSize: "0.9rem",
						}}>
						Тепер ви можете увійти з новим паролем.
					</p>
					<button className="submit-btn" onClick={onCancel}>
						Повернутися до входу
					</button>
				</div>
			)}
		</div>
	);
}

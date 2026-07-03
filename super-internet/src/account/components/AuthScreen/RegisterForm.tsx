import {useState} from "react";
import type {FormEvent} from "react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {
	emailRules,
	phoneRules,
	fioRules,
	passwordRules,
	confirmPasswordRules,
	validateEmail,
	validatePhone,
	validateFIO,
	validatePassword,
} from "../../validation";
import {FieldWithRules} from "../../shared/FieldWithRules";

export function RegisterForm() {
	const {register} = useAuth();
	const {alert} = useModal();
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [fio, setFio] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");

	const allValid =
		validateEmail(email) &&
		validatePhone(phone) &&
		validateFIO(fio) &&
		validatePassword(password) &&
		confirm === password &&
		confirm.length > 0;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!allValid) return;
		try {
			register(email, password, phone, fio);
			await alert(
				"Успіх",
				"Реєстрацію завершено! Тепер оберіть послугу.",
				"success",
			);
		} catch (err) {
			alert(
				"Помилка",
				err instanceof Error ? err.message : "Сталася помилка",
				"error",
			);
		}
	};

	return (
		<form className="auth-form" onSubmit={handleSubmit}>
			<FieldWithRules
				id="regEmail"
				label="Email"
				type="email"
				value={email}
				onChange={setEmail}
				rules={emailRules}
				autoComplete="username"
			/>
			<FieldWithRules
				id="regPhone"
				label="Телефон"
				type="tel"
				value={phone}
				onChange={setPhone}
				rules={phoneRules}
				placeholder="+380XXXXXXXXX"
				autoComplete="tel"
			/>
			<FieldWithRules
				id="regFIO"
				label="ПІБ"
				value={fio}
				onChange={setFio}
				rules={fioRules}
				autoComplete="name"
			/>
			<FieldWithRules
				id="regPassword"
				label="Пароль"
				type="password"
				value={password}
				onChange={setPassword}
				rules={passwordRules}
				autoComplete="new-password"
			/>
			<FieldWithRules
				id="regConfirm"
				label="Підтвердження паролю"
				type="password"
				value={confirm}
				onChange={setConfirm}
				rules={confirmPasswordRules(password)}
				autoComplete="new-password"
			/>
			<button type="submit" className="submit-btn" disabled={!allValid}>
				Зареєструватися
			</button>
		</form>
	);
}

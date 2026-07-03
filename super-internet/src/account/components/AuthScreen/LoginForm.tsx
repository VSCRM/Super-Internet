import {useState} from "react";
import type {FormEvent} from "react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {emailRules, passwordRules} from "../../validation";
import {FieldWithRules} from "../../shared/FieldWithRules";
import {PasswordResetFlow} from "./PasswordResetFlow";

export function LoginForm() {
	const {login} = useAuth();
	const {alert} = useModal();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [resetting, setResetting] = useState(false);

	if (resetting) {
		return <PasswordResetFlow onCancel={() => setResetting(false)} />;
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		try {
			login(email, password);
		} catch (err) {
			alert(
				"Помилка",
				err instanceof Error ? err.message : "Сталася помилка",
				"error",
			);
		}
	};

	return (
		<form className="auth-form active" onSubmit={handleSubmit}>
			<FieldWithRules
				id="loginEmail"
				label="Email"
				type="email"
				value={email}
				onChange={setEmail}
				rules={emailRules}
				autoComplete="username"
			/>
			<FieldWithRules
				id="loginPassword"
				label="Пароль"
				type="password"
				value={password}
				onChange={setPassword}
				rules={passwordRules}
				autoComplete="current-password"
			/>
			<button
				type="button"
				className="link-btn"
				style={{marginTop: "0.5rem"}}
				onClick={() => setResetting(true)}>
				Забув пароль
			</button>
			<button type="submit" className="submit-btn">
				Увійти
			</button>
		</form>
	);
}

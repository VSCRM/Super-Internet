import {useState} from "react";
import {LoginForm} from "./LoginForm";
import {RegisterForm} from "./RegisterForm";
import "./AuthScreen.scss";

const logoUrl = `${import.meta.env.BASE_URL}Logo.png`;

type AuthTab = "login" | "register";

export function AuthScreen() {
	const [tab, setTab] = useState<AuthTab>("login");

	return (
		<div className="auth-container">
			<div className="logo">
				<img src={logoUrl} alt="Super Internet" />
			</div>

			<div className="tab-buttons">
				<button
					className={`tab-btn${tab === "login" ? " active" : ""}`}
					onClick={() => setTab("login")}>
					Вхід
				</button>
				<button
					className={`tab-btn${tab === "register" ? " active" : ""}`}
					onClick={() => setTab("register")}>
					Реєстрація
				</button>
			</div>

			{tab === "login" ? <LoginForm /> : <RegisterForm />}
		</div>
	);
}

import {useEffect, useState} from "react";
import type {FormEvent} from "react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {FieldWithRules} from "../../shared/FieldWithRules";
import {
	emailRules,
	passwordRules,
	staffNameRules,
	validateEmail,
	validatePassword,
} from "../../validation";

interface AddStaffModalProps {
	onClose: () => void;
}

export function AddStaffModal({onClose}: AddStaffModalProps) {
	const {addStaff} = useAuth();
	const {alert} = useModal();
	const [visible, setVisible] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");

	useEffect(() => {
		const id = setTimeout(() => setVisible(true), 10);
		return () => clearTimeout(id);
	}, []);

	const nameValid =
		name.trim().length >= 2 && /^[\p{L}\s'-]+$/u.test(name.trim());
	const allValid =
		validateEmail(email) && validatePassword(password) && nameValid;

	const handleClose = () => {
		setVisible(false);
		setTimeout(onClose, 300);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!allValid) return;
		try {
			addStaff(email, password, name.trim());
			await alert("Успіх", `Співробітника ${name.trim()} додано`, "success");
			handleClose();
		} catch (err) {
			await alert(
				"Помилка",
				err instanceof Error ? err.message : "Помилка",
				"error",
			);
		}
	};

	return (
		<div className={`modal-overlay${visible ? " show" : ""}`}>
			<div className="modal-content" style={{maxWidth: 520}}>
				<h3 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
					Новий співробітник
				</h3>
				<form onSubmit={handleSubmit}>
					<FieldWithRules
						id="staffEmail"
						label="Email"
						type="email"
						value={email}
						onChange={setEmail}
						rules={emailRules}
						autoFocus
					/>
					<FieldWithRules
						id="staffPassword"
						label="Пароль"
						type="password"
						value={password}
						onChange={setPassword}
						rules={passwordRules}
						autoComplete="new-password"
					/>
					<FieldWithRules
						id="staffName"
						label="Імʼя (відображається клієнтам)"
						value={name}
						onChange={setName}
						rules={staffNameRules}
						placeholder="Олена Коваль"
					/>
					<p
						style={{
							color: "var(--gray-color)",
							fontSize: "0.82rem",
							marginTop: "0.75rem",
						}}>
						Усі поля мають стати зеленими перед відправкою.
					</p>
					<div style={{display: "flex", gap: "1rem", marginTop: "1.25rem"}}>
						<button
							type="submit"
							className="modal-btn confirm"
							disabled={!allValid}
							style={{
								opacity: allValid ? 1 : 0.45,
								cursor: allValid ? "pointer" : "not-allowed",
							}}>
							Додати
						</button>
						<button
							type="button"
							className="modal-btn cancel"
							onClick={handleClose}>
							Скасувати
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

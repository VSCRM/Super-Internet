import {useState} from "react";
import type {FormEvent} from "react";
import {Globe, Tv} from "lucide-react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {addressRules, validateAddress} from "../../validation";
import {FieldWithRules} from "../../shared/FieldWithRules";

export function ServiceSelector() {
	const {selectService} = useAuth();
	const {confirm, alert} = useModal();
	const [selected, setSelected] = useState<"internet" | "internet_tv" | null>(
		null,
	);
	const [address, setAddress] = useState("");
	const addressValid = validateAddress(address);

	const activeStyle = {
		borderColor: "var(--purple-color)",
		transform: "translateY(-5px)",
		boxShadow: "0 5px 20px rgba(206,147,255,.4)",
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!selected) {
			alert("Помилка", "Оберіть послугу", "error");
			return;
		}
		if (!addressValid) return;
		const ok = await confirm("Підтвердження", "Подати заявку на підключення?");
		if (!ok) return;
		selectService(selected, address);
		await alert(
			"Успіх",
			"Заявку прийнято! Очікуйте підтвердження від адміністратора.",
			"success",
		);
	};

	return (
		<div className="service-card">
			<h2 style={{marginBottom: "1rem", color: "var(--purple-color)"}}>
				Оберіть послугу
			</h2>
			<div className="service-selection">
				<div
					className="service-option"
					style={selected === "internet" ? activeStyle : {}}
					onClick={() => setSelected("internet")}>
					<Globe
						size={32}
						strokeWidth={1.5}
						style={{color: "var(--purple-color)", marginBottom: "0.75rem"}}
					/>
					<h3>Інтернет</h3>
					<p style={{color: "var(--gray-color)", margin: "0.5rem 0 1rem"}}>
						Швидкісне оптоволоконне підключення
					</p>
					<p
						style={{
							fontSize: "1.5rem",
							color: "var(--purple-color)",
							fontWeight: 700,
						}}>
						300 грн/міс
					</p>
				</div>
				<div
					className="service-option"
					style={selected === "internet_tv" ? activeStyle : {}}
					onClick={() => setSelected("internet_tv")}>
					<Tv
						size={32}
						strokeWidth={1.5}
						style={{color: "var(--purple-color)", marginBottom: "0.75rem"}}
					/>
					<h3>Інтернет + ТБ</h3>
					<p style={{color: "var(--gray-color)", margin: "0.5rem 0 1rem"}}>
						Інтернет + 200+ каналів
					</p>
					<p
						style={{
							fontSize: "1.5rem",
							color: "var(--purple-color)",
							fontWeight: 700,
						}}>
						450 грн/міс
					</p>
				</div>
			</div>
			<form onSubmit={handleSubmit}>
				<FieldWithRules
					id="addressInput"
					label="Адреса підключення"
					value={address}
					onChange={setAddress}
					rules={addressRules}
					placeholder="вул. Івана Франка, 25, кв. 10"
				/>
				<button
					type="submit"
					className="submit-btn"
					disabled={!selected || !addressValid}>
					Подати заявку
				</button>
			</form>
		</div>
	);
}

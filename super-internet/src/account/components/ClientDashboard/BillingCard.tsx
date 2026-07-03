import {useState} from "react";
import type {FormEvent} from "react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import type {Client} from "../../types";

interface BillingCardProps {
	client: Client;
}

export function BillingCard({client}: BillingCardProps) {
	const {makePayment, toggleRecurringPayment} = useAuth();
	const {alert} = useModal();
	const [amount, setAmount] = useState("");

	const monthlyFee = client.contract?.serviceType === "internet" ? 300 : 450;
	const balanceColor =
		client.balance < 0
			? "var(--error-color)"
			: client.balance < 100
				? "var(--warning-color)"
				: "var(--success-color)";

	const handlePayment = async (e: FormEvent) => {
		e.preventDefault();
		const num = parseFloat(amount);
		if (!num || num <= 0) {
			alert("Помилка", "Введіть коректну суму", "error");
			return;
		}
		makePayment(num, false);
		await alert("Успіх", `Поповнення на ${num} грн зараховано!`, "success");
		setAmount("");
	};

	const handleToggleRecurring = async () => {
		toggleRecurringPayment();
		if (!client.isRecurring)
			await alert("Автооплата", "Автооплату увімкнено", "success");
		else await alert("Автооплата", "Автооплату вимкнено", "info");
	};

	return (
		<div className="service-card">
			<h2 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
				Баланс та оплата
			</h2>

			<div style={{textAlign: "center", marginBottom: "2rem"}}>
				<p style={{color: "var(--gray-color)", marginBottom: "0.5rem"}}>
					Поточний баланс
				</p>
				<p style={{fontSize: "2.5rem", fontWeight: 900, color: balanceColor}}>
					{client.balance} грн
				</p>
				<p style={{color: "var(--gray-color)", marginTop: "0.5rem"}}>
					Абонплата: {monthlyFee} грн/місяць
				</p>
			</div>

			<form onSubmit={handlePayment}>
				<div className="form-group">
					<label htmlFor="paymentAmount">Сума поповнення (грн)</label>
					<input
						id="paymentAmount"
						type="number"
						min={1}
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="300"
					/>
				</div>
				<button type="submit" className="submit-btn">
					Поповнити рахунок
				</button>
			</form>

			<div
				style={{
					marginTop: "1.5rem",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: "1rem",
				}}>
				<span>Автоматична оплата</span>
				<label className="switch">
					<input
						type="checkbox"
						checked={!!client.isRecurring}
						onChange={handleToggleRecurring}
					/>
					<span className="slider round" />
				</label>
			</div>
		</div>
	);
}

import {useState} from "react";
import type {FormEvent} from "react";
import {Pencil, Trash2, Save, X} from "lucide-react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import type {Client} from "../../types";
import type {ClientProfileData} from "../../AuthContext";
import {FieldWithRules} from "../../shared/FieldWithRules";
import {StatusDot} from "../../shared/StatusDot";
import {
	emailRules,
	phoneRules,
	fioRules,
	addressRules,
	validateEmail,
	validatePhone,
	validateFIO,
	validateAddress,
} from "../../validation";

interface ContractCardProps {
	client: Client;
}

export function ContractCard({client}: ContractCardProps) {
	const {updateClientProfile, deleteContract} = useAuth();
	const {confirm, alert} = useModal();
	const {contract} = client;
	const [editing, setEditing] = useState(false);

	const [form, setForm] = useState<ClientProfileData>({
		fio: client.fio,
		phone: client.phone,
		email: client.email,
		address: contract?.address ?? "",
		serviceType: contract?.serviceType ?? "internet",
	});

	if (!contract) return null;

	const allValid =
		validateFIO(form.fio) &&
		validatePhone(form.phone) &&
		validateEmail(form.email) &&
		validateAddress(form.address);

	const set = (key: keyof ClientProfileData) => (value: string) =>
		setForm((p) => ({...p, [key]: value}));
	const setSelect = (e: React.ChangeEvent<HTMLSelectElement>) =>
		setForm((p) => ({
			...p,
			serviceType: e.target.value as ClientProfileData["serviceType"],
		}));

	const handleSave = async (e: FormEvent) => {
		e.preventDefault();
		if (!allValid) return;
		updateClientProfile(form);
		setEditing(false);
		await alert("Збережено", "Договір успішно оновлено", "success");
	};

	const handleCancel = () => {
		setForm({
			fio: client.fio,
			phone: client.phone,
			email: client.email,
			address: contract.address,
			serviceType: contract.serviceType,
		});
		setEditing(false);
	};

	const handleDelete = async () => {
		const ok = await confirm(
			"Скасувати договір",
			"Договір буде видалено. Продовжити?",
		);
		if (!ok) return;
		deleteContract();
	};

	const eqStatus = client.equipmentStatus ?? "pending";
	const contractStatusLabel = {
		pending: "Очікує підтвердження",
		active: "Активний",
		debt: "Заборгованість",
	}[contract.status];
	const serviceLabel =
		contract.serviceType === "internet" ? "Інтернет" : "Інтернет + ТБ";

	if (editing) {
		return (
			<div className="service-card">
				<h2 style={{color: "var(--purple-color)", marginBottom: "0.5rem"}}>
					Редагувати договір
				</h2>
				<p
					style={{
						color: "var(--gray-color)",
						fontSize: "0.9rem",
						marginBottom: "1.5rem",
					}}>
					Усі вимоги мають стати зеленими перед збереженням.
				</p>
				<form onSubmit={handleSave}>
					<FieldWithRules
						id="editFio"
						label="ПІБ"
						value={form.fio}
						onChange={set("fio")}
						rules={fioRules}
						autoComplete="name"
					/>
					<FieldWithRules
						id="editPhone"
						label="Телефон"
						type="tel"
						value={form.phone}
						onChange={set("phone")}
						rules={phoneRules}
						placeholder="+380XXXXXXXXX"
						autoComplete="tel"
					/>
					<FieldWithRules
						id="editEmail"
						label="Email (використовується для входу)"
						type="email"
						value={form.email}
						onChange={set("email")}
						rules={emailRules}
						autoComplete="username"
					/>
					<FieldWithRules
						id="editAddress"
						label="Адреса підключення"
						value={form.address}
						onChange={set("address")}
						rules={addressRules}
						placeholder="вул. Івана Франка, 25, кв. 10"
						autoComplete="street-address"
					/>
					<div className="form-group">
						<label htmlFor="editService">Послуга</label>
						<select
							id="editService"
							value={form.serviceType}
							onChange={setSelect}
							className="form-select">
							<option value="internet">Інтернет — 300 грн/міс</option>
							<option value="internet_tv">Інтернет + ТБ — 450 грн/міс</option>
						</select>
					</div>
					<div style={{display: "flex", gap: "1rem", marginTop: "1.5rem"}}>
						<button
							type="submit"
							className="submit-btn icon-btn"
							style={{flex: 1}}
							disabled={!allValid}>
							<Save size={16} strokeWidth={1.8} /> Зберегти
						</button>
						<button
							type="button"
							className="submit-btn icon-btn"
							onClick={handleCancel}
							style={{
								flex: 1,
								background: "transparent",
								border: "2px solid var(--gray-color)",
							}}>
							<X size={16} strokeWidth={1.8} /> Скасувати
						</button>
					</div>
				</form>
			</div>
		);
	}

	return (
		<div className="service-card">
			<h2 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
				Мій договір
			</h2>
			<div className="contract-view">
				<div className="contract-field">
					<label>Номер договору:</label>
					<span>{contract.id}</span>
				</div>
				<div className="contract-field">
					<label>ПІБ:</label>
					<span>{contract.fio}</span>
				</div>
				<div className="contract-field">
					<label>Телефон:</label>
					<span>{contract.phone}</span>
				</div>
				<div className="contract-field">
					<label>Email:</label>
					<span>{contract.email}</span>
				</div>
				<div className="contract-field">
					<label>Послуга:</label>
					<span>{serviceLabel}</span>
				</div>
				<div className="contract-field">
					<label>Адреса:</label>
					<span>{contract.address}</span>
				</div>
				<div className="contract-field">
					<label>Обладнання:</label>
					<span>{contract.equipmentId}</span>
				</div>
				{client.connectionApproved && (
					<div className="contract-field">
						<label>Стан обладнання:</label>
						<span className={`status-badge status-${eqStatus}`}>
							<StatusDot status={eqStatus} />
						</span>
					</div>
				)}
				<div className="contract-field">
					<label>Статус:</label>
					<span className={`status-badge status-${contract.status}`}>
						<StatusDot
							status={contract.status as "pending" | "active" | "debt"}
							label={contractStatusLabel}
						/>
					</span>
				</div>
				<div className="contract-field">
					<label>Дата укладення:</label>
					<span>
						{new Date(contract.createdAt).toLocaleDateString("uk-UA")}
					</span>
				</div>
			</div>
			<div
				style={{
					display: "flex",
					gap: "1rem",
					marginTop: "1.5rem",
					flexWrap: "wrap",
				}}>
				<button
					className="submit-btn icon-btn"
					style={{flex: 1}}
					onClick={() => setEditing(true)}>
					<Pencil size={16} strokeWidth={1.8} /> Редагувати договір
				</button>
				<button
					className="submit-btn icon-btn"
					style={{flex: 1, background: "var(--error-color)"}}
					onClick={handleDelete}>
					<Trash2 size={16} strokeWidth={1.8} /> Скасувати договір
				</button>
			</div>
		</div>
	);
}

import {useEffect, useState} from "react";
import type {FormEvent} from "react";
import {X, Pencil} from "lucide-react";
import {useAuth} from "../../AuthContext";
import type {Client} from "../../types";
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
import "./ClientProfileModal.scss";

interface ClientProfileModalProps {
	client: Client;
	onClose: () => void;
}
type ProfileTab = "info" | "contract" | "billing" | "messages";

export function ClientProfileModal({client, onClose}: ClientProfileModalProps) {
	const {editClientInfo} = useAuth();
	const [profileTab, setProfileTab] = useState<ProfileTab>("info");
	const [visible, setVisible] = useState(false);
	const [editingInfo, setEditingInfo] = useState(false);
	const [infoForm, setInfoForm] = useState({
		fio: client.fio,
		phone: client.phone,
		email: client.email,
	});
	const [infoSaved, setInfoSaved] = useState(false);
	const [editingAddress, setEditingAddress] = useState(false);
	const [addressValue, setAddressValue] = useState(
		client.contract?.address ?? "",
	);
	const [addressSaved, setAddressSaved] = useState(false);

	useEffect(() => {
		const id = setTimeout(() => setVisible(true), 10);
		return () => clearTimeout(id);
	}, []);

	const handleClose = () => {
		setVisible(false);
		setTimeout(onClose, 300);
	};

	const infoAllValid =
		validateFIO(infoForm.fio) &&
		validatePhone(infoForm.phone) &&
		validateEmail(infoForm.email);
	const addressAllValid = validateAddress(addressValue);

	const setInfo = (key: keyof typeof infoForm) => (v: string) =>
		setInfoForm((p) => ({...p, [key]: v}));

	const handleSaveInfo = (e: FormEvent) => {
		e.preventDefault();
		if (!infoAllValid) return;
		editClientInfo(client.id, infoForm);
		setEditingInfo(false);
		setInfoSaved(true);
		setTimeout(() => setInfoSaved(false), 2000);
	};

	const handleSaveAddress = () => {
		if (!addressAllValid) return;
		editClientInfo(client.id, {address: addressValue.trim()});
		setEditingAddress(false);
		setAddressSaved(true);
		setTimeout(() => setAddressSaved(false), 2000);
	};

	const tabLabels: Record<ProfileTab, string> = {
		info: "Інфо",
		contract: "Договір",
		billing: "Баланс",
		messages: "Повідомлення",
	};
	const serviceLabel =
		client.contract?.serviceType === "internet" ? "Інтернет" : "Інтернет + ТБ";

	return (
		<div className={`modal-overlay${visible ? " show" : ""}`}>
			<div className="profile-modal">
				<div className="modal-header">
					<h2>{client.fio}</h2>
					<button
						className="close-modal-btn"
						onClick={handleClose}
						aria-label="Закрити">
						<X size={20} strokeWidth={2} />
					</button>
				</div>

				<div className="profile-tabs">
					{(["info", "contract", "billing", "messages"] as const).map((t) => (
						<button
							key={t}
							className={`profile-tab${profileTab === t ? " active" : ""}`}
							onClick={() => setProfileTab(t)}>
							{tabLabels[t]}
						</button>
					))}
				</div>

				{profileTab === "info" && (
					<div className="profile-tab-content active">
						{editingInfo ? (
							<form onSubmit={handleSaveInfo}>
								<FieldWithRules
									id="siFio"
									label="ПІБ"
									value={infoForm.fio}
									onChange={setInfo("fio")}
									rules={fioRules}
									autoFocus
								/>
								<FieldWithRules
									id="siPhone"
									label="Телефон"
									type="tel"
									value={infoForm.phone}
									onChange={setInfo("phone")}
									rules={phoneRules}
									placeholder="+380XXXXXXXXX"
								/>
								<FieldWithRules
									id="siEmail"
									label="Email (вхід)"
									type="email"
									value={infoForm.email}
									onChange={setInfo("email")}
									rules={emailRules}
								/>
								<div
									style={{display: "flex", gap: "0.8rem", marginTop: "1rem"}}>
									<button
										type="submit"
										className="modal-btn confirm"
										style={{width: "auto", padding: "0.6rem 1.5rem"}}
										disabled={!infoAllValid}>
										Зберегти
									</button>
									<button
										type="button"
										className="modal-btn cancel"
										style={{width: "auto", padding: "0.6rem 1.5rem"}}
										onClick={() => {
											setEditingInfo(false);
											setInfoForm({
												fio: client.fio,
												phone: client.phone,
												email: client.email,
											});
										}}>
										Скасувати
									</button>
								</div>
							</form>
						) : (
							<>
								<p>
									<strong>ПІБ:</strong> {client.fio}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Email:</strong> {client.email}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Телефон:</strong> {client.phone}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Підключення:</strong>{" "}
									{client.connectionApproved ? (
										<StatusDot status="active" label="Підтверджено" />
									) : (
										<StatusDot status="pending" label="Очікує підтвердження" />
									)}
								</p>
								<div
									style={{
										marginTop: "1rem",
										display: "flex",
										gap: "0.8rem",
										alignItems: "center",
									}}>
									<button
										className="modal-btn icon-btn"
										style={{width: "auto", padding: "0.6rem 1.5rem"}}
										onClick={() => setEditingInfo(true)}>
										<Pencil size={14} strokeWidth={2} /> Редагувати
									</button>
									{infoSaved && (
										<span style={{color: "var(--success-color)"}}>
											Збережено
										</span>
									)}
								</div>
							</>
						)}
					</div>
				)}

				{profileTab === "contract" && (
					<div className="profile-tab-content active">
						{client.contract ? (
							<>
								<p>
									<strong>ID:</strong> {client.contract.id}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Послуга:</strong> {serviceLabel}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Обладнання:</strong> {client.contract.equipmentId}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Статус:</strong> {client.contract.status}
								</p>
								<p style={{marginTop: "0.5rem"}}>
									<strong>Дата:</strong>{" "}
									{new Date(client.contract.createdAt).toLocaleDateString(
										"uk-UA",
									)}
								</p>
								<div style={{marginTop: "1rem"}}>
									<strong>Адреса:</strong>
									{editingAddress ? (
										<>
											<FieldWithRules
												id="siAddr"
												label=""
												value={addressValue}
												onChange={setAddressValue}
												rules={addressRules}
												placeholder="вул. Івана Франка, 25, кв. 10"
												autoFocus
											/>
											<div
												style={{
													display: "flex",
													gap: "0.5rem",
													marginTop: "0.5rem",
												}}>
												<button
													className="modal-btn confirm"
													style={{width: "auto", padding: "0.5rem 1rem"}}
													onClick={handleSaveAddress}
													disabled={!addressAllValid}>
													Зберегти
												</button>
												<button
													className="modal-btn cancel"
													style={{width: "auto", padding: "0.5rem 1rem"}}
													onClick={() => {
														setEditingAddress(false);
														setAddressValue(client.contract?.address ?? "");
													}}>
													Скасувати
												</button>
											</div>
										</>
									) : (
										<span style={{marginLeft: "0.5rem"}}>
											{client.contract.address}{" "}
											<button
												className="modal-btn icon-btn"
												style={{
													width: "auto",
													padding: "0.3rem 0.8rem",
													fontSize: "0.8rem",
													marginLeft: "0.5rem",
												}}
												onClick={() => setEditingAddress(true)}>
												<Pencil size={13} strokeWidth={2} /> Змінити
											</button>
											{addressSaved && (
												<span
													style={{
														color: "var(--success-color)",
														marginLeft: "0.5rem",
													}}>
													Збережено
												</span>
											)}
										</span>
									)}
								</div>
							</>
						) : (
							<p>Немає договору</p>
						)}
					</div>
				)}

				{profileTab === "billing" && (
					<div className="profile-tab-content active">
						<p
							style={{
								fontSize: "2rem",
								color:
									client.balance < 0
										? "var(--error-color)"
										: "var(--success-color)",
							}}>
							{client.balance} грн
						</p>
						<p style={{color: "var(--gray-color)", marginTop: "0.5rem"}}>
							Автооплата: {client.isRecurring ? "Увімкнена" : "Вимкнена"}
						</p>
					</div>
				)}

				{profileTab === "messages" && (
					<div className="profile-tab-content active">
						{client.messages.length === 0 ? (
							<p>Немає повідомлень</p>
						) : (
							<div className="chat-messages" style={{height: "300px"}}>
								{client.messages.map((msg, i) => (
									<div
										key={i}
										className={`message ${msg.from === "support" ? "support" : "user"}`}>
										<small>
											{msg.from === "support" ? "Підтримка" : "Клієнт"}
										</small>
										<p style={{marginTop: "0.3rem"}}>{msg.text}</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

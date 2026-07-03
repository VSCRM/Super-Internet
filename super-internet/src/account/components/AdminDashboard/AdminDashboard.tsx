import {useState} from "react";
import {Shield, LogOut, Plus, Trash2, CheckCircle} from "lucide-react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {isClient, isSupport} from "../../types";
import type {Admin, Client} from "../../types";
import {StatusDot} from "../../shared/StatusDot";
import {AddStaffModal} from "./AddStaffModal";
import "./AdminDashboard.scss";

interface AdminDashboardProps {
	admin: Admin;
}

const CONTRACT_STATUS: Record<string, string> = {
	pending: "Очікує",
	active: "Активний",
	debt: "Борг",
};

export function AdminDashboard({admin}: AdminDashboardProps) {
	const {
		users,
		logout,
		approveConnection,
		deleteClient,
		deleteStaff,
		setEquipmentStatus,
	} = useAuth();
	const {confirm, alert} = useModal();
	const [showAddStaff, setShowAddStaff] = useState(false);

	const clients = users.filter(isClient);
	const staff = users.filter(isSupport);

	const handleApprove = async (client: Client) => {
		const ok = await confirm(
			"Підтвердження",
			`Підтвердити підключення для ${client.fio}?`,
		);
		if (!ok) return;
		approveConnection(client.id);
		await alert("Успіх", "Підключення підтверджено!", "success");
	};

	const handleDeleteClient = async (client: Client) => {
		const ok = await confirm(
			"Видалення",
			`Видалити клієнта ${client.fio}? Цю дію не можна скасувати.`,
		);
		if (!ok) return;
		deleteClient(client.id);
		await alert("Видалено", "Клієнта видалено", "info");
	};

	const handleDeleteStaff = async (email: string, name: string) => {
		const ok = await confirm("Видалення", `Видалити співробітника ${name}?`);
		if (!ok) return;
		deleteStaff(email);
		await alert("Видалено", "Співробітника видалено", "info");
	};

	// Direct toggle — no confirm modal to avoid async stale-closure issues.
	// Equipment status is reversible, so confirmation is unnecessary.
	const toggleEquipment = (clientId: number, current: string | undefined) => {
		const next = current === "online" ? "offline" : "online";
		setEquipmentStatus(clientId, next as "online" | "offline");
	};

	return (
		<>
			<div className="dashboard">
				<div className="dashboard-header">
					<div className="user-info">
						<Shield size={28} strokeWidth={1.5} />
						<div>
							<p style={{fontWeight: 700}}>Адміністратор</p>
							<p style={{color: "var(--gray-color)", fontSize: "0.9rem"}}>
								{admin.email}
							</p>
						</div>
					</div>
					<button className="logout-btn icon-btn" onClick={logout}>
						<LogOut size={16} strokeWidth={1.8} /> Вийти
					</button>
				</div>

				<div className="admin-panel">
					{/* Clients */}
					<div className="service-card">
						<h2 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
							Клієнти ({clients.length})
						</h2>
						{clients.length === 0 ? (
							<p style={{color: "var(--gray-color)"}}>Клієнтів ще немає</p>
						) : (
							<div className="equipment-grid">
								{clients.map((client) => {
									const eqStatus = client.equipmentStatus ?? "pending";
									const borderStatus = client.connectionApproved
										? eqStatus === "online"
											? "online"
											: eqStatus === "offline"
												? "offline"
												: "pending"
										: "pending";

									return (
										<div
											key={`${client.id}-${eqStatus}`}
											className={`equipment-item ${borderStatus}`}>
											<p
												style={{
													fontWeight: 700,
													fontSize: "0.95rem",
													marginBottom: "0.4rem",
												}}>
												{client.fio}
											</p>
											<p
												style={{
													color: "var(--gray-color)",
													fontSize: "0.8rem",
													marginBottom: "0.4rem",
												}}>
												{client.email}
											</p>
											{client.contract && (
												<p style={{fontSize: "0.8rem", marginBottom: "0.6rem"}}>
													{client.contract.id}
												</p>
											)}
											<span
												className={`status-badge status-${client.contract?.status ?? "pending"}`}>
												{client.contract
													? CONTRACT_STATUS[client.contract.status]
													: "Без договору"}
											</span>

											{client.connectionApproved && (
												<div style={{marginTop: "0.6rem"}}>
													<StatusDot
														status={
															eqStatus as "online" | "offline" | "pending"
														}
													/>
												</div>
											)}

											<div className="equipment-actions">
												{client.contract && !client.connectionApproved && (
													<button
														className="approve-btn icon-btn"
														onClick={() => handleApprove(client)}>
														<CheckCircle size={14} strokeWidth={2} />{" "}
														Підтвердити
													</button>
												)}
												{client.connectionApproved && (
													<button
														className={`status-control-btn ${eqStatus === "online" ? "set-offline" : "set-online"}`}
														onClick={() =>
															toggleEquipment(client.id, eqStatus)
														}>
														{eqStatus === "online"
															? "Перевести офлайн"
															: "Перевести онлайн"}
													</button>
												)}
												<button
													className="delete-client-btn icon-btn"
													onClick={() => handleDeleteClient(client)}>
													<Trash2 size={14} strokeWidth={2} /> Видалити
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Staff */}
					<div className="service-card">
						<h2 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
							Персонал ({staff.length})
						</h2>
						<button
							className="submit-btn icon-btn"
							style={{marginBottom: "1.5rem"}}
							onClick={() => setShowAddStaff(true)}>
							<Plus size={16} strokeWidth={2} /> Додати співробітника
						</button>
						{staff.length === 0 ? (
							<p style={{color: "var(--gray-color)"}}>Персоналу немає</p>
						) : (
							<div className="equipment-grid">
								{staff.map((s) => (
									<div key={s.id} className="equipment-item online">
										<p style={{fontWeight: 700}}>{s.name}</p>
										<p
											style={{
												color: "var(--gray-color)",
												fontSize: "0.85rem",
												marginBottom: "0.5rem",
											}}>
											{s.email}
										</p>
										<button
											className="delete-client-btn icon-btn"
											onClick={() => handleDeleteStaff(s.email, s.name)}>
											<Trash2 size={14} strokeWidth={2} /> Видалити
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{showAddStaff && <AddStaffModal onClose={() => setShowAddStaff(false)} />}
		</>
	);
}

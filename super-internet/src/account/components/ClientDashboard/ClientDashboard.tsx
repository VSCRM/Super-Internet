import {useEffect, useState} from "react";
import {LogOut, Trash2, User} from "lucide-react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import type {Client} from "../../types";
import {ServiceSelector} from "./ServiceSelector";
import {ContractCard} from "./ContractCard";
import {BillingCard} from "./BillingCard";
import {ClientSupportChat} from "./ClientSupportChat";
import "./ClientDashboard.scss";

type ClientTab = "contract" | "billing" | "support";

interface ClientDashboardProps {
	client: Client;
}

export function ClientDashboard({client}: ClientDashboardProps) {
	const {logout, deleteAccount, markSupportMessagesRead} = useAuth();
	const {confirm, alert} = useModal();
	const [tab, setTab] = useState<ClientTab>("contract");

	useEffect(() => {
		if (tab === "support") markSupportMessagesRead();
	}, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

	const unreadCount = client.messages.filter(
		(m) => m.from === "support" && !m.read,
	).length;

	const handleDeleteAccount = async () => {
		const ok = await confirm(
			"Видалення акаунту",
			"Видалити акаунт? Цю дію не можна скасувати.",
		);
		if (!ok) return;
		deleteAccount();
		await alert("Видалено", "Ваш акаунт видалено", "info");
	};

	return (
		<div className="dashboard">
			<div className="dashboard-header">
				<div className="user-info">
					<User size={28} strokeWidth={1.5} />
					<div>
						<p style={{fontWeight: 700}}>{client.fio}</p>
						<p style={{color: "var(--gray-color)", fontSize: "0.9rem"}}>
							{client.email}
						</p>
					</div>
				</div>
				<div style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
					<button
						className="logout-btn icon-btn"
						style={{
							borderColor: "var(--error-color)",
							color: "var(--error-color)",
						}}
						onClick={handleDeleteAccount}>
						<Trash2 size={16} strokeWidth={1.8} /> Видалити акаунт
					</button>
					<button className="logout-btn icon-btn" onClick={logout}>
						<LogOut size={16} strokeWidth={1.8} /> Вийти
					</button>
				</div>
			</div>

			{!client.contract ? (
				<ServiceSelector />
			) : (
				<>
					<div className="nav-tabs">
						<button
							className={`nav-tab${tab === "contract" ? " active" : ""}`}
							onClick={() => setTab("contract")}>
							Договір
						</button>
						<button
							className={`nav-tab${tab === "billing" ? " active" : ""}`}
							onClick={() => setTab("billing")}>
							Білінг
						</button>
						<button
							className={`nav-tab${tab === "support" ? " active" : ""}`}
							style={{position: "relative"}}
							onClick={() => setTab("support")}>
							Підтримка
							{unreadCount > 0 && (
								<span className="unread-badge">{unreadCount}</span>
							)}
						</button>
					</div>

					<div className={`tab-content${tab === "contract" ? " active" : ""}`}>
						<ContractCard client={client} />
					</div>
					<div className={`tab-content${tab === "billing" ? " active" : ""}`}>
						<BillingCard client={client} />
					</div>
					<div className={`tab-content${tab === "support" ? " active" : ""}`}>
						<ClientSupportChat client={client} />
					</div>
				</>
			)}
		</div>
	);
}

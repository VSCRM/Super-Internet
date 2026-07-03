import {useState} from "react";
import {LogOut, Wrench} from "lucide-react";
import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {isClient} from "../../types";
import type {Support} from "../../types";
import {SupportChatWindow} from "./SupportChatWindow";
import {ClientProfileModal} from "./ClientProfileModal";
import "./SupportDashboard.scss";

interface SupportDashboardProps {
	support: Support;
}

const CONTRACT_STATUS: Record<string, string> = {
	pending: "Очікує",
	active: "Активний",
	debt: "Борг",
};

export function SupportDashboard({support}: SupportDashboardProps) {
	const {users, logout, closeTicket, markClientMessagesRead} = useAuth();
	const {confirm} = useModal();
	const [chatClientId, setChatClientId] = useState<number | null>(null);
	const [profileClientId, setProfileClientId] = useState<number | null>(null);

	// Only show clients that have an open conversation (messages > 0).
	// When a ticket is closed (messages cleared), the client disappears
	// from the queue — nothing left to act on.
	const clients = users.filter(isClient);
	const ticketClients = clients.filter((c) => c.messages.length > 0);
	const chatClient = chatClientId
		? clients.find((c) => c.id === chatClientId)
		: null;
	const profileClient = profileClientId
		? clients.find((c) => c.id === profileClientId)
		: null;

	const openChat = (clientId: number) => {
		setChatClientId(clientId);
		markClientMessagesRead(clientId);
	};

	const handleCloseTicket = async (clientId: number) => {
		const ok = await confirm(
			"Закрити тікет",
			"Закрити тікет і видалити листування?",
		);
		if (!ok) return;
		closeTicket(clientId);
		setChatClientId(null);
	};

	return (
		<div className="dashboard">
			<div className="dashboard-header">
				<div className="user-info">
					<Wrench size={28} strokeWidth={1.5} />
					<div>
						<p style={{fontWeight: 700}}>Технічна підтримка</p>
						<p style={{color: "var(--gray-color)", fontSize: "0.9rem"}}>
							{support.email}
						</p>
					</div>
				</div>
				<button className="logout-btn icon-btn" onClick={logout}>
					<LogOut size={16} strokeWidth={1.8} /> Вийти
				</button>
			</div>

			<div className="service-card">
				<h2 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
					Активні тікети ({ticketClients.length})
				</h2>
				{ticketClients.length === 0 ? (
					<p style={{color: "var(--gray-color)"}}>Нових звернень немає</p>
				) : (
					<div className="tickets-grid">
						{ticketClients.map((client) => {
							const unread = client.messages.filter(
								(m) => m.from !== "support" && !m.read,
							).length;
							const statusLabel = client.contract
								? CONTRACT_STATUS[client.contract.status]
								: "Без договору";
							const statusClass = client.contract
								? `status-${client.contract.status}`
								: "status-pending";
							return (
								<div
									key={client.id}
									className="ticket-card"
									onClick={() => openChat(client.id)}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
											marginBottom: "0.8rem",
										}}>
										<h3 style={{color: "var(--purple-color)"}}>{client.fio}</h3>
										{unread > 0 && (
											<span className="unread-badge">{unread}</span>
										)}
									</div>
									<p
										style={{
											color: "var(--gray-color)",
											fontSize: "0.9rem",
											marginBottom: "0.5rem",
										}}>
										{client.email}
									</p>
									<span className={`status-badge ${statusClass}`}>
										{statusLabel}
									</span>
									<p
										style={{
											color: "var(--gray-color)",
											fontSize: "0.85rem",
											marginTop: "0.5rem",
										}}>
										{client.messages.length > 0
											? `${client.messages.length} повідомлень`
											: "Немає повідомлень"}
									</p>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{chatClient && (
				<SupportChatWindow
					client={chatClient}
					onClose={() => setChatClientId(null)}
					onViewProfile={() => setProfileClientId(chatClient.id)}
					onCloseTicket={() => handleCloseTicket(chatClient.id)}
				/>
			)}
			{profileClient && (
				<ClientProfileModal
					client={profileClient}
					onClose={() => setProfileClientId(null)}
				/>
			)}
		</div>
	);
}

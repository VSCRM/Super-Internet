import {useEffect, useRef, useState} from "react";
import type {FormEvent} from "react";
import {X, User, Wrench, CheckCircle, Send} from "lucide-react";
import {useAuth} from "../../AuthContext";
import type {Client} from "../../types";
import "./SupportChatWindow.scss";

interface SupportChatWindowProps {
	client: Client;
	onClose: () => void;
	onViewProfile: () => void;
	onCloseTicket: () => void;
}

export function SupportChatWindow({
	client,
	onClose,
	onViewProfile,
	onCloseTicket,
}: SupportChatWindowProps) {
	const {sendSupportMessage} = useAuth();
	const [text, setText] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const id = setTimeout(() => setVisible(true), 10);
		return () => clearTimeout(id);
	}, []);
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
	}, [client.messages]);

	const handleClose = () => {
		setVisible(false);
		setTimeout(onClose, 300);
	};

	const handleSend = (e: FormEvent) => {
		e.preventDefault();
		if (!text.trim()) return;
		sendSupportMessage(client.id, text.trim());
		setText("");
	};

	return (
		<div className={`chat-overlay${visible ? " show" : ""}`}>
			<div className="chat-window">
				<div className="chat-header">
					<div>
						<h3>{client.fio}</h3>
						<small style={{color: "var(--gray-color)"}}>{client.email}</small>
					</div>
					<div
						style={{
							display: "flex",
							gap: "0.5rem",
							flexWrap: "wrap",
							alignItems: "center",
						}}>
						<button
							className="view-client-btn icon-btn"
							onClick={onViewProfile}>
							<User size={14} strokeWidth={2} /> Профіль
						</button>
						<button
							className="close-ticket-btn icon-btn"
							onClick={onCloseTicket}>
							<CheckCircle size={14} strokeWidth={2} /> Закрити тікет
						</button>
						<button
							className="close-chat-btn"
							onClick={handleClose}
							aria-label="Закрити чат">
							<X size={18} strokeWidth={2} />
						</button>
					</div>
				</div>

				<div className="chat-messages-area">
					{client.messages.length === 0 ? (
						<p style={{color: "var(--gray-color)", textAlign: "center"}}>
							Нових повідомлень немає
						</p>
					) : (
						client.messages.map((msg, i) => (
							<div
								key={i}
								className={`message ${msg.from === "support" ? "support" : "user"}`}>
								<small
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.3rem",
										opacity: 0.7,
									}}>
									{msg.from === "support" ? (
										<>
											<Wrench size={12} strokeWidth={2} /> Підтримка
										</>
									) : (
										<>
											<User size={12} strokeWidth={2} /> Клієнт
										</>
									)}
									{" — "}
									{new Date(msg.timestamp).toLocaleTimeString("uk-UA", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</small>
								<p style={{marginTop: "0.4rem"}}>{msg.text}</p>
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				<div
					style={{padding: "1rem", borderTop: "2px solid var(--purple-color)"}}>
					<form className="chat-input" onSubmit={handleSend}>
						<input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Відповідь клієнту..."
						/>
						<button
							type="submit"
							className="submit-btn icon-btn"
							style={{flex: "0 0 auto"}}>
							<Send size={16} strokeWidth={1.8} /> Надіслати
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

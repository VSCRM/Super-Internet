import {useEffect, useRef, useState} from "react";
import type {FormEvent} from "react";
import {Send, Wrench, User} from "lucide-react";
import {useAuth} from "../../AuthContext";
import type {Client} from "../../types";
import "./ClientSupportChat.scss";

interface ClientSupportChatProps {
	client: Client;
}

export function ClientSupportChat({client}: ClientSupportChatProps) {
	const {sendClientMessage, sendAutoSupportReply} = useAuth();
	const [text, setText] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
	}, [client.messages]);

	const handleSend = (e: FormEvent) => {
		e.preventDefault();
		if (!text.trim()) return;
		sendClientMessage(text.trim());
		setText("");
		setTimeout(() => {
			sendAutoSupportReply(
				"Дякуємо за звернення! Ваш запит прийнято в обробку. Очікуйте відповіді.",
			);
		}, 1000);
	};

	return (
		<div className="support-chat">
			<h2 style={{color: "var(--purple-color)", marginBottom: "1.5rem"}}>
				Підтримка
			</h2>

			<div className="chat-messages">
				{client.messages.length === 0 ? (
					<p style={{color: "var(--gray-color)", textAlign: "center"}}>
						Напишіть повідомлення, і ми вам відповімо
					</p>
				) : (
					client.messages.map((msg, i) => (
						<div
							key={i}
							className={`message ${msg.from === "support" ? "support" : "user"}`}>
							<small
								style={{
									opacity: 0.7,
									display: "flex",
									alignItems: "center",
									gap: "0.3rem",
								}}>
								{msg.from === "support" ? (
									<>
										<Wrench size={12} strokeWidth={2} /> Підтримка
									</>
								) : (
									<>
										<User size={12} strokeWidth={2} /> Ви
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

			<form className="chat-input" onSubmit={handleSend}>
				<input
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Введіть повідомлення..."
				/>
				<button
					type="submit"
					className="submit-btn icon-btn"
					style={{flex: "0 0 auto"}}>
					<Send size={16} strokeWidth={1.8} /> Надіслати
				</button>
			</form>
		</div>
	);
}

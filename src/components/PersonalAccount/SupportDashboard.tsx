import { useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import type { ClientUser } from "../../types/models";
import { TicketCard } from "./TicketCard";
import { SupportChatOverlay } from "./SupportChatOverlay";
import shared from "./dashboardShared.module.scss";

/** Composition root for the support agent's personal account: ticket queue + the active chat overlay. */
export function SupportDashboard(): ReactElement {
	const { users } = useApp();
	const { t } = useTranslation();
	const [activeClientId, setActiveClientId] = useState<number | null>(null);

	// Only clients who sent at least one message TO support (exclude auto-replies).
	// Unread-first, so a new message never gets buried below older, already-read tickets.
	const tickets = users
		.filter(
			(u): u is ClientUser =>
				u.role === "client" && u.messages.some((m) => m.from !== "support")
		)
		.sort((a, b) => b.unreadMessages - a.unreadMessages);

	const activeClient =
		activeClientId !== null
			? ((users.find((u) => u.id === activeClientId) as
					ClientUser | undefined) ?? null)
			: null;

	const totalUnread = tickets.reduce(
		(sum, client) => sum + client.unreadMessages,
		0
	);

	return (
		<div>
			{/* Not a real tab switcher (there's only one, non-clickable) - so this
			    intentionally does not reuse NavTabs, whose badge hides on the
			    active tab. That rule is right for a switcher, wrong for a static header. */}
			<div className={shared["nav-tabs"]}>
				<button className={`${shared["nav-tab"]} ${shared["nav-tab--active"]}`}>
					{t("tickets.navLabel")}
					{totalUnread > 0 && (
						<span className={shared["unread-badge"]}>{totalUnread}</span>
					)}
				</button>
			</div>

			<div className={shared["tab-content"]}>
				<h3>{t("tickets.panelTitle")}</h3>
				<div className={shared["tickets-grid"]}>
					{tickets.length === 0 ? (
						<p style={{ color: "var(--gray-color)" }}>{t("tickets.empty")}</p>
					) : (
						tickets.map((client) => (
							<TicketCard
								key={client.id}
								client={client}
								onOpen={setActiveClientId}
							/>
						))
					)}
				</div>
			</div>

			{activeClient && (
				<SupportChatOverlay
					client={activeClient}
					onClose={() => setActiveClientId(null)}
					onTicketClosed={() => setActiveClientId(null)}
				/>
			)}
		</div>
	);
}

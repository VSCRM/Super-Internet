import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import type { ClientUser } from "../../types/models";
import { NavTabs } from "../molecules/NavTabs/NavTabs";
import { ProfileEditForm } from "../organisms/ProfileEditForm/ProfileEditForm";
import { ClientStatusTab } from "./ClientStatusTab";
import { ClientContractTab } from "./ClientContractTab";
import { ClientSupportTab } from "./ClientSupportTab";
import { useServiceSelectionAction } from "./useServiceSelectionAction";
import { usePaymentAction } from "./usePaymentAction";
import { useContractManagementActions } from "./useContractManagementActions";
import { useAccountDeletionAction } from "./useAccountDeletionAction";
import { useSupportChatAction } from "./useSupportChatAction";
import shared from "./dashboardShared.module.scss";

type DashboardTab = "status" | "contract" | "support" | "profile";

interface ClientDashboardProps {
	readonly client: ClientUser;
}

/**
 * Composition root for the client's personal account. Each concern
 * (service selection, payment, contract management, account deletion, chat)
 * is its own single-purpose hook; each tab's markup is its own
 * single-responsibility component - this component only owns which tab is
 * active and wires the pieces together.
 */
export function ClientDashboard({
	client,
}: ClientDashboardProps): ReactElement {
	const app = useApp();
	const { t } = useTranslation();
	const [tab, setTab] = useState<DashboardTab>("status");

	const selectService = useServiceSelectionAction(client);
	const { pay, toggleRecurring } = usePaymentAction(client);
	const { editAddress, deleteContract } = useContractManagementActions(client);
	const deleteAccount = useAccountDeletionAction(client);
	const sendMessage = useSupportChatAction(client);

	const selectTab = (next: DashboardTab): void => {
		setTab(next);
		if (next === "support") void app.markClientMessagesRead(client.id);
	};

	// Auto-mark any support replies as read whenever they arrive while the
	// support tab is already open (e.g. the 1s auto-reply, or a real agent reply).
	useEffect(() => {
		if (tab !== "support") return;
		const hasUnreadFromSupport = client.messages.some(
			(m) => m.from === "support" && !m.read
		);
		if (hasUnreadFromSupport) void app.markClientMessagesRead(client.id);
	}, [tab, client.messages, client.id, app]);

	// For the CLIENT tab: unread = messages from support not yet seen by the client.
	const unread = client.messages.filter(
		(m) => m.from === "support" && !m.read
	).length;

	return (
		<div>
			<NavTabs
				tabs={[
					{ id: "status", label: t("dashboard.nav.status") },
					{ id: "contract", label: t("dashboard.nav.contract") },
					{ id: "profile", label: t("dashboard.nav.profile") },
					{
						id: "support",
						label: t("dashboard.nav.support"),
						badgeCount: unread,
					},
				]}
				active={tab}
				onSelect={selectTab}
			/>

			{tab === "status" && (
				<ClientStatusTab
					client={client}
					onSelectService={(serviceType) => void selectService(serviceType)}
					onPay={() => void pay()}
					onToggleRecurring={() => void toggleRecurring()}
				/>
			)}

			{tab === "contract" && (
				<ClientContractTab
					client={client}
					onEditAddress={() => void editAddress()}
					onDeleteContract={() => void deleteContract()}
					onDeleteAccount={() => void deleteAccount()}
				/>
			)}

			{tab === "profile" && (
				<div className={shared["tab-content"]}>
					<ProfileEditForm client={client} />
				</div>
			)}

			{tab === "support" && (
				<ClientSupportTab
					client={client}
					onSendMessage={(text) => void sendMessage(text)}
				/>
			)}
		</div>
	);
}

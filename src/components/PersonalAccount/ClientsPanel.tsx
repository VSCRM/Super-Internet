import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../context/AppContext";
import { useConfirmedAction } from "../../hooks/useConfirmedAction";
import { usePagination } from "../../hooks/usePagination";
import type { ClientUser } from "../../types/models";
import { Pagination } from "../molecules/Pagination/Pagination";
import { ClientCard } from "./ClientCard";
import shared from "./dashboardShared.module.scss";
import styles from "./AdminDashboard.module.scss";

/** Single responsibility: list all client accounts (paginated) with a way to delete them. */
export function ClientsPanel(): ReactElement {
	const { users, deleteUser } = useApp();
	const { runVoid } = useConfirmedAction();
	const { t } = useTranslation();
	const clients = users.filter((u): u is ClientUser => u.role === "client");
	const { page, pageCount, pageItems, goToPage } = usePagination(clients);

	const handleDelete = (client: ClientUser): Promise<boolean> =>
		runVoid({
			confirmTitle: t("clients.deleteConfirmTitle"),
			confirmMessage: t("clients.deleteConfirmMessage", { fio: client.fio }),
			successMessage: t("clients.deletedMessage"),
			action: () => deleteUser(client.id),
		});

	return (
		<div className={shared["service-card"]}>
			<h3>{t("clients.panelTitle")}</h3>
			<div className={shared["tickets-grid"]}>
				{clients.length === 0 ? (
					<p className={styles["empty-state"]}>{t("clients.empty")}</p>
				) : (
					pageItems.map((client) => (
						<ClientCard
							key={client.id}
							client={client}
							onDelete={(c) => void handleDelete(c)}
						/>
					))
				)}
			</div>
			<Pagination page={page} pageCount={pageCount} onPageChange={goToPage} />
		</div>
	);
}

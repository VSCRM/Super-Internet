import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../../types/models";
import { Badge } from "../../atoms/Badge/Badge";

export interface ServiceStatusBadgeProps {
	readonly client: ClientUser;
}

/** Single responsibility: map a client's connection/balance state to the right badge variant + label. */
export function ServiceStatusBadge({
	client,
}: ServiceStatusBadgeProps): ReactElement {
	const { t } = useTranslation();
	if (!client.connectionApproved)
		return <Badge variant="pending">{t("status.pending")}</Badge>;
	if (client.balance >= 0)
		return <Badge variant="active">{t("status.active")}</Badge>;
	return <Badge variant="debt">{t("status.debt")}</Badge>;
}

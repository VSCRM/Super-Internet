import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { ClientUser } from "../../types/models";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import { ProfileStatusTab } from "./ProfileStatusTab";
import { ProfileContractEditForm } from "./ProfileContractEditForm";
import styles from "./ClientProfileModal.module.scss";

type ProfileTab = "status" | "contract";

interface ClientProfileModalProps {
	readonly client: ClientUser;
	readonly onClose: () => void;
}

const CLOSE_ANIMATION_DURATION_MS = 300;
const OPEN_ANIMATION_DELAY_MS = 10;
const TITLE_ID = "client-profile-modal-title";

/** Composition root for the support agent's read-only + editable view of a client's profile. */
export function ClientProfileModal({
	client,
	onClose,
}: ClientProfileModalProps): ReactElement {
	const { t } = useTranslation();
	const [tab, setTab] = useState<ProfileTab>("status");
	const [visible, setVisible] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const id = window.setTimeout(
			() => setVisible(true),
			OPEN_ANIMATION_DELAY_MS
		);
		return () => window.clearTimeout(id);
	}, []);

	const close = (): void => {
		setVisible(false);
		window.setTimeout(onClose, CLOSE_ANIMATION_DURATION_MS);
	};

	useDialogA11y(dialogRef, close, true);

	return (
		<div
			className={`${styles["modal-backdrop"]} ${visible ? styles["modal-backdrop--show"] : ""}`}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={TITLE_ID}
				className={styles["profile-modal"]}
			>
				<div className={styles["modal-header"]}>
					<h2 id={TITLE_ID}>{t("profile.modalTitle")}</h2>
					<button
						className={styles["close-button"]}
						onClick={close}
						aria-label={t("profile.close")}
					>
						✕
					</button>
				</div>

				<div className={styles["profile-tabs"]}>
					<button
						className={`${styles["profile-tab"]} ${tab === "status" ? styles["profile-tab--active"] : ""}`}
						onClick={() => setTab("status")}
					>
						{t("profile.statusTab")}
					</button>
					<button
						className={`${styles["profile-tab"]} ${tab === "contract" ? styles["profile-tab--active"] : ""}`}
						onClick={() => setTab("contract")}
					>
						{t("profile.contractTab")}
					</button>
				</div>

				{tab === "status" && <ProfileStatusTab client={client} />}
				{tab === "contract" && (
					<ProfileContractEditForm client={client} onSaved={close} />
				)}
			</div>
		</div>
	);
}

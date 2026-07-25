import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppProvider, useApp } from "../context/AppContext";
import { ModalProvider } from "../context/ModalContext";
import { AuthScreen } from "../components/organisms/AuthScreen/AuthScreen";
import { DashboardHeader } from "../components/PersonalAccount/DashboardHeader";
import { ClientDashboard } from "../components/PersonalAccount/ClientDashboard";
import { SupportDashboard } from "../components/PersonalAccount/SupportDashboard";
import { AdminDashboard } from "../components/PersonalAccount/AdminDashboard";
import "../styles/global.css";
import styles from "../styles/PersonalAccountPage.module.scss";

function PersonalAccountContent(): ReactElement {
	const { currentUser, isInitializing } = useApp();
	const { t } = useTranslation();

	if (isInitializing) {
		return (
			<div
				style={{
					color: "var(--white-color)",
					textAlign: "center",
					padding: "3rem",
				}}
			>
				{t("dashboard.loading")}
			</div>
		);
	}

	if (!currentUser) {
		return <AuthScreen />;
	}

	return (
		<div className={styles.dashboard}>
			<DashboardHeader user={currentUser} />
			{currentUser.role === "client" && (
				<ClientDashboard client={currentUser} />
			)}
			{currentUser.role === "support" && <SupportDashboard />}
			{currentUser.role === "admin" && <AdminDashboard />}
		</div>
	);
}

export function PersonalAccountPage(): ReactElement {
	return (
		<AppProvider>
			<ModalProvider>
				<div className={styles["personal-account-page"]}>
					<PersonalAccountContent />
				</div>
			</ModalProvider>
		</AppProvider>
	);
}

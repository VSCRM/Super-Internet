import {AuthProvider} from "../../account/AuthContext";
import {ModalProvider} from "../../account/modal/ModalContext";
import {DashboardShell} from "../../account/components/DashboardShell/DashboardShell";
import "../../account/shared/tokens.scss";
import "../../account/shared/animations.scss";
import "./PersonalAccount.scss";

export function PersonalAccount() {
	return (
		<AuthProvider>
			<ModalProvider>
				<div className="pa-page">
					<DashboardShell />
				</div>
			</ModalProvider>
		</AuthProvider>
	);
}

import {useAuth} from "../../AuthContext";
import {isClient, isSupport, isAdmin} from "../../types";
import {ClientDashboard} from "../ClientDashboard/ClientDashboard";
import {SupportDashboard} from "../SupportDashboard/SupportDashboard";
import {AdminDashboard} from "../AdminDashboard/AdminDashboard";
import {AuthScreen} from "../AuthScreen/AuthScreen";

export function DashboardShell() {
	const {currentUser} = useAuth();

	if (!currentUser) return <AuthScreen />;
	if (isClient(currentUser)) return <ClientDashboard client={currentUser} />;
	if (isSupport(currentUser)) return <SupportDashboard support={currentUser} />;
	if (isAdmin(currentUser)) return <AdminDashboard admin={currentUser} />;

	return null;
}

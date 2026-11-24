import { lazy, Suspense } from "react";
import {
	BrowserRouter,
	Navigate,
	Route,
	Routes,
	useLocation,
} from "react-router";
import type { ReactElement } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";

// Code-splitting: each top-level route ships as its own chunk, so the
// PersonalAccountPage's auth/payment/email service stack is never
// downloaded by a visitor who only views the marketing landing page.
const MainPage = lazy(() =>
	import("./pages/MainPage").then((module) => ({ default: module.MainPage }))
);
const PersonalAccountPage = lazy(() =>
	import("./pages/PersonalAccountPage").then((module) => ({
		default: module.PersonalAccountPage,
	}))
);

const OAuthCallbackPage = lazy(() =>
	import("./pages/OAuthCallbackPage").then((module) => ({
		default: module.OAuthCallbackPage,
	}))
);

const BASE = import.meta.env.BASE_URL;

/** The backend redirects a failed Google sign-in to `/login?error=google`; the login form lives on /account. */
function LoginRedirect(): ReactElement {
	const { search } = useLocation();
	return <Navigate to={{ pathname: "/account", search }} replace />;
}

function RouteFallback(): ReactElement {
	return (
		<div
			style={{ minHeight: "100vh", backgroundColor: "rgb(55, 25, 77)" }}
			aria-busy="true"
		/>
	);
}

export default function App(): ReactElement {
	return (
		<BrowserRouter basename={BASE}>
			<ErrorBoundary>
				<Suspense fallback={<RouteFallback />}>
					<Routes>
						<Route path="/" element={<MainPage />} />
						<Route path="/account" element={<PersonalAccountPage />} />
						<Route path="/oauth-callback" element={<OAuthCallbackPage />} />
						<Route path="/login" element={<LoginRedirect />} />
					</Routes>
				</Suspense>
			</ErrorBoundary>
		</BrowserRouter>
	);
}

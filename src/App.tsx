import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
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

const BASE = import.meta.env.BASE_URL;

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
					</Routes>
				</Suspense>
			</ErrorBoundary>
		</BrowserRouter>
	);
}

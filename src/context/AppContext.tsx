import type { ReactElement, ReactNode } from "react";
import { env } from "../shared/config/env";
import { BackendAppProvider } from "./BackendAppProvider";
import { LocalAppProvider } from "./LocalAppProvider";

export type { AppContextValue, AppCapabilities } from "./appContextCore";
// eslint-disable-next-line react-refresh/only-export-components -- re-export keeps every existing `import { useApp } from ".../AppContext"` working
export { useApp } from "./appContextCore";

/**
 * Composition root for application state. `VITE_BACKEND_MODE` picks the data
 * layer: the real Spring backend (`BackendAppProvider`) or the browser-only
 * Mock layer (`LocalAppProvider`). Both expose the exact same context shape,
 * so no component below knows or cares which one is active.
 */
export function AppProvider({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	return env.backendMode ? (
		<BackendAppProvider>{children}</BackendAppProvider>
	) : (
		<LocalAppProvider>{children}</LocalAppProvider>
	);
}

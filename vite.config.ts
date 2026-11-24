import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const BASE = "/Super-Internet/";

/**
 * Dev only. The backend ends a Google sign-in by redirecting to
 * `<FRONTEND_URL>/oauth-callback#token=...` (or `/login?error=google`). If its
 * FRONTEND_URL lacks the `/Super-Internet` base path, Vite answers 404. Sending
 * those two routes to the same path under the base fixes it; browsers keep the
 * `#fragment` (the token) across a redirect.
 */
function redirectAuthRoutesToBase(): Plugin {
	return {
		name: "redirect-auth-routes-to-base",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url ?? "";
				if (/^\/(oauth-callback|login)(\?|$)/.test(url)) {
					res.statusCode = 302;
					res.setHeader("Location", BASE.slice(0, -1) + url);
					res.end();
					return;
				}
				next();
			});
		},
	};
}

export default defineConfig(({ mode }) => {
	// Where the Spring Boot backend listens (see its `server.port`, default 8080).
	// Used only by the dev-server proxy below; override in `.env.local` if needed.
	const fileEnv = loadEnv(mode, process.cwd(), "");
	const backendOrigin = fileEnv.VITE_BACKEND_ORIGIN || "http://localhost:8080";

	return {
		base: BASE,
		plugins: [react(), redirectAuthRoutesToBase()],
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		server: {
			open: true,
			proxy: {
				// JSON API. Same-origin from the browser's point of view, so no CORS.
				"/api": { target: backendOrigin },
			},
		},
		test: {
			globals: true,
			environment: "jsdom",
			setupFiles: "./setupTests.ts",
		},
	};
});

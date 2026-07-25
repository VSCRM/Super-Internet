import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	base: "/Super-Internet/",
	plugins: [react()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	server: {
		open: true,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
			},
			"/images": {
				target: "http://localhost:3000",
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./setupTests.ts",
	},
});

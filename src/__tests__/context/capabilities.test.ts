import { describe, expect, it } from "vitest";
import {
	BACKEND_CAPABILITIES,
	LOCAL_CAPABILITIES,
} from "../../context/appContextCore";

describe("capabilities", () => {
	it("the Mock layer can do everything", () => {
		expect(LOCAL_CAPABILITIES.isBackend).toBe(false);
		expect(LOCAL_CAPABILITIES.canDeleteAccounts).toBe(true);
	});

	it("the backend can do everything too", () => {
		expect(BACKEND_CAPABILITIES).toEqual({
			isBackend: true,
			canEditProfile: true,
			canEditContract: true,
			canDeleteContract: true,
			canDeleteAccounts: true,
			canCloseTicket: true,
			canToggleRecurring: true,
		});
	});
});

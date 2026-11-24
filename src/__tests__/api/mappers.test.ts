import { describe, expect, it } from "vitest";
import {
	mapConversationPreview,
	mapMessage,
	mapUser,
	toEquipmentStatusDto,
	toServiceTypeDto,
} from "../../services/api/mappers";
import type { UserDto } from "../../services/api/dto";

const clientDto: UserDto = {
	id: 7,
	email: "c@gmail.com",
	role: "CLIENT",
	fio: null,
	phone: null,
	balance: 120.5,
	lastPaymentDate: null,
	recurring: true,
	unreadMessages: 2,
	equipmentStatus: "PENDING",
	connectionApproved: true,
};

describe("backend mappers", () => {
	it("maps UPPER_CASE enums to the frontend's lower_case ones", () => {
		const user = mapUser(clientDto);
		expect(user.role).toBe("client");
		if (user.role !== "client") throw new Error("expected client");
		expect(user.equipmentStatus).toBe("pending");
		expect(user.isRecurring).toBe(true);
		expect(user.balance).toBe(120.5);
		// Google accounts have no fio/phone: must be empty strings, not null
		expect(user.fio).toBe("");
		expect(user.phone).toBe("");
	});

	it("maps staff roles", () => {
		const support = mapUser({
			...clientDto,
			role: "SUPPORT",
			fio: "Петренко Петро Петрович",
		});
		expect(support).toMatchObject({
			role: "support",
			name: "Петренко Петро Петрович",
		});
		expect(mapUser({ ...clientDto, role: "ADMIN" }).role).toBe("admin");
	});

	it("converts service and equipment types back to the wire format", () => {
		expect(toServiceTypeDto("internet_tv")).toBe("INTERNET_TV");
		expect(toServiceTypeDto("internet")).toBe("INTERNET");
		expect(toEquipmentStatusDto("online")).toBe("ONLINE");
	});

	it("derives message direction from senderRole", () => {
		const base = {
			id: 1,
			clientId: 7,
			senderId: 7,
			body: "hi",
			sentAt: "2026-01-01T00:00:00Z",
			read: false,
		};
		expect(
			mapMessage({ ...base, senderRole: "CLIENT" }, "c@gmail.com")
		).toMatchObject({
			from: "c@gmail.com",
			to: "support",
		});
		expect(
			mapMessage({ ...base, senderRole: "SUPPORT" }, "c@gmail.com")
		).toMatchObject({
			from: "support",
			to: "c@gmail.com",
		});
	});

	it("builds a preview that is unread only for unread client messages", () => {
		const preview = mapConversationPreview({
			clientId: 7,
			clientEmail: "c@gmail.com",
			clientFio: null,
			lastMessage: "help",
			lastMessageAt: "2026-01-01T00:00:00Z",
			lastSenderRole: "CLIENT",
			unreadFromClient: 3,
		});
		expect(preview.read).toBe(false);
		expect(preview.from).toBe("c@gmail.com");
	});
});

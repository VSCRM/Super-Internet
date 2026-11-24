import { describe, expect, it } from "vitest";
import type { ConversationDto, UserDto } from "../../services/api/dto";
import { composeStaffView } from "../../services/api/staffView";
import type { ChatMessage, ClientUser, Contract } from "../../types/models";

const client: UserDto = {
	id: 7,
	email: "c@gmail.com",
	role: "CLIENT",
	fio: "Іваненко Іван Іванович",
	phone: "+380501234567",
	balance: 0,
	lastPaymentDate: null,
	recurring: false,
	unreadMessages: 9, // the CLIENT's own counter - must not leak into the staff view
	equipmentStatus: null,
	connectionApproved: false,
};

const conversation: ConversationDto = {
	clientId: 7,
	clientEmail: "c@gmail.com",
	clientFio: null,
	lastMessage: "help",
	lastMessageAt: "2026-01-02T10:00:00Z",
	lastSenderRole: "CLIENT",
	unreadFromClient: 2,
};

const contract = { id: "k-1", userId: 7 } as Contract;

const compose = (
	dto: UserDto,
	conversations: ConversationDto[],
	threads: Record<number, ChatMessage[]> = {},
	contracts: Contract[] = []
) =>
	composeStaffView(
		dto,
		new Map(contracts.map((c) => [c.userId, c])),
		new Map(conversations.map((c) => [c.clientId, c])),
		new Map(Object.entries(threads).map(([k, v]) => [Number(k), v]))
	) as ClientUser;

describe("composeStaffView", () => {
	it("leaves staff accounts alone", () => {
		const admin = composeStaffView(
			{ ...client, role: "ADMIN" },
			new Map(),
			new Map(),
			new Map()
		);
		expect(admin.role).toBe("admin");
	});

	it("takes the unread counter from the conversation, not from the user", () => {
		expect(compose(client, [conversation]).unreadMessages).toBe(2);
		expect(compose(client, []).unreadMessages).toBe(0);
	});

	it("attaches the contract and shows the last message as a one-line preview", () => {
		const view = compose(client, [conversation], {}, [contract]);
		expect(view.contract).toBe(contract);
		expect(view.messages).toHaveLength(1);
		expect(view.messages[0]).toMatchObject({
			from: "c@gmail.com",
			text: "help",
			read: false,
		});
	});

	it("has no messages (so no ticket) when there is no conversation", () => {
		expect(compose(client, []).messages).toEqual([]);
	});

	it("keeps a loaded thread and does not duplicate its last message", () => {
		const thread: ChatMessage[] = [
			{
				from: "c@gmail.com",
				to: "support",
				text: "help",
				timestamp: "2026-01-02T10:00:00Z",
				read: true,
			},
		];
		expect(compose(client, [conversation], { 7: thread }).messages).toEqual(
			thread
		);
	});

	it("appends a message newer than the loaded thread", () => {
		const thread: ChatMessage[] = [
			{
				from: "c@gmail.com",
				to: "support",
				text: "old",
				timestamp: "2026-01-01T10:00:00Z",
				read: true,
			},
		];
		const messages = compose(client, [conversation], { 7: thread }).messages;
		expect(messages.map((m) => m.text)).toEqual(["old", "help"]);
	});

	it("marks a support reply preview as read", () => {
		const view = compose(client, [
			{ ...conversation, lastSenderRole: "SUPPORT", unreadFromClient: 0 },
		]);
		expect(view.messages[0]).toMatchObject({ from: "support", read: true });
	});
});

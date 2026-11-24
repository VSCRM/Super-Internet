import { useCallback } from "react";
import type { ChatMessage } from "../types/models";
import type { AppError, Result } from "../shared/lib/result";
import { failure, success } from "../shared/lib/result";
import { sanitizeText } from "../shared/lib/sanitize";
import type { UpdateClient } from "./useClientMutation";

export interface ChatActions {
	sendClientMessage: (
		clientId: number,
		text: string
	) => Promise<Result<void, AppError>>;
	sendSupportMessage: (
		clientId: number,
		text: string
	) => Promise<Result<void, AppError>>;
	markClientMessagesRead: (clientId: number) => Promise<void>;
	markSupportMessagesRead: (clientId: number) => Promise<void>;
	closeTicket: (clientId: number) => Promise<Result<void, AppError>>;
}

function buildMessage(from: string, to: string, text: string): ChatMessage {
	return {
		from,
		to,
		text: sanitizeText(text),
		timestamp: new Date().toISOString(),
		read: false,
	};
}

export function useChatActions(updateClient: UpdateClient): ChatActions {
	const sendClientMessage = useCallback(
		async (clientId: number, text: string): Promise<Result<void, AppError>> => {
			const result = await updateClient(clientId, (client) => {
				const message = buildMessage(client.email, "support", text);
				// Increment unread for support: they need to see new messages FROM this client.
				return {
					...client,
					messages: [...client.messages, message],
					unreadMessages: client.unreadMessages + 1,
				};
			});
			return result.ok ? success(undefined) : failure(result.error);
		},
		[updateClient]
	);

	const sendSupportMessage = useCallback(
		async (clientId: number, text: string): Promise<Result<void, AppError>> => {
			const result = await updateClient(clientId, (client) => {
				const message = buildMessage("support", client.email, text);
				// Do NOT increment unreadMessages: that counter is only for
				// support-agent notifications about new client-sent messages.
				return { ...client, messages: [...client.messages, message] };
			});
			return result.ok ? success(undefined) : failure(result.error);
		},
		[updateClient]
	);

	// Called when the CLIENT opens the support tab: marks messages FROM
	// support as read (client has seen the replies).
	const markClientMessagesRead = useCallback(
		async (clientId: number) => {
			await updateClient(clientId, (client) => ({
				...client,
				messages: client.messages.map((message) =>
					message.from === "support" && !message.read
						? { ...message, read: true }
						: message
				),
			}));
		},
		[updateClient]
	);

	// Called when SUPPORT opens a ticket: resets unreadMessages counter and
	// marks client->support messages as read.
	const markSupportMessagesRead = useCallback(
		async (clientId: number) => {
			await updateClient(clientId, (client) => ({
				...client,
				unreadMessages: 0,
				messages: client.messages.map((message) =>
					message.from !== "support" && !message.read
						? { ...message, read: true }
						: message
				),
			}));
		},
		[updateClient]
	);

	const closeTicket = useCallback(
		async (clientId: number): Promise<Result<void, AppError>> => {
			const result = await updateClient(clientId, (client) => ({
				...client,
				messages: [],
			}));
			return result.ok ? success(undefined) : failure(result.error);
		},
		[updateClient]
	);

	return {
		sendClientMessage,
		sendSupportMessage,
		markClientMessagesRead,
		markSupportMessagesRead,
		closeTicket,
	};
}

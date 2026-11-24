import type { AppUser, ChatMessage, Contract } from "../../types/models";
import type { ConversationDto, UserDto } from "./dto";
import { mapConversationPreview, mapUser } from "./mappers";

/**
 * The staff list endpoints are separate (`/users`, `/contracts`,
 * `/chat/conversations`); the UI works with one `ClientUser` that already
 * carries its contract and chat. This stitches the three answers together.
 *
 * `/chat/conversations` returns only the LAST message of each thread, so a
 * client whose full thread has not been opened gets that one message as a
 * preview. A thread that was opened keeps its full history, plus the newest
 * message if the server has one the thread does not contain yet.
 *
 * Note the two meanings of `unreadMessages`: on the backend's `UserDto` it
 * counts support replies the CLIENT has not read; for the staff view the UI
 * wants "client messages the staff has not read", which is
 * `unreadFromClient` of the conversation.
 */
export function composeStaffView(
	dto: UserDto,
	contracts: ReadonlyMap<number, Contract>,
	conversations: ReadonlyMap<number, ConversationDto>,
	threads: ReadonlyMap<number, ChatMessage[]>
): AppUser {
	if (dto.role !== "CLIENT") return mapUser(dto);

	const conversation = conversations.get(dto.id);
	let messages: ChatMessage[] = threads.get(dto.id) ?? [];

	if (conversation) {
		const preview = mapConversationPreview(conversation);
		const newest = messages.at(-1);
		if (
			!newest ||
			Date.parse(preview.timestamp) > Date.parse(newest.timestamp)
		) {
			messages = [...messages, preview];
		}
	}

	return mapUser(
		{ ...dto, unreadMessages: conversation?.unreadFromClient ?? 0 },
		{ contract: contracts.get(dto.id) ?? null, messages }
	);
}

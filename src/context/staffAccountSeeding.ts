import type { AppUser } from "../types/models";
import { createSafeId } from "../shared/lib/id";
import { hashPassword } from "../shared/lib/passwordHasher";
import { isSuccess } from "../shared/lib/result";
import type { UserRepository } from "../services/repositories/UserRepository";
import i18n from "../i18n";

const DEFAULT_ADMIN_EMAIL = "admin@super.net";
const DEFAULT_SUPPORT_EMAIL = "support@super.net";

/** Removes duplicate accounts that share the same email, keeping the first one seen. */
async function removeDuplicateEmails(
	repository: UserRepository,
	users: readonly AppUser[]
): Promise<Set<string>> {
	const seenEmails = new Set<string>();
	const duplicates: AppUser[] = [];

	for (const user of users) {
		const normalizedEmail = user.email.toLowerCase();
		if (seenEmails.has(normalizedEmail)) duplicates.push(user);
		else seenEmails.add(normalizedEmail);
	}

	for (const duplicate of duplicates) {
		await repository.remove(duplicate.id);
	}

	return seenEmails;
}

/**
 * One-time migration: earlier builds stored `password` in plaintext. Any
 * such record is rehashed and the plaintext field is dropped.
 */
async function migrateLegacyPlaintextPasswords(
	repository: UserRepository,
	users: readonly AppUser[]
): Promise<void> {
	for (const user of users) {
		const legacyPassword = (user as unknown as { password?: unknown }).password;
		if (typeof legacyPassword !== "string") continue;

		const { hash, salt } = await hashPassword(legacyPassword);
		const migrated = {
			...user,
			passwordHash: hash,
			passwordSalt: salt,
		} as AppUser & { password?: string };
		delete migrated.password;
		await repository.save(migrated);
	}
}

async function ensureDefaultAdminExists(
	repository: UserRepository,
	existingEmails: ReadonlySet<string>
): Promise<void> {
	if (existingEmails.has(DEFAULT_ADMIN_EMAIL)) return;

	const { hash, salt } = await hashPassword("admin123");
	await repository.save({
		id: createSafeId(),
		email: DEFAULT_ADMIN_EMAIL,
		passwordHash: hash,
		passwordSalt: salt,
		role: "admin",
	});
}

async function ensureDefaultSupportExists(
	repository: UserRepository,
	existingEmails: ReadonlySet<string>
): Promise<void> {
	if (existingEmails.has(DEFAULT_SUPPORT_EMAIL)) return;

	const { hash, salt } = await hashPassword("support123");
	await repository.save({
		id: createSafeId(),
		email: DEFAULT_SUPPORT_EMAIL,
		passwordHash: hash,
		passwordSalt: salt,
		role: "support",
		// Translated once, at seed time, using whichever language is active on
		// first launch - like any other persisted record, it does not
		// retroactively change if someone later switches languages.
		name: i18n.t("staff.defaultSupportName"),
	});
}

async function seedDefaultStaffAccounts(
	repository: UserRepository
): Promise<void> {
	const all = await repository.findAll();
	if (!isSuccess(all)) return;

	const emails = await removeDuplicateEmails(repository, all.value);
	await migrateLegacyPlaintextPasswords(repository, all.value);
	await ensureDefaultAdminExists(repository, emails);
	await ensureDefaultSupportExists(repository, emails);
}

let seedingPromise: Promise<void> | null = null;

/**
 * Runs `seedDefaultStaffAccounts` exactly once per page load, no matter how
 * many times it is called - safe to call from every mount of `AppProvider`
 * (e.g. under React StrictMode's double-invoke) without duplicating work.
 */
export function seedDefaultStaffAccountsOnce(
	repository: UserRepository
): Promise<void> {
	seedingPromise ??= seedDefaultStaffAccounts(repository);
	return seedingPromise;
}

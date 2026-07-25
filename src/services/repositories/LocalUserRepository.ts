import type { AppUser } from "../../types/models";
import type { Result } from "../../shared/lib/result";
import { appError, failure, success } from "../../shared/lib/result";
import { TypedStorage } from "../../shared/lib/typed-storage";
import type { UserRepository } from "./UserRepository";

export const USER_STORAGE_KEY = "superInternetUsers";

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Mock persistence backend. Implements the same `UserRepository` contract as
 * a future `ApiUserRepository`, so swapping `VITE_BACKEND_MODE` does not
 * require touching any consumer of this interface.
 */
export class LocalUserRepository implements UserRepository {
	private readonly storage = new TypedStorage<AppUser[]>(USER_STORAGE_KEY);

	public async findAll(): Promise<Result<AppUser[], never>> {
		return success(this.storage.read() ?? []);
	}

	public async findById(id: number): Promise<Result<AppUser | null, never>> {
		const users = this.storage.read() ?? [];
		return success(users.find((user) => user.id === id) ?? null);
	}

	public async findByEmail(
		email: string
	): Promise<Result<AppUser | null, never>> {
		const normalized = normalizeEmail(email);
		const users = this.storage.read() ?? [];
		return success(
			users.find((user) => normalizeEmail(user.email) === normalized) ?? null
		);
	}

	public async save(user: AppUser): Promise<Result<AppUser, never>> {
		const users = this.storage.read() ?? [];
		const index = users.findIndex((existing) => existing.id === user.id);
		const next =
			index === -1
				? [...users, user]
				: users.map((existing, i) => (i === index ? user : existing));
		this.storage.write(next);
		return success(user);
	}

	public async saveAll(users: AppUser[]): Promise<Result<AppUser[], never>> {
		this.storage.write(users);
		return success(users);
	}

	public async remove(id: number): Promise<Result<void, never>> {
		const users = this.storage.read() ?? [];
		this.storage.write(users.filter((user) => user.id !== id));
		return success(undefined);
	}

	public clear(): void {
		this.storage.clear();
	}
}

/**
 * Placeholder for the real backend integration. Every method intentionally
 * rejects with a descriptive AppError so that enabling `VITE_BACKEND_MODE=true`
 * without a running API fails loudly and predictably instead of silently
 * falling back to mock data.
 */
export class ApiUserRepository implements UserRepository {
	private readonly notImplemented = appError(
		"NOT_IMPLEMENTED",
		"ApiUserRepository requires a real backend. Implement HTTP calls here once the API is available."
	);

	public async findAll(): Promise<
		Result<AppUser[], typeof this.notImplemented>
	> {
		return failure(this.notImplemented);
	}

	public async findById(): Promise<
		Result<AppUser | null, typeof this.notImplemented>
	> {
		return failure(this.notImplemented);
	}

	public async findByEmail(): Promise<
		Result<AppUser | null, typeof this.notImplemented>
	> {
		return failure(this.notImplemented);
	}

	public async save(): Promise<Result<AppUser, typeof this.notImplemented>> {
		return failure(this.notImplemented);
	}

	public async saveAll(): Promise<
		Result<AppUser[], typeof this.notImplemented>
	> {
		return failure(this.notImplemented);
	}

	public async remove(): Promise<Result<void, typeof this.notImplemented>> {
		return failure(this.notImplemented);
	}
}

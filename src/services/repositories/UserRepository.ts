import type { AppUser } from "../../types/models";
import type { Result } from "../../shared/lib/result";
import type { AppError } from "../../shared/lib/result";

/**
 * Repository pattern: business logic (AuthStrategy, BillingService, etc.)
 * depends only on this interface, never on the concrete persistence
 * mechanism. `LocalUserRepository` backs the Mock mode (VITE_BACKEND_MODE=false);
 * `ApiUserRepository` is the seam for a real backend.
 */
export interface UserRepository {
	findAll(): Promise<Result<AppUser[], AppError>>;
	findById(id: number): Promise<Result<AppUser | null, AppError>>;
	findByEmail(email: string): Promise<Result<AppUser | null, AppError>>;
	save(user: AppUser): Promise<Result<AppUser, AppError>>;
	saveAll(users: AppUser[]): Promise<Result<AppUser[], AppError>>;
	remove(id: number): Promise<Result<void, AppError>>;
}

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AppUser } from "../types/models";
import { isSuccess } from "../shared/lib/result";
import { env } from "../shared/config/env";
import type { AuthStrategy } from "../services/auth/AuthStrategy";
import type { UserRepository } from "../services/repositories/UserRepository";
import { seedDefaultStaffAccountsOnce } from "./staffAccountSeeding";

/**
 * Runs once on mount: seeds default staff accounts, loads the user list, and
 * asks `authStrategy` who (if anyone) is already logged in - e.g. via an
 * existing HttpOnly session cookie. This is also the exact mechanism that
 * will pick up a Google/OAuth login transparently once the backend adds it:
 * an OAuth redirect flow that ends by setting the same session cookie and
 * sending the browser back to this app requires no changes here at all,
 * because `getSession()` already just asks "who does this cookie belong to".
 */
export function useSessionBootstrap(
	authStrategy: AuthStrategy,
	repository: UserRepository,
	setUsers: Dispatch<SetStateAction<AppUser[]>>,
	setCurrentUser: Dispatch<SetStateAction<AppUser | null>>
): boolean {
	const [isInitializing, setIsInitializing] = useState(true);

	useEffect(() => {
		let isMounted = true;

		void (async () => {
			// Seeding hardcoded admin/support credentials must never run
			// against a real backend - it exists purely to make the local
			// Mock persistence layer usable out of the box.
			if (!env.backendMode) await seedDefaultStaffAccountsOnce(repository);

			const usersResult = await repository.findAll();
			if (isMounted && isSuccess(usersResult)) setUsers(usersResult.value);

			const session = await authStrategy.getSession();
			if (isMounted && isSuccess(session)) setCurrentUser(session.value);
			if (isMounted) setIsInitializing(false);
		})();

		return () => {
			isMounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- setUsers/setCurrentUser are stable dispatch functions
	}, [authStrategy, repository]);

	return isInitializing;
}

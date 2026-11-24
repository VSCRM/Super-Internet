import { env } from "../../shared/config/env";
import { getUserRepository } from "../repositories/userRepositoryFactory";
import { getEmailService } from "../email/emailServiceFactory";
import { ApiPasswordRecoveryService } from "./ApiPasswordRecoveryService";
import { PasswordRecoveryService } from "./PasswordRecoveryService";
import type { PasswordRecovery } from "./PasswordRecoveryService";

let cachedService: PasswordRecovery | null = null;

export function getPasswordRecoveryService(): PasswordRecovery {
	if (!cachedService) {
		cachedService = env.backendMode
			? new ApiPasswordRecoveryService()
			: new PasswordRecoveryService(getUserRepository(), getEmailService());
	}
	return cachedService;
}

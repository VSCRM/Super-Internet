import { getUserRepository } from "../repositories/userRepositoryFactory";
import { getEmailService } from "../email/emailServiceFactory";
import { PasswordRecoveryService } from "./PasswordRecoveryService";

let cachedService: PasswordRecoveryService | null = null;

export function getPasswordRecoveryService(): PasswordRecoveryService {
	if (!cachedService) {
		cachedService = new PasswordRecoveryService(
			getUserRepository(),
			getEmailService()
		);
	}
	return cachedService;
}

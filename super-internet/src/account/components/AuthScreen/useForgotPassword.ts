import {useAuth} from "../../AuthContext";
import {useModal} from "../../modal/ModalContext";
import {validatePassword} from "../../validation";

export function useForgotPassword() {
	const {requestPasswordReset, verifyResetCode, resetPassword} = useAuth();
	const {prompt, alert} = useModal();

	return async function handleForgotPassword() {
		const email = await prompt(
			"Відновлення паролю",
			"Введіть ваш email:",
			"user@example.com",
		);
		if (!email) return;

		try {
			const code = requestPasswordReset(email);
			await alert(
				"Код надіслано",
				`Надіслано тимчасовий код на ваш email (імітація). Код: ${code}`,
				"info",
			);

			const userCode = await prompt(
				"Введення коду",
				"Введіть 6-значний код з вашої пошти:",
			);
			if (!userCode) return;
			verifyResetCode(email, userCode);

			let newPassword: string | null = null;
			let confirmPassword: string | null = null;

			do {
				newPassword = await prompt(
					"Новий пароль",
					"Введіть новий пароль (мін. 6 символів, 1 цифра):",
					"******",
				);
				if (!newPassword) return;

				confirmPassword = await prompt(
					"Підтвердження паролю",
					"Підтвердіть новий пароль:",
				);
				if (!confirmPassword) return;

				if (newPassword !== confirmPassword) {
					await alert(
						"Помилка",
						"Паролі не співпадають. Спробуйте ще раз.",
						"error",
					);
				}
			} while (newPassword !== confirmPassword);

			if (!validatePassword(newPassword)) {
				await alert(
					"Помилка",
					"Пароль має містити мінімум 6 символів та хоча б 1 цифру",
					"error",
				);
				return;
			}

			resetPassword(email, newPassword);
			await alert(
				"Успіх",
				"Пароль успішно змінено! Тепер ви можете увійти.",
				"success",
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Сталася помилка";
			alert("Помилка", message, "error");
		}
	};
}

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage, SUPPORTED_LANGUAGES } from "../../../i18n";
import type { SupportedLanguage } from "../../../i18n";
import styles from "./LanguageSwitcher.module.scss";

const LABELS: Record<SupportedLanguage, string> = { uk: "UA", en: "EN" };

/** Single responsibility: switch the active i18next language and persist the choice. */
export function LanguageSwitcher(): ReactElement {
	const { i18n, t } = useTranslation();

	return (
		<div
			className={styles["language-switcher"]}
			role="group"
			aria-label={t("languageSwitcher.ariaLabel")}
		>
			{SUPPORTED_LANGUAGES.map((lang) => (
				<button
					key={lang}
					className={`${styles["language-switcher__button"]} ${i18n.language === lang ? styles["language-switcher__button--active"] : ""}`}
					onClick={() => setLanguage(lang)}
					aria-pressed={i18n.language === lang}
				>
					{LABELS[lang]}
				</button>
			))}
		</div>
	);
}

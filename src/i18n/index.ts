import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uk from "./locales/uk.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGUAGES = ["uk", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "super-internet:lang";

function readStoredLanguage(): SupportedLanguage {
	const stored = localStorage.getItem(STORAGE_KEY);
	return SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)
		? (stored as SupportedLanguage)
		: "uk";
}

export function setLanguage(language: SupportedLanguage): void {
	localStorage.setItem(STORAGE_KEY, language);
	void i18n.changeLanguage(language);
}

void i18n.use(initReactI18next).init({
	resources: {
		uk: { translation: uk },
		en: { translation: en },
	},
	lng: readStoredLanguage(),
	fallbackLng: "uk",
	interpolation: { escapeValue: false }, // React already escapes output
});

export default i18n;

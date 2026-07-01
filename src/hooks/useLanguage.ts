import { useTranslation } from "react-i18next"

export type Language = "ja" | "en"

export function useLanguage() {
	const { i18n } = useTranslation()

	const setLanguage = (lang: Language) => {
		i18n.changeLanguage(lang)
		if (typeof window !== "undefined") {
			localStorage.setItem("language", lang)
		}
	}

	return {
		language: i18n.language as Language,
		setLanguage,
	}
}

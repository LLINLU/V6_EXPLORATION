import i18next from "./i18n"

export function getOutputLanguage(): "Japanese" | "English" {
	return i18next.language === "en" ? "English" : "Japanese"
}

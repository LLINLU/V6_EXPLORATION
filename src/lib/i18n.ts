import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en.json"
import ja from "@/locales/ja.json"

const savedLanguage =
	typeof window !== "undefined"
		? ((localStorage.getItem("language") as "ja" | "en") ?? "ja")
		: "ja"

i18next.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ja: { translation: ja },
	},
	lng: savedLanguage,
	fallbackLng: "ja",
	debug: false,
	interpolation: { escapeValue: false },
})

export default i18next

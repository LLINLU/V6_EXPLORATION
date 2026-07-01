/**
 * Translate Japanese search terms to English using Google Translate API
 */

/**
 * Translate text from Japanese to English using Google Translate
 */
export const translateSearchTerm = async (
	japaneseText: string,
): Promise<string> => {
	if (!japaneseText.trim()) return japaneseText

	// Check if the text contains Japanese characters
	const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(
		japaneseText,
	)
	if (!hasJapanese) {
		// console.log(
		// "No Japanese characters detected, using original text:",
		// japaneseText,
		// )
		return japaneseText
	}

	try {
		// console.log("Translating Japanese search term:", japaneseText)

		// Use Google Translate API to translate from Japanese to English
		const response = await fetch(
			`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(japaneseText)}`,
		)

		if (!response.ok) {
			throw new Error(`Translation API error: ${response.status}`)
		}

		const data = await response.json()

		// Extract the translated text from the response
		const translatedText = data[0][0][0]

		// console.log("Translation result:", japaneseText, "->", translatedText)
		return translatedText
	} catch (error) {
		console.error("Translation failed:", error)
		// console.log("Fallback: Using original Japanese text for search")
		return japaneseText
	}
}

/**
 * Debounced translation function to avoid excessive API calls
 */
export const debouncedTranslateSearchTerm = (() => {
	let timeout: NodeJS.Timeout

	return (
		japaneseText: string,
		callback: (translatedText: string) => void,
		delay: number = 500,
	) => {
		clearTimeout(timeout)
		timeout = setTimeout(async () => {
			const translatedText = await translateSearchTerm(japaneseText)
			callback(translatedText)
		}, delay)
	}
})()

/**
 * Check if text contains Japanese characters
 */
export const containsJapanese = (text: string): boolean => {
	return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

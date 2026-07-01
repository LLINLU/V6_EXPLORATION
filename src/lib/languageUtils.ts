export const containsJapanese = (text: string): boolean =>
	/[\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text)

export const isMostlyJapanese = (text: string): boolean => {
	const japaneseCount =
		text.match(/[\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g)
			?.length ?? 0
	const latinCount = text.match(/[A-Za-z]/g)?.length ?? 0

	return japaneseCount > 0 && japaneseCount >= latinCount * 0.25
}

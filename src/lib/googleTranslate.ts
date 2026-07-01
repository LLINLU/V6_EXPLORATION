export function triggerGoogleTranslate(lang: string) {
	let attempts = 0
	const interval = setInterval(() => {
		const select = document.querySelector(
			".goog-te-combo",
		) as HTMLSelectElement | null
		if (select) {
			select.value = lang
			select.dispatchEvent(new Event("change", { bubbles: true }))
			clearInterval(interval)
		} else if (++attempts > 30) {
			clearInterval(interval)
		}
	}, 300)
}

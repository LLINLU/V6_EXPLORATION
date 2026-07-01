import type { UserCSVData } from "@/types/admin"

export type { UserCSVData }

export const downloadUserCSV = (userData: UserCSVData) => {
	const csvHeaders = [
		"ユーザー名",
		"メールアドレス",
		"パスワード",
		"チーム名",
		"作成日時",
	]
	const csvData = [
		csvHeaders.join(","),
		[
			userData.username,
			userData.email,
			userData.password,
			userData.teamName,
			userData.createdAt,
		].join(","),
	].join("\n")

	const bom = "\uFEFF"
	const blob = new Blob([bom + csvData], { type: "text/csv;charset=utf-8;" })
	const link = document.createElement("a")
	const url = URL.createObjectURL(blob)

	link.setAttribute("href", url)
	link.setAttribute(
		"download",
		`user_${userData.username}_${new Date().toISOString().split("T")[0]}.csv`,
	)
	link.style.visibility = "hidden"

	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

export const downloadMultipleUsersCSV = (usersData: UserCSVData[]) => {
	const csvHeaders = [
		"ユーザー名",
		"メールアドレス",
		"パスワード",
		"チーム名",
		"作成日時",
	]
	const csvRows = usersData.map((user) =>
		[
			user.username,
			user.email,
			user.password,
			user.teamName,
			user.createdAt,
		].join(","),
	)

	const csvData = [csvHeaders.join(","), ...csvRows].join("\n")

	const bom = "\uFEFF"
	const blob = new Blob([bom + csvData], { type: "text/csv;charset=utf-8;" })
	const link = document.createElement("a")
	const url = URL.createObjectURL(blob)

	link.setAttribute("href", url)
	link.setAttribute(
		"download",
		`users_batch_${new Date().toISOString().split("T")[0]}.csv`,
	)
	link.style.visibility = "hidden"

	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

export const generateEmailFromUsername = (username: string): string => {
	if (!username.trim()) return ""
	return `${username.trim()}@memoryai.jp`
}

export const validateEmail = (
	email: string,
): { isValid: boolean; error?: string } => {
	if (!email.trim()) {
		return { isValid: false, error: "メールアドレスは必須です" }
	}

	// Check for Japanese characters (Hiragana, Katakana, Kanji)
	const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
	if (japaneseRegex.test(email)) {
		return {
			isValid: false,
			error: "メールアドレスに日本語文字は使用できません",
		}
	}

	// Basic email format validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) {
		return {
			isValid: false,
			error: "正しいメールアドレス形式で入力してください",
		}
	}

	return { isValid: true }
}

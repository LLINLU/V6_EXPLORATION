import type React from "react"

interface EmptyNodeListProps {
	level: number
}

export const EmptyNodeList: React.FC<EmptyNodeListProps> = ({ level }) => {
	const getMessage = () => {
		if (level === 1) {
			return "最初のレベルです。項目を追加してください。"
		} else if (level === 2) {
			return "レベル1からドメインを選択してください"
		} else {
			return `レベル${level - 1}からサブドメインを選択してください`
		}
	}

	return (
		<div className="text-center py-8 text-gray-500 text-sm">{getMessage()}</div>
	)
}

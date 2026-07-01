import { useEffect } from "react"

interface TreeLevelItems {
	level4Items: any
	level5Items: any
	level6Items: any
	level7Items: any
	level8Items: any
	level9Items: any
	level10Items: any
}

interface UseTreeScrollEffectsProps extends TreeLevelItems {
	databaseTreeData: any
	updateLastVisibleLevel: (items: any) => void
	triggerScrollUpdate: () => void
}

export const useTreeScrollEffects = ({
	level4Items,
	level5Items,
	level6Items,
	level7Items,
	level8Items,
	level9Items,
	level10Items,
	databaseTreeData,
	updateLastVisibleLevel,
	triggerScrollUpdate,
}: UseTreeScrollEffectsProps) => {
	// Update visible levels
	useEffect(() => {
		updateLastVisibleLevel({
			level4Items: Object.values(level4Items).flat(),
			level5Items: Object.values(level5Items).flat(),
			level6Items: Object.values(level6Items).flat(),
			level7Items: Object.values(level7Items).flat(),
			level8Items: Object.values(level8Items).flat(),
			level9Items: Object.values(level9Items).flat(),
			level10Items: Object.values(level10Items).flat(),
		})

		const timeoutId = setTimeout(() => {
			triggerScrollUpdate()
		}, 150)

		return () => clearTimeout(timeoutId)
	}, [
		level4Items,
		level5Items,
		level6Items,
		level7Items,
		level8Items,
		level9Items,
		level10Items,
		updateLastVisibleLevel,
		triggerScrollUpdate,
	])

	// Trigger scroll update on database data change
	useEffect(() => {
		if (databaseTreeData) {
			const timeoutId = setTimeout(() => {
				triggerScrollUpdate()
			}, 200)

			return () => clearTimeout(timeoutId)
		}
	}, [databaseTreeData, triggerScrollUpdate])
}

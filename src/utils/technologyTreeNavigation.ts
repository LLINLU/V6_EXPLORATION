import type { NodePath } from "@/types/ui"

export type { NodePath } from "@/types/ui"

export const createCompletePathEvent = (pathDetail: any) => {
	return new CustomEvent("set-complete-path", {
		detail: pathDetail,
	})
}

export const createSetPathDirectEvent = (pathDetail: any) => {
	return new CustomEvent("set-path-direct", {
		detail: pathDetail,
	})
}

export const createUserClickedNodeEvent = (detail: {
	level: string
	nodeId: string
}) => {
	return new CustomEvent("set-user-clicked-node", {
		detail,
	})
}

export const createExpandScenarioEvent = (scenarioId: string) => {
	return new CustomEvent("expand-scenario-card", {
		detail: { scenarioId },
	})
}

export const createExpandLevelEvent = (
	scenarioId: string,
	levelKey: string,
) => {
	return new CustomEvent("expand-level-card", {
		detail: {
			scenarioId,
			levelKey,
		},
	})
}

export const findCompleteNodePath = (
	targetNodeId: string,
	level1Items: any[],
	level2Items: any,
	level3Items: any,
	level4Items: any,
	level5Items: any,
	level6Items: any,
	level7Items: any,
	level8Items: any,
	level9Items: any,
	level10Items: any,
): NodePath | null => {
	// Check level 1
	const level1Node = level1Items.find((item) => item.id === targetNodeId)
	if (level1Node) {
		return { level: "level1", path: [targetNodeId] }
	}

	// Check level 2
	for (const [level1Id, level2List] of Object.entries(level2Items)) {
		const level2Node = (level2List as any[]).find(
			(item) => item.id === targetNodeId,
		)
		if (level2Node) {
			return { level: "level2", path: [level1Id, targetNodeId] }
		}
	}

	// Check level 3
	for (const [level1Id, level2List] of Object.entries(level2Items)) {
		for (const level2Item of level2List as any[]) {
			const level3List = level3Items[level2Item.id] || []
			const level3Node = level3List.find(
				(item: any) => item.id === targetNodeId,
			)
			if (level3Node) {
				return {
					level: "level3",
					path: [level1Id, level2Item.id, targetNodeId],
				}
			}
		}
	}

	// Check level 4
	for (const [level1Id, level2List] of Object.entries(level2Items)) {
		for (const level2Item of level2List as any[]) {
			const level3List = level3Items[level2Item.id] || []
			for (const level3Item of level3List) {
				const level4List = level4Items[level3Item.id] || []
				const level4Node = level4List.find(
					(item: any) => item.id === targetNodeId,
				)
				if (level4Node) {
					return {
						level: "level4",
						path: [level1Id, level2Item.id, level3Item.id, targetNodeId],
					}
				}
			}
		}
	}

	// Helper function to build path from parent
	const buildPathFromParent = (targetParentId: string): string[] | null => {
		// Check in level 4
		for (const [level1Id, level2List] of Object.entries(level2Items)) {
			for (const level2Item of level2List as any[]) {
				const level3List = level3Items[level2Item.id] || []
				for (const level3Item of level3List) {
					const level4List = level4Items[level3Item.id] || []
					const level4Node = level4List.find(
						(item: any) => item.id === targetParentId,
					)
					if (level4Node) {
						return [level1Id, level2Item.id, level3Item.id, targetParentId]
					}
				}
			}
		}

		// Check in level 3
		for (const [level1Id, level2List] of Object.entries(level2Items)) {
			for (const level2Item of level2List as any[]) {
				const level3List = level3Items[level2Item.id] || []
				const level3Node = level3List.find(
					(item: any) => item.id === targetParentId,
				)
				if (level3Node) {
					return [level1Id, level2Item.id, targetParentId]
				}
			}
		}

		// Check in level 2
		for (const [level1Id, level2List] of Object.entries(level2Items)) {
			const level2Node = (level2List as any[]).find(
				(item) => item.id === targetParentId,
			)
			if (level2Node) {
				return [level1Id, targetParentId]
			}
		}

		// Check in level 1
		const level1Node = level1Items.find((item) => item.id === targetParentId)
		if (level1Node) {
			return [targetParentId]
		}

		return null
	}

	// Check higher levels (5-10)
	const higherLevels = [
		{ items: level5Items, name: "level5" },
		{ items: level6Items, name: "level6" },
		{ items: level7Items, name: "level7" },
		{ items: level8Items, name: "level8" },
		{ items: level9Items, name: "level9" },
		{ items: level10Items, name: "level10" },
	]

	for (const levelInfo of higherLevels) {
		if (levelInfo.items) {
			for (const [parentId, itemList] of Object.entries(levelInfo.items)) {
				const foundNode = (itemList as any[]).find(
					(item: any) => item.id === targetNodeId,
				)
				if (foundNode) {
					const parentPath = buildPathFromParent(parentId)
					if (parentPath) {
						const completePath = [...parentPath, targetNodeId]
						return {
							level: levelInfo.name,
							path: completePath,
						}
					}
				}
			}
		}
	}

	return null
}

export const triggerCardExpansion = (
	level1Id: string,
	level2Id?: string,
	level3Id?: string,
) => {
	const expandScenarioEvent = createExpandScenarioEvent(level1Id)
	document.dispatchEvent(expandScenarioEvent)

	if (level2Id) {
		setTimeout(() => {
			const expandLevel2Event = createExpandLevelEvent(
				level1Id,
				`${level1Id}-${level2Id}`,
			)
			document.dispatchEvent(expandLevel2Event)
		}, 50)
	}

	if (level3Id && level2Id) {
		setTimeout(() => {
			const expandLevel3Event = createExpandLevelEvent(
				level1Id,
				`${level1Id}-${level2Id}-${level3Id}`,
			)
			document.dispatchEvent(expandLevel3Event)
		}, 100)
	}
}

export const createPathEventDetail = (
	path: string[],
	level: string,
	nodeId: string,
	fromQueue: boolean = true,
) => {
	const pathDetail: any = {
		level1: "",
		level2: "",
		level3: "",
		level4: "",
		level5: "",
		level6: "",
		level7: "",
		level8: "",
		level9: "",
		level10: "",
		nodeId,
		level,
		fromQueue,
	}

	// Fill in the path
	path.forEach((id, index) => {
		const levelKey = `level${index + 1}`
		if (Object.hasOwn(pathDetail, levelKey)) {
			pathDetail[levelKey] = id
		}
	})

	return pathDetail
}

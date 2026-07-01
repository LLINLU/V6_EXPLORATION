import i18next from "i18next"

export const getLevelNames = (mode: "TED" | "FAST" = "TED") => {
	if (mode === "FAST") {
		return {
			level1: "How1",
			level2: "How2",
			level3: "How3",
			level4: "How4",
			level5: "How5",
			level6: "How6",
			level7: "How7",
		}
	}

	const t = i18next.t.bind(i18next)
	return {
		level1: t("scenario.level_names.scenario"),
		level2: t("scenario.level_names.objective"),
		level3: t("scenario.level_names.function"),
		level4: t("scenario.level_names.means"),
	}
}

// Legacy function for backwards compatibility
export const getLevelNamesFromPath = (selectedPath: { level1: string }) => {
	if (selectedPath.level1.includes("optics")) {
		return {
			level1: "目的",
			level2: "機能",
			level3: "手段／技術",
		}
	} else if (selectedPath.level1.includes("medical")) {
		return {
			level1: "目的",
			level2: "機能",
			level3: "手段／技術",
		}
	}
	return {
		level1: "目的",
		level2: "機能",
		level3: "手段／技術",
	}
}

// Module-level store: persists report state across expand/collapse remounts
import type { ThemeReportData } from "@/types/theme-report"

export interface ReportStoreEntry {
	showReport: boolean
	analysisSteps: AnalysisStep[]
	isReportLoading: boolean
	isFinalizing: boolean
	finalizeProgress: number
	reportData?: ThemeReportData | null
	jobError?: string
}

export type StepStatus = "pending" | "running" | "done"
export type AnalysisStep = { label: string; status: StepStatus }

export const SECTION_STEPS: AnalysisStep[] = [
	{ label: "01 背景", status: "pending" },
	{ label: "02 定義", status: "pending" },
	{ label: "03 市場規模", status: "pending" },
	{ label: "04 規制・制度", status: "pending" },
	{ label: "05 現状アプローチ", status: "pending" },
	{ label: "06 技術の優位性", status: "pending" },
	{ label: "07 技術成熟度", status: "pending" },
	{ label: "08 プレイヤー分析", status: "pending" },
]

const _store: Record<string, ReportStoreEntry> = {}

export const ensureStoreEntry = (key: string): ReportStoreEntry => {
	if (!_store[key]) {
		_store[key] = {
			showReport: false,
			analysisSteps: [],
			isReportLoading: false,
			isFinalizing: false,
			finalizeProgress: 0,
			reportData: null,
		}
	}
	return _store[key]
}

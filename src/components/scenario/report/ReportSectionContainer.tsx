import type { ReportSectionId, ScenarioReportData } from "@/types/report"
import { REPORT_SECTIONS } from "@/types/report"
import type { OverallStatus, SectionState } from "@/types/services"
import { ReportKpiCardGrid } from "./ReportKpiCardGrid"
import { ReportProgressBanner } from "./ReportProgressBanner"
import { ReportSectionError } from "./ReportSectionError"
import { ReportSectionSkeleton } from "./ReportSectionSkeleton"
import { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection"
import { MarketAnalysisSection } from "./sections/MarketAnalysisSection"
import { MarketImplementationsSection } from "./sections/MarketImplementationsSection"
import { ResearchLandscapeSection } from "./sections/ResearchLandscapeSection"
import { SocialIssuesSection } from "./sections/SocialIssuesSection"
import { TechnicalCompetitorsSection } from "./sections/TechnicalCompetitorsSection"
import { TrlAnalysisSection } from "./sections/TrlAnalysisSection"

// Map from ReportSectionId → DB section_type
const SECTION_ID_TO_DB_TYPE: Record<ReportSectionId, string> = {
	"executive-summary": "executive_summary",
	"trl-analysis": "trl",
	"market-analysis": "market",
	"research-landscape": "research_landscape",
	"market-implementations": "market_implementations",
	"social-issues": "social_issue",
	"technical-competitors": "technical_competitors",
}

interface ReportSectionContainerProps {
	data: ScenarioReportData
	isLoading?: boolean
	visibleSections?: Set<ReportSectionId>
	sectionOrder?: ReportSectionId[]
	sectionStates?: Record<string, SectionState>
	overallStatus?: OverallStatus
	onRetrySection?: (sectionType: string) => void
}

const DEFAULT_ORDER: ReportSectionId[] = [
	"executive-summary",
	"trl-analysis",
	"market-analysis",
	"research-landscape",
	"market-implementations",
	"social-issues",
	"technical-competitors",
]

export function ReportSectionContainer({
	data,
	isLoading,
	visibleSections,
	sectionOrder = DEFAULT_ORDER,
	sectionStates,
	overallStatus,
	onRetrySection,
}: ReportSectionContainerProps) {
	if (isLoading) {
		return (
			<div className="space-y-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<ReportSectionSkeleton key={`skeleton-${i}`} />
				))}
			</div>
		)
	}

	console.log("Rendering ReportSectionContainer with data:", data.market)
	const getSectionState = (
		sectionId: ReportSectionId,
	): SectionState | undefined => {
		if (!sectionStates) return undefined
		const dbType = SECTION_ID_TO_DB_TYPE[sectionId]
		return sectionStates[dbType]
	}

	const getSectionTitle = (sectionId: ReportSectionId): string => {
		const meta = REPORT_SECTIONS.find((s) => s.id === sectionId)
		return meta?.title ?? sectionId
	}

	const renderSection = (id: ReportSectionId) => {
		if (visibleSections && !visibleSections.has(id)) return null

		const state = getSectionState(id)

		// Show skeleton for running sections
		if (state?.status === "running" || state?.status === "pending") {
			return <ReportSectionSkeleton key={id} />
		}

		// Show error for failed sections
		if (state?.status === "error") {
			const dbType = SECTION_ID_TO_DB_TYPE[id]
			return (
				<ReportSectionError
					key={id}
					sectionTitle={getSectionTitle(id)}
					errorMessage={state.errorMessage}
					onRetry={onRetrySection ? () => onRetrySection(dbType) : undefined}
				/>
			)
		}

		// Render completed section
		switch (id) {
			case "executive-summary":
				return (
					<ExecutiveSummarySection
						key={id}
						narrative={data.executiveSummary.narrative}
						findings={data.executiveSummary.findings}
						marketRows={data.executiveSummary.marketRows}
						researchRows={data.executiveSummary.researchRows}
					/>
				)
			case "trl-analysis":
				return (
					<TrlAnalysisSection
						key={id}
						reportSections={data.trl.reportSections}
						scores={data.trl.scores}
					/>
				)
			case "market-analysis":
				return (
					<MarketAnalysisSection
						key={id}
						japanMarket={data.market.japanMarket}
						globalTam={data.market.globalTam}
						globalSam={data.market.globalSam}
						globalCagr={data.market.globalCagr}
						tamNumber={data.market.tamNumber}
						samNumber={data.market.samNumber}
						segments={data.market.segments}
						derivation={data.market.derivation}
						rawSummary={data.market.rawSummary}
					/>
				)
			case "research-landscape":
				return (
					<ResearchLandscapeSection
						key={id}
						articleCommentary={data.research.articleCommentary}
						articleYearlyData={data.research.articleYearlyData}
						patentCommentary={data.research.patentCommentary}
						patentYearlyData={data.research.patentYearlyData}
						topJournals={data.research.topJournals}
					/>
				)
			case "market-implementations":
				return (
					<MarketImplementationsSection
						key={id}
						items={data.marketImplementations}
					/>
				)
			case "social-issues":
				return (
					<SocialIssuesSection
						key={id}
						overallSummary={data.socialIssues.overallSummary}
						solutions={data.socialIssues.solutions}
					/>
				)
			case "technical-competitors":
				return (
					<TechnicalCompetitorsSection
						key={id}
						technologies={data.technicalCompetitors}
					/>
				)
			default:
				return null
		}
	}

	return (
		<div className="space-y-2">
			{overallStatus && (
				<ReportProgressBanner
					overallStatus={overallStatus}
					sectionStates={sectionStates}
				/>
			)}
			<ReportKpiCardGrid items={data.kpiItems} />
			{sectionOrder.map((id) => renderSection(id))}
		</div>
	)
}

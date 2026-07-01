import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useToast } from "@/hooks/use-toast"
import {
	checkIfPaperIsSaved,
	checkIfUseCaseIsSaved,
	type MemoNotes,
	savePaper,
	saveUseCase,
	unsavePaper,
	unsaveUseCase,
	updatePaperNotes,
	updateUseCaseNotes,
} from "@/services/savedItemsService"

// Mock data for demonstration purposes
const MOCK_SAVED_PAPERS = [
	{
		id: "mock-saved-1",
		paper_id: "mock-paper-1",
		saved_at: "2025-10-15T10:00:00Z",
		notes: null,
		tree_id: "mock-tree-1",
		node_id: "mock-node-1",
		paper: {
			id: "mock-paper-1",
			title: "量子コンピューティングにおける誤り訂正の進展",
			authors: "田中太郎, 山田花子",
			journal: "Nature Physics",
			abstract:
				"本研究では、量子ビットの誤り訂正における新しいアプローチを提案します。従来の手法と比較して、エラー率を50%削減することに成功しました。これにより、実用的な量子コンピュータの実現に向けて大きな前進となります。",
			date: "2025-03-15",
			citations: 45,
			doi: "10.1038/example.2025.001",
			url: "https://example.com/paper1",
			tags: ["量子コンピューティング", "誤り訂正"],
			region: "日本",
		},
	},
	{
		id: "mock-saved-2",
		paper_id: "mock-paper-2",
		saved_at: "2025-10-14T15:30:00Z",
		notes: "重要な参考文献",
		tree_id: "mock-tree-1",
		node_id: "mock-node-2",
		paper: {
			id: "mock-paper-2",
			title: "機械学習による医療診断の自動化",
			authors: "佐藤健, 鈴木美咲, 高橋誠",
			journal: "Science Advances",
			abstract:
				"深層学習を用いた医療画像の自動診断システムについて報告します。X線、CT、MRIなどの画像から病変を高精度で検出し、専門医と同等の診断精度を達成しました。臨床現場での実用化に向けた重要な成果です。",
			date: "2025-02-20",
			citations: 128,
			doi: "10.1126/example.2025.002",
			url: "https://example.com/paper2",
			tags: ["AI", "医療", "深層学習"],
			region: "アメリカ",
		},
	},
	{
		id: "mock-saved-3",
		paper_id: "mock-paper-3",
		saved_at: "2025-10-13T09:15:00Z",
		notes: null,
		tree_id: "mock-tree-2",
		node_id: "mock-node-3",
		paper: {
			id: "mock-paper-3",
			title: "再生可能エネルギーの効率的な貯蔵技術",
			authors: "李明, 王芳",
			journal: "Energy & Environmental Science",
			abstract:
				"新しいバッテリー技術により、太陽光発電の貯蔵効率が大幅に向上しました。従来のリチウムイオン電池と比較して、エネルギー密度が2倍、充電速度が3倍に改善されています。再生可能エネルギーの普及促進に貢献します。",
			date: "2025-01-10",
			citations: 67,
			doi: "10.1039/example.2025.003",
			url: "https://example.com/paper3",
			tags: ["再生可能エネルギー", "バッテリー"],
			region: "中国",
		},
	},
]

const MOCK_SAVED_USECASES = [
	{
		id: "mock-usecase-saved-1",
		use_case_id: "mock-usecase-1",
		saved_at: "2025-10-15T11:00:00Z",
		notes: "参考にしたい事例",
		tree_id: "mock-tree-1",
		node_id: "mock-node-1",
		use_case: {
			id: "mock-usecase-1",
			product: "AI搭載医療診断システム",
			description:
				"深層学習を活用した画像診断支援システム。X線、CT、MRIなどの医療画像を解析し、病変の検出と診断を支援します。導入した医療機関では診断時間が30%短縮され、見落とし率も大幅に減少しています。",
			company: ["メディカルAI株式会社", "東京大学医学部"],
			press_releases: [
				"2025年3月: 厚生労働省の医療機器承認を取得",
				"2025年2月: 国内10病院での臨床試験を完了",
			],
		},
	},
	{
		id: "mock-usecase-saved-2",
		use_case_id: "mock-usecase-2",
		saved_at: "2025-10-14T14:20:00Z",
		notes: null,
		tree_id: "mock-tree-1",
		node_id: "mock-node-2",
		use_case: {
			id: "mock-usecase-2",
			product: "自動運転配送ロボット",
			description:
				"都市部での最終配送を自動化するロボット。AIによる経路最適化と障害物回避機能を搭載し、24時間稼働が可能です。配送コストを従来の40%削減し、環境負荷も大幅に低減しています。",
			company: ["ロボデリバリー社", "日本郵便"],
			press_releases: [
				"2025年4月: 東京都内5区での実証実験を開始",
				"2025年3月: シリーズBで50億円の資金調達",
			],
		},
	},
	{
		id: "mock-usecase-saved-3",
		use_case_id: "mock-usecase-3",
		saved_at: "2025-10-13T16:45:00Z",
		notes: "次回ミーティングで議論",
		tree_id: "mock-tree-2",
		node_id: "mock-node-3",
		use_case: {
			id: "mock-usecase-3",
			product: "スマート農業管理プラットフォーム",
			description:
				"IoTセンサーとAIを活用した農業管理システム。土壌状態、気象データ、作物の成長状況をリアルタイムで監視し、最適な栽培計画を提案します。導入農家では収穫量が平均20%増加し、水や肥料の使用量も削減されています。",
			company: ["アグリテック・ジャパン", "JA全農"],
			press_releases: [
				"2025年5月: 全国1000農家での導入を達成",
				"2025年4月: 収穫量20%増加の実績を報告",
			],
		},
	},
]

export function useSavedItems() {
	const { t } = useTranslation()
	const { toast } = useToast()
	const queryClient = useQueryClient()

	// Mutation to save a paper
	const savePaperMutation = useMutation({
		mutationFn: ({
			paperId,
			treeId,
			nodeId,
			teamId,
		}: {
			paperId: string
			treeId: string
			nodeId: string
			teamId?: string | null
		}) => savePaper(paperId, treeId, nodeId, teamId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["saved-papers"] })
			queryClient.invalidateQueries({
				queryKey: ["is-paper-saved", variables.paperId],
			})
			toast({ title: t("tech.paper_saved") })
		},
		onError: (error: any) => {
			toast({
				title: t("common.error"),
				description: error.message || t("tech.save_failed"),
			})
		},
	})

	// Mutation to unsave a paper
	const unsavePaperMutation = useMutation({
		mutationFn: (paperId: string) => unsavePaper(paperId),
		onSuccess: (_, paperId) => {
			queryClient.invalidateQueries({ queryKey: ["saved-papers"] })
			queryClient.invalidateQueries({ queryKey: ["is-paper-saved", paperId] })
			toast({ title: t("tech.paper_removed") })
		},
		onError: (error: any) => {
			toast({
				title: t("common.error"),
				description: error.message || t("tech.remove_failed"),
			})
		},
	})

	// Mutation to save a use case
	const saveUseCaseMutation = useMutation({
		mutationFn: ({
			useCaseId,
			treeId,
			nodeId,
			teamId,
		}: {
			useCaseId: string
			treeId: string
			nodeId: string
			teamId?: string | null
		}) => saveUseCase(useCaseId, treeId, nodeId, teamId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["saved-use-cases"] })
			toast({ title: t("tech.case_saved") })
		},
		onError: (error: any) => {
			toast({
				title: t("common.error"),
				description: error.message || t("tech.save_failed"),
			})
		},
	})

	// Mutation to unsave a use case
	const unsaveUseCaseMutation = useMutation({
		mutationFn: (useCaseId: string) => unsaveUseCase(useCaseId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["saved-use-cases"] })
			toast({ title: t("tech.case_removed") })
		},
		onError: (error: any) => {
			toast({
				title: t("common.error"),
				description: error.message || t("tech.remove_failed"),
			})
		},
	})

	// Check if paper is saved
	const useIsPaperSaved = (paperId: string) => {
		return useQuery({
			queryKey: ["is-paper-saved", paperId],
			queryFn: () => checkIfPaperIsSaved(paperId),
			enabled: !!paperId,
		})
	}

	// Check if use case is saved
	const useIsUseCaseSaved = (useCaseId: string) => {
		return useQuery({
			queryKey: ["is-usecase-saved", useCaseId],
			queryFn: () => checkIfUseCaseIsSaved(useCaseId),
			enabled: !!useCaseId,
		})
	}

	// Mutation to update paper notes
	const updatePaperNotesMutation = useMutation({
		mutationFn: ({
			savedPaperId,
			notes,
		}: {
			savedPaperId: string
			notes: MemoNotes
		}) => updatePaperNotes(savedPaperId, notes),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["saved-papers"] })
			toast({ title: t("tech.memo_saved") })
		},
		onError: (error: any) => {
			toast({
				title: t("common.error"),
				description: error.message || t("tech.memo_save_failed"),
			})
		},
	})

	// Mutation to update use case notes
	const updateUseCaseNotesMutation = useMutation({
		mutationFn: ({
			savedUseCaseId,
			notes,
		}: {
			savedUseCaseId: string
			notes: MemoNotes
		}) => updateUseCaseNotes(savedUseCaseId, notes),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["saved-use-cases"] })
			toast({ title: t("tech.memo_saved") })
		},
		onError: (error: any) => {
			toast({
				title: t("common.error"),
				description: error.message || t("tech.memo_save_failed"),
			})
		},
	})

	return {
		// Papers - using mock data for demonstration
		savedPapers: MOCK_SAVED_PAPERS,
		savedPapersLoading: false,
		savePaper: savePaperMutation.mutate,
		unsavePaper: unsavePaperMutation.mutate,
		updatePaperNotes: updatePaperNotesMutation.mutate,
		isSavingPaper: savePaperMutation.isPending,
		isUnsavingPaper: unsavePaperMutation.isPending,
		isUpdatingPaperNotes: updatePaperNotesMutation.isPending,
		useIsPaperSaved,

		// Use cases - using mock data for demonstration
		savedUseCases: MOCK_SAVED_USECASES,
		savedUseCasesLoading: false,
		saveUseCase: saveUseCaseMutation.mutate,
		unsaveUseCase: unsaveUseCaseMutation.mutate,
		updateUseCaseNotes: updateUseCaseNotesMutation.mutate,
		isSavingUseCase: saveUseCaseMutation.isPending,
		isUnsavingUseCase: unsaveUseCaseMutation.isPending,
		isUpdatingUseCaseNotes: updateUseCaseNotesMutation.isPending,
		useIsUseCaseSaved,
	}
}

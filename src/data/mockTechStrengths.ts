/**
 * Mock tech_strengths data
 * Used as fallback when generate-tree-v3 Edge Function is not deployed
 * with the pipeline/generate integration.
 *
 * Shape matches the Python FastAPI v5 pipeline/generate SSE response.
 */

import type { TechStrength } from "@/types/axis"

/**
 * Generate mock tech strengths based on a query string.
 * Uses a simple hash to produce deterministic results per query.
 */
export function generateMockTechStrengths(_query: string): TechStrength[] {
	const MOCK_STRENGTHS_MAP: Record<string, TechStrength[]> = {
		default: [
			{
				strength_name: "高精度センシング",
				description:
					"微小な物理量の変化を高感度に検出し、リアルタイムでデータを取得する技術基盤",
				potential_applications: "環境モニタリング、医療診断、産業検査",
			},
			{
				strength_name: "データ統合・解析基盤",
				description:
					"異種データソースを統合し、機械学習による高度な分析・予測を実現するプラットフォーム",
				potential_applications: "予知保全、需要予測、リスク評価",
			},
			{
				strength_name: "リアルタイム制御",
				description:
					"低遅延のフィードバックループにより、動的な環境に適応する自律制御を可能にする技術",
				potential_applications: "ロボティクス、自動運転、プロセス制御",
			},
			{
				strength_name: "スケーラブルアーキテクチャ",
				description:
					"小規模から大規模システムまで柔軟に拡張可能な設計パターンと実装手法",
				potential_applications: "クラウドインフラ、分散処理、マイクロサービス",
			},
			{
				strength_name: "エネルギー効率最適化",
				description:
					"消費電力を最小化しながら性能を維持する省エネルギー技術とアルゴリズム",
				potential_applications: "エッジコンピューティング、IoTデバイス、EV",
			},
		],
	}

	// Return default mock data (deterministic for any query)
	return MOCK_STRENGTHS_MAP.default
}

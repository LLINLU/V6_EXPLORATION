/**
 * Mock Scenario Data
 * Contains sample scenarios with expanded market and research metrics
 */

import type { Scenario } from "@/types/scenario"

export const MOCK_SCENARIOS: Scenario[] = [
	{
		id: "scenario-1",
		name: "スマートシティ開発におけるデジタルツイン活用",
		description:
			"都市開発プロジェクトにおけるデジタルツイン技術を活用した計画最適化と住民サービス向上。",
		level: 1,
		customerSegment: {
			name: "不動産デベロッパー・都市計画部局",
		},
		metrics: {
			// Legacy fields
			tam: 11.3,
			tamCategory: "large",
			trl: 9,
			trlCategory: "mature",
			cagr: 10,
			cagrCategory: "medium",
			marketGrowthRate: 10,
			competitiveness: 7,
			implementationDifficulty: "medium",
			timeToMarket: "medium",
			paperCount: 142,
			patentCount: 12,
			implementationCount: 8,

			// New market sizing
			marketSizing: {
				domestic: {
					tam: { value: 11.3, reasoning: "国内製薬市場の調査データに基づく" },
					sam: { value: 5.2, reasoning: "ターゲット領域の市場規模" },
					som: { value: 1.8, reasoning: "初期参入可能市場" },
				},
				global: {
					tam: { value: 76.8, reasoning: "グローバル医薬品開発支援市場" },
					sam: { value: 32.1, reasoning: "AI活用領域" },
					som: { value: 12.4, reasoning: "競争優位性のある領域" },
				},
				cagr: { value: 10, reasoning: "過去5年間の平均成長率から算出" },
				structure: {
					value: "oligopoly",
					reasoning: "大手3社が市場の70%を占める寡占市場",
				},
			},

			// Research signals
			papers: {
				count: 142,
				cagr: 23,
				reasoning: "学術論文データベースからの検索結果",
			},
			patents: {
				count: 12,
				cagr: -5,
				reasoning: "特許データベースからの検索結果",
			},
			useCases: {
				count: 8,
				cagr: 2,
				reasoning: "市場調査レポートからの事例数",
			},

			// TRL breakdown
			trlBreakdown: {
				total: 9,
				paperContribution: 5,
				patentContribution: 4,
				reasoning: "論文数と特許数の比率から算出",
			},
		},
		tags: ["スマートシティ", "デジタルツイン", "都市開発"],
	},
	{
		id: "scenario-2",
		name: "グローバルサプライチェーン最適化AI",
		description:
			"国際物流ネットワークの可視化とAIによるリアルタイム最適化で効率性と耐障害性を向上。",
		level: 1,
		customerSegment: {
			name: "政府・国際機関・物流企業",
		},
		metrics: {
			// Legacy fields
			tam: 76.8,
			tamCategory: "very-large",
			trl: 2,
			trlCategory: "early",
			cagr: 9,
			cagrCategory: "medium",
			marketGrowthRate: 9,
			competitiveness: 4,
			implementationDifficulty: "high",
			timeToMarket: "long",
			paperCount: 89,
			patentCount: 45,
			implementationCount: 3,

			// New market sizing
			marketSizing: {
				domestic: {
					tam: { value: 8.7, reasoning: "国内遺伝子解析市場" },
					sam: { value: 4.1, reasoning: "高速化ソリューション市場" },
					som: { value: 1.2, reasoning: "初期ターゲット" },
				},
				global: {
					tam: { value: 54.2, reasoning: "グローバル遺伝子解析市場" },
					sam: { value: 21.3, reasoning: "高速化需要のある領域" },
					som: { value: 8.7, reasoning: "参入可能市場" },
				},
				cagr: { value: 9, reasoning: "市場レポートに基づく成長予測" },
				structure: {
					value: "fragmented",
					reasoning: "多数の中小企業が参入している分散市場",
				},
			},

			// Research signals
			papers: {
				count: 89,
				cagr: 31,
				reasoning: "急成長中の研究領域",
			},
			patents: {
				count: 45,
				cagr: 12,
				reasoning: "特許出願が増加傾向",
			},
			useCases: {
				count: 3,
				cagr: 8,
				reasoning: "実用化事例は限定的",
			},

			// TRL breakdown
			trlBreakdown: {
				total: 2,
				paperContribution: 1.5,
				patentContribution: 0.5,
				reasoning: "研究段階が主、実用化は限定的",
			},
		},
		tags: ["サプライチェーン", "AI", "物流"],
	},
	{
		id: "scenario-3",
		name: "次世代インフラ監視・予知保全システム",
		description:
			"IoTセンサーとAI解析による上下水道・ガス管網の異常検知と予防保全の実現。",
		level: 1,
		customerSegment: {
			name: "自治体・上下水道事業者・ガス会社",
		},
		metrics: {
			// Legacy fields
			tam: 45.2,
			tamCategory: "large",
			trl: 6,
			trlCategory: "mid",
			cagr: 15,
			cagrCategory: "high",
			marketGrowthRate: 15,
			competitiveness: 6,
			implementationDifficulty: "medium",
			timeToMarket: "medium",
			paperCount: 234,
			patentCount: 78,
			implementationCount: 15,

			// New market sizing
			marketSizing: {
				domestic: {
					tam: { value: 12.5, reasoning: "国内精密医療市場" },
					sam: { value: 6.8, reasoning: "データ解析ソリューション" },
					som: { value: 2.3, reasoning: "初期参入市場" },
				},
				global: {
					tam: { value: 89.3, reasoning: "グローバル精密医療データ解析市場" },
					sam: { value: 45.2, reasoning: "AI/ML活用領域" },
					som: { value: 18.7, reasoning: "競争可能領域" },
				},
				cagr: { value: 15, reasoning: "急成長市場、過去3年の平均" },
				structure: {
					value: "oligopoly",
					reasoning: "大手IT企業と医療機器メーカーが主導",
				},
			},

			// Research signals
			papers: {
				count: 234,
				cagr: 18,
				reasoning: "活発な研究活動",
			},
			patents: {
				count: 78,
				cagr: 25,
				reasoning: "特許出願が急増",
			},
			useCases: {
				count: 15,
				cagr: 12,
				reasoning: "実用化事例が増加中",
			},

			// TRL breakdown
			trlBreakdown: {
				total: 6,
				paperContribution: 3,
				patentContribution: 3,
				reasoning: "研究と開発がバランスよく進行",
			},
		},
		tags: ["インフラ", "IoT", "予知保全"],
	},
	{
		id: "scenario-4",
		name: "大規模イベント群衆管理プラットフォーム",
		description:
			"AIカメラ解析とモバイルデータ連携による人流予測・安全管理・緊急対応の統合システム。",
		level: 1,
		customerSegment: {
			name: "イベント運営会社・自治体・NGO",
		},
		metrics: {
			// Legacy fields
			tam: 23.4,
			tamCategory: "large",
			trl: 4,
			trlCategory: "mid",
			cagr: 22,
			cagrCategory: "high",
			marketGrowthRate: 22,
			competitiveness: 5,
			implementationDifficulty: "high",
			timeToMarket: "long",
			paperCount: 178,
			patentCount: 56,
			implementationCount: 6,

			// New market sizing
			marketSizing: {
				domestic: {
					tam: { value: 5.6, reasoning: "国内再生医療市場" },
					sam: { value: 2.8, reasoning: "自動化ソリューション市場" },
					som: { value: 0.9, reasoning: "初期ターゲット" },
				},
				global: {
					tam: { value: 38.7, reasoning: "グローバル再生医療自動化市場" },
					sam: { value: 18.2, reasoning: "細胞培養自動化" },
					som: { value: 7.3, reasoning: "参入可能市場" },
				},
				cagr: { value: 22, reasoning: "高成長市場" },
				structure: {
					value: "fragmented",
					reasoning: "新興企業が多数参入する成長市場",
				},
			},

			// Research signals
			papers: {
				count: 178,
				cagr: 28,
				reasoning: "研究が急速に進展",
			},
			patents: {
				count: 56,
				cagr: 15,
				reasoning: "特許出願も増加傾向",
			},
			useCases: {
				count: 6,
				cagr: 20,
				reasoning: "実用化が始まりつつある",
			},

			// TRL breakdown
			trlBreakdown: {
				total: 4,
				paperContribution: 2.5,
				patentContribution: 1.5,
				reasoning: "研究優位だが開発も進行中",
			},
		},
		tags: ["群衆管理", "AI", "安全管理"],
	},
	{
		id: "scenario-5",
		name: "地域エネルギーマネジメントシステム",
		description:
			"再生可能エネルギーと地域熱供給の統合管理によるカーボンニュートラル地域の実現。",
		level: 1,
		customerSegment: {
			name: "地域熱供給事業者・自治体・エネルギー公社",
		},
		metrics: {
			// Legacy fields
			tam: 34.8,
			tamCategory: "large",
			trl: 7,
			trlCategory: "mature",
			cagr: 18,
			cagrCategory: "high",
			marketGrowthRate: 18,
			competitiveness: 8,
			implementationDifficulty: "low",
			timeToMarket: "short",
			paperCount: 312,
			patentCount: 134,
			implementationCount: 28,

			// New market sizing
			marketSizing: {
				domestic: {
					tam: { value: 8.9, reasoning: "国内医療画像AI市場" },
					sam: { value: 5.2, reasoning: "高精度診断ソリューション" },
					som: { value: 2.1, reasoning: "初期ターゲット" },
				},
				global: {
					tam: { value: 67.4, reasoning: "グローバル医療画像AI市場" },
					sam: { value: 34.8, reasoning: "高精度化ソリューション" },
					som: { value: 14.2, reasoning: "競争可能領域" },
				},
				cagr: { value: 18, reasoning: "急成長市場" },
				structure: {
					value: "oligopoly",
					reasoning: "大手医療機器メーカーとAI企業が寡占",
				},
			},

			// Research signals
			papers: {
				count: 312,
				cagr: 15,
				reasoning: "成熟した研究領域",
			},
			patents: {
				count: 134,
				cagr: 20,
				reasoning: "特許競争が激化",
			},
			useCases: {
				count: 28,
				cagr: 25,
				reasoning: "実用化が進んでいる",
			},

			// TRL breakdown
			trlBreakdown: {
				total: 7,
				paperContribution: 3,
				patentContribution: 4,
				reasoning: "開発・実用化段階",
			},
		},
		tags: ["エネルギー", "カーボンニュートラル", "地域熱供給"],
	},
]

export default MOCK_SCENARIOS

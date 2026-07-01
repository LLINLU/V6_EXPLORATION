import type { ScenarioReportData } from "@/types/report"

export function generateDummyReportData(
	scenarioName: string,
): ScenarioReportData {
	return {
		title: scenarioName,
		subtitle: "シナリオレポート",
		kpiItems: [
			{ label: "統合TRL", value: "6.2" },
			{ label: "論文数", value: "1,247" },
			{ label: "特許数", value: "834" },
			{ label: "CAGR (論文)", value: "+12.3%" },
			{ label: "CAGR (特許)", value: "+8.7%" },
			{ label: "TAM (Global)", value: "$48.2B" },
			{ label: "SAM (Global)", value: "$12.6B" },
			{ label: "市場実装", value: "23件" },
		],

		executiveSummary: {
			narrative: `${scenarioName}は、先端的なアルゴリズムと実装基盤を組み合わせ、従来手法では達成困難だった精度と効率を両立する技術分野です。統合TRLは6.2で、一部の要素技術は実運用段階に達していますが、知識グラフ構築やシステム統合において追加の開発が必要です。グローバルTAMは482億ドル、SAMは126億ドルと推定され、年平均成長率11.2%の成長が見込まれます。`,
			findings: [
				"技術成熟度：データ処理基盤はTRL 8で実用レベルに到達。AI/ML分析エンジン(TRL 6)と知識グラフ構築(TRL 5)がボトルネック",
				"市場機会：グローバルSAM 126億ドル、国内SAM 1,260億円。早期採用層の獲得が鍵",
				"競合優位性：日本市場最適化と既存システム親和性が差別化要因。グローバルリーダーとの直接競合を回避",
				"社会インパクト：R&D生産性向上により、気候変動対策や持続可能な製造の実現を加速",
			],
			marketRows: [
				{ index: 1, label: "TAM (Global)", value: "$48.2B" },
				{ index: 2, label: "SAM (Global)", value: "$12.6B" },
				{ index: 3, label: "CAGR", value: "11.2%" },
				{ index: 4, label: "TAM (国内)", value: "4,200億円" },
				{ index: 5, label: "SAM (国内)", value: "1,260億円" },
			],
			researchRows: [
				{ index: 1, label: "論文数", value: "1,247" },
				{ index: 2, label: "特許数", value: "834" },
				{ index: 3, label: "論文CAGR", value: "+12.3%" },
				{ index: 4, label: "特許CAGR", value: "+8.7%" },
				{ index: 5, label: "統合TRL", value: "6.2" },
			],
		},

		trl: {
			reportSections: [
				{
					heading: "ボトルネック技術",
					summary:
						"以下の技術はTRL 7未満であり、商用展開に向けた追加の開発・検証が必要です。",
					technologies: [
						{
							name: "知識グラフ構築エンジン",
							content:
								"現在TRL 5。大規模ネットワーク処理には成功しているが、矛盾検出と自動修正が研究段階。数千万ノードの動的更新処理がボトルネック。2027年までにTRL 7達成を目標。",
						},
						{
							name: "統合プラットフォーム",
							content:
								"現在TRL 4。概念実証は完了。レガシーシステムとのAPI統合、マルチテナント対応、本番環境でのスケーラビリティ検証が次ステップ。",
						},
					],
				},
				{
					heading: "実現可能な技術",
					summary:
						"以下の技術はTRL 7以上で、商用利用が見込める段階にあります。",
					technologies: [
						{
							name: "データ処理基盤",
							content:
								"TRL 8。主要フレームワーク（Apache Spark, Flink）は大規模実運用環境で稼働中。処理速度は従来比10倍以上、F1スコア0.85以上の精度を達成。",
						},
						{
							name: "AI/ML分析エンジン",
							content:
								"TRL 7。複数の実証実験で高精度を達成。リアルタイム推論はエッジ環境でも動作確認済み。ファインチューニングの自動化が残課題。",
						},
					],
				},
			],
			scores: [
				{
					technology_name: "データ処理基盤",
					category: "feasible",
					integrated_trl: 8,
					article_trl: 7,
					patent_trl: 8,
					market_trl: 8,
					assessment: "大規模実運用環境で安定稼働。成熟した技術。",
					integratedReasoning:
						"論文・特許・市場の全指標でTRL 7以上。特にApache Spark/Flinkのエコシステムが充実。",
					sourceDetails: [
						{
							source: "article",
							trl_score: 7,
							reasoning: "複数の大規模ベンチマーク論文で実用性を実証",
							bestSourceRefs: [
								{
									title: "Scalable Data Processing Framework",
									url: "https://doi.org/example1",
								},
							],
						},
					],
				},
				{
					technology_name: "AI/ML分析エンジン",
					category: "feasible",
					integrated_trl: 7,
					article_trl: 7,
					patent_trl: 6,
					market_trl: 7,
					assessment: "実証実験で高精度達成。商用展開の準備段階。",
					integratedReasoning:
						"論文ではF1スコア0.85以上を達成。市場でもEdge AIデバイスでの動作実績あり。",
					sourceDetails: [],
				},
				{
					technology_name: "知識グラフ構築",
					category: "bottleneck",
					integrated_trl: 5,
					article_trl: 5,
					patent_trl: 4,
					market_trl: null,
					assessment: "大規模処理は可能だが、動的更新・矛盾検出が課題。",
					integratedReasoning:
						"学術研究は進展しているが、特許化が遅れ、商用実装も限定的。",
					sourceDetails: [],
				},
				{
					technology_name: "統合プラットフォーム",
					category: "bottleneck",
					integrated_trl: 4,
					article_trl: 4,
					patent_trl: 3,
					market_trl: null,
					assessment: "概念実証段階。本番環境でのスケーラビリティ検証が必要。",
					integratedReasoning:
						"PoC完了だが、マルチテナント対応やAPI標準化はこれから。",
					sourceDetails: [],
				},
				{
					technology_name: "エッジコンピューティング",
					category: "feasible",
					integrated_trl: 7,
					article_trl: 6,
					patent_trl: 7,
					market_trl: 8,
					assessment: "商用製品が多数。低レイテンシ処理で強み。",
					integratedReasoning:
						"市場TRLが最も高く、AWS Wavelength等の商用サービスが利用可能。",
					sourceDetails: [],
				},
			],
			derivations: [
				{
					technology_name: "データ処理基盤",
					integrated_trl: 8,
					article_trl: 7,
					patent_trl: 8,
					market_trl: 8,
				},
				{
					technology_name: "AI/ML分析エンジン",
					integrated_trl: 7,
					article_trl: 7,
					patent_trl: 6,
					market_trl: 7,
				},
			],
		},

		market: {
			japanMarket: {
				tamValue: "4,200億円",
				samValue: "1,260億円",
				cagr: "5.8%",
				marketName: "日本R&Dインテリジェンス市場",
				sourceUrl: "https://example.com/japan-market-report",
			},
			globalTam: {
				value: "$48.2B",
				description: "グローバルR&D関連技術市場（2024年推定）",
			},
			globalSam: {
				value: "$12.6B",
				description: "先進国のエンタープライズ・研究機関向けセグメント",
			},
			globalCagr: {
				value: "11.2%",
				description: "2024-2030年の年平均成長率",
				sourceUrl: "https://example.com/global-report",
			},
			tamNumber: 48.2,
			samNumber: 12.6,
			segments: [
				{
					segment_name: "製造業R&D",
					share_percent: 35,
					estimated_size: "$16.9B",
					description: "生産プロセス最適化、品質管理、新素材開発",
				},
				{
					segment_name: "製薬・ヘルスケア",
					share_percent: 25,
					estimated_size: "$12.1B",
					description: "創薬、臨床試験最適化、医療機器開発",
				},
				{
					segment_name: "IT・エレクトロニクス",
					share_percent: 20,
					estimated_size: "$9.6B",
					description: "半導体設計、ソフトウェア開発効率化",
				},
				{
					segment_name: "化学・材料",
					share_percent: 12,
					estimated_size: "$5.8B",
					description: "新材料探索、プロセス最適化",
				},
				{
					segment_name: "その他",
					share_percent: 8,
					estimated_size: "$3.8B",
					description: "エネルギー、農業、環境分野",
				},
			],
			derivation: {
				tam_source_name: "Grand View Research",
				tam_source_url: "https://example.com/grand-view-research-report",
				sam_formula: "SAM = TAM × 先進国比率(65%) × エンタープライズ比率(40%)",
				sam_description:
					"先進国（北米40%、欧州30%、日本15%、その他15%）のエンタープライズ市場に限定",
				reference_sources: [
					{
						label: "Grand View Research - R&D Intelligence Market",
						url: "https://example.com/grand-view",
					},
					{
						label: "MarketsandMarkets - AI in R&D Report",
						url: "https://example.com/marketsandmarkets",
					},
					{
						label: "総務省 - 科学技術研究調査",
						url: "https://example.com/soumu",
					},
				],
			},
		},

		research: {
			articleCommentary:
				"対象分野の論文発表は2018年以降急増し、2022年にピーク（287件）を記録。特にTransformerアーキテクチャの応用研究が牽引。2023-2024年は生成AI関連の応用論文が増加傾向。",
			articleYearlyData: [
				{ year: 2015, count: 45 },
				{ year: 2016, count: 62 },
				{ year: 2017, count: 89 },
				{ year: 2018, count: 134 },
				{ year: 2019, count: 178 },
				{ year: 2020, count: 215 },
				{ year: 2021, count: 256 },
				{ year: 2022, count: 287 },
				{ year: 2023, count: 312 },
				{ year: 2024, count: 198 },
			],
			patentCommentary:
				"特許出願は安定的に増加し、2023年に過去最高（156件）を記録。中国・韓国企業の出願が大幅増加。日本企業は製造業応用に特化した出願が目立つ。",
			patentYearlyData: [
				{ year: 2015, count: 34 },
				{ year: 2016, count: 42 },
				{ year: 2017, count: 58 },
				{ year: 2018, count: 72 },
				{ year: 2019, count: 89 },
				{ year: 2020, count: 105 },
				{ year: 2021, count: 124 },
				{ year: 2022, count: 143 },
				{ year: 2023, count: 156 },
				{ year: 2024, count: 112 },
			],
			topJournals: [
				{ name: "Nature Machine Intelligence", count: 45 },
				{ name: "IEEE Trans. on Pattern Analysis", count: 38 },
				{ name: "ACM Computing Surveys", count: 32 },
				{ name: "Artificial Intelligence Review", count: 28 },
				{ name: "Journal of Machine Learning Research", count: 24 },
			],
		},

		marketImplementations: [
			{
				product: "AI Research Assistant Pro",
				company: "TechVenture Inc.",
				stage: "commercial",
				description: "研究者向けAI文献検索・分析ツール",
				urls: ["https://example.com/product1"],
				year: 2023,
			},
			{
				product: "PatentScope AI",
				company: "IP Analytics Corp.",
				stage: "commercial",
				description: "特許分析AIプラットフォーム",
				urls: ["https://example.com/product2"],
				year: 2022,
			},
			{
				product: "MaterialsDB",
				company: "DeepMatter Labs",
				stage: "rnd",
				description: "新素材探索AIエンジン",
				urls: ["https://example.com/product3"],
				year: 2024,
			},
			{
				product: "ClinicalAI Optimizer",
				company: "MedTech Solutions",
				stage: "rnd",
				description: "臨床試験設計最適化ツール",
				urls: ["https://example.com/product4"],
				year: 2023,
			},
			{
				product: "Smart R&D Platform",
				company: "Enterprise AI Co.",
				stage: "commercial",
				description: "エンタープライズR&D管理プラットフォーム",
				urls: ["https://example.com/product5", "https://example.com/press5"],
				year: 2023,
			},
			{
				product: "知識グラフエクスプローラー",
				company: "NexGen Knowledge",
				stage: "rnd",
				description: "大規模知識グラフ構築・可視化ツール",
				urls: ["https://example.com/product6"],
				year: 2024,
			},
		],

		socialIssues: {
			overallSummary:
				"本技術分野は、R&D生産性の停滞、情報過負荷による意思決定遅延、そして技術開発から社会実装までのタイムラグという3つの社会課題に対して、直接的な解決策を提供します。特に、研究開発投資の効率化は気候変動対策やヘルスケア革新の加速に不可欠です。",
			solutions: [
				{
					title: "R&D生産性革命：情報過負荷からの解放",
					text: "世界のR&D投資は年間2.4兆ドルに達するが、研究者の65%が「情報収集に過大な時間を費やしている」と回答[1]。本技術により、文献調査時間を70%削減し、未探索の研究空白を自動特定することで、真に革新的な研究への集中を可能にします[2]。",
					sources: [
						{
							index: 1,
							url: "https://example.com/source1",
							title: "Global R&D Productivity Survey 2023",
						},
						{
							index: 2,
							url: "https://example.com/source2",
							title: "AI-Assisted Research Efficiency Report",
						},
					],
				},
				{
					title: "技術開発サイクルの短縮",
					text: "技術開発から社会実装までに平均10-15年を要する現状[1]は、気候変動対策やパンデミック対応の緊急性と整合しません。本技術による技術成熟度の自動評価と最適なイノベーションパスの提示により、このサイクルを3-5年に短縮する可能性があります[2]。",
					sources: [
						{
							index: 1,
							url: "https://example.com/source3",
							title: "Technology Transfer Gap Analysis",
						},
						{
							index: 2,
							url: "https://example.com/source4",
							title: "Accelerating Innovation Pipeline",
						},
					],
				},
				{
					title: "グローバル知識格差の是正",
					text: "先進国と新興国の間でR&D投資額に10倍以上の格差が存在[1]。本技術は低コストでの最先端知見へのアクセスを実現し、地理的・経済的障壁を超えた知識の民主化に貢献します。特に、多言語対応の知識統合により、言語障壁による情報格差を解消します[2]。",
					sources: [
						{
							index: 1,
							url: "https://example.com/source5",
							title: "UNESCO Science Report 2024",
						},
						{
							index: 2,
							url: "https://example.com/source6",
							title: "Multilingual AI for Research",
						},
					],
				},
			],
			totalIssues: 3,
			totalReferences: 6,
		},

		technicalCompetitors: [
			{
				technology_name: "Large-Scale Data Processing",
				technology_name_ja: "大規模データ処理",
				unique_companies: 45,
				analyzed_companies: 15,
				competitors: [
					{
						rank: 1,
						company_name: "Google LLC",
						country: "US",
						patent_count: 342,
					},
					{
						rank: 2,
						company_name: "Microsoft Corp.",
						country: "US",
						patent_count: 289,
					},
					{
						rank: 3,
						company_name: "IBM Corp.",
						country: "US",
						patent_count: 234,
					},
					{
						rank: 4,
						company_name: "Samsung Electronics",
						country: "KR",
						patent_count: 178,
					},
					{
						rank: 5,
						company_name: "富士通株式会社",
						country: "JP",
						patent_count: 145,
					},
				],
			},
			{
				technology_name: "Knowledge Graph Construction",
				technology_name_ja: "知識グラフ構築",
				unique_companies: 28,
				analyzed_companies: 10,
				competitors: [
					{
						rank: 1,
						company_name: "Google LLC",
						country: "US",
						patent_count: 156,
					},
					{
						rank: 2,
						company_name: "Microsoft Corp.",
						country: "US",
						patent_count: 98,
					},
					{
						rank: 3,
						company_name: "Baidu Inc.",
						country: "CN",
						patent_count: 87,
					},
					{
						rank: 4,
						company_name: "Amazon Technologies",
						country: "US",
						patent_count: 72,
					},
					{
						rank: 5,
						company_name: "NEC Corp.",
						country: "JP",
						patent_count: 45,
					},
				],
			},
			{
				technology_name: "AI/ML Inference Optimization",
				technology_name_ja: "AI/ML推論最適化",
				unique_companies: 52,
				analyzed_companies: 12,
				competitors: [
					{
						rank: 1,
						company_name: "NVIDIA Corp.",
						country: "US",
						patent_count: 423,
					},
					{
						rank: 2,
						company_name: "Intel Corp.",
						country: "US",
						patent_count: 312,
					},
					{
						rank: 3,
						company_name: "Google LLC",
						country: "US",
						patent_count: 267,
					},
					{
						rank: 4,
						company_name: "Huawei Technologies",
						country: "CN",
						patent_count: 198,
					},
					{
						rank: 5,
						company_name: "日立製作所",
						country: "JP",
						patent_count: 89,
					},
				],
			},
		],
	}
}

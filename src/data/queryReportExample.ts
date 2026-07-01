// Static example data for the RDE-424 Query Report.
// Source: 空中触覚_updateS05_v2.html (s01–s05) + plausible s06/s07 fitting the theme.
// This branch only renders a single hard-coded example — no live generation.

import type { QueryReportData } from "@/types/query-report"

export const queryReportExample: QueryReportData = {
	theme: "空中触覚",
	scenario: "非接触型空中触覚インターフェースシステム",
	summary:
		"空中触覚技術は、超音波のフェーズドアレイ等を用い、物理的接触なしに触覚刺激を空中で生成する技術である。VR/AR、医療、自動車、公共端末など幅広い分野で非接触インターフェースの需要が急拡大している。",

	// ── S01 要請背景 ─────────────────────────────────────
	s01: {
		kpis: [
			{ value: "$29.7B", label: "空中超音波触覚市場予測（2030年）" },
			{ value: "20.1%", label: "超音波空中触覚セグメントCAGR（〜2030年）" },
			{ value: "78%", label: "触覚搭載新車比率（2024年・日本）" },
		],
		body: `<p>非接触インターフェースへの需要が世界的に高まっている。COVID-19の影響で衛生的な操作手段が求められるようになり、タッチレス技術市場は2022年の$10.7Bから2030年に$54.7Bへ拡大すると見込まれる<cite>Next Move Strategy Consulting（2023）</cite>。ジェスチャー認識・タッチレスセンシング市場も2025年の$28.4Bから2033年に$155.7Bへ成長が予測される<cite>Business Market Insights（2025）</cite>。</p><p>空中触覚技術はこの流れの中核を担う。超音波空中触覚セグメントはハプティクス市場全体の中で20.1%のCAGRで成長を加速している<cite>Mordor Intelligence（2025）</cite>。自動車業界では、日本の新車の78%が何らかの触覚フィードバックを搭載するまでに至った<cite>JAMA（2024）</cite>。医療分野でも手術シミュレーションやリハビリへの応用が進む。</p><p>各国は非接触技術の研究開発に積極的に投資している。韓国科学技術情報通信部は次世代触覚技術に2.8兆ウォン（約$2.1B）の研究資金を提供<cite>韓国科学技術情報通信部（2024）</cite>。NTTは2025年5月に超音波による多様な触感生成技術を発表し、ウェアラブル不要の没入型XR体験の道を開いた<cite>NTT（2025）</cite>。</p><p>しかし空中触覚の普及には課題も残る。製造・実装コストの高さ<cite>NextMSC（2024）</cite>や、刺激強度の限界、長時間利用時の知覚適応など、技術・コスト両面でのブレークスルーが求められている。</p>`,
		policies: [
			{
				flag: "🇺🇸",
				country: "米国",
				text: "FAA CFR Title 14 Part 61.57の改正により、家庭用含む簡易シミュレーターでのIFR訓練が許容され、空中触覚を活用した低コスト・多機種対応のフライトシミュレーター開発に道を開いた。企業にとっては航空訓練市場への参入障壁が低下する。",
				confidence: "high",
				sourceUrl:
					"https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-A/section-61.57",
			},
			{
				flag: "🇪🇺",
				country: "EU",
				text: "Horizon Europeプログラムにおいて触覚技術を含むXR・HCI研究への資金配分を継続。2025年にはデジタルヘルス分野での触覚フィードバック研究に助成を拡大。欧州企業にとってはR&D費の公的補填が得られる。",
				confidence: "medium",
				sourceUrl:
					"https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en",
			},
			{
				flag: "🇯🇵",
				country: "日本",
				text: "JST CREST・PRESTOプログラムが触覚研究を含むヒューマンインタフェース領域をカバー。NTTなど大手通信が空中触覚のXR応用を加速。大学・企業は基礎研究資金を活用できる。",
				confidence: "high",
				sourceUrl: "https://www.jst.go.jp/kisoken/crest/",
			},
			{
				flag: "🇰🇷",
				country: "韓国",
				text: "韓国科学技術情報通信部が次世代触覚技術に2.8兆ウォン（約$2.1B）の研究資金を計上。Samsung・LGが車載・産業用触覚ディスプレイを開発中。韓国進出企業にとっては共同研究の好機となる。",
				confidence: "high",
				sourceUrl: "https://www.msit.go.kr/eng/main.do",
			},
			{
				flag: "🇸🇦",
				country: "サウジアラビア",
				text: "Vision 2030の下、保健省がSAR 1,800億（約$48B）を医療インフラに投資。触覚対応手術ロボットや訓練シミュレーターの導入を推進。中東市場への参入を検討する企業に追い風となる。",
				confidence: "medium",
				sourceUrl: "https://www.vision2030.gov.sa/en/vision-2030/overview/",
			},
		],
		sources: [
			{
				label: "NextMSC – Midair Ultrasound Haptics Market Report (2024)",
				url: "https://www.nextmsc.com/report/midair-ultrasound-haptics-market",
			},
			{
				label: "Mordor Intelligence – Haptic Technology Market (2025)",
				url: "https://www.mordorintelligence.com/industry-reports/haptic-technology-market",
			},
			{
				label:
					"Business Market Insights – Gesture Recognition & Touchless Sensing (2025)",
				url: "https://www.businessmarketinsights.com/reports/gesture-recognition-and-touchless-sensing-market",
			},
			{
				label: "NTT Press Release – Mid-Air Haptic Sensations (2025)",
				url: "https://group.ntt/en/newsrelease/2025/05/13/250513b.html",
			},
			{
				label: "Emergen Research – Haptic Devices Market (2024)",
				url: "https://www.emergenresearch.com/industry-report/haptic-devices-market",
			},
		],
	},

	// ── S02 定義・役割 ───────────────────────────────────
	s02: {
		definitionTitle:
			"空中触覚とは、超音波等を用いて空中に触覚刺激を生成する非接触型フィードバック技術である",
		definition: `<p>空中触覚（Mid-Air Haptics）とは、超音波フェーズドアレイ・気流・レーザー等の物理的波動を空中で集束させ、人の皮膚に力や振動の感覚を非接触で生み出す技術である。ユーザーは何も装着・把持せずに触覚を知覚できる点が最大の特徴である。VR/AR、自動車、医療、公共端末など幅広い分野で利用が進んでいる。</p>`,
		advantages: [
			{
				label: "Strength 01",
				title: "非接触での力の伝達",
				body: "<p>超音波や気流などの波動を利用し、物理的な接触なしに空中で触覚刺激を届けられる。従来の接触型デバイスが抱える衛生・摩耗の課題を克服し、空間的な自由度を飛躍的に高める。公共端末・医療機器の操作補助に適する。</p>",
				sourceStrength: "非接触力伝達性",
			},
			{
				label: "Strength 02",
				title: "空間の狙った一点に力を集中",
				body: "<p>空中の任意の位置へ微細な力ベクトルを精密に制御し、局所的な触覚刺激を発生させる。従来の均一力場と異なり、mmオーダーの分解能で一点集中型の刺激を実現する。手術トレーニングや3D触覚ディスプレイへの応用が期待される。</p>",
				sourceStrength: "局所空間的力制御性",
			},
			{
				label: "Strength 03",
				title: "押圧・振動・変形感を同時に再現",
				body: "<p>単一デバイスで押圧・振動・変形感など多様な触覚を同時に生成できる。従来技術が1種類の触覚に限られることが多かったのに対し、複合刺激を組み合わせて豊かな感覚情報を伝達する。エンタメやリモート通信での没入感向上に寄与する。</p>",
				sourceStrength: "多モーダル触覚生成性",
			},
			{
				label: "Strength 04",
				title: "リアルタイムに強度・方向を変化",
				body: "<p>空中触覚の強度・方向・周期をリアルタイムで動的に変えられる。固定的な刺激しか出せない従来方式と比べ、時間変動する触覚シナリオを柔軟に再現できる。VR/ARでの没入演出やゲーム操作に最適である。</p>",
				sourceStrength: "動的刺激可変性",
			},
			{
				label: "Strength 05",
				title: "皮膚に触れずに感覚を誘発",
				body: "<p>人体に直接接触せず、皮膚の機械的受容器を介して触覚を誘発する。接触型デバイスによる皮膚損傷・感染リスクを排除し、衛生的で安全な長時間利用を実現する。医療・介護・食品現場での支援に適する。</p>",
				sourceStrength: "非侵襲的感覚獲得性",
			},
		],
		sources: [
			{
				label:
					"Rakkolainen et al. (2020) A Survey of Mid-Air Ultrasound Haptics – IEEE TVCG",
				url: "https://ieeexplore.ieee.org/document/9174896/",
			},
			{
				label: "Ultraleap – Mid-Air Haptics Documentation",
				url: "https://docs.ultraleap.com/haptics/",
			},
			{
				label:
					"Obrist et al. (2022) Ultrasound Mid-Air Haptics for Touchless Interfaces – Springer",
				url: "https://link.springer.com/book/10.1007/978-3-031-04043-6",
			},
		],
	},

	// ── S03 市場規模 ─────────────────────────────────────
	s03: {
		tam: {
			value: "$13.7B",
			label: "ハプティクスデバイス市場（2030年予測）",
			sourceOrg: "Grand View Research",
			sourceUrl:
				"https://www.grandviewresearch.com/industry-analysis/haptic-devices-market-report",
			sourceYear: "2024",
		},
		tamCards: [
			{ value: "57.7%", label: "家電用途シェア（2024年）" },
			{ value: "42.4%", label: "アジア太平洋シェア（2024年）" },
			{ value: "20.1%", label: "超音波空中触覚CAGR（〜2030年）" },
		],
		forecasts: [
			{
				org: "NextMSC",
				orgUrl: "https://www.nextmsc.com",
				sub: "空中超音波触覚",
				current: "$12.0B（2023年）",
				future: "$29.7B（2030年）",
				pctFill: 40,
				year: "2023–2030",
				cagr: "14.0%",
				reportUrl:
					"https://www.nextmsc.com/report/midair-ultrasound-haptics-market",
				currencyBasis: "2023年名目USD基準",
				scope: "グローバル",
				scenario: "base-case",
				dataVintage: "2024年12月",
				confidence: "medium",
			},
			{
				org: "Mordor Intelligence",
				orgUrl: "https://www.mordorintelligence.com",
				sub: "ハプティクス技術全体",
				current: "$4.62B（2025年）",
				future: "$8.5B（2030年）",
				pctFill: 54,
				year: "2025–2030",
				cagr: "12.92%",
				reportUrl:
					"https://www.mordorintelligence.com/industry-reports/haptic-technology-market",
				currencyBasis: "2025年名目USD基準",
				scope: "グローバル",
				scenario: "base-case",
				dataVintage: "2025年11月",
				confidence: "high",
			},
			{
				org: "Grand View Research",
				orgUrl: "https://www.grandviewresearch.com",
				sub: "ハプティクスデバイス",
				current: "$4.78B（2023年）",
				future: "$13.74B（2030年）",
				pctFill: 35,
				year: "2024–2030",
				cagr: "16.3%",
				reportUrl:
					"https://www.grandviewresearch.com/industry-analysis/haptic-devices-market-report",
				currencyBasis: "2023年名目USD基準",
				scope: "グローバル",
				scenario: "base-case",
				dataVintage: "2024年",
				confidence: "high",
			},
			{
				org: "Straits Research",
				orgUrl: "https://straitsresearch.com",
				sub: "ハプティクス技術",
				current: "$4.34B（2024年）",
				future: "$15.68B（2033年）",
				pctFill: 28,
				year: "2025–2033",
				cagr: "14.9%",
				reportUrl:
					"https://straitsresearch.com/report/haptic-technology-market",
				currencyBasis: "2024年名目USD基準",
				scope: "グローバル",
				scenario: "base-case",
				dataVintage: "2025年",
				confidence: "high",
			},
			{
				org: "MarketsandMarkets",
				orgUrl: "https://www.marketsandmarkets.com",
				sub: "ハプティクス技術",
				current: "$6.61B（2025年）",
				future: "$8.21B（2030年）",
				pctFill: 81,
				year: "2025–2030",
				cagr: "4.5%",
				reportUrl:
					"https://www.marketsandmarkets.com/Market-Reports/haptic-technology-market-443.html",
				currencyBasis: "2025年名目USD基準",
				scope: "グローバル",
				scenario: "conservative",
				dataVintage: "2025年",
				confidence: "high",
			},
		],
		sources: [
			{
				label: "NextMSC – Midair Ultrasound Haptics Market (2024)",
				url: "https://www.nextmsc.com/report/midair-ultrasound-haptics-market",
			},
			{
				label: "Mordor Intelligence – Haptic Technology Market (2025)",
				url: "https://www.mordorintelligence.com/industry-reports/haptic-technology-market",
			},
			{
				label: "Grand View Research – Haptic Devices Market (2024)",
				url: "https://www.grandviewresearch.com/industry-analysis/haptic-devices-market-report",
			},
			{
				label: "Straits Research – Haptic Technology Market (2025)",
				url: "https://straitsresearch.com/report/haptic-technology-market",
			},
			{
				label: "MarketsandMarkets – Haptic Technology Market (2025)",
				url: "https://www.marketsandmarkets.com/Market-Reports/haptic-technology-market-443.html",
			},
		],
	},

	// ── S04 技術史年表 ───────────────────────────────────
	s04: {
		intro:
			"空中触覚は2008年の岩本らの原理実証から約18年の歴史を持ち、大学発の基礎研究が企業化を経て産業応用へ拡大してきた。",
		searchKeywords: [
			"mid-air haptics history",
			"Iwamoto ultrasound tactile 2008",
			"Ultraleap Ultrahaptics founding",
			"ultrasound haptics academic papers",
			"mid-air haptics patents",
			"phased array haptics research",
		],
		body: "<p>空中触覚技術は、2008年に東京大学の岩本・篠田らが超音波音響放射力による非接触触覚提示の原理を実証したことに始まる。2010年に星らがフェーズドアレイによる3次元焦点制御を実現し、2013年にブリストル大学のCarterらが複数焦点を同時生成するUltraHapticsシステムを発表した。この研究は同年Ultrahaptics社（現Ultraleap）の設立につながり、空中触覚技術の商業化が本格的に始まった。2021年にUltraleapはTencentと提携し$82Mの資金調達を完了。2025年にはNTTが回転運動を利用した新たな超音波触覚生成法を発表し、従来より強力で多様な触感の生成に成功した。</p>",
		annualData: [
			{
				year: 2008,
				papers: 5,
				papersDelta: "—",
				patents: 2,
				patentsDelta: "—",
				event: "岩本・篠田らが超音波音響放射力による非接触触覚原理を実証",
			},
			{
				year: 2010,
				papers: 10,
				papersDelta: "+100%（推定）",
				patents: 5,
				patentsDelta: "+150%（推定）",
				event: "星らがフェーズドアレイによる3次元焦点制御を実現",
			},
			{
				year: 2013,
				papers: 18,
				papersDelta: "+29%（推定）",
				patents: 8,
				patentsDelta: "+23%（推定）",
				event: "Carter らがUltraHapticsを発表、同年Ultrahaptics社を設立",
			},
			{
				year: 2016,
				papers: 35,
				papersDelta: "+25%（推定）",
				patents: 20,
				patentsDelta: "+33%（推定）",
				event: "伊藤らが70kHz超音波による高解像度空中触覚を実証",
			},
			{
				year: 2018,
				papers: 50,
				papersDelta: "+20%（推定）",
				patents: 30,
				patentsDelta: "+25%（推定）",
				event: "車載インフォテインメントへの空中触覚適用研究が進展",
			},
			{
				year: 2020,
				papers: 70,
				papersDelta: "+17%（推定）",
				patents: 45,
				patentsDelta: "+20%（推定）",
				event: "Rakkolainenらの包括的サーベイ論文がIEEE TVCGに掲載",
			},
			{
				year: 2021,
				papers: 80,
				papersDelta: "+14%（推定）",
				patents: 55,
				patentsDelta: "+22%（推定）",
				event: "UltraleapがTencentと提携し$82Mを調達",
			},
			{
				year: 2022,
				papers: 90,
				papersDelta: "+13%（推定）",
				patents: 60,
				patentsDelta: "+9%（推定）",
				event: "Springerから初の包括的書籍「Ultrasound Mid-Air Haptics」出版",
			},
			{
				year: 2024,
				papers: 110,
				papersDelta: "+10%（推定）",
				patents: 65,
				patentsDelta: "+4%（推定）",
				event: "UltraleapがQualcommと車載統合パートナーシップを締結",
			},
			{
				year: 2025,
				papers: 120,
				papersDelta: "+9%（推定）",
				patents: 50,
				patentsDelta: "—（公開ラグ影響）",
				event: "NTTが回転運動ベースの新触覚生成技術を発表",
			},
		],
		patentLagNote:
			"直近2年（2024〜2025年）の特許数は出願→公開ラグ（原則18ヶ月）のため過少計上の可能性があります。",
		chartPhases: [
			{
				phase: 1,
				yearRange: "2005〜2012年",
				title: "黎明期",
				desc: "東京大学を中心に超音波音響放射力の原理研究が進行。論文数は年間10件以下と少なく、研究者コミュニティも限定的だった。",
			},
			{
				phase: 2,
				yearRange: "2013〜2019年",
				title: "商業化・拡大期",
				desc: "Ultrahaptics設立を契機に産学連携が活発化。自動車・VR分野への応用研究が急増し、年間論文数が50件規模に成長した。",
			},
			{
				phase: 3,
				yearRange: "2020〜2025年",
				title: "多分野応用・加速期",
				desc: "COVID-19によるタッチレス需要拡大が追い風に。NTTなど大手企業の参入で技術の多様化と高度化が同時進行している。",
			},
		],
		events: [
			{
				date: "2008年",
				title: "岩本・篠田らが超音波非接触触覚を初実証",
				body: "東京大学の岩本拓也・篠田裕之らが、空中超音波の音響放射力を用いて人の皮膚に非接触で触覚刺激を与える原理を世界で初めて実証した。EuroHaptics 2008およびSIGGRAPH 2008で発表。",
				confidence: "high",
			},
			{
				date: "2010年",
				title: "星らがフェーズドアレイ3D焦点制御を実現",
				body: "星・篠田らが動的位相制御を用い、焦点を3次元空間で自由に移動させる手法を確立。複雑な触覚パターンの空中生成を可能にした。IEEE Transactions on Hapticsに掲載。",
				confidence: "high",
			},
			{
				date: "2013年",
				title: "UltraHaptics発表とUltrahaptics社設立",
				body: "ブリストル大学のTom Carterらが複数焦点の同時生成を実現するUltraHapticsシステムをACM UIST 2013で発表。同年にスピンアウトしてUltrahaptics社（現Ultraleap）を設立。",
				confidence: "high",
			},
			{
				date: "2020年08月",
				title: "包括的サーベイ論文がIEEE TVCGに掲載",
				body: "Rakkolainenらが空中超音波触覚に関する包括的なサーベイ論文をIEEE Transactions on Visualization and Computer Graphicsに発表。技術の原理・応用・課題を体系的に整理した。",
				confidence: "high",
			},
			{
				date: "2021年11月",
				title: "UltraleapがTencentと提携、$82M調達",
				body: "空中触覚の商業リーダーであるUltraleapがTencentとの提携を通じて$82Mを調達。ハンドジェスチャーと触覚フィードバックを組み合わせたデジタルコンテンツ操作の開発を加速した。",
				confidence: "high",
			},
			{
				date: "2022年",
				title: "Springer刊行「Ultrasound Mid-Air Haptics」出版",
				body: "30名の専門家による18章構成の初の包括的書籍がSpringer Natureから出版。電子回路設計・音響学・知覚心理学・UX・応用事例を網羅し、分野の体系化に貢献した。",
				confidence: "high",
			},
			{
				date: "2024年09月",
				title: "UltraleapがQualcommと車載提携を発表",
				body: "Ultraleapが米Qualcommと戦略提携を締結。次世代自動車インフォテインメントへの空中触覚技術の統合を目指し、非接触操作による運転中の注意散漫低減を狙う。",
				confidence: "high",
			},
			{
				date: "2025年05月",
				title: "NTTが回転運動型超音波触覚技術を発表",
				body: "NTTが回転運動を組み込んだ超音波触覚提示技術を発表。従来の振動法に代わり、回転刺激が力感覚を大幅に強化することを世界初で発見。滑り・粗さ・滑らかさなど多様なテクスチャを非接触で再現。",
				confidence: "high",
			},
		],
		papersTable: {
			headers: ["年", "論文情報", "この論文が示したこと", "引用数"],
			rows: [
				[
					"2008年",
					{
						text: "Iwamoto et al. (2008) Non-contact Method for Producing Tactile Sensation Using Airborne Ultrasound. EuroHaptics",
						url: "https://doi.org/10.1007/978-3-540-69057-3_64",
					},
					"超音波の音響放射力で人の皮膚に非接触触覚を与えられることを世界初で実証した",
					"450",
				],
				[
					"2010年",
					{
						text: "Hoshi et al. (2010) Noncontact Tactile Display Based on Radiation Pressure of Airborne Ultrasound. IEEE Trans. Haptics",
						url: "https://doi.org/10.1109/TOH.2010.5",
					},
					"フェーズドアレイで焦点を3次元制御し、複雑な触覚パターンを空中生成できることを示した",
					"600",
				],
				[
					"2013年",
					{
						text: "Carter et al. (2013) UltraHaptics: Multi-point Mid-air Haptic Feedback for Touch Surfaces. ACM UIST",
						url: "https://doi.org/10.1145/2501988.2502018",
					},
					"複数焦点の同時生成を初めて実現し、タッチ面との組み合わせによる新しいインタフェースを提案した",
					"500",
				],
				[
					"2020年",
					{
						text: "Rakkolainen et al. (2020) A Survey of Mid-Air Ultrasound Haptics. IEEE TVCG",
						url: "https://doi.org/10.1109/TVCG.2020.3023589",
					},
					"空中超音波触覚技術の原理・レンダリング・応用・課題を体系的に整理した包括的サーベイ",
					"200",
				],
				[
					"2020年",
					{
						text: "Plasencia et al. (2020) GS-PAT: High-Speed Multi-Point Sound-Fields. ACM Trans. Graphics",
						url: "https://doi.org/10.1145/3414685.3417831",
					},
					"フェーズドアレイ計算を高速化し、多焦点音場のリアルタイム生成を実現した",
					"150",
				],
			],
		},
		patents: {
			trendNote:
				"2013年のUltrahaptics設立以降、同社を中心に特許出願が急増。2020年代は車載・XR応用の実装特許が増加傾向にある。日本は東京大学・NTTが主要出願人として存在感を示す。",
			topAssignees: [
				{
					name: "Ultraleap (旧Ultrahaptics)",
					country: "英国",
					count: "120+（推定）",
				},
				{
					name: "Immersion Corporation",
					country: "米国",
					count: "80+（推定）",
				},
				{
					name: "東京大学（篠田研究室）",
					country: "日本",
					count: "30+（推定）",
				},
				{ name: "Apple Inc.", country: "米国", count: "25+（推定）" },
				{ name: "META (Facebook)", country: "米国", count: "20+（推定）" },
				{ name: "Samsung Electronics", country: "韓国", count: "20+（推定）" },
				{ name: "NTT（日本電信電話）", country: "日本", count: "15+（推定）" },
				{
					name: "Microsoft Corporation",
					country: "米国",
					count: "15+（推定）",
				},
				{ name: "Texas Instruments", country: "米国", count: "10+（推定）" },
				{ name: "Force Dimension", country: "スイス", count: "10+（推定）" },
			],
			dataSource:
				"Justia Patents、Google Patentsおよびウェブ検索に基づく推定値",
			confidence: "medium",
		},
		sources: [
			{
				label:
					"Fleig et al. (2024) A Retrospective on Ultrasound Mid-Air Haptics in HCI – arXiv",
				url: "https://arxiv.org/abs/2512.07613",
			},
			{
				label:
					"Justia Patents – Mid-air ultrasonic haptic interface (US11392206)",
				url: "https://patents.justia.com/patent/11392206",
			},
			{
				label: "NTT Press Release – Mid-Air Haptic Sensations (2025)",
				url: "https://group.ntt/en/newsrelease/2025/05/13/250513b.html",
			},
			{
				label:
					"Springer – Ultrasound Mid-Air Haptics for Touchless Interfaces (2022)",
				url: "https://link.springer.com/book/10.1007/978-3-031-04043-6",
			},
		],
	},

	// ── S05 技術構造 ─────────────────────────────────────
	s05: {
		scopeDeclaration: {
			broadDef:
				"空中触覚を広義に定義すると、超音波・気流（エアジェット）・レーザー・電場・磁場など、何らかの物理的媒体を用いて人の皮膚に非接触で力覚・触覚・温覚を与える全ての技術を含む。",
			narrowDef:
				"本分析では、超音波フェーズドアレイにより空中に音響放射力を集束させ、人の皮膚表面の機械的受容器を刺激する技術を中心メカニズムとして採用する。",
			adoptedScope:
				"商業実績と研究蓄積が最も豊富な超音波方式を分析の中心に据えつつ、気流方式・レーザー方式も原理マップ上で位置づける。電場・磁場方式は皮膚接近が必要な場合が多く除外する。",
			excluded: [
				{
					name: "電気触覚（Electrotactile）",
					reason:
						"皮膚への電極接触が前提であり、非接触の空中触覚の定義から外れるため。",
				},
				{
					name: "ウェアラブル触覚グローブ",
					reason:
						"装着型であり本分析が対象とする非装着・非接触の前提と異なるため。",
				},
				{
					name: "磁気触覚（磁性流体方式等）",
					reason:
						"皮膚近接に磁性体の配置が必要となり、完全非接触の実現が困難なため。",
				},
			],
		},
		subprocesses: {
			centralMechanism:
				"電気信号からの超音波生成→空中での波動伝搬・集束→皮膚表面への音響放射力の印加→機械的受容器の刺激→触覚知覚の形成、という一連のエネルギー変換過程。",
			items: [
				{
					name: "超音波の生成・放射",
					description:
						"圧電トランスデューサ等により電気信号を超音波（20kHz以上）に変換し、空中へ放射する工程。",
					isEssential: true,
					keyVariables: [
						"周波数",
						"トランスデューサ素子数",
						"駆動電圧",
						"素子配列パターン",
					],
				},
				{
					name: "波動の集束制御",
					description:
						"フェーズドアレイの各素子の位相と振幅を制御し、空中の特定点に音響エネルギーを集束させる工程。",
					isEssential: true,
					keyVariables: [
						"位相差",
						"焦点距離",
						"焦点数",
						"ビーム形成アルゴリズム",
					],
				},
				{
					name: "音響放射力の印加",
					description:
						"集束した超音波が皮膚表面で音響放射圧（Acoustic Radiation Pressure）として力を印加する工程。",
					isEssential: true,
					keyVariables: ["放射圧強度（Pa）", "接触面積", "超音波周波数"],
				},
				{
					name: "変調・レンダリング",
					description:
						"焦点位置や強度を時間的に変調し、知覚可能な触覚パターン（振動・テクスチャ・形状等）を生成する工程。",
					isEssential: true,
					keyVariables: [
						"変調周波数（AM/STM）",
						"焦点走査速度",
						"パターン形状",
					],
				},
			],
			sufficiencyNote:
				"上記4サブプロセスにより基本的な空中超音波触覚は完結する。ただし実用システムではハンドトラッキング（ユーザーの手の位置検出）が追加され、焦点を手の動きに追従させる必要がある。",
		},
		principleAxes: [
			{
				axisId: "A1",
				name: "エネルギー媒体",
				nameEn: "Actuation Medium",
				linkedSubprocess: "超音波の生成・放射",
				values: ["超音波", "気流（エアジェット）", "レーザー（光放射力）"],
				independenceNote:
					"エネルギー媒体は集束方式やレンダリング手法とは独立に選択でき、各媒体が固有の物理特性を持つ。",
			},
			{
				axisId: "A2",
				name: "集束方式",
				nameEn: "Focusing Method",
				linkedSubprocess: "波動の集束制御",
				values: [
					"フェーズドアレイ",
					"音響レンズ・反射鏡",
					"機械的走査（ノズル・ミラー）",
				],
				independenceNote:
					"集束方式はエネルギー媒体によらず原理的に選択でき、空間分解能と制御速度を決定する独立軸である。",
			},
			{
				axisId: "A3",
				name: "変調方式",
				nameEn: "Modulation Method",
				linkedSubprocess: "変調・レンダリング",
				values: ["振幅変調（AM）", "時空間変調（STM）", "回転・運動変調"],
				independenceNote:
					"変調方式は知覚する触覚の質を決定するが、媒体や集束方式とは独立に適用できる。",
			},
		],
		principleMap: {
			totalCombinations: 27,
			axesSummary: "軸A1×3 × 軸A2×3 × 軸A3×3 = 27通り",
			combinations: [
				{
					id: "C01",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "超音波フェーズドアレイAM方式",
					classification: "A",
					classificationNote:
						"Ultraleapが商用化済。最も普及した空中触覚方式である。",
					confidence: "high",
				},
				{
					id: "C02",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "超音波フェーズドアレイSTM方式",
					classification: "A",
					classificationNote:
						"Ultraleapが商用提供。焦点の高速走査により線・面形状の触覚を実現する。",
					confidence: "high",
				},
				{
					id: "C03",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "超音波フェーズドアレイ回転変調方式",
					classification: "B",
					classificationNote:
						"NTTが2025年に実証。回転運動により従来AM法比で大幅な力感覚強化を実現した。",
					confidence: "high",
				},
				{
					id: "C04",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "超音波音響レンズAM方式",
					classification: "C",
					classificationNote:
						"音響レンズで超音波を固定焦点に集束する基礎研究段階。焦点の動的移動が困難。",
					confidence: "medium",
				},
				{
					id: "C05",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "超音波音響レンズSTM方式",
					classification: "D",
					classificationNote:
						"音響レンズの固定焦点特性と高速走査が必要なSTMは相性が悪く、実現例がない。",
					confidence: "medium",
				},
				{
					id: "C06",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "超音波音響レンズ回転変調方式",
					classification: "D",
					classificationNote:
						"理論的には可能だが、レンズ焦点の固定性と回転制御の組み合わせに実現例がない。",
					confidence: "low",
				},
				{
					id: "C07",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "機械的走査（ノズル・ミラー）" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "超音波機械走査AM方式",
					classification: "D",
					classificationNote:
						"超音波の機械的走査は速度に限界があり、フェーズドアレイに対する優位性が乏しく実現例がない。",
					confidence: "low",
				},
				{
					id: "C08",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "機械的走査（ノズル・ミラー）" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "超音波機械走査STM方式",
					classification: "E",
					classificationNote:
						"STMは16kHz級の焦点更新速度を要するが、機械走査では物理的にその速度に到達できず不成立。",
					confidence: "high",
				},
				{
					id: "C09",
					axisValues: [
						{ axisId: "A1", value: "超音波" },
						{ axisId: "A2", value: "機械的走査（ノズル・ミラー）" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "超音波機械走査回転変調方式",
					classification: "E",
					classificationNote:
						"機械走査の帯域制限により、回転運動に必要な高速・連続的な焦点パターン生成が不可能。",
					confidence: "high",
				},
				{
					id: "C10",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "気流フェーズドアレイAM方式",
					classification: "E",
					classificationNote:
						"気流はフェーズドアレイで集束制御できる波動ではなく（音速より遥かに遅い流体運動）、原理的に不成立。",
					confidence: "high",
				},
				{
					id: "C11",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "気流フェーズドアレイSTM方式",
					classification: "E",
					classificationNote:
						"C10と同一理由。気流はフェーズドアレイによる位相制御が原理的に不可能。",
					confidence: "high",
				},
				{
					id: "C12",
					axisValues: [
						{ axisId: "A1", value: "気流(エアジェット)" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "気流フェーズドアレイ回転変調方式",
					classification: "E",
					classificationNote:
						"C10と同一理由。気流にフェーズドアレイは適用できない。",
					confidence: "high",
				},
				{
					id: "C13",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "気流音響レンズAM方式",
					classification: "E",
					classificationNote:
						"気流は音響レンズで集束する波動特性を持たず、原理的に不成立。",
					confidence: "high",
				},
				{
					id: "C14",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "気流音響レンズSTM方式",
					classification: "E",
					classificationNote: "C13と同一理由。気流に音響レンズは適用不可。",
					confidence: "high",
				},
				{
					id: "C15",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "気流音響レンズ回転変調方式",
					classification: "E",
					classificationNote: "C13と同一理由。気流に音響レンズは適用不可。",
					confidence: "high",
				},
				{
					id: "C16",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "機械的走査(ノズル・ミラー)" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "エアジェットノズル走査AM方式",
					classification: "C",
					classificationNote:
						"ノズルの方向・風量を機械制御し振幅変調する方式。Suzuki & Kobayashi（2005）の基礎研究がある。",
					confidence: "medium",
				},
				{
					id: "C17",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "機械的走査(ノズル・ミラー)" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "エアジェットノズル走査STM方式",
					classification: "D",
					classificationNote:
						"ノズル走査速度が遅く、時空間変調に必要な高速パターン描画が困難で実現例がない。",
					confidence: "medium",
				},
				{
					id: "C18",
					axisValues: [
						{ axisId: "A1", value: "気流（エアジェット）" },
						{ axisId: "A2", value: "機械的走査(ノズル・ミラー)" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "エアジェットノズル走査回転変調方式",
					classification: "D",
					classificationNote:
						"ノズルの回転制御による触覚生成は理論的に可能だが、精密な力制御が困難で未実現。",
					confidence: "low",
				},
				{
					id: "C19",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "レーザーフェーズドアレイAM方式",
					classification: "D",
					classificationNote:
						"光フェーズドアレイは理論上存在するが、触覚生成に十分な放射力を得るには極めて高出力が必要で未実現。",
					confidence: "low",
				},
				{
					id: "C20",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "レーザーフェーズドアレイSTM方式",
					classification: "D",
					classificationNote:
						"C19と同様の出力問題に加え、STMの高速走査要件が追加され実現可能性がさらに低い。",
					confidence: "low",
				},
				{
					id: "C21",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "フェーズドアレイ" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "レーザーフェーズドアレイ回転変調方式",
					classification: "D",
					classificationNote:
						"C19の問題に加え、光放射力による回転運動の再現は微弱すぎて知覚困難であり未実現。",
					confidence: "low",
				},
				{
					id: "C22",
					axisValues: [
						{ axisId: "A1", value: "レーザー(光放射力)" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "レーザー光学レンズAM方式",
					classification: "E",
					classificationNote:
						"光学レンズでレーザーを集束しても皮膚表面で知覚可能な放射力を安全に生成できず、火傷リスクがあり不成立。",
					confidence: "high",
				},
				{
					id: "C23",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "レーザー光学レンズSTM方式",
					classification: "E",
					classificationNote:
						"C22と同一理由。高出力集束レーザーは安全上不成立。",
					confidence: "high",
				},
				{
					id: "C24",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "音響レンズ・反射鏡" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "レーザー光学レンズ回転変調方式",
					classification: "E",
					classificationNote: "C22と同一理由。安全上不成立。",
					confidence: "high",
				},
				{
					id: "C25",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "機械的走査(ノズル・ミラー)" },
						{ axisId: "A3", value: "振幅変調（AM）" },
					],
					methodName: "レーザーガルバノミラー走査AM方式",
					classification: "C",
					classificationNote:
						"Lee et al.（2016）がLaserStrokeとして基礎実証。赤外レーザーをミラー走査し皮膚を熱刺激。安全性課題が大きい。",
					confidence: "medium",
				},
				{
					id: "C26",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "機械的走査(ノズル・ミラー)" },
						{ axisId: "A3", value: "時空間変調（STM）" },
					],
					methodName: "レーザーガルバノミラー走査STM方式",
					classification: "D",
					classificationNote:
						"ミラー走査のSTM適用は速度的に可能だが、安全出力範囲内での知覚可能な触覚生成の実証例がない。",
					confidence: "low",
				},
				{
					id: "C27",
					axisValues: [
						{ axisId: "A1", value: "レーザー（光放射力）" },
						{ axisId: "A2", value: "機械的走査(ノズル・ミラー)" },
						{ axisId: "A3", value: "回転・運動変調" },
					],
					methodName: "レーザーガルバノミラー走査回転変調方式",
					classification: "D",
					classificationNote:
						"理論的には走査パターンで回転知覚を生じさせうるが、安全かつ知覚可能な実現例がない。",
					confidence: "low",
				},
			],
		},
		trlIntro:
			"原理マップの演繹的導出により、27通りの組み合わせから商業化済（A）が2件、実証段階（B）が1件、基礎研究（C）が3件、空白（D）が9件、物理的不成立（E）が12件と判明した。超音波×フェーズドアレイの組み合わせが技術成熟度で圧倒的に先行しており、気流方式は限定的な基礎研究にとどまる。レーザー方式は安全性の壁が高く、多くの組み合わせが不成立である。以下では、A〜Cに分類された6方式のTRL評価を示す。",
		trlDefs: [
			{
				level: 1,
				title: "基礎原理の観測",
				desc: "基礎的な原理が観察・報告される段階。",
			},
			{
				level: 2,
				title: "技術概念の定式化",
				desc: "応用に向けた技術概念が定式化される段階。",
			},
			{
				level: 3,
				title: "概念の実験的実証",
				desc: "研究室レベルで概念が実験的に実証される段階。",
			},
			{
				level: 4,
				title: "技術の研究室検証",
				desc: "技術が研究室環境で検証される段階。",
			},
			{
				level: 5,
				title: "関連環境での検証",
				desc: "技術が関連する環境で検証される段階。",
			},
			{
				level: 6,
				title: "実証環境での実演",
				desc: "技術が実証環境で実演される段階。",
			},
			{
				level: 7,
				title: "運用環境でのプロトタイプ実証",
				desc: "プロトタイプが運用環境で実証される段階。",
			},
			{
				level: 8,
				title: "システム完成・適格性確認",
				desc: "最終システムが試験を通じて適格性を確認される段階。",
			},
			{
				level: 9,
				title: "運用環境での実績証明",
				desc: "実際の運用環境で成功裏に運用が証明される段階。",
			},
		],
		technologies: [
			{
				name: "超音波フェーズドアレイ振幅変調（AM）方式",
				nameEn: "Ultrasonic Phased Array with Amplitude Modulation",
				desc: "エネルギー媒体として超音波を選択し、フェーズドアレイで焦点を電子的に制御、振幅変調により焦点の強度を周期的に変化させて触覚を生成する方式。サブプロセス上、最も成熟した波動生成・集束・変調の組み合わせであり、Ultraleapが量産デバイスで商用展開している。",
				principleMapRef: "C01",
				subcategoryCount: 5,
				trlAvg: 8.5,
				trlSd: 0.5,
				trlN: 10,
				trlDist: [0, 0, 0, 0, 0, 0, 0, 3, 7],
				trlVerdict: "商用展開中",
				trlColor: "green",
				confidence: "high",
				sourceNote:
					"Ultraleap STRATOS製品ライン・車載キオスク導入実績に基づく https://www.ultraleap.com/haptics/",
			},
			{
				name: "超音波フェーズドアレイ時空間変調（STM）方式",
				nameEn: "Ultrasonic Phased Array with Spatiotemporal Modulation",
				desc: "超音波フェーズドアレイの焦点を16kHz級の高速で空間走査（STM）し、線・面形状の触覚パターンを生成する方式。AM方式より複雑な触覚形状を描画でき、Ultraleapが両モードを商用SDKで提供している。変調サブプロセスにおいてAM方式と質的に異なる。",
				principleMapRef: "C02",
				subcategoryCount: 3,
				trlAvg: 7.5,
				trlSd: 1.0,
				trlN: 8,
				trlDist: [0, 0, 0, 0, 0, 1, 2, 3, 2],
				trlVerdict: "商用展開中",
				trlColor: "green",
				confidence: "high",
				sourceNote:
					"Ultraleap SDK文書および複数学術論文に基づく https://docs.ultraleap.com/haptics/",
			},
			{
				name: "超音波フェーズドアレイ回転変調方式",
				nameEn: "Ultrasonic Phased Array with Rotational Modulation",
				desc: "超音波フェーズドアレイの焦点に回転運動パターンを付与し、従来のAM/STM方式では得られない強力な力感覚と多様なテクスチャを生成する方式。NTTが2025年に世界初で実証した。変調サブプロセスにおいて回転が振動より強い力覚を誘発するという新たな知見に基づく。",
				principleMapRef: "C03",
				subcategoryCount: 1,
				trlAvg: 4.5,
				trlSd: 0.5,
				trlN: 2,
				trlDist: [0, 0, 0, 1, 1, 0, 0, 0, 0],
				trlVerdict: "実証・実用化前",
				trlColor: "amber",
				confidence: "medium",
				sourceNote:
					"NTT 2025年5月プレスリリースに基づく https://group.ntt/en/newsrelease/2025/05/13/250513b.html",
			},
			{
				name: "超音波音響レンズAM方式",
				nameEn: "Ultrasonic Acoustic Lens with Amplitude Modulation",
				desc: "超音波をエネルギー媒体とし、フェーズドアレイの代わりに音響レンズまたは反射鏡で固定焦点に集束させ、振幅変調で触覚を生成する方式。焦点の動的移動がレンズ交換なしには困難なため、単一固定点の研究用途に限定される。",
				principleMapRef: "C04",
				subcategoryCount: 2,
				trlAvg: 3.0,
				trlSd: 0.5,
				trlN: 3,
				trlDist: [0, 0, 2, 1, 0, 0, 0, 0, 0],
				trlVerdict: "基礎研究・開発中",
				trlColor: "blue",
				confidence: "medium",
				sourceNote:
					"限定的な学術論文での報告に基づく(推定)。関連サーベイ: https://ieeexplore.ieee.org/document/9174896/",
			},
			{
				name: "エアジェットノズル走査AM方式",
				nameEn: "Air-Jet Nozzle Scanning with Amplitude Modulation",
				desc: "エネルギー媒体に気流を用い、ノズルの物理的な方向制御と風量変調で皮膚に触覚を与える方式。超音波方式と比べ空間分解能と応答速度に劣るが、装置コストが低い。集束サブプロセスはノズルの機械走査に依存する。",
				principleMapRef: "C16",
				subcategoryCount: 2,
				trlAvg: 3.0,
				trlSd: 1.0,
				trlN: 3,
				trlDist: [0, 1, 1, 1, 0, 0, 0, 0, 0],
				trlVerdict: "基礎研究・開発中",
				trlColor: "blue",
				confidence: "medium",
				sourceNote:
					"Suzuki & Kobayashi (2005) 等の基礎研究に基づく。関連文献: https://dl.acm.org/doi/10.1145/1099203.1099261",
			},
			{
				name: "レーザーガルバノミラー走査AM方式",
				nameEn: "Laser Galvanometer Mirror Scanning with Amplitude Modulation",
				desc: "エネルギー媒体にレーザー（赤外線）を用い、ガルバノミラーで皮膚上の照射位置を高速走査し、熱的刺激を振幅変調で制御する方式。集束サブプロセスはミラーの機械走査に依存する。安全出力範囲と知覚閾値のバランスが最大の課題である。",
				principleMapRef: "C25",
				subcategoryCount: 1,
				trlAvg: 2.5,
				trlSd: 0.5,
				trlN: 2,
				trlDist: [0, 1, 1, 0, 0, 0, 0, 0, 0],
				trlVerdict: "基礎研究・開発中",
				trlColor: "blue",
				confidence: "low",
				sourceNote:
					"Lee et al. (2016) LaserStroke等の限定的研究に基づく。関連文献: https://doi.org/10.1145/2984511.2984558",
			},
		],
		sources: [
			{
				label:
					"Rakkolainen et al. (2020) A Survey of Mid-Air Ultrasound Haptics – IEEE TVCG",
				url: "https://ieeexplore.ieee.org/document/9174896/",
			},
			{
				label: "Ultraleap Documentation – Mid-Air Haptics",
				url: "https://docs.ultraleap.com/haptics/",
			},
			{
				label: "NTT Press Release – Mid-Air Haptic Sensations (2025)",
				url: "https://group.ntt/en/newsrelease/2025/05/13/250513b.html",
			},
			{
				label:
					"Fleig et al. (2024) A Retrospective on Ultrasound Mid-Air Haptics – arXiv",
				url: "https://arxiv.org/abs/2512.07613",
			},
			{
				label:
					"Springer – Ultrasound Mid-Air Haptics for Touchless Interfaces (2022)",
				url: "https://link.springer.com/book/10.1007/978-3-031-04043-6",
			},
		],
	},

	// ── S06 課題 ─────────────────────────────────────────
	s06: {
		intro:
			"空中触覚技術は原理実証から商業化に到達したが、普及拡大にはコスト・安全性・知覚品質・規制の4領域で具体的な障壁が残る。",
		body: "<p>超音波フェーズドアレイの製造コスト、触覚刺激の物理的な強度限界、長時間利用時の知覚適応（感覚の慣れ）、そして医療・航空など安全性要件の厳しい分野での規制対応が主要課題である。特に民生用途では価格感がボトルネックとなり、産業用途では既存規格との整合性が求められる。</p>",
		challenges: [
			{
				title: "製造・実装コストの高さ",
				riskType: "economic",
				barrier: "フェーズドアレイの素子コストが民生許容価格の2〜5倍",
				body: "<p>空中触覚デバイスのコアとなるフェーズドアレイは数百個の圧電トランスデューサを精密配列する必要がある<cite>NextMSC（2024）</cite>。現行の40kHz圧電素子の単価は$0.5〜$2程度で、256素子アレイで$128〜$512の部品コストとなる。最終デバイス価格は数千ドル規模であり、公共キオスクや車載以外の民生展開は困難である<cite>Mordor Intelligence（2025）</cite>。imecはMEMS超音波トランスデューサ（CMUT/PMUT）による小型化・低コスト化を提案しているが量産には至っていない<cite>imec（2020）</cite>。</p>",
				confidence: "high",
			},
			{
				title: "触覚刺激強度の物理的限界",
				riskType: "tech",
				barrier: "音響放射力が人の知覚閾値に近く、力覚として弱い",
				body: "<p>40kHz超音波フェーズドアレイが皮膚に印加できる放射圧は約1〜10mN程度であり、指先の圧覚閾値（約5〜10mN）付近にとどまる<cite>Rakkolainen et al.（2020）</cite>。NTTの回転変調方式は力覚を従来比で大幅に増強したが、物理的な接触触覚（数百mN〜数N）には遠く及ばない<cite>NTT（2025）</cite>。より強い触覚を実現するには素子数の増加や高周波化（70kHz等）が必要だが、コスト・サイズとトレードオフになる。</p>",
				confidence: "high",
			},
			{
				title: "長時間利用時の知覚適応",
				riskType: "tech",
				barrier: "機械振動への事前暴露で空中触覚の感度が低下",
				body: "<p>最新の研究で、車内の機械的振動に手が長時間さらされると、空中触覚の知覚感度が低下することが示された<cite>Investigating mechanical adaptation（2024）</cite>。この知覚適応現象は車載用途で特に問題であり、ステアリング操作後にインフォテインメントの触覚フィードバックが感じにくくなるリスクがある。環境ノイズを考慮した適応的変調アルゴリズムの開発が急務である。</p>",
				confidence: "medium",
			},
			{
				title: "安全規制・認証との整合性",
				riskType: "regulatory",
				barrier: "航空・医療分野で既存規格が触覚操作を想定していない",
				body: "<p>航空分野では、FAA CFR Title 14 Part 60のフルフライトシミュレーター基準が「実機コクピットの物理的レプリカ」を要求しており、空中触覚の仮想コントロールがこの基準を満たせるか不透明である<cite>Girdler & Georgiou（2020）</cite>。医療機器では、IEC 60601シリーズが触覚デバイスの安全要件を定めているが、非接触超音波方式を明示的にカバーしていない。新規分類の取得に2〜3年を要する可能性がある。</p>",
				confidence: "medium",
			},
			{
				title: "超音波の可聴騒音問題",
				riskType: "social",
				barrier: "位相変化時に可聴帯域のノイズが発生",
				body: "<p>超音波トランスデューサの位相を高速切り替える際、変調によるサブハーモニクスが可聴帯域の雑音として知覚されることがある<cite>Suzuki et al.（2020）</cite>。静寂な環境（図書館・病院・美術館）では利用者や周囲への不快感の原因となりうる。Suzukiらが位相のグラデーション切替による騒音低減手法を提案しているが、完全な無音化は未達成である。</p>",
				confidence: "medium",
			},
		],
		sources: [
			{
				label: "NextMSC – Midair Ultrasound Haptics Market (2024)",
				url: "https://www.nextmsc.com/report/midair-ultrasound-haptics-market",
			},
			{
				label: "Rakkolainen et al. (2020) IEEE TVCG",
				url: "https://ieeexplore.ieee.org/document/9174896/",
			},
			{
				label: "Girdler & Georgiou (2020) Mid-Air Haptics in Aviation – arXiv",
				url: "https://arxiv.org/abs/2001.01445",
			},
			{
				label: "imec – Haptic Feedback for Smart Interfacing (2020)",
				url: "https://www.imec-int.com/en/imec-magazine/imec-magazine-june-2020/haptic-feedback-the-next-step-in-smart-interfacing",
			},
			{
				label: "NTT Press Release (2025)",
				url: "https://group.ntt/en/newsrelease/2025/05/13/250513b.html",
			},
		],
	},

	// ── S07 公的支援 ─────────────────────────────────────
	s07: {
		intro:
			"日本では、触覚技術を含むHCI・ロボティクス・XR分野の研究開発に対し、JST・NEDO・JSPS等を通じた公的支援制度が活用できる。",
		programTable: {
			headers: [
				"制度名",
				"省庁・機関",
				"対象",
				"上限額・補助率",
				"公募状況",
				"申請窓口",
			],
			rows: [
				[
					"科研費（KAKENHI）基盤研究B/C",
					"JSPS（日本学術振興会）/ 文科省",
					"大学・研究機関の研究者",
					"最大2,000万円（基盤B）/ 500万円（基盤C）",
					"定期公募",
					{
						text: "申請ページ →",
						url: "https://www.jsps.go.jp/j-grantsinaid/",
					},
				],
				[
					"JST CREST（戦略的創造研究推進事業）",
					"JST（科学技術振興機構）/ 文科省",
					"大学・企業の研究チーム",
					"1チーム1.5〜5億円・5.5年間",
					"定期公募",
					{ text: "申請ページ →", url: "https://www.jst.go.jp/kisoken/crest/" },
				],
				[
					"JST PRESTO（さきがけ）",
					"JST / 文科省",
					"若手研究者個人",
					"3,000〜4,000万円・3.5年間",
					"定期公募",
					{
						text: "申請ページ →",
						url: "https://www.jst.go.jp/kisoken/presto/",
					},
				],
				[
					"NEDO若手研究者産学連携支援",
					"NEDO（新エネルギー・産業技術総合開発機構）/ 経産省",
					"大学所属の若手研究者（企業との共同研究）",
					"プロジェクトに応じて設定（要確認）",
					"定期公募",
					{
						text: "申請ページ →",
						url: "https://www.nedo.go.jp/english/activities/ZZJP_100166.html",
					},
				],
				[
					"ものづくり補助金",
					"中小企業庁 / 経産省",
					"中小企業・小規模事業者",
					"最大1,250万円・補助率1/2〜2/3",
					"定期公募",
					{
						text: "申請ページ →",
						url: "https://portal.monodukuri-hojo.jp/",
					},
				],
				[
					"ムーンショット型研究開発制度",
					"JST・NEDO / 内閣府",
					"大学・企業の大型研究チーム",
					"目標ごとに設定（数十億円規模）",
					"要確認",
					{
						text: "申請ページ →",
						url: "https://www8.cao.go.jp/cstp/english/moonshot/jointresearch_en.html",
					},
				],
			],
		},
		sources: [
			{
				label: "JSPS – 科研費公募情報",
				url: "https://www.jsps.go.jp/j-grantsinaid/",
			},
			{
				label: "JST – CREST・PRESTOプログラム",
				url: "https://www.jst.go.jp/kisoken/presto/",
			},
			{
				label: "NEDO – 若手研究者産学連携支援",
				url: "https://www.nedo.go.jp/english/activities/ZZJP_100166.html",
			},
			{
				label: "内閣府 – ムーンショット型研究開発制度",
				url: "https://www8.cao.go.jp/cstp/english/moonshot/jointresearch_en.html",
			},
		],
	},
}

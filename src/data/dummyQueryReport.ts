import type { QueryReportData } from "@/types/query-report"

export const DUMMY_QUERY_REPORT: QueryReportData = {
	theme: "光電融合技術",
	scenario: "光電融合技術による次世代データセンター向け低消費電力インターコネクト",
	summary:
		"光電融合技術は、光（フォトニクス）と電子（エレクトロニクス）を単一チップ上に集積することで、データセンターの消費電力を最大80%削減しつつ伝送帯域を100倍以上に拡大する革新的技術。2035年には市場規模が291億ドルに達する見込みであり、日本・米国・台湾が主要競争国として知財・標準化でしのぎを削る。",

	s01: {
		kpis: [
			{ value: "291億$", label: "TAM（2035年）", color: "blue" },
			{ value: "32.9%", label: "CAGR", color: "green" },
			{ value: "TRL 5.3", label: "平均TRL", color: "amber" },
		],
		body: "データセンターの消費電力は2030年に世界電力需要の8%を超えると予測されており、AIワークロードの急拡大が主因となっている。光電融合技術はこの課題に対して根本的な解決策を提供する。従来の銅配線インターコネクトを光インターコネクトに置換することで、距離に依存しない高帯域・低遅延・低消費電力の伝送が実現する。NTT・Intel・台積電（TSMC）などの大手が次世代IOWNアーキテクチャへの組み込みを加速しており、2027〜2028年の量産開始に向けた開発競争が激化している。",
		policies: [
			{
				flag: "🇯🇵",
				country: "日本",
				text: "NTTのIOWN構想に総務省が2,000億円規模の支援。2030年実用化目標。",
				confidence: "high",
			},
			{
				flag: "🇺🇸",
				country: "米国",
				text: "CHIPSおよび科学法のもと、シリコンフォトニクスへの連邦投資が拡大。AIM Photonicsが製造ハブとして機能。",
				confidence: "high",
			},
			{
				flag: "🇹🇼",
				country: "台湾",
				text: "TSMCが3Dパッケージング技術CoWoSを活用した光電集積を2026年にテープアウト予定。",
				confidence: "medium",
			},
		],
		sources: [
			{ label: "NTT IOWN Global Forum 2024", url: "https://iowngf.org" },
			{ label: "IEA Data Centres Report 2023", url: "https://www.iea.org" },
			{ label: "Yole Group Photonics 2024", type: "memlab" },
		],
	},

	s02: {
		definitionTitle: "光電融合技術とは",
		definition:
			"光電融合技術（Electro-Optic Integration）とは、シリコンフォトニクスや化合物半導体を用い、光変調器・光検出器・レーザ光源・電子回路を単一基板またはパッケージ上に集積する技術の総称。電気信号を光信号に変換し、光ファイバや導波路で伝送した後に再度電気信号に戻すことで、銅配線の物理的限界（抵抗・容量・熱）を超える伝送性能を実現する。",
		advantages: [
			{
				label: "A",
				title: "超低消費電力",
				body: "光信号は銅配線と異なり伝送距離によらず電力損失がほぼゼロ。データセンター全体の消費電力を最大80%削減できるとNTT研究所が試算。",
				sourceStrength: "NTT IOWN白書 2024",
			},
			{
				label: "B",
				title: "超高帯域",
				body: "波長多重（WDM）技術の適用により、単一導波路で100Tbps超の伝送容量が理論上可能。現行の高速イーサネット（400GbE）の250倍以上。",
				sourceStrength: "IEEE Photonics Journal 2023",
			},
			{
				label: "C",
				title: "超低遅延",
				body: "光の速度で伝播するため、100mの距離でも電気配線比で遅延を1/3以下に抑制。AIクラスターの同期処理において決定的優位となる。",
				sourceStrength: "Lightwave Technology 2024",
			},
		],
		sources: [
			{ label: "NTT研究所 光電融合ロードマップ 2024" },
			{ label: "Nature Photonics Review 2023", url: "https://www.nature.com/nphoton" },
		],
	},

	s03: {
		tam: {
			value: "291億ドル",
			label: "2035年 市場規模（TAM）",
			color: "blue",
			sourceOrg: "Yole Group",
			sourceUrl: "https://www.yolegroup.com",
			sourceYear: "2024",
		},
		tamCards: [
			{ value: "32億ドル", label: "2024年 現在市場規模" },
			{ value: "32.9%", label: "CAGR (2024-2035)" },
			{ value: "291億ドル", label: "2035年 予測市場規模" },
		],
		forecasts: [
			{
				org: "Yole Group",
				orgUrl: "https://yolegroup.com",
				sub: "Silicon Photonics Market Report",
				current: "32億ドル（2024年）",
				future: "291億ドル（2035年）",
				pctFill: 80,
				year: "2035",
				cagr: "32.9%",
				reportUrl: "https://yolegroup.com",
				currencyBasis: "USD",
				scope: "データセンター向けシリコンフォトニクス",
				scenario: "base-case",
				confidence: "high",
			},
			{
				org: "MarketsandMarkets",
				orgUrl: "https://www.marketsandmarkets.com",
				sub: "Optical Interconnect Report",
				current: "28億ドル（2024年）",
				future: "252億ドル（2034年）",
				pctFill: 70,
				year: "2034",
				cagr: "24.6%",
				reportUrl: "https://www.marketsandmarkets.com",
				currencyBasis: "USD",
				scope: "光インターコネクト全体",
				scenario: "base-case",
				confidence: "medium",
			},
		],
		sources: [
			{ label: "Yole Group Silicon Photonics 2024" },
			{ label: "MarketsandMarkets Optical Interconnect 2024" },
		],
	},

	s04: {
		intro:
			"光電融合技術の研究は1980年代の集積光学研究に端を発し、2010年代にシリコンフォトニクスのCMOS互換プロセス確立とともに急加速した。論文・特許ともに2020年以降の増加率が著しい。",
		searchKeywords: ["silicon photonics", "electro-optic integration", "optical interconnect", "IOWN", "co-packaged optics"],
		body: "2000年代前半はIBM・IntelがSiGeフォトニクスを開拓。2015年前後から台湾・韓国勢が参入し量産技術が整備された。2020年以降はAIブームによるデータセンター需要が研究開発を牽引し、年間論文数は5,000件を超えた。",
		annualData: [
			{ year: 2018, papers: 1820, papersDelta: "+8%", patents: 620, patentsDelta: "+12%", event: "Intel Co-packaged Optics実証" },
			{ year: 2019, papers: 2140, papersDelta: "+18%", patents: 710, patentsDelta: "+15%", event: "NTT IOWN構想発表" },
			{ year: 2020, papers: 2890, papersDelta: "+35%", patents: 890, patentsDelta: "+25%", event: "COVID-19によるクラウド需要急増" },
			{ year: 2021, papers: 3620, papersDelta: "+25%", patents: 1120, patentsDelta: "+26%", event: "TSMC SiPh PDK公開" },
			{ year: 2022, papers: 4310, papersDelta: "+19%", patents: 1480, patentsDelta: "+32%", event: "ChatGPT登場、AI向け需要爆発" },
			{ year: 2023, papers: 5180, papersDelta: "+20%", patents: 1940, patentsDelta: "+31%", event: "Nvidia + Ayar Labs 光インターコネクト提携" },
		],
		patentLagNote: "特許データには出願から公開まで18〜24ヶ月の遅延があるため、2022〜2023年の数値は実際より過小評価の可能性がある。",
		chartPhases: [
			{ phase: 1, yearRange: "1985–2009", title: "基礎研究フェーズ", desc: "集積光学・SOI導波路の基礎確立。大学研究室中心。" },
			{ phase: 2, yearRange: "2010–2019", title: "産業化フェーズ", desc: "CMOSファウンドリとの融合。Intel・IBMがパイロット量産。" },
			{ phase: 3, yearRange: "2020–現在", title: "スケールアップフェーズ", desc: "AI需要に牽引され市場急拡大。TSMC・台積電が量産競争。" },
		],
		events: [
			{ date: "2019-01", title: "NTT IOWN構想発表", body: "NTTが光と電気を融合した次世代インフラ「IOWN」を発表。2030年実用化を目標として掲げた。", confidence: "high" },
			{ date: "2021-06", title: "TSMC SiPh PDK公開", body: "TSMCがシリコンフォトニクス向けPDKをファウンドリ顧客に公開し、設計参入障壁を大幅に引き下げた。", confidence: "high" },
			{ date: "2023-03", title: "Nvidia × Ayar Labs提携", body: "NvidiaがAyar LabsのTeraPHY光I/O技術をH100後継チップに採用する方針を発表。", confidence: "medium" },
		],
		papersTable: {
			headers: ["年", "論文数", "主要掲載誌", "引用数トップ論文"],
			rows: [
				["2023", "5,180", "Nature Photonics, OFC", "\"On-chip optical interconnect at 100Tbps\" — Stanford 2023"],
				["2022", "4,310", "Optics Express, Photonics Research", "\"Energy-efficient co-packaged optics\" — MIT 2022"],
			],
		},
		patents: {
			trendNote: "2023年の特許出願数は前年比31%増。日本（NTT・富士通）と米国（Intel・Nvidia）が出願数で拮抗。",
			topAssignees: [
				{ name: "NTT", country: "JP", count: "284件" },
				{ name: "Intel", country: "US", count: "241件" },
				{ name: "Cisco", country: "US", count: "198件" },
				{ name: "富士通", country: "JP", count: "176件" },
				{ name: "TSMC", country: "TW", count: "154件" },
			],
			dataSource: "Espacenet / J-PlatPat (2024年3月時点)",
			confidence: "high",
		},
		sources: [
			{ label: "Web of Science 光電融合関連論文 2024年集計" },
			{ label: "J-PlatPat 特許データベース 2024" },
		],
	},

	s05: {
		scopeDeclaration: {
			broadDef: "光と電子の信号処理を組み合わせるあらゆる技術（レーザ通信・光コンピューティング含む）",
			narrowDef: "シリコンフォトニクスを用いたデータセンター向け電気光変換・集積インターコネクト",
			adoptedScope: "狭義定義（データセンター向けシリコンフォトニクス集積）を採用",
			excluded: [
				{ name: "自由空間光通信（FSO）", reason: "集積化されておらず異なる市場セグメント" },
				{ name: "量子光学・量子コンピューティング", reason: "現時点でデータセンター実用化から乖離" },
			],
		},
		subprocesses: {
			centralMechanism: "電気信号→光変調→光導波路伝送→光電変換→電気信号の変換サイクル",
			items: [
				{ name: "電気光変換（EO変調）", description: "電気信号で光の強度・位相・偏波を制御する素子。リングレゾネータや MZI変調器が主流。", isEssential: true, keyVariables: ["変調帯域幅(GHz)", "駆動電圧(V)", "挿入損失(dB)"] },
				{ name: "光導波路・伝送", description: "シリコン細線導波路やSiN導波路でオンチップ/オンパッケージ伝送を行う。", isEssential: true, keyVariables: ["伝播損失(dB/cm)", "曲げ半径(μm)", "偏波依存損失"] },
				{ name: "光電変換（PD）", description: "Ge-on-Si受光素子で光信号を電気信号に戻す。", isEssential: true, keyVariables: ["応答速度(GHz)", "暗電流(nA)", "量子効率(%)"] },
				{ name: "レーザ光源集積", description: "IIIーV族化合物半導体レーザをSiチップに直接ボンディングまたはモジュール内蔵する。", isEssential: true, keyVariables: ["発振波長(nm)", "温度特性", "MTBF(時間)"] },
			],
		},
		principleAxes: [
			{ axisId: "A1", name: "変調方式", nameEn: "Modulation", linkedSubprocess: "電気光変換（EO変調）", values: ["強度変調（IM）", "コヒーレント変調", "位相変調（BPSK/QPSK）"], independenceNote: "変調方式は伝送路選定と独立して選択可能" },
			{ axisId: "A2", name: "集積基板", nameEn: "Integration Platform", linkedSubprocess: "光導波路・伝送", values: ["SOI（シリコン）", "SiN", "InP系化合物半導体"], independenceNote: "基板は変調方式から独立した材料選択" },
		],
		principleMap: {
			totalCombinations: 9,
			axesSummary: "変調方式×集積基板の2軸、計9通りの組み合わせが理論上存在。現在市場で実用化されているのは3通り。",
			combinations: [
				{ id: "C1", axisValues: [{ axisId: "A1", value: "強度変調（IM）" }, { axisId: "A2", value: "SOI（シリコン）" }], methodName: "SOI-IMDDシステム", classification: "A", classificationNote: "最も量産が進んだ主流構成。400G-DR4等に採用済み。", confidence: "high" },
				{ id: "C2", axisValues: [{ axisId: "A1", value: "コヒーレント変調" }, { axisId: "A2", value: "SOI（シリコン）" }], methodName: "シリコンコヒーレントDSP", classification: "B", classificationNote: "ZR/ZR+規格向け。長距離伝送でコスト優位。", confidence: "high" },
			],
		},
		trlIntro: "光電融合技術の構成要素ごとにTRL評価を実施。変調器・受光素子はTRL 8〜9だが、IIIーV族レーザの量産集積はTRL 5〜6に留まる。",
		trlDefs: [
			{ level: 9, title: "実証済み・量産稼働", desc: "量産ライン確立・顧客出荷中" },
			{ level: 7, title: "システム実証", desc: "実環境プロトタイプで性能確認" },
			{ level: 5, title: "関連環境検証", desc: "関連環境でのコンポーネント検証" },
			{ level: 3, title: "概念実証", desc: "PoC・実験室実証" },
		],
		technologies: [
			{ name: "シリコン光変調器（MZI）", nameEn: "Si MZI Modulator", desc: "CMOSプロセスで製造可能な電気光変換素子。400G以上の高速変調に対応。", principleMapRef: "C1", subcategoryCount: 4, trlAvg: 8.2, trlSd: 0.5, trlN: 12, trlDist: [0, 0, 0, 0, 0, 0, 0, 2, 7, 3], trlVerdict: "量産段階。Cisco・Intelが商用出荷中。", trlColor: "green", confidence: "high" },
			{ name: "Ge-on-Si受光素子", nameEn: "Ge-on-Si Photodetector", desc: "Siプロセスに組み込めるGe受光素子。高速・低コストを両立。", principleMapRef: "C1", subcategoryCount: 3, trlAvg: 8.8, trlSd: 0.3, trlN: 8, trlDist: [0, 0, 0, 0, 0, 0, 0, 0, 4, 4], trlVerdict: "成熟技術。主要ファウンドリの標準PDKに収録。", trlColor: "green", confidence: "high" },
			{ name: "IIIーV族レーザ直接集積", nameEn: "III-V on Si Laser Integration", desc: "InP系レーザをSiウェハに直接ボンディングする最難関技術。収率・熱設計が課題。", principleMapRef: "C2", subcategoryCount: 5, trlAvg: 5.1, trlSd: 1.2, trlN: 15, trlDist: [0, 0, 0, 1, 5, 6, 3, 0, 0, 0], trlVerdict: "研究開発段階。2027〜2028年の量産開始を複数社が目標とする。", trlColor: "amber", confidence: "medium" },
		],
		sources: [
			{ label: "SEMI Silicon Photonics Roadmap 2024" },
			{ label: "OFC 2024 Technical Digest" },
		],
	},

	s06: {
		intro: "光電融合技術の普及には、技術・経済・制度の3層にわたる構造的課題が残る。特にIIIーV族レーザの集積コストと測定標準の整備が短期ボトルネックとなっている。",
		body: "TRL 5〜6の技術要素が複数残存しており、量産スケールアップが最大の技術課題。また、シリコンフォトニクスのデザインルールは各ファウンドリ固有であり、設計の移植性が低い。",
		challenges: [
			{ title: "IIIーV族レーザの量産集積コスト", riskType: "tech", barrier: "TRL 5〜6、収率10〜30%が課題", body: "InP on Siボンディングの歩留まり向上とウェハ径の6インチ→8インチ移行が量産コスト削減の鍵。現状のコストは銅配線比で3〜5倍高い。", confidence: "high" },
			{ title: "設計エコシステムの未成熟", riskType: "tech", barrier: "PDK・EDA標準の分散", body: "各ファウンドリのPDKが非互換であるため、設計資産の再利用が困難。AIM PhotonicsのPDK標準化活動が進行中だが、2026年以降の本格普及見込み。", confidence: "medium" },
			{ title: "米中デカップリングによるサプライチェーン分断", riskType: "geopolitical", barrier: "InP基板の中国依存（世界供給の40%）", body: "InP基板の主要産地は中国であり、米国の輸出規制強化シナリオでは材料調達リスクが高まる。日本・欧州での代替供給網の整備が急務。", confidence: "medium" },
		],
		sources: [
			{ label: "Gartner Hype Cycle for Semiconductors 2024" },
			{ label: "ITRI Taiwan Photonics Risk Report 2024" },
		],
	},

	s07: {
		intro: "光電融合技術は日本・米国・欧州の主要国で重点支援対象に指定されており、補助金・研究開発助成が整備されつつある。",
		programTable: {
			headers: ["国", "プログラム名", "規模", "対象", "状態"],
			rows: [
				["🇯🇵 日本", "IOWN推進プログラム（総務省）", "2,000億円", "光電融合・IOWN関連研究", "募集中"],
				["🇯🇵 日本", "NEDO Green Innovation基金（光電融合枠）", "300億円", "低消費電力フォトニクス", "定期公募"],
				["🇺🇸 米国", "CHIPS Act — Advanced Packaging R&D", "$30億", "シリコンフォトニクス量産", "募集中"],
				["🇺🇸 米国", "NSF / DARPA PIPES Program", "$1.5億", "光インターコネクト基礎研究", "要確認"],
				["🇪🇺 EU", "Horizon Europe Photonics21", "€4.5億", "欧州フォトニクスエコシステム", "定期公募"],
			],
		},
		sources: [
			{ label: "総務省 IOWN補助金情報 2024年度" },
			{ label: "NEDO Green Innovation基金公募要領" },
			{ label: "CHIPS.gov Advanced Packaging Funding 2024" },
		],
	},
}

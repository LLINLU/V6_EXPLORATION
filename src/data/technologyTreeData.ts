export const level1Items = [
	{
		id: "astronomy",
		name: "天文観測の改善",
		info: "42論文 • 15事例",
		description:
			"天文観測のために、地球の乱流大気を通して視界を強化し、回折限界に近い解像度を達成する。",
	},
	{
		id: "biomedical",
		name: "生体医学イメージングの進歩",
		info: "38論文 • 14事例",
		description:
			"細胞レベルでの解像度と明瞭さを向上させるため、医療および生物学的イメージングに適応光学を応用する。",
	},
	{
		id: "defense",
		name: "防衛と監視の支援",
		info: "35論文 • 12事例",
		description:
			"大気を通した強化されたイメージング、ターゲティング、およびレーザー伝播のために防衛アプリケーションで適応光学を使用する。",
	},
	{
		id: "industrial",
		name: "産業応用",
		info: "28論文 • 10事例",
		description:
			"製造、計測、および品質管理プロセスにおける光学系の改善のために適応光学技術を産業的に応用する。",
	},
	{
		id: "communications",
		name: "通信システムの強化",
		info: "25論文 • 8事例",
		description:
			"自由空間光通信とネットワーキングにおける信号品質と接続性を向上させるための適応光学技術の活用。",
	},
]

export const level2Items = {
	astronomy: [
		{
			id: "turbulence-compensation",
			name: "大気乱流補正",
			info: "18論文 • 6事例",
			description:
				"より明確な天文イメージングを達成するために、大気乱流によって引き起こされる光学的歪みを補正するための技術。",
		},
		{
			id: "wavefront-reconstruction",
			name: "波面再構成",
			info: "14論文 • 5事例",
			description:
				"大気乱流によって歪められた光の波面を分析し数学的に再構成する方法。",
		},
		{
			id: "wavefront-correction",
			name: "波面補正",
			info: "16論文 • 4事例",
			description: "大気の歪みを補正するために光波を物理的に操作する技術。",
		},
		{
			id: "extreme-adaptive-optics",
			name: "極限適応光学",
			info: "10論文 • 3事例",
			description:
				"系外惑星の直接撮像や特性評価のために、極めて高い精度と性能で作動する先進的な適応光学システム。",
		},
		{
			id: "multi-conjugate-ao",
			name: "マルチコンジュゲート適応光学",
			info: "12論文 • 4事例",
			description:
				"複数の高さにおける大気乱流を同時に補正し、より広い視野での鮮明な天体観測を可能にする技術。",
		},
	],
	biomedical: [
		{
			id: "high-resolution-microscopy",
			name: "高解像度顕微鏡法／網膜イメージング",
			info: "20論文 • 7事例",
			description:
				"医学診断のための細胞レベルの解像度を達成するために適応光学を顕微鏡法と網膜イメージングに応用すること。",
		},
		{
			id: "depth-correction",
			name: "OCTにおける深度補正",
			info: "12論文 • 4事例",
			description:
				"深度依存の収差を補正することによって光コヒーレンストモグラフィーを改善する方法。",
		},
		{
			id: "live-imaging",
			name: "ライブイメージングフィードバック",
			info: "14論文 • 3事例",
			description:
				"医学応用における生体組織の生体内イメージングのためのリアルタイム適応補正を提供するシステム。",
		},
		{
			id: "cellular-tracking",
			name: "細胞追跡・解析",
			info: "10論文 • 3事例",
			description:
				"生きた組織内の個々の細胞を追跡および分析するための高精度イメージング技術。",
		},
		{
			id: "surgical-visualization",
			name: "外科的視覚化",
			info: "11論文 • 3事例",
			description:
				"外科医が複雑な手術をより精密に実施できるよう、手術中のリアルタイム適応イメージングを提供する技術。",
		},
	],
	defense: [
		{
			id: "image-stabilization",
			name: "画像安定化とターゲット追跡",
			info: "16論文 • 5事例",
			description:
				"大気の乱れを通して移動するターゲットの安定したイメージングを維持するための技術。",
		},
		{
			id: "beam-propagation",
			name: "ビーム伝播のための大気補正",
			info: "13論文 • 4事例",
			description:
				"長距離伝播のための大気効果に対抗するためにレーザービームを事前補正するシステム。",
		},
		{
			id: "precision-guidance",
			name: "精密誘導システム",
			info: "14論文 • 3事例",
			description:
				"精度と性能を向上させるために誘導システムと統合された適応光学技術。",
		},
		{
			id: "long-range-imaging",
			name: "長距離監視イメージング",
			info: "8論文 • 2事例",
			description:
				"大気乱流の影響を受ける長距離にわたって高解像度の監視画像を取得するためのシステム。",
		},
		{
			id: "secure-communications",
			name: "セキュア通信",
			info: "9論文 • 3事例",
			description:
				"適応光学を利用して大気を通じた高セキュリティの光通信リンクを確立するための技術。",
		},
	],
	industrial: [
		{
			id: "laser-manufacturing",
			name: "レーザー加工",
			info: "10論文 • 4事例",
			description:
				"材料加工のためのレーザービーム品質と焦点位置を向上させる適応光学技術。",
		},
		{
			id: "quality-inspection",
			name: "品質検査",
			info: "8論文 • 3事例",
			description: "製造ラインでの高速かつ高精度な光学検査システム。",
		},
		{
			id: "metrology",
			name: "精密計測",
			info: "9論文 • 2事例",
			description: "産業計測における光学系の収差補正による測定精度の向上。",
		},
		{
			id: "3d-printing",
			name: "3Dプリンティング",
			info: "7論文 • 2事例",
			description:
				"光造形や選択的レーザー焼結など、3Dプリンティング技術の精度と解像度を向上させる応用。",
		},
		{
			id: "semiconductor",
			name: "半導体製造",
			info: "8論文 • 3事例",
			description:
				"リソグラフィーや検査プロセスにおける適応光学の応用による半導体製造の向上。",
		},
	],
	communications: [
		{
			id: "free-space-optical",
			name: "自由空間光通信",
			info: "10論文 • 3事例",
			description:
				"大気乱流の影響を軽減し、自由空間光通信リンクの信頼性を向上させる技術。",
		},
		{
			id: "quantum-key-distribution",
			name: "量子鍵配送",
			info: "8論文 • 2事例",
			description:
				"量子通信システムにおける光子の伝送効率と整合性を高めるための適応光学技術。",
		},
		{
			id: "satellite-communications",
			name: "衛星通信",
			info: "9論文 • 3事例",
			description:
				"地上と衛星間の光通信リンクの品質を向上させるための大気補正技術。",
		},
		{
			id: "high-bandwidth",
			name: "高帯域幅ネットワーク",
			info: "7論文 • 2事例",
			description:
				"都市間や建物間の高帯域幅光ネットワークのための適応光学ソリューション。",
		},
		{
			id: "underwater-communications",
			name: "水中通信",
			info: "6論文 • 2事例",
			description:
				"水中光通信における乱流と散乱の影響を軽減するための適応補正技術。",
		},
	],
}

export const level3Items = {
	"turbulence-compensation": [
		{
			id: "laser-guide-star",
			name: "レーザーガイドスターシステム",
			info: "10論文 • 3事例",
			description:
				"ナトリウム層技術とレイリー技術を含む適応光学システムのための大気歪みを測定するためにレーザーを使用して作成された人工参照星。",
		},
		{
			id: "shack-hartmann-astronomy",
			name: "シャック・ハルトマンセンサー",
			info: "8論文 • 3事例",
			description:
				"レンズレットアレイとカメラセンサーを使用して波面の歪みを測定する光学装置で、天文学的適応光学でよく使用される。",
		},
		{
			id: "pyramid-wavefront",
			name: "ピラミッド波面センサー",
			info: "6論文 • 2事例",
			description:
				"高感度波面測定のためのピラミッド型の光学素子を使用した先進的な波面センシング技術。",
		},
		{
			id: "tomography-techniques",
			name: "大気トモグラフィー",
			info: "7論文 • 2事例",
			description:
				"複数の方向からのデータを用いて大気乱流の3次元構造を再構成する計算技術。",
		},
		{
			id: "predictive-control",
			name: "予測制御アルゴリズム",
			info: "5論文 • 2事例",
			description:
				"時間的進化を予測し、大気乱流の効果に先んじて補正を適用する制御戦略。",
		},
	],
	"wavefront-reconstruction": [
		{
			id: "matrix-vector",
			name: "行列ベクトル処理",
			info: "7論文 • 2事例",
			description:
				"波面センサーデータを効率的に処理し、補正コマンドを計算するための行列演算を用いた計算方法。",
		},
		{
			id: "modal-decomposition",
			name: "モード分解アルゴリズム",
			info: "7論文 • 3事例",
			description:
				"より効率的な補正のために複雑な波面収差をより単純な成分（モード）に分解する数学的技術。",
		},
		{
			id: "zernike-polynomials",
			name: "ゼルニケ多項式解析",
			info: "5論文 • 2事例",
			description:
				"光学系の収差をゼルニケ多項式の線形結合として表現し分析する手法。",
		},
		{
			id: "fourier-methods",
			name: "フーリエ変換法",
			info: "6論文 • 2事例",
			description: "波面再構成のための周波数領域での効率的な計算手法。",
		},
		{
			id: "neural-networks",
			name: "ニューラルネットワーク再構成",
			info: "5論文 • 1事例",
			description:
				"機械学習を用いて波面センサーデータから波面を再構成する最新のアプローチ。",
		},
	],
	"wavefront-correction": [
		{
			id: "deformable-mirrors-astronomy",
			name: "可変形ミラー",
			info: "9論文 • 2事例",
			description:
				"天文観測における波面収差を補正するために形状を急速に変化させることができる大型アクチュエータを備えた高精度ミラー。",
		},
		{
			id: "tip-tilt-astronomy",
			name: "チップ・チルトミラー",
			info: "7論文 • 2事例",
			description:
				"画像位置を安定させるために最大の大気収差（チップとチルト）を補正する高速ステアリングミラー。",
		},
		{
			id: "mems-mirrors",
			name: "MEMSミラーアレイ",
			info: "6論文 • 2事例",
			description:
				"小型で高速な応答特性を持つマイクロエレクトロメカニカルシステム技術を用いたミラーアレイ。",
		},
		{
			id: "liquid-crystal",
			name: "液晶空間光変調器",
			info: "5論文 • 1事例",
			description:
				"電圧制御による液晶分子の配向変化を利用して光の位相を変調する装置。",
		},
		{
			id: "bimorph-mirrors",
			name: "バイモルフミラー",
			info: "5論文 • 2事例",
			description: "圧電素子を用いた曲率制御が可能な特殊な可変形ミラー技術。",
		},
	],
	"high-resolution-microscopy": [
		{
			id: "wavefront-sensors-bio",
			name: "波面センサー",
			info: "11論文 • 4事例",
			description:
				"シャック・ハルトマンセンシングと曲率センシングアプローチを含む、生物医学イメージングにおいて波面歪みを測定するために使用される光学装置。",
		},
		{
			id: "deformable-mirrors-bio",
			name: "可変形ミラー",
			info: "9論文 • 3事例",
			description:
				"高解像度細胞イメージングを可能にするために生物学的組織の光学収差を補正する適応型ミラー。",
		},
		{
			id: "confocal-integration",
			name: "共焦点顕微鏡統合",
			info: "7論文 • 2事例",
			description:
				"適応光学と共焦点イメージング技術を組み合わせた高解像度3次元可視化システム。",
		},
		{
			id: "multi-photon",
			name: "多光子顕微鏡",
			info: "6論文 • 2事例",
			description:
				"深部組織イメージングのための多光子励起と適応補正を組み合わせた技術。",
		},
		{
			id: "super-resolution",
			name: "超解像技術",
			info: "7論文 • 2事例",
			description:
				"回折限界を超える解像度を実現するために適応光学と超解像法を組み合わせたアプローチ。",
		},
	],
	"depth-correction": [
		{
			id: "ao-oct",
			name: "適応光学OCTモジュール",
			info: "6論文 • 2事例",
			description:
				"組織内のイメージング深度と解像度を向上させるために適応光学と光コヒーレンストモグラフィーを統合した特殊モジュール。",
		},
		{
			id: "fpga-controllers",
			name: "低レイテンシーFPGAコントローラー",
			info: "6論文 • 2事例",
			description:
				"リアルタイム補正のための波面センシングデータの高速、低レイテンシー処理用に設計されたフィールドプログラマブルゲートアレイシステム。",
		},
		{
			id: "tissue-models",
			name: "組織散乱モデル",
			info: "5論文 • 1事例",
			description:
				"生体組織内の光伝播と散乱を予測し、適応補正を最適化するための計算モデル。",
		},
		{
			id: "volumetric-correction",
			name: "体積補正アルゴリズム",
			info: "4論文 • 1事例",
			description:
				"3次元体積全体にわたって変化する収差を補正するための計算手法。",
		},
		{
			id: "phase-conjugation",
			name: "光学位相共役",
			info: "5論文 • 2事例",
			description:
				"散乱媒質を通過する光の歪みを補正するためにその位相の共役を用いる技術。",
		},
	],
	"live-imaging": [
		{
			id: "real-time-imaging",
			name: "リアルタイムイメージングシステム",
			info: "8論文 • 2事例",
			description:
				"医療診断および処置中の生体組織イメージング中に継続的な適応補正を提供する統合システム。",
		},
		{
			id: "control-algorithms",
			name: "制御アルゴリズム",
			info: "6論文 • 1事例",
			description:
				"生物医学応用のための適応光学システムの性能を最適化する特殊ソフトウェアアルゴリズム。",
		},
		{
			id: "fast-feedback",
			name: "高速フィードバック機構",
			info: "5論文 • 2事例",
			description:
				"ミリ秒レベルの応答時間で生体組織の動きや変化に対応する高速制御システム。",
		},
		{
			id: "sensorless-ao",
			name: "センサーレス適応光学",
			info: "6論文 • 1事例",
			description:
				"イメージ品質メトリクスのみを用いて波面センサーなしで収差を補正する手法。",
		},
		{
			id: "motion-compensation",
			name: "モーション補償",
			info: "5論文 • 1事例",
			description:
				"生体の動きや呼吸に起因するアーティファクトを軽減する画像処理技術。",
		},
	],
	"image-stabilization": [
		{
			id: "tip-tilt-defense",
			name: "チップ・チルトミラー",
			info: "9論文 • 3事例",
			description:
				"プラットフォームの動きと大気効果を迅速に補償するために防衛システムで使用される高速ステアリングミラー。",
		},
		{
			id: "real-time-sensors",
			name: "リアルタイムセンサーとコントローラー",
			info: "7論文 • 2事例",
			description:
				"大気乱流を通して移動するターゲットを追跡するために最適化された高速センシングおよび制御システム。",
		},
		{
			id: "inertial-stabilization",
			name: "慣性安定化",
			info: "5論文 • 2事例",
			description:
				"プラットフォームの振動や動きを補償するための慣性測定と光学安定化の組み合わせ。",
		},
		{
			id: "multi-target",
			name: "複数ターゲット追跡",
			info: "6論文 • 1事例",
			description:
				"広視野内の複数の移動ターゲットを同時に追跡・安定化するシステム。",
		},
		{
			id: "image-registration",
			name: "画像レジストレーション",
			info: "5論文 • 1事例",
			description:
				"連続フレーム間の自動アライメントによる画像安定化のためのソフトウェア技術。",
		},
	],
	"beam-propagation": [
		{
			id: "deformable-mirrors-defense",
			name: "可変形ミラー",
			info: "7論文 • 2事例",
			description:
				"長距離ターゲティングと通信における大気歪みを補償するためにレーザービームを事前に形成する先進的なミラーシステム。",
		},
		{
			id: "shack-hartmann-defense",
			name: "シャック・ハルトマンセンサー",
			info: "6論文 • 2事例",
			description:
				"ビーム伝播補正のための大気歪みを測定するために防衛応用に適応された波面センサー。",
		},
		{
			id: "beam-quality",
			name: "ビーム品質最適化",
			info: "5論文 • 1事例",
			description:
				"大気伝播におけるビームの集光性と強度を最大化するための波面制御技術。",
		},
		{
			id: "thermal-blooming",
			name: "熱膨張補償",
			info: "6論文 • 2事例",
			description:
				"高出力レーザーが大気を加熱することによって生じるビーム歪みを軽減する技術。",
		},
		{
			id: "atmospheric-modeling",
			name: "大気伝播モデル",
			info: "5論文 • 1事例",
			description:
				"様々な気象条件下でのレーザービーム伝播を予測し補正するための数値モデル。",
		},
	],
	"precision-guidance": [
		{
			id: "adaptive-tracking",
			name: "適応型レーザー追跡",
			info: "8論文 • 2事例",
			description:
				"大気乱流を通してターゲットへのロックを維持するために適応光学を使用する先進的な追跡システム。",
		},
		{
			id: "real-time-control",
			name: "リアルタイム制御アルゴリズム",
			info: "6論文 • 1事例",
			description:
				"適応光学を備えた誘導システムにおける高速の意思決定のために最適化された特殊アルゴリズム。",
		},
		{
			id: "sensor-fusion",
			name: "センサーフュージョン",
			info: "5論文 • 2事例",
			description: "複数のセンサーデータを統合して誘導精度を向上させる手法。",
		},
		{
			id: "target-identification",
			name: "ターゲット識別強化",
			info: "6論文 • 1事例",
			description:
				"適応光学による画像鮮明化を用いたターゲット認識・分類の改善。",
		},
		{
			id: "autonomous-targeting",
			name: "自律ターゲティング",
			info: "5論文 • 1事例",
			description:
				"人間の介入なしにターゲットを検出・追跡・ロックするAI支援システム。",
		},
	],
}

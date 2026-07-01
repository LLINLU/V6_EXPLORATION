/**
 * GPT-4o を使って市場実装情報の要約を生成する。
 *
 * @param markets       - 検索で取得した市場実装情報
 * @param query         - 検索クエリ
 * @param openaiApiKey  - OpenAI API キー
 * @returns 日本語の要約テキスト（約1000字）
 */ export async function generateUseCaseSummary(markets, query, openaiApiKey) {
	if (markets.length === 0) {
		return "この検索条件に該当するユースケースは見つかりませんでした。"
	}
	const useCasesText = markets
		.map((market) => {
			const pressReleases =
				Array.isArray(market.press_releases) && market.press_releases.length > 0
					? market.press_releases
							.map((pr) => `<a href="${pr}" target="_blank">${pr}</a>`)
							.join(", ")
					: "N/A"
			return [
				`Product: ${market.product}`,
				`Company: ${Array.isArray(market.company) ? market.company.join(", ") : market.company}`,
				`Description: ${market.description}`,
				`Stage: ${market.stage}`,
				`Press Releases: ${pressReleases}`,
			].join("\n")
		})
		.join("\n\n")
	const prompt = `### ユーザーのペルソナ (User Persona)
- あなたは研究者、アナリスト、戦略立案担当者のいずれかであり、
- 製品・技術に関する大量のユースケース情報を整理し、共通するトレンドや課題を把握したい。
- 全体像を深く理解して、ビジネス戦略や研究の方向性に活かすことを目的としている。

### アシスタントのペルソナ (Assistant Persona)
- あなたは大量の製品・技術情報を統合して分析する専門のリサーチアナリスト。
- 多分野（医療、IT、製造、エネルギー、消費財など）にわたる技術・製品を分析し、
特徴・用途・価値・動向・課題を論理的かつ網羅的に整理することができる。
- ユーザーが戦略的意思決定や研究計画立案に使える深いインサイトを提供する。

### 出力要件
1. 最初から内容に入り、解説的な前置きは書かない。
2. 各製品や技術の名称、企業名、特徴、用途、導入背景を具体的に織り込みながらまとめる。
3. 製品の分野・カテゴリごとに構造化し、段落を明確に分ける。
4. 商用化済み（commercial）とR&D段階（rnd）の動向をそれぞれ整理する。
5. 各カテゴリの共通する動向や課題、全体に共通するトレンド・今後の示唆を必ず含める。
6. 出力は日本語で **1000字程度** の長文にし、論理性と読みやすさを意識して構成する。

### 入力:
Query: ${query}

Market Implementations:

${useCasesText}

### 出力:
- 日本語の詳細サマリー（1000字）
- カテゴリごとの大きな段落構成で整理
- 各製品の特徴や価値を深掘り、分野間の関係性や全体のトレンドも含める
- HTMLリンクを適切に含める`
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${openaiApiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"あなたは大量の製品・技術情報を統合して分析する専門のリサーチアナリストです。HTMLリンクを含む日本語の詳細サマリーを作成してください。",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 2000,
			temperature: 0.3,
		}),
	})
	if (!response.ok) {
		console.error(`[SUMMARY] OpenAI API error: ${response.status}`)
		return "要約の生成中にエラーが発生しました。"
	}
	const result = await response.json()
	return result.choices[0].message.content.trim()
}

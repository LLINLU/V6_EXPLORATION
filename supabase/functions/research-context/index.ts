import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}

const TED_PROMPT = `Query＝\${Query}
目的＝\${AIM}

### ROLE

あなたは、与えられた「Query」と「目的」から、どのような**市場領域（業界・産業・ビジネス領域）**や**アプリケーション領域（実装される具体的な用途やソリューション）**、および**応用テーマ（解決される課題や新たな価値提案）**が考えられるかを**Chain of Thought**形式で思考し、抽出・整理してください。

### 要求仕様

**ステップ1:** 「目的」を読み取り、背景にある課題・ニーズ・解決すべき問題をChain of Thought（思考の連鎖）で簡潔に推論してください（1～3文）。
**ステップ2:** 推論に基づき、関連しそうな「市場領域・業界・ビジネス領域」を3～5個列挙してください。
**ステップ3:** さらに、それらの中で特に有望・現実的な「アプリケーション領域・用途・ソリューション例」を3～5個列挙してください。
**ステップ4:** 最後に、上記を踏まえて「応用テーマ（解決できる課題、期待される価値や新サービス）」を3～5個列挙してください。
**ステップ5:** 以下のJSONフォーマットで出力してください（**日本語**で記述）。

\`\`\`json
{
  "chain_of_thought": "",
  "target_market_areas": [
    "市場領域1",
    "市場領域2",
    "市場領域3"
  ],
  "application_areas": [
    "アプリケーション領域1",
    "アプリケーション領域2",
    "アプリケーション領域3"
  ],
  "application_themes": [
    "応用テーマ1",
    "応用テーマ2",
    "応用テーマ3"
  ]
}
\`\`\`

---

### 注意事項

* 出力は必ず上記JSON形式に厳密に従うこと。
* 「chain_of_thought」には推論プロセスを簡潔に記述すること。
* 各リストは3～5個程度が望ましい。
* 「市場領域」や「アプリケーション領域」は**現実の事業や産業展開の観点**を意識し、「応用テーマ」は**課題解決や新しい価値創出につながる観点**で具体的に記述すること。
* 汎用的な分野名（例：製造業、医療分野など）ではなく、より具体的な市場・アプリケーション名を意識すること。`

const FAST_PROMPT = `Query = \${Query}
目的=\${AIM}

### ROLE
あなたは、与えられた「Query」と「目的」に対して、その内容から考えられる「技術的課題」や「技術ニーズ」を**思考の連鎖（Chain of Thought）**により推論し、その結果に基づいて「技術領域（分野）」および「注目すべき技術的な仕組み・観点」をそれぞれ3～5個ずつ抽出・列挙してください。

### 要求仕様
**ステップ1:**
  まず与えられた「目的」と「Query」から、どのような技術的な課題・ニーズ・解決すべき問題があるかをChain of Thought形式で論理的に推論してください。
  ※ 1～3文程度で簡潔にまとめてください。
**ステップ2:**
  上記の推論をもとに、「技術領域（分野）」を3～5個、列挙してください。
**ステップ3:**
  さらに、「注目したい技術的な仕組み・観点」を3～5個、列挙してください。
  ※ より具体的な原理、構成要素、方式、制御、設計観点などを意識してください。
**ステップ4:**
  以下のJSONフォーマットに従い、出力してください（**日本語**で記述）。

\`\`\`json
{
  "chain_of_thought": "",
  "technical_domains": [
    "技術領域1",
    "技術領域2",
    "技術領域3"
  ],
  "focus_mechanisms": [
    "仕組み・観点1",
    "仕組み・観点2",
    "仕組み・観点3"
  ]
}
\`\`\`

---

### 注意事項

* 出力は上記のJSON形式に厳密に従ってください。
* 「chain_of_thought」にはあなたの推論方法を記述してください。
* 「technical_domains」「focus_mechanisms」は、それぞれ3～5個を目安としてください。
* 「focus_mechanisms」は、できるだけ具体的かつ技術的特徴や設計・制御・原理・構成要素などを意識してください。`

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		const { query, aim, type } = await req.json()

		console.log("Received research context request:", { query, aim, type })

		if (!query || !aim || !type) {
			return new Response(
				JSON.stringify({ error: "Query, AIM, and type are required" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		if (type !== "TED" && type !== "FAST") {
			return new Response(
				JSON.stringify({ error: "Type must be either 'TED' or 'FAST'" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		// Select the appropriate prompt based on type
		const promptTemplate = type === "TED" ? TED_PROMPT : FAST_PROMPT

		// Replace placeholders in the prompt
		const prompt = promptTemplate
			.replace(/\${Query}/g, query)
			.replace(/\${AIM}/g, aim)

		const messages = [
			{
				role: "user",
				content: prompt,
			},
		]

		console.log("Sending request to OpenAI with type:", type)

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openAIApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4.1-mini",
				messages: messages,
			}),
		})

		if (!response.ok) {
			console.error("OpenAI API error:", response.status, response.statusText)
			return new Response(
				JSON.stringify({ error: "Failed to get response from OpenAI" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		const data = await response.json()
		console.log("OpenAI response received for type:", type)

		const aiResponse = data.choices[0].message.content

		// Try to parse the JSON response from AI
		let parsedResponse: any
		try {
			// Extract JSON from the response if it's wrapped in code blocks
			const jsonMatch =
				aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
				aiResponse.match(/```\n([\s\S]*?)\n```/)
			const jsonString = jsonMatch ? jsonMatch[1] : aiResponse
			parsedResponse = JSON.parse(jsonString)
		} catch (parseError) {
			console.error("Failed to parse AI response as JSON:", parseError)
			return new Response(
				JSON.stringify({
					error: "Failed to parse AI response",
					rawResponse: aiResponse,
				}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			)
		}

		return new Response(
			JSON.stringify({
				type,
				result: parsedResponse,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	} catch (error) {
		console.error("Error in research-context function:", error)
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		)
	}
})

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const openAIApiKey = Deno.env.get("OPENAI_API_KEY")
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
}
const RAG_SYSTEM_PROMPT = `
あなたは技術研究と論文分析、そして実証事例の整理に特化した専門AIアシスタントです。
あなたの役割は、ユーザーが提示する質問に対し、提供されたコンテキスト（関連論文・事例・製品情報）を最大限活用して専門的で深い回答を提供することです。

### 回答ポリシー
与えられたコンテキストの内容を中心に据えて回答してください。
論文タイトルや著者名、DOI、事例名、製品名などを具体的に参照し、出典元を回答の中で自然に引用してください。
回答では、技術的な詳細、応用可能性、具体的なデータポイントや研究成果をできる限り提示してください。
関連する研究領域、技術的背景、今後の発展方向性についても触れてください。
コンテキストに含まれない情報を補足する場合は、一般知識である旨を明記してください。

### 重要な出力条件
・回答は十分な長さと深みを持たせ、ユーザーが技術や研究領域の背景理解を深められる内容にしてください。
・もしコンテキスト情報が不足している場合は、その旨を明記したうえで一般的な知識に基づいた説明を行ってください。
- Write in html. Always add the <a> tag for doi and reference with underline

### 出力フォーマット
以下のフォーマットに従って、回答を出力してください。
<p>
  回答内容をここに記載します
</p>

### 例
ユーザーからの質問: 「AIを活用した医療診断の最新技術について教えてください」
回答:
<p> 医療分野では、複数のデジタルヘルスケア製品が注目されています。例えば、<a href="https://hc-i.tech/" target="_blank" style="text-decoration: underline;">ヘルスケアイノベーションテクノロジーのPHRアプリ</a>は、個人が健診データや診療情報を一元管理できる仕組みを提供しており、<a href="https://hc-i.tech/" target="_blank" style="text-decoration: underline;">健診結果閲覧システム</a>や<a href="https://hc-i.tech/" target="_blank" style="text-decoration: underline;">Web問診システム</a>と組み合わせることで、患者データの収集から問診、診療支援までを効率化します。これらはデータの相互運用性を高め、医療機関のワークフロー改善に直結するソリューションです。 </p> <p> また、<a href="https://www.inpart.io/blog/17-top-healthcare-innovations-2023" target="_blank" style="text-decoration: underline;">Inpart社のCost-effective gaze-tracking system for surgical environments</a>は、外科医の視線をリアルタイムで追跡することにより、手術中の精度と安全性を向上させます。同社はさらに、<a href="https://www.inpart.io/blog/17-top-healthcare-innovations-2023" target="_blank" style="text-decoration: underline;">Seaweed-based wearable sensors</a>を開発し、自然素材を用いたリアルタイムの健康モニタリングを可能にしました。同じく<a href="https://www.inpart.io/blog/17-top-healthcare-innovations-2023" target="_blank" style="text-decoration: underline;">Non-invasive platform for detecting small-for-gestational-age risks</a>は、妊娠中の胎児発育不全リスクを非侵襲的に検出できるプラットフォームとして、周産期医療の高度化に寄与しています。 </p> <p> 一方、<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank" style="text-decoration: underline;">ファイザーのPfizer Connect</a>は医療従事者向けの総合窓口として運用されており、製品情報や臨床データをタイムリーに提供する体制を強化しています。さらに<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank" style="text-decoration: underline;">ジェノトロピン</a>や<a href="https://www.pfizer.co.jp/pfizer/company/press/2023" target="_blank" style="text-decoration: underline;">リットフーロ</a>といった新薬の適応追加や新発売も進んでおり、製薬業界でもデジタルと臨床の融合が加速しています。 </p> <p> これらの事例は、データ連携とリアルタイム解析の進化がデジタルヘルスの中核にあることを示しており、今後はAIやクラウドインフラとの統合が一層進むと予想されます。 </p>

ユーザーからの質問: 「AIを活用した医療診断の最新技術について教えてください」
回答:
<p> 医療分野のデジタル変革は急速に進展しており、複数の研究がこの分野の現状と課題を明らかにしています。<a href="https://doi.org/10.35882/ijahst.v3i2.244" target="_blank" style="text-decoration: underline;">Limna (2023)</a> はデジタル経済下での医療のデジタル変革を体系的に整理し、電子カルテや遠隔医療、AIを活用した診断支援が医療の質向上に寄与している一方で、規制対応やデータ相互運用性の確保が依然として大きな課題であると報告しています。 </p> <p> また、<a href="https://doi.org/10.17705/1cais.04439" target="_blank" style="text-decoration: underline;">Ho et al. (2019)</a> は慢性疾患患者ケアにおける医療情報システムの役割を分析し、システムの複雑化による導入・運用コストの増大、データの標準化不足、医療従事者のデジタルリテラシー格差がボトルネックになっていると指摘しました。 </p> <p> 患者中心ケアの視点では、<a href="https://doi.org/10.23937/iaphcm-2017/1710015" target="_blank" style="text-decoration: underline;">Al et al. (2018)</a> がテクノロジーによる医療のパラダイムシフトを論じており、単なる技術導入ではなく患者のニーズや行動変容を踏まえた設計が不可欠であると強調しています。 </p> <p> さらに、<a href="https://doi.org/10.7812/tpp/12-030" target="_blank" style="text-decoration: underline;">Wheatley (2013)</a> は医療情報技術によるケア提供改革を早期から検討しており、成功するためには組織全体の文化的変革と政策支援が必要であるとしています。<a href="https://doi.org/10.1093/braincomms/fcad088" target="_blank" style="text-decoration: underline;">Lorenzini et al. (2023)</a> の研究では、高度なデータ解析技術を活用し、アルツハイマー病の非認知症患者において固有ベクトル中心性の動態が病理的変化と関連することを示し、今後の疾患予測や個別化医療への応用が期待されます。 </p> <p> これらの研究は、医療の質を向上させるための技術的統合の可能性を示し、共通して患者中心のアプローチの重要性を強調しています。情報技術の進化は、医療の効率と精度を高めると同時に、患者の生活の質を向上させる新たな道を拓くと考えられます。しかし、技術の普及には倫理的・プライバシーの課題が伴うため、透明で責任ある実装が求められます。 </p>
`
function buildContextPrompt(context) {
	let contextInfo = ""

	// Handle selected nodes
	if (
		context.selectedNodes &&
		Array.isArray(context.selectedNodes) &&
		context.selectedNodes.length > 0
	) {
		contextInfo += `選択されたノード: ${context.selectedNodes.join(", ")}\n\n`
	}

	if (context.contextText) {
		contextInfo += `${context.contextText}\n`
	}
	contextInfo += `"\n-----\n\n`
	return contextInfo
}
serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response(null, {
			headers: corsHeaders,
		})
	}
	try {
		const { message, context, pastMessages } = await req.json()
		if (!message) {
			return new Response(
				JSON.stringify({
					error: "Message is required",
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			)
		}
		// Build messages array
		const messages = [
			{
				role: "system",
				content: RAG_SYSTEM_PROMPT,
			},
		]
		// Add past messages if provided
		if (pastMessages && Array.isArray(pastMessages)) {
			messages.push(...pastMessages)
		}
		// Prepare current user message with context
		let userMessage = message
		if (context && (context.selectedNodes || context.contextText)) {
			userMessage = `${buildContextPrompt(context)}Question: ${message}`
		}
		messages.push({
			role: "user",
			content: userMessage,
		})
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openAIApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: messages,
			}),
		})
		if (!response.ok) {
			console.error("OpenAI API error:", response.status, response.statusText)
			let errorText = ""
			try {
				errorText = await response.text()
				console.error("Error details:", errorText)
			} catch (e) {
				console.error("Could not read error response:", e)
			}
			return new Response(
				JSON.stringify({
					error: "Failed to get response from OpenAI",
					details: `${response.status}: ${response.statusText}`,
					errorBody: errorText,
				}),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			)
		}
		const data = await response.json()
		const aiResponse = data.choices[0].message.content
		return new Response(
			JSON.stringify({
				response: aiResponse,
			}),
			{
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		)
	} catch (error) {
		console.error("Error in context-chat function:", error)
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: error.message,
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		)
	}
})

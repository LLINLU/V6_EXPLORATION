export const extractResearchContext = (
	userResponse: string,
	phase: string,
	researchAnswers: Record<string, string>,
	questionStatus: Record<string, boolean>,
) => {
	const updatedAnswers = { ...researchAnswers }
	const updatedStatus = { ...questionStatus }

	switch (phase) {
		case "focus":
			updatedAnswers.focus =
				userResponse.includes("技術") || userResponse.includes("technical")
					? "technical"
					: "market"
			updatedStatus.focus = true
			break
		case "purpose":
			updatedAnswers.purpose = userResponse
			updatedStatus.purpose = true
			break
		case "depth":
			if (userResponse.includes("基礎") || userResponse.includes("理論")) {
				updatedAnswers.depth = "基礎研究"
			} else if (
				userResponse.includes("応用") ||
				userResponse.includes("実用")
			) {
				updatedAnswers.depth = "応用研究"
			} else {
				updatedAnswers.depth = "混合研究"
			}
			updatedStatus.depth = true
			break
		case "targetField":
			updatedAnswers.targetField = userResponse
			updatedStatus.targetField = true
			break
		case "expectedOutcome":
			updatedAnswers.expectedOutcome = userResponse
			updatedStatus.expectedOutcome = true
			break
		case "applications":
			updatedAnswers.applications = userResponse
			updatedStatus.applications = true
			break
	}

	return { updatedAnswers, updatedStatus }
}

export const generateQuestionPrompt = (phase: string) => {
	// NOTE: Currently using pure hardcoded approach with buttons
	// ChatGPT prompts are commented out for future use
	switch (phase) {
		case "focus":
			// FUTURE: ChatGPT-based dynamic focus detection
			/* 
      return `あなたは、ある研究テーマに関するユーザーとの対話を通じて、ユーザーが特に関心を持っている方向性を評価し、明確にする役割を担います。
        研究テーマについてユーザーが入力する「${initialQuery}」をもとに、自然な質問や会話を通じて、以下の2つの方向性のうち、ユーザーがどちらに関心を持っているかを確認してください。
          【方向性の選択肢】
          **1. 技術的な仕組み・原理に関する関心**
          * ユーザーは具体的なメカニズム、技術の原理、プロセスの詳細な説明に興味がある。
          * キーワード例：「仕組み」「原理」「アルゴリズム」「プロセス」「動作原理」「技術的背景」
          **2. 市場応用・実用化に関する関心**
          * ユーザーは、その技術やコンセプトがどのように市場や社会で活用されるか、また実用化されるかに興味がある。
          * キーワード例：「市場」「応用」「実用化」「ビジネス」「活用シナリオ」「用途」「社会的影響」
          【会話の誘導方法】
          * まずユーザーが入力したQueryの内容を注意深く読み、興味や関心の方向性を推測します。
          * どちらの方向性にユーザーが興味を持っているかが明確でない場合は、以下のような質問でユーザーを誘導してください：
          「${initialQuery}をもう少し具体的に伺ってもよろしいでしょうか。例えば、技術的な仕組みやプロセスについて深掘りしたいとお考えでしょうか。それとも、この技術がどのように実際の市場や社会で役立つのか、その実用化や応用に特に関心がおありでしょうか？」
          * ユーザーが回答したら、明確にどちらの方向性を希望しているかを整理して示してください：
          【出力例】
          「技術的な仕組み・原理の方向性ですね。具体的な仕組みやメカニズムを深掘りしていきましょう。」
          または、
          「市場応用・実用化の方向性ですね。技術が市場や社会でどのように役立つかを中心に掘り下げていきましょう。」
          結論に至る答えがあれば、いずれかの二つについて言及することを伝えてください。decisionにtechnicalかmarketを書いてください。まだわからない場合は,空を返してください
          technical: 技術的な仕組み・原理
          market: 市場応用・実用化
          You must always return in the following Output Format (JSON)
          {
            "chat": ....,
            "decision": ....,
          }
        `;
      */
			return "" // Not used in hardcoded button approach

		case "purpose":
			// FUTURE: ChatGPT-based dynamic purpose detection
			/*
      return `ユーザーは「${initialQuery}」について調査・研究を行いたいと考えています。
      
研究の焦点は明確になりました。次に、この研究を行う「目的」について詳しく聞いてください。

以下のような観点から、ユーザーの研究目的を特定してください：

【研究目的の選択肢】
1. **ビジネス・製品開発**: 新しい製品やサービスの開発、商業化を目指している
2. **社会課題解決**: 社会的な問題や課題の解決を目的としている  
3. **競争優位性確保**: 技術的な優位性や差別化を図りたい
4. **実証実験・PoC**: 概念実証や実証実験を通じて検証したい

ユーザーに自然な質問を投げかけて、どの目的に最も近いかを特定してください。

You must always return in the following Output Format (JSON)
{
  "chat": "ユーザーへの質問文",
  "decision": "business/social/competitive/poc のいずれか、または空文字"
}`;
      */
			return "" // Not used in hardcoded button approach

		case "depth":
			// FUTURE: ChatGPT-based depth analysis
			return `研究目的が分かりました。次に、研究の深さについて質問してください。基礎的な理論・原理を追求したいのか、実用的な応用・実装に焦点を当てたいのかを聞いてください。`

		case "targetField":
			// FUTURE: ChatGPT-based target field detection
			/*
      return `ユーザーは「${initialQuery}」について研究を行い、目的も明確になりました。

次に、具体的な「対象分野・応用領域」について詳しく聞いてください。

【対象分野の選択肢】
1. **医療・ヘルスケア**: 医療現場、診断支援、治療技術など
2. **教育・学習支援**: 教育現場、学習システム、教育技術など
3. **製造・工場・物流**: 製造業、工場自動化、物流最適化など
4. **農業・環境保全**: 農業技術、環境保護、持続可能性など
5. **金融・保険**: 金融サービス、リスク管理、投資支援など
6. **行政・公共サービス**: 行政業務、公共サービス、社会基盤など
7. **小売・マーケティング**: 販売支援、顧客分析、マーケティングなど

ユーザーにどの分野での応用を考えているかを自然に質問し、最も適切な分野を特定してください。

You must always return in the following Output Format (JSON)
{
  "chat": "ユーザーへの質問文", 
  "decision": "medical/education/manufacturing/agriculture/finance/government/retail のいずれか、または空文字"
}`;
      */
			return "" // Not used in hardcoded button approach

		case "expectedOutcome":
			// FUTURE: ChatGPT-based outcome analysis
			return `対象分野が分かりました。次に、期待する研究成果について質問してください。論文、特許、プロトタイプ、商用化など、どのような形の成果を期待しているかを聞いてください。`

		case "applications":
			// FUTURE: ChatGPT-based application analysis
			return `期待成果が分かりました。最後に、この研究の応用可能性について質問してください。他の分野への展開可能性や、関連技術との組み合わせについて聞いてください。`

		default:
			return ""
	}
}

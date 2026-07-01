import React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const ResultsTabs = () => {
	const { t } = useTranslation()
	const [activeTab, setActiveTab] = React.useState("papers")

	return (
		<div className="container mx-auto px-4 mb-12">
			{" "}
			<Tabs
				defaultValue="papers"
				className="w-full"
				onValueChange={setActiveTab}
			>
				<TabsList className="inline-flex mb-6">
					<TabsTrigger
						value="papers"
						className={`${
							activeTab === "papers" ? "bg-blue-500 text-white" : "bg-gray-100"
						} rounded-md py-2 px-6 text-base`}
					>
						{t("search.tab_papers")}
					</TabsTrigger>
					{/* 🚫 TEMPORARILY DISABLED - Use Cases not production ready */}
					{/* 
          <TabsTrigger value="implementations" className={`${activeTab === "implementations" ? "bg-blue-500 text-white" : "bg-gray-100"} rounded-md py-2 px-6 text-base`}>
            事例
          </TabsTrigger>
          */}
					<TabsTrigger
						value="researchers"
						className={`${
							activeTab === "researchers"
								? "bg-blue-500 text-white"
								: "bg-gray-100"
						} rounded-md py-2 px-6 text-base`}
					>
						Researchers
					</TabsTrigger>
					<TabsTrigger
						value="patents"
						className={`${
							activeTab === "patents" ? "bg-blue-500 text-white" : "bg-gray-100"
						} rounded-md py-2 px-6 text-base`}
					>
						Patents
					</TabsTrigger>
				</TabsList>

				<TabsContent value="papers" className="mt-0">
					<div className="space-y-6">
						<div className="bg-white p-6 border border-gray-200 rounded-md">
							<h3 className="text-lg font-bold mb-1">
								{t("search.paper1_title_ja")}
							</h3>
							<h4 className="text-base mb-2">{t("search.paper1_title_en")}</h4>
							<div className="text-gray-600 mb-3">
								{t("search.paper1_authors")}
							</div>
							<div className="flex gap-2 mb-3">
								<span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
									AO-SLO
								</span>
								<span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
									{t("search.paper1_tag_dr")}
								</span>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								This study investigates the application of adaptive optics
								scanning laser ophthalmoscopy (AO-SLO) for early detection of
								cellular changes in diabetic retinopathy. The research
								demonstrates improved visualization of retinal microvasculature
								and photoreceptor abnormalities before clinical symptoms appear.
							</p>
							<div className="flex justify-end gap-2">
								<Button variant="outline" className="border-gray-300">
									PDF
								</Button>
								<Button variant="outline" className="border-gray-300">
									Save
								</Button>
							</div>
						</div>

						<div className="bg-white p-6 border border-gray-200 rounded-md">
							<h3 className="text-lg font-bold mb-1">
								Multi-Modal Adaptive Optics Imaging Combined with OCT for
								Enhanced Retinal Diagnostics
							</h3>
							<div className="text-gray-600 mb-3">
								J. Zhang, M. Williams, K. Yamada • American Journal of
								Ophthalmology • 2023
							</div>
							<div className="flex gap-2 mb-3">
								<span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
									AO-OCT
								</span>
								<span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
									Multi-Modal
								</span>
							</div>
							<p className="text-sm text-gray-600 mb-4">
								This paper presents a novel approach combining adaptive optics
								with optical coherence tomography for comprehensive retinal
								imaging. The multi-modal system achieves unprecedented
								resolution for in vivo assessment of retinal layers, offering
								new insights into pathophysiology of macular degeneration.
							</p>
							<div className="flex justify-end gap-2">
								<Button variant="outline" className="border-gray-300">
									PDF
								</Button>
								<Button variant="outline" className="border-gray-300">
									Save
								</Button>
							</div>
						</div>
					</div>{" "}
				</TabsContent>

				{/* 🚫 TEMPORARILY DISABLED - Use Cases not production ready */}
				{/* 
        <TabsContent value="implementations" className="mt-0">
          <div className="bg-white p-6 border border-gray-200 rounded-md">
            <h3 className="text-xl font-bold mb-4">事例の例</h3>
            <p className="text-gray-600 mb-4">事例データがここに表示されます。</p>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">OptiVision社による商用AO-SLOシステム</h4>
                <p className="text-sm text-gray-600">
                  臨床眼科アプリケーション向けの市販の適応光学システム。細胞レベルの網膜評価のためのリアルタイム波面センシングと高速画像取得機能を備えています。
                </p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-2">東京医科大学の研究グレードAOプラットフォーム</h4>
                <p className="text-sm text-gray-600">
                  高度な研究アプリケーション向けに複数のイメージングモダリティを統合したカスタムビルドの適応光学システム。このプラットフォームにより、蛍光イメージングと構造評価を同時に行うことが可能です。
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        */}

				<TabsContent value="researchers" className="mt-0">
					<div className="bg-white p-6 border border-gray-200 rounded-md">
						<h3 className="text-xl font-bold mb-4">
							{t("search.researchers_title")}
						</h3>
						<p className="text-gray-600 mb-4">
							{t("search.researchers_placeholder")}
						</p>
						<div className="space-y-4">
							<div className="border-b pb-4">
								<h4 className="font-semibold mb-2">
									{t("search.researcher1_name")}
								</h4>
								<p className="text-sm text-gray-600">
									{t("search.researcher1_bio")}
								</p>
							</div>
							<div className="border-b pb-4">
								<h4 className="font-semibold mb-2">
									{t("search.researcher2_name")}
								</h4>
								<p className="text-sm text-gray-600">
									{t("search.researcher2_bio")}
								</p>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="patents" className="mt-0">
					<div className="bg-white p-6 border border-gray-200 rounded-md">
						<h3 className="text-xl font-bold mb-4">
							{t("search.patents_title")}
						</h3>
						<p className="text-gray-600 mb-4">
							{t("search.patents_placeholder")}
						</p>
						<div className="space-y-4">
							<div className="border-b pb-4">
								<h4 className="font-semibold mb-2">{t("search.patent1_id")}</h4>
								<p className="text-sm text-gray-600">
									{t("search.patent1_description")}
								</p>
							</div>
							<div className="border-b pb-4">
								<h4 className="font-semibold mb-2">{t("search.patent2_id")}</h4>
								<p className="text-sm text-gray-600">
									{t("search.patent2_description")}
								</p>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}

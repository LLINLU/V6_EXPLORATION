import { ArrowUp, Lightbulb, Target } from "lucide-react"
import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTedGeneration } from "@/hooks/tree/useTedGeneration"

interface TreeNode {
	id: string
	name: string
	parent_id?: string
	[key: string]: any
}

interface SuggestionProps {
	label: string
	onClick: () => void
	mode?: string
}

const SearchSuggestion = ({ label, onClick, mode }: SuggestionProps) => {
	const getBackgroundColor = () => {
		return mode === "FAST" ? "bg-[#fffbff]" : "bg-[#f6fbff]"
	}

	const getBorderColor = () => {
		return mode === "FAST" ? "border-[#efdaf9]" : "border-[#c4d4f4]"
	}

	return (
		<button
			className={`${getBackgroundColor()} hover:bg-gray-50 rounded-md px-4 py-1 text-gray-700 transition-colors text-sm border ${getBorderColor()}`}
			onClick={onClick}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12"
				height="14"
				viewBox="0 0 12 14"
				fill="none"
				className="inline-block mr-1.5"
			>
				<path
					d="M11.1765 0H0.823529C0.605116 0 0.395648 0.113197 0.241206 0.31469C0.0867645 0.516183 0 0.789465 0 1.07442V12.1256C0 12.4105 0.0867645 12.6838 0.241206 12.8853C0.395648 13.0868 0.605116 13.2 0.823529 13.2H11.1765C11.3949 13.2 11.6044 13.0868 11.7588 12.8853C11.9132 12.6838 12 12.4105 12 12.1256V1.07442C12 0.789465 11.9132 0.516183 11.7588 0.31469C11.6044 0.113197 11.3949 0 11.1765 0ZM11.2941 12.1256C11.2941 12.1663 11.2817 12.2053 11.2597 12.2341C11.2376 12.2629 11.2077 12.2791 11.1765 12.2791H0.823529C0.792327 12.2791 0.762403 12.2629 0.74034 12.2341C0.718277 12.2053 0.705882 12.1663 0.705882 12.1256V1.07442C0.705882 1.03371 0.718277 0.99467 0.74034 0.965886C0.762403 0.937101 0.792327 0.92093 0.823529 0.92093H11.1765C11.2077 0.92093 11.2376 0.937101 11.2597 0.965886C11.2817 0.99467 11.2941 1.03371 11.2941 1.07442V12.1256ZM9.17647 4.14419C9.17647 4.26631 9.13929 4.38343 9.0731 4.46978C9.00691 4.55614 8.91714 4.60465 8.82353 4.60465H3.17647C3.08286 4.60465 2.99309 4.55614 2.9269 4.46978C2.86071 4.38343 2.82353 4.26631 2.82353 4.14419C2.82353 4.02206 2.86071 3.90494 2.9269 3.81859C2.99309 3.73223 3.08286 3.68372 3.17647 3.68372H8.82353C8.91714 3.68372 9.00691 3.73223 9.0731 3.81859C9.13929 3.90494 9.17647 4.02206 9.17647 4.14419ZM9.17647 6.6C9.17647 6.72212 9.13929 6.83924 9.0731 6.9256C9.00691 7.01195 8.91714 7.06046 8.82353 7.06046H3.17647C3.08286 7.06046 2.99309 7.01195 2.9269 6.9256C2.86071 6.83924 2.82353 6.72212 2.82353 6.6C2.82353 6.47788 2.86071 6.36076 2.9269 6.2744C2.99309 6.18805 3.08286 6.13953 3.17647 6.13953H8.82353C8.91714 6.13953 9.00691 6.18805 9.0731 6.2744C9.13929 6.36076 9.17647 6.47788 9.17647 6.6ZM9.17647 9.05581C9.17647 9.17794 9.13929 9.29506 9.0731 9.38141C9.00691 9.46777 8.91714 9.51628 8.82353 9.51628H3.17647C3.08286 9.51628 2.99309 9.46777 2.9269 9.38141C2.86071 9.29506 2.82353 9.17794 2.82353 9.05581C2.82353 8.93369 2.86071 8.81657 2.9269 8.73022C2.99309 8.64386 3.08286 8.59535 3.17647 8.59535H8.82353C8.91714 8.59535 9.00691 8.64386 9.0731 8.73022C9.13929 8.81657 9.17647 8.93369 9.17647 9.05581Z"
					fill="#9F9F9F"
				/>
			</svg>
			{label}
		</button>
	)
}

export const SearchSection = () => {
	const navigate = useNavigate()
	const [searchValue, setSearchValue] = useState("")
	const [searchMode, setSearchMode] = useState("TED")
	const { isGenerating, generateCompleteTree, getProgressText } =
		useTedGeneration()

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (searchValue.trim() && !isGenerating) {
			if (searchMode === "TED") {
				// Generate TED tree using the new layer-by-layer process
				const results = await generateCompleteTree(searchValue)

				if (results) {
					// Convert TED results to the format expected by the technology tree
					const convertedTreeData = convertTedToTreeData(results)

					navigate("/technology-tree", {
						state: {
							query: searchValue,
							searchMode: searchMode,
							tedResults: results,
							treeData: convertedTreeData,
						},
					})
				}
			} else {
				// FAST mode - navigate to research context
				navigate("/research-context", {
					state: {
						query: searchValue,
						searchMode: searchMode,
					},
				})
			}
		}
	}

	const convertTedToTreeData = (results: any) => {
		// console.log("Converting TED results to tree data:", results)

		// Convert TED structure to existing tree data format
		const level1Items =
			(results as any).purpose?.layer.nodes.map((node: any, index: number) => ({
				id: node.id,
				name: node.name, // Fixed: use 'name' instead of 'title'
				info: `${Math.floor(Math.random() * 50) + 1}論文 • ${
					Math.floor(Math.random() * 20) + 1
				}事例`, // Random numbers for papers and cases
				description: node.description,
				color: `hsl(${200 + index * 30}, 70%, 50%)`,
			})) || []

		// console.log("Level 1 items:", level1Items)

		const level2Items: Record<string, TreeNode[]> = {}
		const level3Items: Record<string, TreeNode[]> = {}

		if ((results as any).function?.layer.nodes) {
			;(results as any).function.layer.nodes.forEach(
				(node: any, index: number) => {
					const parentId = node.parent_id
					if (!level2Items[parentId]) {
						level2Items[parentId] = []
					}
					level2Items[parentId].push({
						id: node.id,
						name: node.name, // Fixed: use 'name' instead of 'title'
						info: `${Math.floor(Math.random() * 50) + 1}論文 • ${
							Math.floor(Math.random() * 20) + 1
						}事例`, // Random numbers for papers and cases
						description: node.description,
						color: `hsl(${220 + index * 25}, 65%, 55%)`,
					})
				},
			)
		}

		// console.log("Level 2 items:", level2Items)

		if ((results as any).measure?.layer.nodes) {
			;(results as any).measure.layer.nodes.forEach(
				(node: any, index: number) => {
					const parentId = node.parent_id
					if (!level3Items[parentId]) {
						level3Items[parentId] = []
					}
					level3Items[parentId].push({
						id: node.id,
						name: node.name, // Fixed: use 'name' instead of 'title'
						info: `${Math.floor(Math.random() * 50) + 1}論文`, // Only show papers count
						description: node.description,
						color: `hsl(${240 + index * 20}, 60%, 60%)`,
					})
				},
			)
		}

		// console.log("Level 3 items:", level3Items)

		const convertedData = {
			level1Items,
			level2Items,
			level3Items,
		}

		// console.log("Final converted tree data:", convertedData)
		return convertedData
	}

	const handleSuggestionClick = () => {
		// Do nothing when suggestion is clicked - don't update the search input field
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	}

	const handleSearchModeChange = (mode: string) => {
		setSearchMode(mode)
	}

	const tedSuggestions = [
		"量子コンピューティングの医療応用",
		"空中触覚技術",
		"カーボンニュートラル",
	]

	const fastSuggestions = [
		"空中触覚技術",
		"レーザービーム制御技術",
		"リチウムイオン電池耐熱技術",
	]

	const currentSuggestions =
		searchMode === "TED" ? tedSuggestions : fastSuggestions

	return (
		<div className="bg-white p-8 rounded-3xl max-w-5xl mx-auto">
			<h1 className="text-4xl font-bold text-center mb-12">
				研究情報を俯瞰する
			</h1>

			<div className="w-full mx-auto mb-8">
				<div className="bg-gray-50 rounded-2xl p-4 border border-[#ebf0f7] border-[1px]">
					<Input
						type="text"
						placeholder={
							searchMode === "FAST"
								? "例：肝細胞がん患者のAI支援画像診断を用いた早期診断精度向上を目指し、診断から3ヶ月以内の症例を対象とした研究を行いたい"
								: "例：補償光学の眼科分野への利用"
						}
						className="w-full px-4 py-3 text-lg border-none bg-gray-50 focus-visible:ring-0 placeholder:text-gray-400 truncate"
						value={searchValue}
						onChange={handleSearchChange}
						disabled={isGenerating}
					/>

					<div className="flex mt-2 items-center">
						<div className="flex space-x-2">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => handleSearchModeChange("TED")}
											className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
												searchMode === "TED"
													? "bg-blue-50 text-blue-700"
													: "bg-gray-200 hover:bg-gray-300 text-[#9f9f9f]"
											}`}
											disabled={isGenerating}
										>
											<Target
												className={`h-3 w-3 mr-1 ${
													searchMode === "TED" ? "stroke-[2.5px]" : ""
												}`}
											/>
											ニーズからはじめる
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p className="max-w-xs">
											社会課題やニーズを起点に、「シナリオ → 目的 → 機能 →
											手段」のフレームで解決する可能性のある技術テーマを探索します。
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => handleSearchModeChange("FAST")}
											className={`inline-flex items-center rounded-full py-1 px-4 h-[28px] text-sm transition-colors ${
												searchMode === "FAST"
													? "bg-purple-50 text-purple-700"
													: "bg-gray-200 hover:bg-gray-300 text-[#9f9f9f]"
											}`}
											disabled={isGenerating}
										>
											<Lightbulb
												className={`h-3 w-3 mr-1 ${
													searchMode === "FAST" ? "stroke-[2.5px]" : ""
												}`}
											/>
											技術からはじめる
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p className="max-w-xs">
											注目技術を軸に、「How1 → How2 → How3
											…」と段階的に技術要素を深掘り。実装に必要な要素技術やアプローチを体系的に整理します。
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<div className="ml-auto">
							<Button
								onClick={handleSubmit}
								size="icon"
								className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={!searchValue.trim() || isGenerating}
							>
								{isGenerating ? (
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
								) : (
									<ArrowUp className="h-4 w-4 text-gray-600" />
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* Progress indicator */}
				{isGenerating && (
					<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div className="flex items-center space-x-3">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
							<span className="text-blue-700 font-medium">
								{getProgressText()}
							</span>
						</div>
						<p className="text-sm text-blue-600 mt-2">
							TED手法を使用して高品質な技術ツリーを生成しています...
						</p>
					</div>
				)}
			</div>

			<div className="flex flex-col">
				<div className="flex items-center gap-1 mb-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="13"
						height="13"
						viewBox="0 0 13 13"
						fill="none"
					>
						<g clipPath="url(#clip0_219_5)">
							<path
								d="M10.5625 7.3125C10.5635 7.47814 10.5132 7.64003 10.4184 7.77589C10.3237 7.91175 10.1891 8.01491 10.0333 8.07117L7.41405 9.03906L6.44921 11.6604C6.39207 11.8156 6.2887 11.9496 6.15303 12.0442C6.01737 12.1388 5.85594 12.1896 5.69054 12.1896C5.52513 12.1896 5.36371 12.1388 5.22804 12.0442C5.09238 11.9496 4.989 11.8156 4.93186 11.6604L3.96093 9.03906L1.3396 8.07422C1.18438 8.01708 1.05041 7.91371 0.955787 7.77804C0.861161 7.64238 0.810425 7.48095 0.810425 7.31555C0.810425 7.15014 0.861161 6.98872 0.955787 6.85305C1.05041 6.71739 1.18438 6.61401 1.3396 6.55687L3.96093 5.58594L4.92577 2.96461C4.98291 2.80939 5.08628 2.67542 5.22195 2.5808C5.35761 2.48617 5.51904 2.43544 5.68444 2.43544C5.84985 2.43544 6.01127 2.48617 6.14694 2.5808C6.2826 2.67542 6.38598 2.80939 6.44311 2.96461L7.41405 5.58594L10.0354 6.55078C10.1913 6.60755 10.3257 6.71132 10.4201 6.84776C10.5146 6.9842 10.5643 7.14659 10.5625 7.3125ZM7.71874 2.4375H8.53124V3.25C8.53124 3.35774 8.57404 3.46108 8.65023 3.53726C8.72641 3.61345 8.82974 3.65625 8.93749 3.65625C9.04523 3.65625 9.14856 3.61345 9.22475 3.53726C9.30094 3.46108 9.34374 3.35774 9.34374 3.25V2.4375H10.1562C10.264 2.4375 10.3673 2.3947 10.4435 2.31851C10.5197 2.24233 10.5625 2.13899 10.5625 2.03125C10.5625 1.92351 10.5197 1.82017 10.4435 1.74399C10.3673 1.6678 10.264 1.625 10.1562 1.625H9.34374V0.8125C9.34374 0.704756 9.30094 0.601424 9.22475 0.525238C9.14856 0.449051 9.04523 0.40625 8.93749 0.40625C8.82974 0.40625 8.72641 0.449051 8.65023 0.525238C8.57404 0.601424 8.53124 0.704756 8.53124 0.8125V1.625H7.71874C7.61099 1.625 7.50766 1.6678 7.43148 1.74399C7.35529 1.82017 7.31249 1.92351 7.31249 2.03125C7.31249 2.13899 7.35529 2.24233 7.43148 2.31851C7.50766 2.3947 7.61099 2.4375 7.71874 2.4375ZM12.1875 4.0625H11.7812V3.65625C11.7812 3.54851 11.7384 3.44517 11.6623 3.36899C11.5861 3.2928 11.4827 3.25 11.375 3.25C11.2672 3.25 11.1639 3.2928 11.0877 3.36899C11.0115 3.44517 10.9687 3.54851 10.9687 3.65625V4.0625H10.5625C10.4547 4.0625 10.3514 4.1053 10.2752 4.18149C10.199 4.25767 10.1562 4.36101 10.1562 4.46875C10.1562 4.57649 10.199 4.67983 10.2752 4.75601C10.3514 4.8322 10.4547 4.875 10.5625 4.875H10.9687V5.28125C10.9687 5.38899 11.0115 5.49233 11.0877 5.56851C11.1639 5.6447 11.2672 5.6875 11.375 5.6875C11.4827 5.6875 11.5861 5.6447 11.6623 5.56851C11.7384 5.49233 11.7812 5.38899 11.7812 5.28125V4.875H12.1875C12.2952 4.875 12.3986 4.8322 12.4748 4.75601C12.5509 4.67983 12.5937 4.57649 12.5937 4.46875C12.5937 4.36101 12.5509 4.25767 12.4748 4.18149C12.3986 4.1053 12.2952 4.0625 12.1875 4.0625Z"
								fill="#9CA8D5"
							/>
						</g>
						<defs>
							<clipPath id="clip0_219_5">
								<rect width="13" height="13" fill="white" />
							</clipPath>
						</defs>
					</svg>
					<span className="text-gray-600 text-sm">試してみる：</span>
				</div>
				<div className="flex gap-2 flex-wrap">
					{currentSuggestions.map((suggestion) => (
						<SearchSuggestion
							key={suggestion}
							label={suggestion}
							onClick={handleSuggestionClick}
							mode={searchMode}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

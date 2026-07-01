import parse from "html-react-parser"
import React, { useEffect, useMemo, useState } from "react"
import { SuggestionActions } from "@/components/technology-tree/chat/SuggestionActions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MIcon } from "@/components/ui/m-icon"
import { cn } from "@/lib/utils"
import type { NodeSuggestion } from "@/types/chat"

// Unified interface that supports both technology-tree and research-context features
interface ChatMessageProps {
	// Technology-tree specific props
	message?: {
		content: string | string[]
		isUser: boolean
		type?: string
		suggestion?: NodeSuggestion
		buttons?: {
			label: string
			action: string
			primary?: boolean
		}[]
		isGroup?: boolean
		nodeTitle?: string
		selectedNodes?: Array<{ id: string; title: string }> // Support for multiple selected nodes
	}
	isActionTaken?: boolean
	onUseNode?: (suggestion: NodeSuggestion) => void
	onEditNode?: (suggestion: NodeSuggestion) => void
	onRefine?: (suggestion: NodeSuggestion) => void

	// Research-context specific props (flat structure for backwards compatibility)
	content?: string
	isUser?: boolean
	buttons?: Array<{
		label: string
		value: string
	}>
	onButtonClick: (action: string) => void
	checkboxGroups?: Array<{
		title: string
		options: Array<{
			label: string
			value: string
		}>
	}>
	onCheckboxSubmit?: (selections: Record<string, string[]>) => void
	isDisabled?: boolean
	initialSelections?: Record<string, string[]>
}

export const ChatMessage = ({
	// Technology-tree props
	message,
	isActionTaken = false,
	onUseNode,
	onEditNode,
	onRefine,

	// Research-context props (for backwards compatibility)
	content,
	isUser,
	buttons,
	onButtonClick,
	checkboxGroups,
	onCheckboxSubmit,
	isDisabled = false,
	initialSelections = {},
}: ChatMessageProps) => {
	// State for checkbox selections (research-context feature)
	const [selectedItems, setSelectedItems] =
		useState<Record<string, string[]>>(initialSelections)

	// Determine which mode we're in based on props
	const isResearchMode = !message && content !== undefined

	// Get unified message data
	const messageData = useMemo(() => {
		// console.log("messageData", isResearchMode, content, isUser, message)
		return isResearchMode
			? {
					content: content || "",
					isUser: isUser ?? false,
					type: undefined,
					suggestion: undefined,
					buttons: undefined,
					nodeTitle: undefined,
				}
			: message || { content: "", isUser: false }
	}, [isResearchMode, content, isUser, message])

	const isSkipped = messageData.isUser && messageData.content === "Skipped"

	// Update selectedItems when initialSelections changes (for disabled messages)
	useEffect(() => {
		if (isDisabled) {
			setSelectedItems(initialSelections || {})
		}
	}, [isDisabled, initialSelections])

	// Function to process mentions in text - FIXED VERSION
	const processMentions = (text: string, isUserMessage: boolean = false) => {
		if (!text || typeof text !== "string") return text

		const parts = []
		let keyIndex = 0
		let currentIndex = 0

		// Find all mention patterns in the text
		const mentionRegex =
			/@([A-Za-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)(?=\s|$)/g
		let match: RegExpExecArray | null = null

		match = mentionRegex.exec(text)
		while (match !== null) {
			const mentionStart = match.index
			const mentionEnd = match.index + match[0].length

			// Add text before mention
			if (mentionStart > currentIndex) {
				const beforeText = text.substring(currentIndex, mentionStart)
				if (beforeText) {
					parts.push(
						<React.Fragment key={`text-${keyIndex++}`}>
							{beforeText}
						</React.Fragment>,
					)
				}
			}

			// Add mention
			parts.push(
				<span
					key={`mention-${keyIndex++}`}
					className={
						isUserMessage ? "mention-highlight-user" : "mention-highlight"
					}
				>
					{match[0]}
				</span>,
			)

			currentIndex = mentionEnd
			match = mentionRegex.exec(text)
		}

		// Add remaining text after last mention
		if (currentIndex < text.length) {
			const remainingText = text.substring(currentIndex)
			if (remainingText) {
				parts.push(
					<React.Fragment key={`text-${keyIndex++}`}>
						{remainingText}
					</React.Fragment>,
				)
			}
		}

		// If no mentions found, return original text
		return parts.length > 0 ? parts : text
	}

	// Handle checkbox changes (research-context feature)
	const handleCheckboxChange = (
		groupTitle: string,
		value: string,
		checked: boolean,
	) => {
		if (isDisabled) return

		setSelectedItems((prev) => {
			const groupSelections = prev[groupTitle] || []

			if (checked) {
				if (value === "網羅的に見る") {
					return {
						...prev,
						[groupTitle]: [value],
					}
				} else {
					const newSelections = groupSelections.filter(
						(item) => item !== "網羅的に見る",
					)
					return {
						...prev,
						[groupTitle]: [...newSelections, value],
					}
				}
			} else {
				return {
					...prev,
					[groupTitle]: groupSelections.filter((item) => item !== value),
				}
			}
		})
	}

	const handleSubmitSelections = () => {
		if (onCheckboxSubmit) {
			onCheckboxSubmit(selectedItems)
		}
	}

	// Research-context logic for submit button
	const hasSelections = Object.values(selectedItems).some(
		(group) => group.length > 0,
	)
	const hasTechnicalGroups = checkboxGroups?.some(
		(group) =>
			group.title.includes("技術領域") ||
			group.title.includes("注目すべき技術的な仕組み・観点"),
	)
	const hasTedGroups = checkboxGroups?.some(
		(group) =>
			group.title.includes("市場領域") ||
			group.title.includes("アプリケーション領域") ||
			group.title.includes("応用テーマ"),
	)

	const shouldShowSubmitButton = hasTechnicalGroups
		? checkboxGroups?.every((group) => {
				const groupSelections = selectedItems[group.title] || []
				return groupSelections.length > 0
			}) || false
		: hasTedGroups
			? checkboxGroups?.every((group) => {
					const groupSelections = selectedItems[group.title] || []
					return groupSelections.length > 0
				}) || false
			: hasSelections

	// Render content with mention processing
	const renderContent = () => {
		if (Array.isArray(messageData.content)) {
			return messageData.content.map((content) => (
				<p
					key={content}
					className={cn(
						"mb-2 whitespace-pre-line",
						messageData.isUser ? "text-sm" : "text-sm",
					)}
				>
					{processMentions(content, messageData.isUser)}
				</p>
			))
		}

		let content = messageData.content
		if (typeof content === "string") {
			content = content.replace(
				/1️⃣ 選択したアイテムが各レベルの一番上に移動して表示されます。\n2️⃣ 関連するサブカテゴリが次のレベルに表示されます。/g,
				"1️⃣ まず、興味のあるシナリオを選択してください。\n2️⃣ 次に、カードの横にあるボタンをクリックして次のレベルを表示します。",
			)
		}

		const processedContent =
			typeof content === "string"
				? processMentions(content, messageData.isUser)
				: content

		return (
			<p
				className={cn(
					"whitespace-pre-line",
					messageData.type === "welcome"
						? "text-lg text-blue-800 mb-4"
						: messageData.isUser
							? "text-sm"
							: "text-sm",
				)}
			>
				{processedContent}
			</p>
		)
	}

	// Research-context style rendering
	if (isResearchMode) {
		return (
			<div
				className={`flex ${messageData.isUser ? "justify-end" : "justify-start"}`}
			>
				<div
					className={`max-w-3xl p-4 rounded-lg ${
						messageData.isUser
							? "bg-blue-600 text-white"
							: "bg-gray-100 text-gray-900"
					}`}
				>
					<div className="whitespace-pre-wrap">
						{processMentions(messageData.content as string, messageData.isUser)}
					</div>

					{buttons && (
						<div className="mt-3 flex gap-2 flex-wrap">
							{buttons.map((button) => (
								<Button
									key={button.value}
									variant="outline"
									size="sm"
									onClick={
										isDisabled ? undefined : () => onButtonClick?.(button.value)
									}
									disabled={isDisabled}
									className={`${messageData.isUser ? "border-white text-white hover:bg-white hover:text-blue-600" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
								>
									{button.label}
								</Button>
							))}
						</div>
					)}

					{checkboxGroups && (
						<div className="mt-4 space-y-4">
							{checkboxGroups.map((group) => (
								<div key={group.title} className="space-y-2">
									<h4
										className={`font-semibold text-sm ${messageData.isUser ? "text-white" : "text-gray-800"}`}
									>
										{group.title}
									</h4>
									<div className="space-y-2">
										{group.options.map((option) => {
											const safeId = `checkbox-${group.title}-${option.value.replace(/[\s()（）・\-\u3000]/g, "_").substring(0, 50)}`

											return (
												<div
													key={option.value}
													className="flex items-center space-x-2"
												>
													<Checkbox
														id={safeId}
														checked={
															selectedItems[group.title]?.includes(
																option.value,
															) || false
														}
														onCheckedChange={
															isDisabled
																? undefined
																: (checked) =>
																		handleCheckboxChange(
																			group.title,
																			option.value,
																			!!checked,
																		)
														}
														disabled={isDisabled}
														className={`${messageData.isUser ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
													/>
													<label
														htmlFor={safeId}
														className={`text-sm ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${messageData.isUser ? "text-white" : "text-gray-700"}`}
													>
														{option.label}
													</label>
												</div>
											)
										})}
									</div>
								</div>
							))}

							{shouldShowSubmitButton && !isDisabled && (
								<div className="mt-4">
									<Button
										onClick={handleSubmitSelections}
										variant={messageData.isUser ? "secondary" : "default"}
										size="sm"
										className={
											messageData.isUser
												? "bg-white text-blue-600 hover:bg-gray-100"
												: ""
										}
									>
										選択を送信
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		)
	}

	// Technology-tree style rendering
	return (
		<div
			className={cn(
				"inline-block w-full max-w-full",
				messageData.type === "welcome" && "w-full",
			)}
		>
			{messageData.isUser ? (
				<div className="ml-auto max-w-xs mb-3">
					<div
						className={cn(
							"rounded-lg px-3 py-2 text-sm",
							isSkipped ? "bg-blue-50 text-blue-700" : "bg-blue-600 text-white",
						)}
					>
						{isSkipped ? (
							<span className="font-medium whitespace-nowrap">スキップ</span>
						) : (
							<div className="text-sm whitespace-pre-line">
								{typeof messageData.content === "string"
									? processMentions(messageData.content, messageData.isUser)
									: renderContent()}
							</div>
						)}
					</div>
				</div>
			) : (
				<div className="flex items-start gap-3 mb-4">
					<div className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
						<MIcon className="h-4 w-4" size={16} />
					</div>
					<div className="flex-1 bg-gray-50 rounded-lg p-4 text-sm">
						{messageData.selectedNodes &&
						messageData.selectedNodes.length > 0 ? (
							<div className="mb-2 pb-2 border-b border-gray-200">
								<p className="text-xs text-gray-500">
									<span className="font-medium">関連ノード:</span>
								</p>
								<div className="mt-1 space-y-1">
									{messageData.selectedNodes.map((node) => (
										<span
											key={node.id}
											className="text-blue-700 font-medium text-xs block"
										>
											• {node.title}
										</span>
									))}
								</div>
							</div>
						) : (
							messageData.nodeTitle && (
								<div className="mb-2 pb-2 border-b border-gray-200">
									<p className="text-xs text-gray-500">
										<span className="font-medium">関連ノード:</span>{" "}
										{messageData.nodeTitle}
									</p>
								</div>
							)
						)}
						<div className="text-sm mb-2 whitespace-pre-line text-gray-900">
							{(() => {
								try {
									const contentString = messageData.content.toString()
									if (
										contentString.includes("<") &&
										contentString.includes(">")
									) {
										const parsedContent = parse(contentString)
										return parsedContent || processMentions(contentString)
									} else {
										return processMentions(contentString, messageData.isUser)
									}
								} catch (error) {
									console.error("HTML parsing error:", error)
									return processMentions(
										messageData.content.toString(),
										messageData.isUser,
									)
								}
							})()}
						</div>
						{messageData.suggestion && !isActionTaken && (
							<SuggestionActions
								suggestion={messageData.suggestion}
								onUseNode={onUseNode}
								onEditNode={onEditNode}
								onRefine={onRefine}
							/>
						)}
						{messageData.buttons && (
							<div className="flex flex-col sm:flex-row gap-3 justify-start mt-3">
								{messageData.buttons.map((button) => (
									<Button
										key={button.action}
										onClick={() => onButtonClick(button.action)}
										variant="outline"
										className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
										size="sm"
									>
										{button.label}
									</Button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

import { ArrowDown } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"

interface UseCaseSearchProgressProps {
	elapsedTime: number
}

interface Step {
	id: number
	name: string
	description: string
	estimatedTime: number
}

const steps: Step[] = [
	{
		id: 1,
		name: "検索プランを作成中",
		description: "最適な検索戦略を立案しています",
		estimatedTime: 50,
	},
	{
		id: 2,
		name: "世界中の事例を検索中",
		description: "グローバルなデータベースから関連事例を収集しています",
		estimatedTime: 90,
	},
	{
		id: 3,
		name: "検索結果を集約中",
		description: "収集した情報を整理・分析しています",
		estimatedTime: 50,
	},
]

export const UseCaseSearchProgress: React.FC<UseCaseSearchProgressProps> = ({
	elapsedTime,
}) => {
	const [currentStepIndex, setCurrentStepIndex] = useState(0)

	const getCurrentStep = useCallback((elapsedSeconds: number) => {
		let cumulativeTime = 0

		for (let i = 0; i < steps.length; i++) {
			cumulativeTime += steps[i].estimatedTime
			if (elapsedSeconds <= cumulativeTime) {
				return i
			}
		}

		return steps.length - 1
	}, [])

	useEffect(() => {
		const newStepIndex = getCurrentStep(elapsedTime)
		setCurrentStepIndex(newStepIndex)
	}, [elapsedTime, getCurrentStep])

	return (
		<div className="flex items-center justify-center min-h-[300px] py-4">
			<div className="max-w-xs w-full">
				<div className="space-y-4">
					{steps.map((step, index) => {
						const isCompleted = index < currentStepIndex
						const isActive = index === currentStepIndex

						return (
							<React.Fragment key={step.id}>
								<div className="flex flex-col items-center relative">
									<span
										className={`
                      text-base transition-all duration-1000 relative
                      ${
												isActive
													? "text-blue-600 font-medium animate-pulse"
													: isCompleted
														? "text-green-600 opacity-80"
														: "text-gray-400 opacity-50"
											}
                    `}
									>
										{step.name}
									</span>

									{index < steps.length - 1 && (
										<div className="mt-2">
											<ArrowDown
												className={`
                        w-3 h-3 transition-all duration-1000
                        ${
													index < currentStepIndex
														? "text-green-400 opacity-80"
														: index === currentStepIndex
															? "text-blue-500 animate-bounce opacity-100"
															: "text-gray-300 opacity-30"
												}
                      `}
											/>
										</div>
									)}
								</div>
							</React.Fragment>
						)
					})}
				</div>
			</div>
		</div>
	)
}

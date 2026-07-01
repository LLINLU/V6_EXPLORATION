interface KeyboardHintProps {
	showNavigationHint?: boolean
	showSelectionHint?: boolean
	showCloseHint?: boolean
	showOpenSearchHint?: boolean
	additionalMessage?: string
}

export function KeyboardHint({
	showNavigationHint = true,
	showSelectionHint = true,
	showCloseHint = true,
	showOpenSearchHint = false,
	additionalMessage,
}: KeyboardHintProps) {
	return (
		<div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-600">
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					{showOpenSearchHint && (
						<div className="flex items-center gap-1">
							<kbd className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-[4px] rounded-[4px] border border-gray-300 text-gray-400 text-[12px] font-medium">
								⌘
							</kbd>
							<kbd className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-[4px] rounded-[4px] border border-gray-300 text-gray-400 text-[12px] font-medium">
								K
							</kbd>
							<span>Open Search •</span>
						</div>
					)}
					{showNavigationHint && (
						<div className="flex items-center gap-1">
							<kbd className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-[3px] rounded-[4px] border border-gray-300 text-gray-400 text-[12px] font-medium">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									fill="#2e2e2e"
									viewBox="0 0 256 256"
								>
									<path d="M226.83,117.17l-96-96a4,4,0,0,0-5.66,0l-96,96A4,4,0,0,0,32,124H76v84a12,12,0,0,0,12,12h80a12,12,0,0,0,12-12V124h44a4,4,0,0,0,2.83-6.83ZM176,116a4,4,0,0,0-4,4v88a4,4,0,0,1-4,4H88a4,4,0,0,1-4-4V120a4,4,0,0,0-4-4H41.66L128,29.66,214.34,116Z"></path>
								</svg>
							</kbd>
							<kbd className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-[3px] rounded-[4px] border border-gray-300 text-gray-400 text-[12px] font-medium transform rotate-180">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="12"
									height="12"
									fill="#2e2e2e"
									viewBox="0 0 256 256"
								>
									<path d="M226.83,117.17l-96-96a4,4,0,0,0-5.66,0l-96,96A4,4,0,0,0,32,124H76v84a12,12,0,0,0,12,12h80a12,12,0,0,0,12-12V124h44a4,4,0,0,0,2.83-6.83ZM176,116a4,4,0,0,0-4,4v88a4,4,0,0,1-4,4H88a4,4,0,0,1-4-4V120a4,4,0,0,0-4-4H41.66L128,29.66,214.34,116Z"></path>
								</svg>
							</kbd>
						</div>
					)}
					<div className="flex items-center gap-1">
						{showNavigationHint && <span>移動 •</span>}
						{showSelectionHint && (
							<>
								<kbd className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-[.5rem] rounded-[4px] text-gray-400 text-[12px] font-medium">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="22"
										height="22"
										fill="#2e2e2e"
										viewBox="0 0 256 256"
									>
										<path d="M180,104v32a4,4,0,0,1-4,4H89.66l17.17,17.17a4,4,0,0,1-5.66,5.66l-24-24a4,4,0,0,1,0-5.66l24-24a4,4,0,0,1,5.66,5.66L89.66,132H172V104a4,4,0,0,1,8,0Zm48-48V200a12,12,0,0,1-12,12H40a12,12,0,0,1-12-12V56A12,12,0,0,1,40,44H216A12,12,0,0,1,228,56Zm-8,0a4,4,0,0,0-4-4H40a4,4,0,0,0-4,4V200a4,4,0,0,0,4,4H216a4,4,0,0,0,4-4Z"></path>
									</svg>
								</kbd>
								<span>選択 • </span>
							</>
						)}
						{showCloseHint && (
							<div className="MuiStack-root mui-style-1umy8nh flex items-center gap-1">
								<kbd className="text-[10px] px-[3px] border border-[#bababa] rounded-[4px]">
									ESC
								</kbd>
								<span className="MuiTypography-root MuiTypography-caption mui-style-1663wns text-xs">
									閉じる
								</span>
							</div>
						)}
					</div>
				</div>
				{additionalMessage && <span>{additionalMessage}</span>}
			</div>
		</div>
	)
}

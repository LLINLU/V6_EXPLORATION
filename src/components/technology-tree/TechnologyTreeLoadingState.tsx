interface TechnologyTreeLoadingStateProps {
	isInitializing: boolean
}

export const TechnologyTreeLoadingState = ({
	isInitializing,
}: TechnologyTreeLoadingStateProps) => {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center p-8">
				{isInitializing ? (
					<>
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<h2 className="text-xl font-semibold mb-4">読み込み中...</h2>
						<p className="text-gray-600">
							技術ツリーデータを初期化しています。
						</p>
					</>
				) : (
					<>
						<h2 className="text-xl font-semibold mb-4">
							技術ツリーが見つかりません
						</h2>
						<p className="text-gray-600 mb-4">
							有効な技術ツリーデータがありません。新しい検索を開始してください。
						</p>
						<a
							href="/"
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							ホームに戻る
						</a>
					</>
				)}
			</div>
		</div>
	)
}

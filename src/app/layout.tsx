import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Memory AI",
	description: "企業の新規事業・研究開発を加速する",
	authors: [{ name: "Memory AI" }],
	openGraph: {
		title: "Memory AI",
		description: "企業の新規事業・研究開発を加速する",
		type: "website",
		images: ["/memoryAI.jpg"],
	},
	twitter: {
		card: "summary_large_image",
		site: "@memory_ai",
		images: ["/memoryAI.jpg"],
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ja">
			<head>
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
			</head>
			<body className="notranslate" suppressHydrationWarning>
				<div id="root">{children}</div>
				{/* IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS VERY COMMENT! */}
				<script
					src="https://cdn.gpteng.co/gptengineer.js"
					type="module"
				></script>
			</body>
		</html>
	)
}

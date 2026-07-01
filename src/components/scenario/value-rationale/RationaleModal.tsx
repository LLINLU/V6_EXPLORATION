import * as DialogPrimitive from "@radix-ui/react-dialog"
import { BarChart3, Copy, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { RationaleModalProps } from "./types"

export function RationaleModal({
	isOpen,
	onClose,
	metricName,
	metricValue,
	derivation,
}: RationaleModalProps) {
	const { t } = useTranslation()
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(`${metricName}: ${metricValue}`)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error("Failed to copy:", err)
		}
	}

	return (
		<DialogPrimitive.Root
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Content
					className={cn(
						"fixed left-[50%] top-[50%] z-50 grid w-full max-w-[560px] translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
					)}
				>
					{/* Custom Close Button - Rounded square style */}
					<DialogPrimitive.Close className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-600 transition-colors focus:outline-none focus:ring-0">
						<X className="h-4 w-4" />
						<span className="sr-only">{t("rationale.close")}</span>
					</DialogPrimitive.Close>

					{/* Header */}
					<DialogHeader className="p-4 pb-3 border-b">
						<div className="flex items-center justify-between pr-12">
							<div className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5 text-blue-500" />
								<DialogTitle className="text-base font-medium">
									{metricName}: {metricValue}
								</DialogTitle>
							</div>
						</div>
					</DialogHeader>

					{/* Content */}
					<div className="p-4 max-h-[60vh] overflow-y-auto">
						{/* Derivation Section */}
						<div>
							<h3 className="text-sm font-medium text-gray-900 mb-3">
								Derivation
							</h3>
							<div className="bg-[#F5F9FF] rounded-lg p-4">
								<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
									{derivation}
								</p>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 px-2 text-gray-500 hover:text-gray-700 mt-3 font-normal"
									onClick={handleCopy}
								>
									<Copy className="h-4 w-4 mr-1" />
									{copied ? "Copied!" : "Copy"}
								</Button>
							</div>
						</div>
					</div>
				</DialogPrimitive.Content>
			</DialogPortal>
		</DialogPrimitive.Root>
	)
}

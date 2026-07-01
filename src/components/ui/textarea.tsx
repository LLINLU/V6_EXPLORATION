import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, autoResize = false, onChange, ...props }, ref) => {
		const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

		// Combine refs
		const handleRef = (element: HTMLTextAreaElement | null) => {
			textareaRef.current = element
			if (typeof ref === "function") {
				ref(element)
			} else if (ref) {
				ref.current = element
			}
		}

		const resizeTextarea = React.useCallback(() => {
			if (autoResize && textareaRef.current) {
				textareaRef.current.style.height = "auto"
				textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
			}
		}, [autoResize])

		// Handle changes to resize
		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			if (onChange) {
				onChange(e)
			}
			if (autoResize) {
				resizeTextarea()
			}
		}

		// Adjust height on initial render and when content changes
		React.useEffect(() => {
			if (autoResize && textareaRef.current) {
				resizeTextarea()
			}
		}, [autoResize, resizeTextarea])

		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={handleRef}
				onChange={handleChange}
				{...props}
			/>
		)
	},
)
Textarea.displayName = "Textarea"

export { Textarea }

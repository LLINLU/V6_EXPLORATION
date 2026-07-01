import { toast as sonnerToast, type ToastT } from "sonner"

type ToastProps = Partial<Omit<ToastT, "description">> & {
	description?: React.ReactNode
	title?: string
}

// Keep track of all active toasts
let toasts: ToastT[] = []
let toastCounter = 0

export const toast = ({ description, ...props }: ToastProps) => {
	// Generate a unique ID if not provided
	const toastId = props.id || `toast-${Date.now()}-${toastCounter++}`

	const id = sonnerToast(props.title || "", {
		...props,
		id: toastId,
		description,
		onDismiss: (toast) => {
			// Remove the toast from our array when dismissed
			toasts = toasts.filter((t) => t.id !== toast.id)
			if (props.onDismiss) props.onDismiss(toast)
		},
		onAutoClose: (toast) => {
			// Remove the toast from our array when auto-closed
			toasts = toasts.filter((t) => t.id !== toast.id)
			if (props.onAutoClose) props.onAutoClose(toast)
		},
	})

	// Add the new toast to our array
	const newToast = { id, ...props, description }
	toasts.push(newToast as ToastT)

	return id
}

export const useToast = () => {
	return {
		toast,
		toasts: [...toasts], // Return a copy of the toasts array
	}
}

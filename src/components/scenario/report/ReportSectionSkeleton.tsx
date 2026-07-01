import { Skeleton } from "@/components/ui/skeleton"

export function ReportSectionSkeleton() {
	return (
		<div className="space-y-3 py-4">
			<Skeleton className="h-6 w-48" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-32 w-full" />
		</div>
	)
}

// Shared className for prose body content in the query report.
// Styles the inline <cite> tags from the generator prompt as small blue pills.

export const QUERY_PROSE_CLASS = [
	"prose prose-sm prose-gray max-w-none text-[14px] text-gray-700 leading-relaxed",
	"[&_p]:mb-3 [&_p]:text-[14px] [&_strong]:text-gray-900",
	"[&_cite]:inline [&_cite]:not-italic [&_cite]:font-mono [&_cite]:text-[10px]",
	"[&_cite]:bg-blue-50 [&_cite]:text-blue-700 [&_cite]:px-1.5 [&_cite]:py-[1px]",
	"[&_cite]:rounded [&_cite]:ml-1 [&_cite]:align-[1px] [&_cite]:whitespace-nowrap",
].join(" ")

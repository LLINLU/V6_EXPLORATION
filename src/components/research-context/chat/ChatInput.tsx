// COMMENTED OUT: Chat input functionality - may be restored in the future
// import React from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Send } from "lucide-react";

export const ChatInput = () => {
	// COMMENTED OUT: Chat input UI - may be restored in the future
	// const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
	//   if (e.key === 'Enter' && !e.shiftKey) {
	//     e.preventDefault();
	//     onSend();
	//   }
	// };

	// Hide the chat input for now
	return null

	// COMMENTED OUT: Original chat input UI - may be restored in the future
	// return (
	//   <div className="border-t border-gray-200 p-4">
	//     <div className="flex space-x-2">
	//       <Textarea
	//         value={value}
	//         onChange={(e) => onChange(e.target.value)}
	//         placeholder={placeholder || "研究について詳しく教えてください..."}
	//       className="flex-1"
	//         rows={2}
	//         onKeyDown={handleKeyDown}
	//       />
	//       <Button
	//         onClick={onSend}
	//         disabled={!value.trim() || isLoading}
	//         size="icon"
	//       >
	//         <Send className="h-4 w-4" />
	//       </Button>
	//     </div>
	//   </div>
	// );
}

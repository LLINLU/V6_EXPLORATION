# CSV Export - Usage Guide

## Quick Integration Examples

### Using the Custom Export Icon

```tsx
import { exportPapersToCSV, exportUseCasesToCSV } from "@/utils/csvExport"
import { ExportIcon } from "@/components/icons/ExportIcon"
import { Button } from "@/components/ui/button"

// Example 1: Simple button with custom icon
<Button 
  variant="ghost" 
  size="sm" 
  onClick={() => exportPapersToCSV(papers, "papers.csv")}
>
  <ExportIcon className="h-4 w-4" />
</Button>

// Example 2: Button with text
<Button 
  variant="outline" 
  onClick={() => exportPapersToCSV(papers)}
>
  <ExportIcon className="mr-2 h-4 w-4" />
  Export CSV
</Button>

// Example 3: In a dropdown menu
<DropdownMenuItem 
  onClick={() => exportPapersToCSV(displayedPapers, "research_papers.csv")}
>
  <ExportIcon className="mr-2 h-4 w-4" />
  Export as CSV
</DropdownMenuItem>
```

### Export Functions

#### Export Papers
```tsx
import { exportPapersToCSV } from "@/utils/csvExport"

// Basic usage
exportPapersToCSV(papers)

// With custom filename
exportPapersToCSV(papers, "my_papers.csv")

// Export filtered papers
const filteredPapers = papers.filter(p => p.citations > 100)
exportPapersToCSV(filteredPapers, "high_impact_papers.csv")

// Export saved papers only
const savedPapers = papers.filter(p => p.saved)
exportPapersToCSV(savedPapers, "saved_papers.csv")
```

#### Export Use Cases
```tsx
import { exportUseCasesToCSV } from "@/utils/csvExport"

// Basic usage
exportUseCasesToCSV(useCases)

// With custom filename
exportUseCasesToCSV(useCases, "implementation_cases.csv")

// Export saved cases only
const savedCases = useCases.filter(c => c.saved)
exportUseCasesToCSV(savedCases, "saved_cases.csv")
```

### Integration in TabContent Component

If you want to add the export button to your existing TabContent:

```tsx
// In src/components/technology-tree/components/TabContent.tsx
import { exportPapersToCSV, exportUseCasesToCSV } from "@/utils/csvExport"
import { ExportIcon } from "@/components/icons/ExportIcon"

// Add this button alongside your existing buttons (Saved filter, Search, etc.)
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    if (activeTab === "papers") {
      exportPapersToCSV(displayedPapers, "papers.csv")
    } else if (activeTab === "implementation") {
      exportUseCasesToCSV(displayedCases, "use_cases.csv")
    }
  }}
>
  <ExportIcon className="h-4 w-4" />
</Button>
```

### CSV Data Included

**Papers CSV includes:**
- title
- authors
- journal
- abstract
- date
- citations
- doi
- url
- tags (comma-separated)
- region

**Use Cases CSV includes:**
- product
- description
- company
- press_releases

### Advanced Usage

#### Custom CSV Formatting
```tsx
import { preparePapersForCSV, downloadCSV } from "@/utils/csvExport"

// Prepare data
const csvData = preparePapersForCSV(papers)

// Modify or filter the data
const customData = csvData.map(paper => ({
  ...paper,
  // Add custom fields or transformations
  year: new Date(paper.date).getFullYear()
}))

// Download
downloadCSV(customData, "custom_papers.csv")
```

#### Export with Toast Notification
```tsx
import { exportPapersToCSV } from "@/utils/csvExport"
import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

const handleExport = () => {
  exportPapersToCSV(papers, "papers.csv")
  toast({
    title: "CSV Exported",
    description: `${papers.length} papers exported successfully`,
  })
}
```

## File Locations

- **Export Utilities:** `src/utils/csvExport.ts`
- **Custom Icon:** `src/components/icons/ExportIcon.tsx`
- **This Guide:** `src/utils/csvExport.usage.md`


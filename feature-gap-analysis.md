# Feature Gap Analysis Report: Scenario Mindmap Generator vs Memory AI App

## Executive Summary
- **Analysis Date**: 2025-10-20
- **Reference Repo**: /Users/apple/Downloads/10_7-scenario-mindmap-generator
- **Current Repo**: /Users/apple/MemoryAI/memory-ai-app
- **Total features analyzed**: 28
- **Missing features identified**: 15
- **Critical gaps**: 8

## Overview

The reference repository (10_7-scenario-mindmap-generator) is an AI-powered scenario mindmap generator that uses Google Gemini AI to create multi-dimensional business scenarios with comprehensive analysis. The current repository (memory-ai-app) is a technology tree research tool with node enrichment capabilities.

### Key Architecture Differences

| Aspect | Reference Repo | Current Repo |
|--------|---------------|--------------|
| AI Provider | Google Gemini 2.5 Flash | OpenAI GPT (via Supabase functions) |
| Data Structure | Hierarchical mindmap with axes | Fixed-depth technology tree (Scenario→Purpose→Function→Measure) |
| Generation Approach | Multi-axis keyword-driven | Single query MECE-based |
| Storage | Client-side only | Supabase PostgreSQL with team management |
| Enrichment | Real-time AI analysis with charts | Database polling queue with papers/use cases |

---

## Missing Features by Category

### 1. Core Mindmap Generation Features

#### Feature 1.1: Multi-Axis Keyword Generation System
- **Description**: A systematic approach to explore topics from multiple dimensions (axes) before generating the mindmap. Each axis represents a different perspective (e.g., "Social Impact", "Technical Challenges", "Economic Viability")
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts`
- **Key functions**:
  - `getRecommendedAxes(query: string)` - Lines 12-42
  - `generateAxisDescription(query: string, axisName: string)` - Lines 44-51
  - `generateKeywordsForAxis(query: string, axis: string)` - Lines 54-95
- **Implementation details**:
  ```typescript
  // Algorithm: AI generates 3-5 diverse axes for exploration
  // Each axis generates 3-5 keywords with descriptions
  // User selects keywords (minimum 2) to guide mindmap generation

  interface Axis {
    name: string;         // e.g., "Market Potential"
    description: string;  // Brief explanation of this dimension
  }

  interface Keyword {
    keyword: string;      // e.g., "Healthcare Automation"
    description: string;  // Context-specific explanation
    axis: string;         // Which axis it belongs to
  }
  ```
- **Current repo equivalent**: None - Current repo uses direct query-to-tree generation
- **Dependencies**:
  - `@google/genai` - For structured JSON generation
  - JSON schema validation for consistent output format
- **Estimated complexity**: Medium
- **Priority**: High
- **Business Value**: Enables systematic exploration of topics from multiple perspectives, ensuring comprehensive scenario coverage
- **Implementation approach**:
  1. Create `multiAxisService.ts` in `/src/services/`
  2. Implement axis recommendation algorithm (can adapt to OpenAI structured outputs)
  3. Add keyword generation per axis
  4. Create state management for selected keywords
  5. Modify tree generation to incorporate multi-axis context

#### Feature 1.2: Investigation Aim Suggestion System
- **Description**: AI-powered suggestion of specific research objectives based on selected keywords, helping users focus their exploration
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:97-120`
- **Key function**: `suggestAims(query: string, selectedKeywords: Keyword[])`
- **Implementation details**:
  ```typescript
  // Input: User query + 2+ selected keywords from different axes
  // Output: 3 specific, actionable investigation aims
  // Example output: [
  //   "Explore AI applications in urban mobility for sustainability",
  //   "Analyze economic viability of autonomous vehicle deployment",
  //   "Investigate social acceptance factors for shared mobility"
  // ]
  ```
- **Current repo equivalent**: None - Current repo doesn't have aim/objective refinement
- **Business Value**: Helps users narrow down broad topics into specific research directions
- **Priority**: Medium
- **Implementation approach**:
  1. Add to `multiAxisService.ts`
  2. Create endpoint in Supabase functions if needed
  3. Integrate with tree generation flow as optional refinement step

#### Feature 1.3: Two-Stage Hierarchical Mindmap Generation
- **Description**: Progressive mindmap building with initial structure (levels 1-2) followed by parallel branch expansion (level 3)
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:122-215`
- **Key functions**:
  - `generateMindMapInitial()` - Lines 122-178: Creates root + 5 high-level scenarios
  - `generateMindMapBranch()` - Lines 180-215: Expands each scenario with 3 specific applications
- **Algorithm**:
  ```typescript
  // Stage 1: Generate root + level-2 nodes (max 5 strategic scenarios)
  // Stage 2: For each level-2 node, generate level-3 nodes in parallel (3 applications each)
  // Result: Tree with 1 root → 5 scenarios → 15 total applications

  // Role-based prompting:
  // - "戦略家エージェント" (Strategist Agent) for initial structure
  // - "イノベーターエージェント" (Innovator Agent) for concrete applications
  ```
- **Current repo equivalent**: Single-stage generation with fixed depth via `generate-tree/index.ts`
- **Current repo limitation**: Generates entire tree in one call, less control over node count and depth
- **Business Value**: Better control over tree structure, progressive refinement, role-based quality
- **Priority**: High
- **Implementation approach**:
  1. Split `generate-tree` edge function into two stages
  2. Implement `generate-tree-initial` and `generate-tree-branch`
  3. Add state management for tracking which nodes need expansion
  4. Update database schema to support progressive generation status

---

### 2. Node Refinement & Exploration Features

#### Feature 2.1: Converge/Diverge Refinement System
- **Description**: Interactive node refinement allowing users to either deep-dive (converge) or explore alternatives (diverge) for any scenario
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:399-462`
- **Key functions**:
  - `suggestRefinementQueries()` - Lines 399-421: AI suggests 3 refinement queries
  - `generateConvergentNodes()` - Lines 432-446: Generate sub-scenarios (children)
  - `generateDivergentNodes()` - Lines 448-462: Generate alternative scenarios (siblings)
- **Implementation details**:
  ```typescript
  // Converge: "Drill down into specifics"
  // Input: Parent node "AI-powered healthcare"
  // Query: "Focus on diagnostic applications"
  // Output: 3 child nodes - ["Radiology AI", "Pathology AI", "Clinical Decision Support"]

  // Diverge: "Explore alternatives"
  // Input: Current node "AI-powered healthcare" + Parent context "Healthcare Innovation"
  // Query: "Alternative healthcare innovations"
  // Output: 3 sibling nodes - ["Telemedicine Platforms", "Wearable Health Tech", "Genomics"]
  ```
- **UI Integration**: Right-click context menu on nodes, modal for query input
- **Current repo equivalent**: None - No dynamic node refinement capability
- **Business Value**: Enables iterative exploration, adapts to user's research direction
- **Priority**: Critical
- **Implementation approach**:
  1. Create `nodeRefinementService.ts` with converge/diverge logic
  2. Add Supabase edge function `node-refinement`
  3. Modify database schema to track refinement type and query
  4. Add `refinementType?: 'converge' | 'diverge'` and `refinementQuery?: string` to node schema
  5. Implement UI: context menu + modal for query input

#### Feature 2.2: Suggested Refinement Queries
- **Description**: AI automatically suggests relevant refinement directions when user initiates converge/diverge
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:399-421`
- **Implementation**:
  ```typescript
  // Input: Node name + refinement mode (converge/diverge)
  // Output: 3 suggested queries
  // Example for "AI Healthcare" + converge:
  // ["Focus on diagnostic imaging", "Explore personalized medicine", "Analyze drug discovery applications"]
  ```
- **Business Value**: Reduces cognitive load, guides exploration with expert suggestions
- **Priority**: Medium
- **Implementation approach**: Add to `nodeRefinementService.ts`, integrate with refinement modal

---

### 3. Comprehensive Analysis & Visualization Features

#### Feature 3.1: Multi-Stage Node Analysis Pipeline
- **Description**: 3-stage automated analysis for each scenario: Web search → Academic papers → AI-generated report with visualizations
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:219-363`
- **Key functions**:
  - `searchWebSources()` - Lines 219-241: Google Search API integration
  - `searchAcademicPapers()` - Lines 255-274: OpenAlex API for papers
  - `generateAnalysisReport()` - Lines 328-363: Generate comprehensive report with 6 data visualizations
- **Pipeline Architecture**:
  ```typescript
  // Stage 1: Web Search (uses Google Search grounding)
  //   - Returns: summary text + source links
  //   - Duration: ~2-3 seconds

  // Stage 2: Academic Papers (OpenAlex API)
  //   - Fetch top 5 papers by relevance
  //   - Invert abstract indices to reconstruct text
  //   - AI summarizes key research trends
  //   - Duration: ~3-4 seconds

  // Stage 3: Analysis Report Generation (Structured JSON)
  //   - Input: query + web summary + academic summary
  //   - Output: 6 structured data objects:
  //     1. summary: Executive summary (string)
  //     2. marketGrowth: 5-year market forecast (line chart data)
  //     3. techMaturity: 5-axis radar chart (scores 1-10)
  //     4. swot: Strengths/Weaknesses/Opportunities/Threats (3 items each with scores)
  //     5. competition: 3-5 competitors with market share (bar chart)
  //     6. potentialImpact: 5-axis impact assessment (radar chart)
  //   - Duration: ~5-7 seconds

  // Total pipeline: ~10-14 seconds per node
  ```
- **Current repo equivalent**:
  - Partial: `node-enrichment` function fetches papers
  - Partial: `node-enrichment-usecases` generates use cases
  - **Missing**: Web search, structured analysis report, data visualizations
- **Priority**: Critical
- **Business Value**: Provides comprehensive business intelligence for each scenario
- **Implementation approach**:
  1. Create `analysisService.ts` with 3-stage pipeline
  2. Add web search capability (Google Search API or alternative)
  3. Enhance OpenAlex integration with summary generation
  4. Implement structured analysis report generation with JSON schema
  5. Store analysis data in new table `node_analysis_reports`

#### Feature 3.2: Dynamic Chart Data Generation
- **Description**: AI generates structured data for 5 different chart types based on business analysis
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:277-363`
- **Chart Types & Schemas**:
  ```typescript
  // 1. Market Growth Forecast (Line Chart)
  interface LineChartData {
    series: { x: number; y: number }[];  // x = year offset, y = market size
  }

  // 2. Technology Maturity (Radar Chart)
  interface RadarChartData {
    axes: { axis: string; value: number }[];  // 5 axes, values 1-10
  }

  // 3. SWOT Analysis (Grid Display)
  interface SwotData {
    strengths: Point[];      // 3 items with importance scores
    weaknesses: Point[];
    opportunities: Point[];
    threats: Point[];
  }
  interface Point { label: string; value: number; }

  // 4. Competitive Landscape (Bar Chart)
  interface BarChartData {
    bars: { label: string; value: number }[];  // 3-5 competitors
  }

  // 5. Potential Impact (Radar Chart)
  // Same structure as techMaturity but different dimensions
  ```
- **Current repo equivalent**: None - Current repo doesn't generate visualization data
- **Priority**: High
- **Business Value**: Visual insights make analysis more digestible and actionable
- **Implementation approach**:
  1. Define chart data types in `/src/types/analysis.ts`
  2. Implement JSON schema-based generation in analysis pipeline
  3. Create chart components (can reuse D3.js approach or use Recharts/Nivo)
  4. Store chart data as JSONB in `node_analysis_reports`

#### Feature 3.3: Interactive Chart Regeneration with Natural Language
- **Description**: Users can modify any chart using natural language instructions (e.g., "make the forecast more pessimistic")
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:365-395`
- **Key function**: `regenerateChart(query, chartName, originalData, instruction)`
- **Implementation**:
  ```typescript
  // Input:
  //   - chartName: "Market Growth Forecast"
  //   - originalData: { series: [{ x: 0, y: 100 }, { x: 1, y: 120 }, ...] }
  //   - instruction: "Make it more pessimistic and add a market correction in year 3"

  // Output: New chart data maintaining structure but reflecting instruction
  //   { series: [{ x: 0, y: 100 }, { x: 1, y: 105 }, { x: 2, y: 108 },
  //               { x: 3, y: 95 }, { x: 4, y: 100 }] }
  ```
- **Current repo equivalent**: None
- **Business Value**: Allows scenario planning with different assumptions, increases analysis flexibility
- **Priority**: Medium
- **Implementation approach**:
  1. Add `regenerateChart` function to `analysisService.ts`
  2. Create edge function `regenerate-chart` in Supabase
  3. Update UI to include chart modification input
  4. Store modification history in database

---

### 4. Context-Aware Chat Features

#### Feature 4.1: Mindmap-Context Chat Assistant
- **Description**: Chat interface with full awareness of mindmap structure and selected nodes, providing contextual answers
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:465-521`
- **Key functions**:
  - `askChatAssistant()` - Lines 465-496: Answer with web search grounding
  - `suggestChatQuestions()` - Lines 498-521: Auto-suggest next questions
- **Context Serialization**:
  ```typescript
  // Serializes entire mindmap tree into text format for AI context
  function serializeMindMap(node: MindMapNode, depth = 0): string {
    let result = `${'  '.repeat(depth)}- ${node.name}`;
    if (node.refinementType) {
      result += ` (Refinement: ${node.refinementType}, Query: "${node.refinementQuery}")`;
    }
    if (node.analysisSummary) {
      result += `\n${'  '.repeat(depth+1)}Summary: ${node.analysisSummary}`;
    }
    // Recursively add children...
  }
  ```
- **Smart Context Selection**:
  ```typescript
  // If user has selected specific nodes → focus context on those nodes
  // Otherwise → use entire mindmap as context
  // Enables focused Q&A on specific scenarios
  ```
- **Current repo equivalent**:
  - Partial: `context-chat` edge function exists
  - **Missing**: Mindmap serialization, selected node context, auto-suggested questions
- **Priority**: High
- **Business Value**: Makes research more interactive, helps users discover insights
- **Implementation approach**:
  1. Create `mindmapSerializer.ts` utility
  2. Enhance `context-chat` function with tree context
  3. Add auto-suggestion for next questions
  4. Integrate with chat UI to show suggested questions as quick actions

#### Feature 4.2: Auto-Suggested Chat Questions
- **Description**: AI analyzes current context and suggests 3 relevant follow-up questions
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:498-521`
- **Example**:
  ```typescript
  // Context: User exploring "AI Healthcare" node with analysis data
  // Suggested questions:
  // - "What are the main regulatory challenges?"
  // - "Which companies are leading this market?"
  // - "How does this compare to traditional healthcare approaches?"
  ```
- **Current repo equivalent**: None
- **Priority**: Low
- **Business Value**: Guides exploration, reduces friction in research flow
- **Implementation approach**: Add to chat service, display as quick-action buttons in chat UI

---

### 5. Report Generation & Export Features

#### Feature 5.1: Business Proposal PDF Generator
- **Description**: Export analyzed scenarios as professional PDF business proposals with customizable sections
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/components/ReportGeneratorPanel.tsx`
- **Key capabilities**:
  - **Section Selection**: Checkbox for each section (summary, charts, SWOT, sources)
  - **Chart Rendering**: Uses html2canvas to convert D3.js/React charts to images
  - **PDF Layout**: jsPDF with Japanese font support (NotoSansCJKjp)
  - **Auto-pagination**: Intelligent page breaks based on content height
  - **AI Suggestions**: Recommends additional sections for executive approval
- **Section Components**:
  ```typescript
  const sections = {
    summary: true,           // Executive summary text
    marketGrowth: true,      // Market forecast line chart
    techMaturity: true,      // Technology maturity radar chart
    swot: true,              // SWOT analysis grid
    competition: true,       // Competitive landscape bar chart
    potentialImpact: true,   // Impact assessment radar chart
    webSources: false,       // Web reference links
    academicPapers: false,   // Academic citations
  }
  ```
- **PDF Generation Flow**:
  ```typescript
  1. User selects sections to include
  2. AI suggests additional sections (budget, timeline, team, risks)
  3. Click "Download PDF"
  4. System renders charts off-screen using html2canvas
  5. jsPDF assembles content with proper pagination
  6. Download PDF file: "Proposal-{NodeName}.pdf"
  ```
- **Current repo equivalent**: None - No PDF export capability
- **Priority**: Medium
- **Business Value**: Enables sharing insights with stakeholders, professional deliverable
- **Dependencies**:
  - `jspdf` - PDF generation
  - `html2canvas` - Chart to image conversion
  - Japanese font CDN link in index.html
- **Implementation approach**:
  1. Install dependencies: `npm install jspdf html2canvas`
  2. Create `reportGenerator.ts` service
  3. Implement chart-to-image conversion
  4. Add PDF layout with pagination logic
  5. Create UI panel for section selection
  6. Add to technology tree page as export option

#### Feature 5.2: AI-Suggested Report Sections
- **Description**: AI recommends additional sections needed for executive approval based on scenario
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:523-541`
- **Function**: `suggestAdditionalSections(topic: string)`
- **Example Output**:
  ```typescript
  // For topic "AI-powered Medical Diagnostics"
  // Suggestions: [
  //   "Budget & Resource Allocation",
  //   "Implementation Timeline (12-month roadmap)",
  //   "Required Team Structure & Skills",
  //   "Risk Assessment & Mitigation",
  //   "Regulatory Compliance Strategy"
  // ]
  ```
- **Priority**: Low
- **Business Value**: Ensures proposals are comprehensive and actionable
- **Implementation approach**: Add to `reportGenerator.ts`, display in report panel

---

### 6. Advanced Algorithm Implementations

#### Feature 6.1: Grouped Keyword Management
- **Description**: Algorithm for grouping selected keywords by their axes for structured mindmap generation
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:123-129`
- **Algorithm**:
  ```typescript
  // Input: Array of keywords with axis metadata
  const selectedKeywords = [
    { keyword: "Urban Mobility", axis: "Application Domain", ... },
    { keyword: "Sustainability", axis: "Impact Focus", ... },
    { keyword: "AI/ML", axis: "Technology", ... },
  ];

  // Output: Grouped by axis for structured generation
  const groupedKeywords = {
    "Application Domain": ["Urban Mobility", "Healthcare"],
    "Impact Focus": ["Sustainability", "Cost Reduction"],
    "Technology": ["AI/ML", "IoT"]
  };

  // This structure ensures mindmap explores all selected dimensions
  ```
- **Current repo equivalent**: None - Single query without multi-dimensional context
- **Priority**: Medium
- **Business Value**: Ensures comprehensive coverage of all exploration dimensions
- **Implementation approach**: Implement as utility function in multiAxisService

#### Feature 6.2: Node ID Management with Auto-Increment
- **Description**: Client-side unique ID generation for mindmap nodes during progressive generation
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/App.tsx:147-163`
- **Algorithm**:
  ```typescript
  const nodeIdCounter = useRef(0);

  const initializeNode = (node: Omit<MindMapNode, 'id'>, refinementType?: string): MindMapNode => {
    const newNode: MindMapNode = {
      ...node,
      id: `node-${nodeIdCounter.current++}`,  // Auto-increment ID
      refinementType,
      isAnalyzed: false,
      analysisSummary: undefined,
      analysisReport: undefined,
    };
    if (newNode.children) {
      newNode.children = newNode.children.map(child => initializeNode(child, refinementType));
    }
    return newNode;
  };
  ```
- **Current repo equivalent**: Database-generated UUIDs (more robust)
- **Priority**: Low (Current approach is better)
- **Note**: Current repo's UUID approach is superior for distributed systems

---

### 7. Data Structure & Type System Enhancements

#### Feature 7.1: Comprehensive Mindmap Node Type
- **Description**: Rich node type supporting analysis data, refinement metadata, and visualization state
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/types.ts:17-33`
- **Type Definition**:
  ```typescript
  interface MindMapNode {
    name: string;
    children?: MindMapNode[];
    _children?: MindMapNode[];           // For collapse/expand state
    id?: string | number;
    refinementType?: 'converge' | 'diverge';  // How this node was created
    refinementQuery?: string;                  // What query created it
    isAnalyzed?: boolean;                      // Has analysis completed
    analysisSummary?: string;                  // Short summary text
    analysisReport?: AnalysisReport;           // Full analysis with charts
  }
  ```
- **Current repo equivalent**: `TreeNode` type - simpler, lacks analysis metadata
- **Recommendation**: Enhance `TreeNode` type with analysis-related fields
- **Implementation**:
  ```typescript
  // In src/types/tree.ts, add:
  export interface TreeNode {
    id: string;
    name: string;
    description?: string;
    level?: number;
    // Add these fields:
    refinementType?: 'converge' | 'diverge';
    refinementQuery?: string;
    isAnalyzed?: boolean;
    analysisSummary?: string;
    analysisReport?: AnalysisReport;  // New type to create
  }
  ```

#### Feature 7.2: Analysis Report Type System
- **Description**: Comprehensive type definitions for all analysis data structures
- **Location in reference repo**: `/Users/apple/Downloads/10_7-scenario-mindmap-generator/types.ts:36-84`
- **Key Types**:
  ```typescript
  interface WebSource {
    title: string;
    link: string;
    summary?: string;
  }

  interface AcademicPaper {
    title: string;
    authors: string[];
    year: number;
    link: string;
    abstract?: string;
  }

  interface Point {
    label: string;
    value: number;  // Typically 1-10 scale
  }

  interface LineChartData {
    series: { x: number; y: number }[];
  }

  interface RadarChartData {
    axes: { axis: string; value: number }[];
  }

  interface BarChartData {
    bars: { label: string; value: number }[];
  }

  interface SwotData {
    strengths: Point[];
    weaknesses: Point[];
    opportunities: Point[];
    threats: Point[];
  }

  interface AnalysisReport {
    summary: string;
    marketGrowth: LineChartData;
    techMaturity: RadarChartData;
    swot: SwotData;
    competition: BarChartData;
    potentialImpact: RadarChartData;
    webSources?: WebSource[];
    academicPapers?: AcademicPaper[];
    [key: string]: any;  // Extensible for custom charts
  }

  type AnalysisStatus = 'idle' | 'web' | 'papers' | 'report' | 'done' | 'error';
  ```
- **Current repo equivalent**: None - These types don't exist
- **Priority**: High (Required for analysis features)
- **Implementation approach**: Create `/src/types/analysis.ts` with these definitions

---

## API Endpoints Missing

| Endpoint | Method | Purpose | Priority | Implementation |
|----------|--------|---------|----------|----------------|
| N/A - Client-side only | N/A | Multi-axis keyword generation | High | Convert to Supabase edge function |
| N/A | N/A | Investigation aim suggestions | Medium | New edge function |
| N/A | N/A | Node refinement (converge/diverge) | Critical | New edge function `node-refinement` |
| N/A | N/A | Web source search | Critical | New edge function with Google Search API |
| N/A | N/A | Comprehensive analysis report generation | Critical | Enhance `node-enrichment` or create new |
| N/A | N/A | Chart data regeneration | Medium | New edge function `regenerate-chart` |
| N/A | N/A | Chat question suggestions | Low | Enhance `context-chat` |

**Note**: Reference repository is fully client-side with no backend. All AI calls are made directly from browser to Google Gemini API. Current repository uses Supabase Edge Functions for server-side processing.

---

## Database Schema Enhancements Needed

### New Table: `node_analysis_reports`

```sql
CREATE TABLE node_analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES tree_nodes(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES technology_trees(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),

  -- Analysis pipeline status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'web' | 'papers' | 'report' | 'done' | 'error'

  -- Stage 1: Web sources
  web_summary TEXT,
  web_sources JSONB,  -- Array of { title, link, summary }

  -- Stage 2: Academic papers
  academic_summary TEXT,
  academic_papers JSONB,  -- Array of { title, authors, year, link, abstract }

  -- Stage 3: Analysis report
  report_summary TEXT,
  market_growth JSONB,      -- LineChartData
  tech_maturity JSONB,      -- RadarChartData
  swot_analysis JSONB,      -- SwotData
  competition JSONB,        -- BarChartData
  potential_impact JSONB,   -- RadarChartData

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(node_id)  -- One report per node
);

-- Index for fast lookups
CREATE INDEX idx_analysis_reports_tree ON node_analysis_reports(tree_id);
CREATE INDEX idx_analysis_reports_status ON node_analysis_reports(status);
```

### Modify Table: `tree_nodes`

```sql
-- Add refinement metadata
ALTER TABLE tree_nodes
ADD COLUMN refinement_type TEXT CHECK (refinement_type IN ('converge', 'diverge')),
ADD COLUMN refinement_query TEXT,
ADD COLUMN is_analyzed BOOLEAN DEFAULT FALSE,
ADD COLUMN analysis_summary TEXT;

-- Add index for refinement queries
CREATE INDEX idx_tree_nodes_refinement ON tree_nodes(refinement_type) WHERE refinement_type IS NOT NULL;
```

### New Table: `keyword_axes`

```sql
CREATE TABLE keyword_axes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES technology_trees(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),

  -- Axis definition
  axis_name TEXT NOT NULL,
  axis_description TEXT,

  -- Generated keywords for this axis
  keywords JSONB NOT NULL,  -- Array of { keyword, description }

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tree_id, axis_name)
);
```

### New Table: `investigation_aims`

```sql
CREATE TABLE investigation_aims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES technology_trees(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),

  -- Aim details
  aim_text TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,

  -- Context that generated this aim
  selected_keywords JSONB,  -- Array of keyword objects

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Configuration Files Missing

### Environment Variables to Add

```env
# In .env.local

# Google Gemini API (for reference implementation features)
GOOGLE_GEMINI_API_KEY=your-api-key-here

# Google Search API (for web source grounding)
GOOGLE_SEARCH_API_KEY=your-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id

# OpenAlex API (already have papers, but for enhanced usage)
OPENALEX_EMAIL=your-email@domain.com  # For polite pool access

# PDF Generation
PDF_FONT_URL=https://cdn.jsdelivr.net/npm/noto-sans-cjk-jp@1.0.0/fonts/NotoSansCJKjp-Regular.woff
```

---

## Implementation Roadmap

### Phase 1: Core Multi-Axis & Refinement (Weeks 1-3) - CRITICAL

#### Week 1: Multi-Axis Keyword System
**Objective**: Enable exploration from multiple perspectives

**Tasks**:
1. **Day 1-2**: Setup & Type Definitions
   - Create `/src/services/multiAxisService.ts`
   - Create `/src/types/axis.ts` with `Axis`, `Keyword`, `GeneratedKeywords` types
   - Setup Google Gemini API client (or adapt to OpenAI)
   - Create database migration for `keyword_axes` table

2. **Day 3-4**: Backend Implementation
   - Implement `getRecommendedAxes(query)` function
   - Implement `generateAxisDescription(query, axisName)` function
   - Implement `generateKeywordsForAxis(query, axis)` function
   - Create Supabase edge function `generate-axes`
   - Add API routes in edge functions

3. **Day 5**: Testing
   - Unit tests for axis generation
   - Integration tests for edge functions
   - Test with various query types

**Deliverables**:
- Working multi-axis generation backend
- API endpoints functional
- Database schema in place

#### Week 2: Investigation Aim System
**Objective**: Help users focus their exploration

**Tasks**:
1. **Day 1-2**: Aim Suggestion Logic
   - Implement `suggestAims(query, selectedKeywords)` in `multiAxisService.ts`
   - Create database migration for `investigation_aims` table
   - Create edge function `suggest-aims`

2. **Day 3-5**: Integration & Testing
   - Integrate with tree generation flow
   - Store selected aim with tree metadata
   - Test aim quality with various keyword combinations

**Deliverables**:
- Aim suggestion working end-to-end
- Database persistence
- Quality assurance on AI outputs

#### Week 3: Node Refinement (Converge/Diverge)
**Objective**: Enable iterative scenario exploration

**Tasks**:
1. **Day 1-2**: Refinement Service
   - Create `/src/services/nodeRefinementService.ts`
   - Implement `suggestRefinementQueries(nodeName, mode)`
   - Implement `generateConvergentNodes(parentNode, query)`
   - Implement `generateDivergentNodes(contextNode, parentNode, query)`

2. **Day 3-4**: Database & API
   - Add refinement columns to `tree_nodes` table
   - Create edge function `node-refinement`
   - Implement node update logic

3. **Day 5**: Testing
   - Test converge mode with various scenarios
   - Test diverge mode with sibling generation
   - Verify database updates

**Deliverables**:
- Fully functional refinement system
- Database schema updated
- Edge functions deployed

### Phase 2: Analysis & Visualization (Weeks 4-6) - HIGH PRIORITY

#### Week 4: Multi-Stage Analysis Pipeline
**Objective**: Comprehensive business intelligence for each scenario

**Tasks**:
1. **Day 1-2**: Web Source Search
   - Setup Google Search API integration
   - Implement `searchWebSources(query)` with grounding
   - Create edge function with proper error handling

2. **Day 3-4**: Academic Paper Enhancement
   - Enhance existing OpenAlex integration
   - Implement abstract reconstruction from inverted index
   - Add AI summarization of research trends

3. **Day 5**: Pipeline Orchestration
   - Create `analysisService.ts` with 3-stage pipeline
   - Implement sequential execution: web → papers → report
   - Add proper error handling and retry logic

**Deliverables**:
- Working analysis pipeline
- Web and academic data collection
- Proper error handling

#### Week 5: Structured Analysis Report Generation
**Objective**: Generate rich business analysis with visualizations

**Tasks**:
1. **Day 1-2**: Type System & Schema
   - Create `/src/types/analysis.ts` with all chart types
   - Create database migration for `node_analysis_reports` table
   - Define JSON schemas for structured generation

2. **Day 3-4**: Report Generation Logic
   - Implement `generateAnalysisReport(query, webCtx, academicCtx)`
   - Generate all 6 chart data types with proper schemas
   - Test data quality and consistency

3. **Day 5**: Database Integration
   - Store analysis reports in database
   - Implement retrieval and caching
   - Add update/regeneration support

**Deliverables**:
- Structured analysis report generation
- Database persistence
- 6 types of chart data

#### Week 6: Chart Visualization & Regeneration
**Objective**: Display insights visually and allow modifications

**Tasks**:
1. **Day 1-3**: Chart Components
   - Choose chart library (Recharts/Nivo recommended)
   - Implement LineChart component
   - Implement RadarChart component
   - Implement BarChart component
   - Implement SWOT grid display
   - Test with real data

2. **Day 4-5**: Interactive Regeneration
   - Implement `regenerateChart(query, chartName, originalData, instruction)`
   - Create edge function `regenerate-chart`
   - Add UI for chart modification input
   - Test various modification instructions

**Deliverables**:
- All chart components functional
- Interactive chart modification
- Smooth user experience

### Phase 3: Chat & Export (Weeks 7-8) - MEDIUM PRIORITY

#### Week 7: Context-Aware Chat Enhancement
**Objective**: Make chat assistant mindmap-aware

**Tasks**:
1. **Day 1-2**: Mindmap Serialization
   - Create `/src/utils/mindmapSerializer.ts`
   - Implement tree serialization for AI context
   - Include refinement metadata and analysis summaries

2. **Day 3-4**: Enhanced Chat Service
   - Enhance `context-chat` edge function with tree context
   - Implement selected node focus mode
   - Add web search grounding for answers

3. **Day 5**: Auto-Suggested Questions
   - Implement `suggestChatQuestions(context)`
   - Display suggestions as quick-action buttons
   - Test suggestion relevance

**Deliverables**:
- Tree-aware chat responses
- Focused context on selected nodes
- Auto-suggested questions

#### Week 8: PDF Report Generation
**Objective**: Export scenarios as professional proposals

**Tasks**:
1. **Day 1-2**: Dependencies & Setup
   - Install jspdf and html2canvas
   - Setup Japanese font loading
   - Create `/src/services/reportGenerator.ts`

2. **Day 3-4**: PDF Generation Logic
   - Implement section selection
   - Implement chart-to-image conversion
   - Implement PDF layout with pagination
   - Test with various content sizes

3. **Day 5**: AI Section Suggestions
   - Implement `suggestAdditionalSections(topic)`
   - Display in report panel
   - Polish user experience

**Deliverables**:
- Working PDF export
- Professional layout
- AI recommendations for completeness

### Phase 4: Polish & Optimization (Week 9-10) - LOW PRIORITY

#### Week 9: Performance Optimization
- Implement caching for repeated queries
- Optimize database queries
- Add loading states for all async operations
- Implement request deduplication

#### Week 10: Error Handling & Edge Cases
- Comprehensive error handling for all AI calls
- Retry logic with exponential backoff
- User-friendly error messages
- Fallback mechanisms for API failures

---

## Dependencies to Add

```json
{
  "dependencies": {
    // AI & Analysis
    "@google/genai": "^1.23.0",              // Google Gemini AI client

    // Visualization
    "recharts": "^2.10.0",                   // Chart library (alternative to D3.js)
    "nivo": "^0.87.0",                       // Alternative rich chart library

    // PDF Generation
    "jspdf": "^2.5.1",                       // PDF generation
    "html2canvas": "^1.4.1",                 // HTML to canvas/image conversion

    // Utilities
    "lodash": "^4.17.21",                    // Utility functions for data manipulation
  },
  "devDependencies": {
    "@types/lodash": "^4.14.202"
  }
}
```

---

## Quick Start Implementation Guide

### Step 1: Setup Core Structure
```bash
# Create necessary directories
mkdir -p src/services/{multiAxis,analysis,nodeRefinement}
mkdir -p src/types
mkdir -p src/utils/serializers
mkdir -p src/components/charts
mkdir -p supabase/functions/{generate-axes,suggest-aims,node-refinement,web-search,regenerate-chart}

# Install dependencies
npm install @google/genai recharts jspdf html2canvas lodash
npm install -D @types/lodash
```

### Step 2: Database Migrations
```bash
# Create migration files
npx supabase migration new add_analysis_features

# Copy SQL from "Database Schema Enhancements" section
# Apply migrations
npx supabase db push
```

### Step 3: Environment Setup
```bash
# Add to .env.local
echo "GOOGLE_GEMINI_API_KEY=your-key" >> .env.local
echo "GOOGLE_SEARCH_API_KEY=your-key" >> .env.local
echo "GOOGLE_SEARCH_ENGINE_ID=your-id" >> .env.local
```

### Step 4: Core Service Implementation
```bash
# Copy core logic from reference repo
# Priority order:
# 1. src/services/multiAxisService.ts (multi-axis keyword system)
# 2. src/services/nodeRefinementService.ts (converge/diverge)
# 3. src/services/analysisService.ts (3-stage analysis pipeline)
```

### Step 5: Edge Functions
```bash
# Deploy new edge functions
npx supabase functions deploy generate-axes
npx supabase functions deploy suggest-aims
npx supabase functions deploy node-refinement
npx supabase functions deploy web-search
npx supabase functions deploy comprehensive-analysis
```

### Step 6: Frontend Integration
```bash
# Add chart components
# Add analysis panel components
# Integrate with technology tree page
# Test end-to-end flows
```

---

## File Mapping

| Reference Repo File | Purpose | Port to Current Repo | Priority |
|-------------------|---------|---------------------|----------|
| `services/geminiService.ts` | Core AI service | Split into multiple services | Critical |
| Lines 12-95 | Multi-axis keyword generation | `src/services/multiAxisService.ts` | High |
| Lines 97-120 | Investigation aim suggestions | `src/services/multiAxisService.ts` | Medium |
| Lines 122-215 | Hierarchical mindmap generation | Enhance `supabase/functions/generate-tree/index.ts` | High |
| Lines 219-274 | Web + academic search | `src/services/analysisService.ts` | Critical |
| Lines 277-363 | Analysis report generation | `src/services/analysisService.ts` | Critical |
| Lines 365-395 | Chart regeneration | `src/services/analysisService.ts` | Medium |
| Lines 399-462 | Node refinement (converge/diverge) | `src/services/nodeRefinementService.ts` | Critical |
| Lines 465-496 | Context-aware chat | Enhance `supabase/functions/context-chat/index.ts` | High |
| Lines 498-541 | Chat & report suggestions | `src/services/chatService.ts` | Low |
| `types.ts` | Type definitions | `src/types/analysis.ts` + enhance `src/types/tree.ts` | High |
| `components/AnalysisPanel.tsx` | Analysis UI | `src/components/technology-tree/AnalysisPanel.tsx` | High |
| `components/ReportGeneratorPanel.tsx` | PDF export UI | `src/components/technology-tree/ReportGenerator.tsx` | Medium |
| `components/ChatAssistant.tsx` | Chat UI patterns | Enhance existing chat components | Medium |
| `components/charts/*.tsx` | Chart components | `src/components/charts/*.tsx` | High |

---

## Key Algorithmic Differences

### 1. Tree Generation Philosophy

**Reference Repo**:
```
User-Driven Exploration
├─ Define exploration axes (3-5 dimensions)
├─ Generate keywords per axis (3-5 each)
├─ Select keywords (min 2, cross-axis)
├─ AI suggests focused aims
├─ Generate 2-level initial tree (1 root → 5 scenarios)
├─ Parallel branch expansion (5 scenarios → 3 apps each)
└─ Interactive refinement (converge/diverge)
```

**Current Repo**:
```
Structure-Driven Generation
├─ Single query input
├─ AI generates full tree (Scenario → Purpose → Function → Measure)
├─ MECE principle for comprehensive coverage
├─ Fixed hierarchical structure
└─ Post-generation enrichment (papers, use cases)
```

**Recommendation**: Combine both approaches
- Use reference repo's multi-axis exploration for initial phase
- Apply current repo's MECE principles for structure quality
- Enable reference repo's refinement for iterative exploration

### 2. Analysis Approach

**Reference Repo**:
```
AI-Powered Comprehensive Analysis
├─ Web search with Google grounding
├─ Academic paper search (OpenAlex)
├─ AI generates 6 structured datasets
│   ├─ Market forecast (5-year)
│   ├─ Tech maturity (5 dimensions)
│   ├─ SWOT (4 categories)
│   ├─ Competition (3-5 players)
│   └─ Impact assessment (5 dimensions)
├─ Visualize all data
└─ Allow natural language modifications
```

**Current Repo**:
```
Database-Driven Enrichment
├─ Fetch academic papers (database storage)
├─ Generate use cases (database storage)
├─ Calculate TRL scores
└─ Display in panels
```

**Recommendation**: Merge approaches
- Keep current repo's database persistence (superior for teams)
- Add reference repo's comprehensive analysis pipeline
- Combine paper data with market analysis
- Add visualization layer

---

## Business Value Assessment

### High-Impact Features (Implement First)

1. **Multi-Axis Keyword System** (Value: ★★★★★)
   - Enables systematic exploration
   - Reduces bias in scenario generation
   - Ensures comprehensive coverage

2. **Node Refinement (Converge/Diverge)** (Value: ★★★★★)
   - Makes tool interactive and adaptive
   - Enables iterative research
   - Unique differentiator

3. **Comprehensive Analysis Pipeline** (Value: ★★★★★)
   - Provides actionable business intelligence
   - Combines web + academic + AI insights
   - Core value proposition

4. **Structured Visualization Data** (Value: ★★★★☆)
   - Makes insights digestible
   - Enables data-driven decisions
   - Professional presentation

### Medium-Impact Features

5. **Investigation Aim Suggestions** (Value: ★★★☆☆)
   - Helps focus exploration
   - Reduces decision paralysis
   - Good UX enhancement

6. **Interactive Chart Regeneration** (Value: ★★★☆☆)
   - Enables scenario planning
   - Increases analysis flexibility
   - Differentiating feature

7. **Context-Aware Chat** (Value: ★★★★☆)
   - Improves research efficiency
   - Natural interaction model
   - Reduces friction

### Lower-Impact Features

8. **PDF Report Generation** (Value: ★★☆☆☆)
   - Nice-to-have for presentations
   - Shareable deliverable
   - Can defer to later phase

9. **Auto-Suggested Questions** (Value: ★★☆☆☆)
   - Slight UX improvement
   - Easy to implement
   - Low priority

---

## Technical Debt & Considerations

### Reference Repo Limitations to Avoid

1. **Client-Side Only Architecture**
   - **Issue**: All AI calls from browser expose API keys
   - **Current repo advantage**: Server-side edge functions are more secure
   - **Recommendation**: Keep server-side architecture

2. **No Persistence**
   - **Issue**: Lose all work on page refresh
   - **Current repo advantage**: Database-backed with team management
   - **Recommendation**: Persist all generated data

3. **No Collaboration Features**
   - **Issue**: Single-user only
   - **Current repo advantage**: Team-based access control
   - **Recommendation**: Maintain current team structure

4. **Limited Scalability**
   - **Issue**: Large trees become slow to render
   - **Current repo advantage**: Pagination and virtualization
   - **Recommendation**: Keep current optimization strategies

### Current Repo Limitations to Address

1. **Fixed Tree Structure**
   - **Issue**: Rigid Scenario→Purpose→Function→Measure hierarchy
   - **Solution**: Add dynamic depth and flexible levels

2. **No Interactive Refinement**
   - **Issue**: Can't explore alternatives or drill down
   - **Solution**: Implement converge/diverge from reference

3. **Limited Analysis Depth**
   - **Issue**: Only papers + use cases, no market/competitive analysis
   - **Solution**: Add comprehensive analysis pipeline

4. **No Visualization**
   - **Issue**: Text-heavy, harder to digest insights
   - **Solution**: Add chart components and structured data generation

---

## Cost & Resource Estimation

### API Costs (Monthly estimates for moderate usage)

| Feature | API | Est. Cost per 1000 calls | Monthly (1000 users) |
|---------|-----|---------------------------|----------------------|
| Multi-axis generation | Gemini 2.5 Flash | $0.15 | $150 |
| Node refinement | Gemini 2.5 Flash | $0.15 | $150 |
| Comprehensive analysis | Gemini 2.5 Flash | $0.30 | $300 |
| Web search grounding | Google Search | $5.00 | $5000 |
| Academic papers | OpenAlex | Free | $0 |
| Chat assistance | Gemini 2.5 Flash | $0.15 | $150 |
| **Total estimated** | | | **~$5750/month** |

**Note**: Google Search API grounding is the most expensive component. Consider alternatives:
- Brave Search API (cheaper)
- Tavily API (optimized for AI)
- Exa AI (semantic search)
- SerpAPI (flexible pricing)

### Development Time Estimation

| Phase | Weeks | Developer Resources |
|-------|-------|---------------------|
| Phase 1: Core Multi-Axis & Refinement | 3 | 1-2 full-time developers |
| Phase 2: Analysis & Visualization | 3 | 1-2 full-time developers |
| Phase 3: Chat & Export | 2 | 1 developer |
| Phase 4: Polish & Optimization | 2 | 1 developer |
| **Total** | **10 weeks** | **~400-600 hours** |

### Testing & QA Requirements

- Unit tests for all service functions
- Integration tests for edge functions
- E2E tests for critical user flows
- Load testing for concurrent analysis pipelines
- AI output quality assurance (manual review)

Estimated QA time: +20% of development time (80-120 hours)

---

## Success Metrics & KPIs

### Feature Adoption Metrics

1. **Multi-Axis Usage**
   - % of users who explore multiple axes
   - Average number of axes used per session
   - Axis recommendation acceptance rate

2. **Node Refinement Engagement**
   - % of trees with refined nodes
   - Converge vs diverge usage ratio
   - Average refinement depth

3. **Analysis Utilization**
   - % of nodes analyzed
   - Time spent viewing analysis panels
   - Chart modification frequency

4. **Chat Interaction**
   - Chat messages per session
   - Question suggestion click-through rate
   - Average conversation length

5. **Export & Share**
   - PDF downloads per user
   - Report section selection patterns
   - Share/collaboration rate

### Quality Metrics

1. **AI Output Quality**
   - Axis relevance score (user feedback)
   - Keyword usefulness rating
   - Analysis accuracy (manual review)

2. **System Performance**
   - Analysis pipeline completion time
   - Error rate per feature
   - API timeout frequency

3. **User Satisfaction**
   - Feature NPS scores
   - Time to insight (measured)
   - Task completion rate

---

## Conclusion & Recommendations

### Critical Path

The most valuable features to implement in priority order:

1. **Node Refinement System** (converge/diverge) - Enables iterative exploration, biggest differentiator
2. **Comprehensive Analysis Pipeline** - Provides actionable business intelligence
3. **Multi-Axis Keyword System** - Ensures systematic exploration
4. **Structured Visualization** - Makes insights digestible

### Strategic Recommendations

1. **Hybrid Approach**: Combine reference repo's interactive exploration with current repo's persistence and team features

2. **Incremental Rollout**: Start with refinement system, add analysis pipeline, then multi-axis exploration

3. **API Cost Optimization**:
   - Use cheaper search alternatives for web grounding
   - Cache analysis results aggressively
   - Implement rate limiting per team

4. **Quality Assurance**:
   - Manual review of AI outputs during beta
   - User feedback loops for improvement
   - A/B testing for prompt optimization

5. **Future Enhancements** (Post Phase 4):
   - Collaborative mindmap editing
   - Version history and comparison
   - Template library for common scenarios
   - Integration with external tools (Notion, Miro)
   - Custom chart types and metrics

---

## Appendices

### A. Reference Code Snippets

See separate file: `algorithms-to-port.md`

### B. API Integration Guides

See separate file: `api-specifications.md`

### C. Data Model Specifications

See separate file: `data-models.md`

### D. Testing Strategies

See separate file: `testing-guide.md`

---

**End of Feature Gap Analysis Report**

Generated on: 2025-10-20
Report Version: 1.0
Next Review: After Phase 1 completion

# Implementation Guide: Scenario Mindmap Features

## Quick Start - 5-Day Sprint Implementation

This guide provides a rapid implementation path for the **highest-priority** features from the gap analysis. Follow this to get core refinement and analysis features working in one sprint.

---

## Day 1: Node Refinement Backend (Converge/Diverge)

### Goal: Enable users to drill down or explore alternatives for any scenario

### Step 1: Create Type Definitions (30 min)

Create `src/types/refinement.ts`:
```typescript
export type RefinementMode = 'converge' | 'diverge';

export interface RefinementRequest {
  nodeId: string;
  nodeName: string;
  mode: RefinementMode;
  query: string;
  parentContext?: {
    parentId: string;
    parentName: string;
  };
}

export interface RefinementResult {
  newNodes: {
    name: string;
    description: string;
  }[];
  refinementType: RefinementMode;
  refinementQuery: string;
}

export interface RefinementSuggestions {
  suggestions: string[];
  mode: RefinementMode;
}
```

### Step 2: Database Migration (15 min)

Create migration file:
```bash
npx supabase migration new add_node_refinement
```

Add SQL:
```sql
-- Add refinement columns to tree_nodes
ALTER TABLE tree_nodes
ADD COLUMN refinement_type TEXT CHECK (refinement_type IN ('converge', 'diverge')),
ADD COLUMN refinement_query TEXT;

-- Index for queries
CREATE INDEX idx_tree_nodes_refinement ON tree_nodes(refinement_type) WHERE refinement_type IS NOT NULL;

-- Apply migration
npx supabase db push
```

### Step 3: Create Refinement Service (2 hours)

Create `src/services/nodeRefinementService.ts`:
```typescript
import { supabase } from "@/integrations/supabase/client";
import type { RefinementRequest, RefinementResult, RefinementSuggestions, RefinementMode } from "@/types/refinement";

/**
 * Suggests refinement queries based on node and mode
 */
export async function suggestRefinementQueries(
  nodeName: string,
  mode: RefinementMode
): Promise<RefinementSuggestions> {
  const { data, error } = await supabase.functions.invoke('suggest-refinement', {
    body: { nodeName, mode }
  });

  if (error) throw new Error(`Failed to get suggestions: ${error.message}`);
  return data;
}

/**
 * Generates new nodes based on refinement request
 */
export async function refineNode(
  request: RefinementRequest
): Promise<RefinementResult> {
  const { data, error } = await supabase.functions.invoke('refine-node', {
    body: request
  });

  if (error) throw new Error(`Refinement failed: ${error.message}`);
  return data;
}

/**
 * Adds refined nodes to database
 */
export async function addRefinedNodes(
  treeId: string,
  parentNodeId: string,
  newNodes: RefinementResult,
  teamId?: string
): Promise<void> {
  const nodesToInsert = newNodes.newNodes.map(node => ({
    tree_id: treeId,
    parent_id: newNodes.refinementType === 'converge' ? parentNodeId : null,
    name: node.name,
    description: node.description,
    refinement_type: newNodes.refinementType,
    refinement_query: newNodes.refinementQuery,
    team_id: teamId,
  }));

  const { error } = await supabase
    .from('tree_nodes')
    .insert(nodesToInsert);

  if (error) throw new Error(`Failed to insert refined nodes: ${error.message}`);
}
```

### Step 4: Create Edge Functions (3 hours)

Create `supabase/functions/suggest-refinement/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { nodeName, mode } = await req.json();

    const actionText = mode === 'converge'
      ? "drill down into more specific sub-topics or applications"
      : "explore alternative or related ideas";

    const prompt = `For the scenario "${nodeName}", suggest 3 concise and insightful queries to ${actionText}. Return only a JSON array of strings.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic thinking assistant helping users explore business scenarios. Return only valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions":[]}');

    return new Response(
      JSON.stringify({ suggestions: result.suggestions || [], mode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

Create `supabase/functions/refine-node/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.20.1";

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { nodeName, mode, query, parentContext } = await req.json();

    let prompt: string;

    if (mode === 'converge') {
      prompt = `Given the parent scenario "${nodeName}", generate 3 specific and actionable sub-scenarios or applications based on the query: "${query}".

Return a JSON object with this structure:
{
  "nodes": [
    { "name": "Sub-scenario 1", "description": "Brief description" },
    { "name": "Sub-scenario 2", "description": "Brief description" },
    { "name": "Sub-scenario 3", "description": "Brief description" }
  ]
}`;
    } else {
      // Diverge
      prompt = `In the context of the broader scenario "${parentContext?.parentName || 'unknown'}", and considering the existing idea "${nodeName}", generate 3 related but distinct alternative scenarios based on the query: "${query}".

Return a JSON object with this structure:
{
  "nodes": [
    { "name": "Alternative 1", "description": "Brief description" },
    { "name": "Alternative 2", "description": "Brief description" },
    { "name": "Alternative 3", "description": "Brief description" }
  ]
}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a business scenario generator. Generate specific, actionable scenarios with clear descriptions. Return only valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"nodes":[]}');

    return new Response(
      JSON.stringify({
        newNodes: result.nodes || [],
        refinementType: mode,
        refinementQuery: query
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

Deploy:
```bash
npx supabase functions deploy suggest-refinement
npx supabase functions deploy refine-node
```

---

## Day 2-3: Analysis Pipeline Backend

### Goal: Generate comprehensive business analysis with visualizations

### Step 1: Type Definitions (30 min)

Create `src/types/analysis.ts`:
```typescript
export interface Point {
  label: string;
  value: number;
}

export interface LineChartData {
  series: { x: number; y: number }[];
}

export interface RadarChartData {
  axes: { axis: string; value: number }[];
}

export interface BarChartData {
  bars: { label: string; value: number }[];
}

export interface SwotData {
  strengths: Point[];
  weaknesses: Point[];
  opportunities: Point[];
  threats: Point[];
}

export interface WebSource {
  title: string;
  link: string;
  summary?: string;
}

export interface AcademicPaper {
  title: string;
  authors: string[];
  year: number;
  link: string;
  abstract?: string;
}

export interface AnalysisReport {
  summary: string;
  marketGrowth: LineChartData;
  techMaturity: RadarChartData;
  swot: SwotData;
  competition: BarChartData;
  potentialImpact: RadarChartData;
  webSources?: WebSource[];
  academicPapers?: AcademicPaper[];
}

export type AnalysisStatus = 'idle' | 'web' | 'papers' | 'report' | 'done' | 'error';
```

### Step 2: Database Migration (20 min)

```sql
-- Create analysis reports table
CREATE TABLE node_analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL UNIQUE REFERENCES tree_nodes(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES technology_trees(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),

  status TEXT NOT NULL DEFAULT 'pending',

  web_summary TEXT,
  web_sources JSONB,

  academic_summary TEXT,
  academic_papers JSONB,

  report_summary TEXT,
  market_growth JSONB,
  tech_maturity JSONB,
  swot_analysis JSONB,
  competition JSONB,
  potential_impact JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_reports_tree ON node_analysis_reports(tree_id);
CREATE INDEX idx_analysis_reports_status ON node_analysis_reports(status);
```

### Step 3: Create Analysis Service (4 hours)

Create `src/services/analysisService.ts`:
```typescript
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisReport, AnalysisStatus } from "@/types/analysis";

export async function startAnalysis(
  nodeId: string,
  nodeName: string,
  treeId: string,
  teamId?: string
): Promise<string> {
  // Create analysis record
  const { data, error } = await supabase
    .from('node_analysis_reports')
    .insert({
      node_id: nodeId,
      tree_id: treeId,
      team_id: teamId,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to start analysis: ${error.message}`);

  // Trigger analysis function
  const { error: invokeError } = await supabase.functions.invoke('comprehensive-analysis', {
    body: {
      analysisId: data.id,
      nodeId,
      nodeName,
      treeId,
      teamId
    }
  });

  if (invokeError) throw new Error(`Failed to invoke analysis: ${invokeError.message}`);

  return data.id;
}

export async function getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
  const { data, error } = await supabase
    .from('node_analysis_reports')
    .select('status')
    .eq('id', analysisId)
    .single();

  if (error) throw new Error(`Failed to get status: ${error.message}`);
  return data.status as AnalysisStatus;
}

export async function getAnalysisReport(nodeId: string): Promise<AnalysisReport | null> {
  const { data, error } = await supabase
    .from('node_analysis_reports')
    .select('*')
    .eq('node_id', nodeId)
    .eq('status', 'done')
    .single();

  if (error || !data) return null;

  return {
    summary: data.report_summary,
    marketGrowth: data.market_growth,
    techMaturity: data.tech_maturity,
    swot: data.swot_analysis,
    competition: data.competition,
    potentialImpact: data.potential_impact,
    webSources: data.web_sources,
    academicPapers: data.academic_papers,
  };
}
```

### Step 4: Create Comprehensive Analysis Edge Function (6 hours)

This is the most complex function. Create `supabase/functions/comprehensive-analysis/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { OpenAI } from "https://esm.sh/openai@4.20.1";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Search academic papers via OpenAlex
async function searchAcademicPapers(query: string) {
  const response = await fetch(
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5&sort=relevance_score:desc`
  );
  const data = await response.json();

  const papers = data.results.map((item: any) => ({
    title: item.title,
    authors: item.authorships.map((a: any) => a.author.display_name),
    year: item.publication_year,
    link: item.doi || `https://openalex.org/${item.id}`,
    abstract: item.abstract_inverted_index ? invertAbstract(item.abstract_inverted_index) : 'No abstract available.'
  }));

  // Summarize papers with AI
  const abstractTexts = papers.map(p => `Title: ${p.title}\\nAbstract: ${p.abstract}`).join('\\n\\n---\\n\\n');
  const summaryPrompt = `Summarize the key research trends and technical findings related to "${query}" based on these academic papers:\\n\\n${abstractTexts}`;

  const summaryResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: summaryPrompt }],
    temperature: 0.5,
  });

  return {
    summary: summaryResponse.choices[0].message.content,
    papers
  };
}

function invertAbstract(invertedIndex: Record<string, number[]>): string {
  const wordList: { word: string; pos: number }[] = [];
  Object.entries(invertedIndex).forEach(([term, positions]) => {
    positions.forEach(pos => wordList.push({ word: term, pos }));
  });
  wordList.sort((a, b) => a.pos - b.pos);
  return wordList.map(item => item.word).join(' ');
}

// Helper: Web search (simplified - use Tavily or Brave API in production)
async function searchWeb(query: string) {
  // TODO: Replace with actual web search API
  // For now, return mock data or skip
  return {
    summary: `Web search for "${query}" - integration pending`,
    sources: []
  };
}

// Helper: Generate analysis report
async function generateReport(query: string, webContext: string, academicContext: string) {
  const prompt = `You are a business and technology analyst. Based on the following context, generate a comprehensive analysis report for the topic "${query}".

Web Information Summary:
${webContext}
---
Academic Research Summary:
${academicContext}

Generate a JSON report with the following structure:
{
  "summary": "Executive summary of the topic (2-3 sentences)",
  "marketGrowth": {
    "series": [
      { "x": 0, "y": <current market size> },
      { "x": 1, "y": <year 1 projection> },
      ... up to year 5
    ]
  },
  "techMaturity": {
    "axes": [
      { "axis": "Technology Readiness", "value": <1-10> },
      { "axis": "Market Adoption", "value": <1-10> },
      { "axis": "Ecosystem Support", "value": <1-10> },
      { "axis": "Regulatory Clarity", "value": <1-10> },
      { "axis": "Talent Availability", "value": <1-10> }
    ]
  },
  "swot": {
    "strengths": [
      { "label": "Strength 1", "value": <importance 1-10> },
      { "label": "Strength 2", "value": <importance 1-10> },
      { "label": "Strength 3", "value": <importance 1-10> }
    ],
    "weaknesses": [...],
    "opportunities": [...],
    "threats": [...]
  },
  "competition": {
    "bars": [
      { "label": "Company A", "value": <market share %> },
      { "label": "Company B", "value": <market share %> },
      ...
    ]
  },
  "potentialImpact": {
    "axes": [
      { "axis": "Economic", "value": <1-10> },
      { "axis": "Social", "value": <1-10> },
      { "axis": "Environmental", "value": <1-10> },
      { "axis": "Technological", "value": <1-10> },
      { "axis": "Political/Regulatory", "value": <1-10> }
    ]
  }
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a business analyst generating structured market analysis reports. Return only valid JSON.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { analysisId, nodeId, nodeName, treeId, teamId } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Stage 1: Update status to 'web'
    await supabase
      .from('node_analysis_reports')
      .update({ status: 'web' })
      .eq('id', analysisId);

    const webData = await searchWeb(nodeName);

    await supabase
      .from('node_analysis_reports')
      .update({
        web_summary: webData.summary,
        web_sources: webData.sources
      })
      .eq('id', analysisId);

    // Stage 2: Update status to 'papers'
    await supabase
      .from('node_analysis_reports')
      .update({ status: 'papers' })
      .eq('id', analysisId);

    const paperData = await searchAcademicPapers(nodeName);

    await supabase
      .from('node_analysis_reports')
      .update({
        academic_summary: paperData.summary,
        academic_papers: paperData.papers
      })
      .eq('id', analysisId);

    // Stage 3: Update status to 'report'
    await supabase
      .from('node_analysis_reports')
      .update({ status: 'report' })
      .eq('id', analysisId);

    const report = await generateReport(nodeName, webData.summary, paperData.summary);

    await supabase
      .from('node_analysis_reports')
      .update({
        status: 'done',
        report_summary: report.summary,
        market_growth: report.marketGrowth,
        tech_maturity: report.techMaturity,
        swot_analysis: report.swot,
        competition: report.competition,
        potential_impact: report.potentialImpact,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    return new Response(
      JSON.stringify({ success: true, analysisId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analysis error:', error);

    // Update status to error
    if (req.body) {
      const { analysisId } = await req.json();
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('node_analysis_reports')
        .update({ status: 'error' })
        .eq('id', analysisId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

Deploy:
```bash
npx supabase functions deploy comprehensive-analysis
```

---

## Day 4: Frontend Integration

### Goal: Wire up UI for refinement and analysis

### Step 1: Context Menu for Refinement

Add to existing node component (e.g., in technology tree):

```typescript
// In your node component
const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
  e.preventDefault();
  setContextMenu({ x: e.clientX, y: e.clientY, node });
};

// Render context menu
{contextMenu && (
  <div
    className="fixed z-50 bg-white shadow-lg rounded-lg p-2"
    style={{ top: contextMenu.y, left: contextMenu.x }}
  >
    <button onClick={() => handleRefine('converge')}>
      🔍 Drill Down (Converge)
    </button>
    <button onClick={() => handleRefine('diverge')}>
      🌱 Explore Alternatives (Diverge)
    </button>
  </div>
)}
```

### Step 2: Refinement Modal

Create `src/components/technology-tree/RefinementModal.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { suggestRefinementQueries, refineNode, addRefinedNodes } from '@/services/nodeRefinementService';
import type { RefinementMode } from '@/types/refinement';

interface Props {
  node: { id: string; name: string };
  mode: RefinementMode;
  treeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefinementModal({ node, mode, treeId, onClose, onSuccess }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    suggestRefinementQueries(node.name, mode).then(data => {
      setSuggestions(data.suggestions);
      setLoading(false);
    });
  }, [node.name, mode]);

  const handleGenerate = async (query: string) => {
    try {
      const result = await refineNode({
        nodeId: node.id,
        nodeName: node.name,
        mode,
        query
      });

      await addRefinedNodes(treeId, node.id, result);
      onSuccess();
    } catch (error) {
      console.error('Refinement failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'converge' ? '🔍 Drill Down' : '🌱 Explore Alternatives'}
        </h2>

        {loading ? (
          <p>Loading suggestions...</p>
        ) : (
          <div className="space-y-3">
            <h3>Suggested Queries:</h3>
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleGenerate(q)}
                className="block w-full text-left p-3 border rounded hover:bg-gray-50"
              >
                {q}
              </button>
            ))}

            <h3 className="mt-6">Or enter custom query:</h3>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Enter your refinement query..."
            />
            <button
              onClick={() => customQuery && handleGenerate(customQuery)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Generate
            </button>
          </div>
        )}

        <button onClick={onClose} className="mt-4 text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Analysis Panel

Create `src/components/technology-tree/AnalysisPanel.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { startAnalysis, getAnalysisStatus, getAnalysisReport } from '@/services/analysisService';
import type { AnalysisReport, AnalysisStatus } from '@/types/analysis';

interface Props {
  node: { id: string; name: string };
  treeId: string;
  onClose: () => void;
}

export function AnalysisPanel({ node, treeId, onClose }: Props) {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [report, setReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      const analysisId = await startAnalysis(node.id, node.name, treeId);

      // Poll for status
      const pollInterval = setInterval(async () => {
        const currentStatus = await getAnalysisStatus(analysisId);
        setStatus(currentStatus);

        if (currentStatus === 'done') {
          clearInterval(pollInterval);
          const finalReport = await getAnalysisReport(node.id);
          setReport(finalReport);
        } else if (currentStatus === 'error') {
          clearInterval(pollInterval);
        }
      }, 2000);
    };

    runAnalysis();
  }, [node.id, node.name, treeId]);

  const statusMessages = {
    idle: 'Starting analysis...',
    web: 'Stage 1/3: Searching web sources...',
    papers: 'Stage 2/3: Analyzing academic papers...',
    report: 'Stage 3/3: Generating comprehensive report...',
    done: 'Analysis complete!',
    error: 'Analysis failed'
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-xl overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Analysis: {node.name}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <p className="text-gray-600 mb-4">{statusMessages[status]}</p>

        {status !== 'done' && (
          <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        )}

        {report && (
          <div className="space-y-6">
            <section>
              <h3 className="font-bold mb-2">Summary</h3>
              <p>{report.summary}</p>
            </section>

            <section>
              <h3 className="font-bold mb-2">Market Growth Forecast</h3>
              {/* TODO: Add chart component */}
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(report.marketGrowth, null, 2)}
              </pre>
            </section>

            <section>
              <h3 className="font-bold mb-2">Technology Maturity</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(report.techMaturity, null, 2)}
              </pre>
            </section>

            <section>
              <h3 className="font-bold mb-2">SWOT Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.swot).map(([key, items]) => (
                  <div key={key}>
                    <h4 className="font-semibold capitalize">{key}</h4>
                    <ul>
                      {items.map((item: any, i: number) => (
                        <li key={i}>
                          {item.label} ({item.value}/10)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Add other sections: competition, potentialImpact, sources */}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Day 5: Testing & Polish

### Goals:
1. Test refinement flows (converge and diverge)
2. Test analysis pipeline end-to-end
3. Fix bugs and edge cases
4. Add loading states and error handling
5. Write basic tests

### Testing Checklist:

**Refinement Tests**:
- [ ] Right-click context menu appears
- [ ] Suggestions load correctly
- [ ] Converge generates child nodes
- [ ] Diverge generates sibling nodes
- [ ] Custom queries work
- [ ] Database updates correctly
- [ ] UI refreshes after refinement

**Analysis Tests**:
- [ ] Analysis starts on node click
- [ ] All 3 stages complete (web, papers, report)
- [ ] Charts data is valid JSON
- [ ] Analysis saves to database
- [ ] Can retrieve existing analysis
- [ ] Error handling works
- [ ] Loading states display properly

### Quick Test Commands:

```bash
# Test edge functions locally
npx supabase functions serve

# In another terminal, test:
curl -i --location --request POST 'http://localhost:54321/functions/v1/suggest-refinement' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"nodeName":"AI Healthcare","mode":"converge"}'

# Test with frontend
npm run dev
```

---

## Next Steps After Sprint

After this 5-day sprint, you'll have:
✅ Node refinement (converge/diverge) fully working
✅ Comprehensive analysis pipeline functional
✅ Database schema updated
✅ Basic UI integration

**Follow-up tasks for Week 2**:
1. Add chart visualization components (Recharts/Nivo)
2. Implement chart regeneration feature
3. Add multi-axis keyword system
4. Enhance chat with tree context
5. Add PDF export capability

---

## Troubleshooting

### Common Issues:

**Edge function fails to deploy**:
```bash
# Check logs
npx supabase functions logs comprehensive-analysis --follow

# Verify environment variables
npx supabase functions list
```

**Analysis stuck in pending**:
- Check edge function logs for errors
- Verify OpenAI API key is set
- Check database permissions

**Refinement not showing nodes**:
- Verify database migration ran successfully
- Check parent_id references are correct
- Refresh tree data after refinement

**CORS errors**:
- Ensure all edge functions have corsHeaders
- Handle OPTIONS requests properly
- Check Supabase project settings

---

## Performance Tips

1. **Caching**: Cache analysis results for 24 hours
2. **Batching**: Allow batch analysis of multiple nodes
3. **Streaming**: Consider streaming analysis updates
4. **Rate Limiting**: Add rate limits per user/team
5. **Background Jobs**: Move long-running tasks to queues

---

**End of Quick Start Implementation Guide**

This guide gets you 80% of the way to the reference implementation's core features in just 5 days!

# Core Algorithms to Port from Reference Repository

This document contains the key backend algorithms and logic patterns from the reference repository that should be ported to the current repository.

---

## 1. Multi-Axis Keyword Generation

### Algorithm Overview
Generates exploration dimensions (axes) and keywords for each dimension to enable systematic topic exploration.

### Source Code Location
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:12-95`

### Key Functions

#### 1.1 Recommended Axes Generation

```typescript
/**
 * Generates 3-5 diverse exploration axes for a given topic
 * Uses structured JSON output with schema validation
 */
async function getRecommendedAxes(query: string): Promise<Axis[]> {
  const prompt = `For the research theme "${query}", recommend 3-5 diverse and insightful axes for analysis.
  Provide a short name and concise one-sentence description for each axis.
  Return as JSON array with "name" and "description" properties.`;

  // Use AI with JSON schema enforcement
  const response = await ai.generateContent({
    model: 'gemini-2.5-flash', // or gpt-4-turbo-preview
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['name', 'description']
      }
    }
  });

  return JSON.parse(response.text);
}
```

**Example Input/Output**:
```typescript
Input: "Sustainable Urban Mobility"

Output: [
  {
    name: "Environmental Impact",
    description: "Analyzing carbon footprint and ecological sustainability"
  },
  {
    name: "Economic Viability",
    description: "Cost-effectiveness and business model sustainability"
  },
  {
    name: "Social Accessibility",
    description: "Equity and access across different demographics"
  },
  {
    name: "Technology Stack",
    description: "Core technologies and infrastructure requirements"
  },
  {
    name: "Policy Framework",
    description: "Regulatory environment and government support"
  }
]
```

#### 1.2 Keyword Generation Per Axis

```typescript
/**
 * Generates 3-5 specific keywords for a given axis
 * Each keyword has a description contextualizing it
 */
async function generateKeywordsForAxis(
  query: string,
  axis: string
): Promise<{ [axis: string]: Keyword[] }> {
  const prompt = `For the research theme "${query}", generate 3-5 specific keywords
  related to the axis "${axis}". Provide a concise description for each keyword.
  Return as JSON object where key is "${axis}" and value is array of {keyword, description}.`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'object',
      properties: {
        [axis]: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['keyword', 'description']
          }
        }
      },
      required: [axis]
    }
  });

  return JSON.parse(response.text);
}
```

**Example Input/Output**:
```typescript
Input: query = "Sustainable Urban Mobility", axis = "Technology Stack"

Output: {
  "Technology Stack": [
    {
      keyword: "Electric Vehicle Charging Infrastructure",
      description: "High-capacity charging networks for fleet operations"
    },
    {
      keyword: "IoT Sensors for Traffic Management",
      description: "Real-time data collection for route optimization"
    },
    {
      keyword: "Mobile App Integration",
      description: "User-facing platforms for booking and payments"
    },
    {
      keyword: "Battery Technology",
      description: "Energy density and fast-charging capabilities"
    }
  ]
}
```

#### 1.3 Keyword Grouping Algorithm

```typescript
/**
 * Groups selected keywords by their axis for structured generation
 * Ensures mindmap explores all selected dimensions
 */
function groupKeywordsByAxis(selectedKeywords: Keyword[]): { [axis: string]: string[] } {
  return selectedKeywords.reduce((acc, kw) => {
    if (!acc[kw.axis]) {
      acc[kw.axis] = [];
    }
    acc[kw.axis].push(kw.keyword);
    return acc;
  }, {} as { [axis: string]: string[] });
}
```

**Example**:
```typescript
Input: [
  { keyword: "EV Charging", axis: "Technology", ... },
  { keyword: "Cost Reduction", axis: "Economics", ... },
  { keyword: "Urban Planning", axis: "Policy", ... },
  { keyword: "AI Routing", axis: "Technology", ... }
]

Output: {
  "Technology": ["EV Charging", "AI Routing"],
  "Economics": ["Cost Reduction"],
  "Policy": ["Urban Planning"]
}
```

---

## 2. Investigation Aim Suggestion

### Algorithm Overview
Analyzes selected keywords to suggest focused research objectives.

### Source Code
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:97-120`

```typescript
/**
 * Suggests 3 specific, actionable investigation aims
 * Based on overall theme and selected keywords
 */
async function suggestAims(query: string, selectedKeywords: Keyword[]): Promise<string[]> {
  const keywordList = selectedKeywords.map(k => k.keyword).join(', ');

  const prompt = `Based on the theme "${query}" and selected keywords [${keywordList}],
  suggest 3 concise and clear objectives for investigating potential new business applications.
  Objectives should be actionable and focused. Return as JSON array of strings.`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  });

  return JSON.parse(response.text);
}
```

**Example**:
```typescript
Input:
  query = "AI in Healthcare"
  selectedKeywords = [
    { keyword: "Diagnostic Imaging", axis: "Application" },
    { keyword: "Cost Reduction", axis: "Economics" },
    { keyword: "FDA Approval", axis: "Regulation" }
  ]

Output: [
  "Explore cost-effective AI diagnostic tools for rural healthcare",
  "Analyze regulatory pathways for AI-powered medical imaging",
  "Investigate business models for AI diagnostic platforms"
]
```

---

## 3. Two-Stage Mindmap Generation

### Algorithm Overview
Progressive tree building: initial structure first, then parallel branch expansion.

### Source Code
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:122-215`

#### 3.1 Initial Structure Generation

```typescript
/**
 * Stage 1: Generate root + 5 high-level strategic scenarios
 * Uses "Strategist Agent" persona for strategic thinking
 */
async function generateMindMapInitial(
  query: string,
  selectedKeywords: Keyword[],
  aim: string
): Promise<{ aim: string; mindmap: MindMapNode }> {
  const groupedKeywords = groupKeywordsByAxis(selectedKeywords);

  const prompt = `You are a "Strategist Agent".
Given the research theme "${query}", the investigation objective "${aim}",
and grouped keywords: ${JSON.stringify(groupedKeywords)}

Your task is to generate an initial mindmap structure:
1. Generate a root node reflecting the investigation objective
2. Generate up to 5 diverse, high-level strategic scenarios as children (level 2)

These should be based on the theme and keywords provided.

Return JSON: { "aim": string, "mindmap": { "name": string, "children": [{ "name": string }] } }`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'object',
      properties: {
        aim: { type: 'string' },
        mindmap: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' } },
                required: ['name']
              }
            }
          },
          required: ['name']
        }
      },
      required: ['aim', 'mindmap']
    }
  });

  return JSON.parse(response.text);
}
```

**Example Output Structure**:
```typescript
{
  aim: "Explore AI applications in urban mobility for sustainability",
  mindmap: {
    name: "AI-Powered Sustainable Urban Mobility",
    children: [
      { name: "Intelligent Traffic Management Systems" },
      { name: "Autonomous Shared Mobility Services" },
      { name: "Predictive Maintenance for Public Transit" },
      { name: "Dynamic Routing for Delivery Vehicles" },
      { name: "Smart Parking and Space Optimization" }
    ]
  }
}
```

#### 3.2 Branch Expansion

```typescript
/**
 * Stage 2: For each level-2 node, generate 3 concrete applications
 * Uses "Innovator Agent" persona for actionable ideas
 */
async function generateMindMapBranch(
  query: string,
  aim: string,
  parentNodeName: string
): Promise<{ name: string }[]> {
  const prompt = `You are an "Innovator Agent".
The overall theme is "${query}", the main objective is "${aim}".

Your task is to elaborate the strategic scenario "${parentNodeName}".
Generate up to 3 specific, actionable business application ideas derived from this scenario.
These will form level 3 of the mindmap.

Return JSON array: [{ "name": string }, { "name": string }, { "name": string }]`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      }
    }
  });

  return JSON.parse(response.text);
}
```

**Example**:
```typescript
Input: parentNodeName = "Intelligent Traffic Management Systems"

Output: [
  { name: "Real-time Congestion Prediction Dashboard" },
  { name: "Adaptive Traffic Light Control System" },
  { name: "Emergency Vehicle Priority Routing" }
]
```

#### 3.3 Orchestration Pattern

```typescript
/**
 * Orchestrates two-stage generation
 */
async function generateFullMindmap(
  query: string,
  selectedKeywords: Keyword[],
  aim: string
): Promise<MindMapNode> {
  // Stage 1: Generate initial structure
  const initial = await generateMindMapInitial(query, selectedKeywords, aim);
  const rootNode = initial.mindmap;

  // Stage 2: Expand all level-2 nodes in parallel
  const expansionPromises = rootNode.children.map(async (node) => {
    try {
      const children = await generateMindMapBranch(query, aim, node.name);
      return { parentId: node.id, children };
    } catch (error) {
      console.error(`Branch expansion failed for ${node.name}:`, error);
      return { parentId: node.id, children: [] };
    }
  });

  // Wait for all branches to complete
  const expansions = await Promise.all(expansionPromises);

  // Attach children to parents
  expansions.forEach(({ parentId, children }) => {
    const parent = findNodeById(rootNode, parentId);
    if (parent) {
      parent.children = children;
    }
  });

  return rootNode;
}
```

---

## 4. Node Refinement (Converge/Diverge)

### Algorithm Overview
Interactive tree exploration through drilling down (converge) or exploring alternatives (diverge).

### Source Code
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:399-462`

#### 4.1 Refinement Query Suggestion

```typescript
/**
 * Suggests 3 refinement queries based on mode
 */
async function suggestRefinementQueries(
  nodeName: string,
  mode: 'converge' | 'diverge'
): Promise<string[]> {
  const actionText = mode === 'converge'
    ? "drill down into more specific sub-topics or applications"
    : "explore alternative or related ideas";

  const prompt = `For the scenario "${nodeName}", suggest 3 concise and insightful queries
  to ${actionText}. Return as JSON array of strings.`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  });

  return JSON.parse(response.text);
}
```

**Example - Converge**:
```typescript
Input: nodeName = "AI-Powered Medical Diagnostics", mode = "converge"

Output: [
  "Focus on radiology and image analysis applications",
  "Explore pathology and histology automation",
  "Investigate clinical decision support systems"
]
```

**Example - Diverge**:
```typescript
Input: nodeName = "AI-Powered Medical Diagnostics", mode = "diverge"

Output: [
  "Explore alternative healthcare innovation areas",
  "Consider telemedicine and remote monitoring",
  "Investigate genomics and personalized medicine"
]
```

#### 4.2 Convergent Node Generation

```typescript
/**
 * Generates child nodes (drill down)
 */
async function generateConvergentNodes(
  parentNodeName: string,
  query: string
): Promise<MindMapNode[]> {
  const prompt = `From the parent scenario "${parentNodeName}", generate up to 3 specific
  and actionable sub-scenarios or applications based on the query: "${query}".

  Return JSON array: [{ "name": string }, ...]`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      }
    }
  });

  return JSON.parse(response.text);
}
```

**Example**:
```typescript
Input:
  parentNodeName = "AI-Powered Medical Diagnostics"
  query = "Focus on radiology and image analysis"

Output: [
  { name: "CT Scan Anomaly Detection" },
  { name: "MRI Image Segmentation for Tumor Detection" },
  { name: "X-Ray Fracture Identification Assistant" }
]
```

#### 4.3 Divergent Node Generation

```typescript
/**
 * Generates sibling nodes (explore alternatives)
 */
async function generateDivergentNodes(
  contextNodeName: string,
  parentNodeName: string,
  query: string
): Promise<MindMapNode[]> {
  const prompt = `In the broader scenario "${parentNodeName}", and considering the existing
  idea "${contextNodeName}", generate up to 3 related but distinct alternative scenarios
  based on the query: "${query}".

  Return JSON array: [{ "name": string }, ...]`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      }
    }
  });

  return JSON.parse(response.text);
}
```

**Example**:
```typescript
Input:
  contextNodeName = "AI-Powered Medical Diagnostics"
  parentNodeName = "Healthcare Innovation"
  query = "Alternative healthcare innovations"

Output: [
  { name: "Wearable Health Monitoring Devices" },
  { name: "Blockchain-Based Medical Records" },
  { name: "Virtual Reality Physical Therapy" }
]
```

---

## 5. Comprehensive Analysis Pipeline

### Algorithm Overview
Three-stage pipeline: Web search → Academic papers → AI analysis with visualizations.

### Source Code
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:219-363`

#### 5.1 Web Source Search

```typescript
/**
 * Stage 1: Search web with AI grounding
 * Uses Google Search API integration
 */
async function searchWebSources(query: string): Promise<{
  summary: string;
  sources: WebSource[]
}> {
  // Use AI with search tool enabled
  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt: `For the topic "${query}", provide a comprehensive summary focused on
    business applications and technical advancements (in Japanese).`,
    tools: [{ googleSearch: {} }]  // Enable Google Search grounding
  });

  const summary = response.text;

  // Extract grounding sources
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = groundingChunks
    .map(chunk => chunk.web)
    .filter(Boolean)
    .map(web => ({
      title: web.title || 'Untitled',
      link: web.uri || '#'
    }));

  return { summary, sources };
}
```

**Example Output**:
```typescript
{
  summary: "AI in healthcare is rapidly advancing, with diagnostic imaging...",
  sources: [
    { title: "FDA Approves New AI Diagnostic Tool", link: "https://..." },
    { title: "Market Analysis: AI Healthcare 2024", link: "https://..." },
    { title: "Top 10 AI Healthcare Startups", link: "https://..." }
  ]
}
```

#### 5.2 Academic Paper Search

```typescript
/**
 * Stage 2: Fetch and summarize academic papers
 * Uses OpenAlex API
 */
async function searchAcademicPapers(query: string): Promise<{
  summary: string;
  papers: AcademicPaper[];
}> {
  // Fetch papers from OpenAlex
  const response = await fetch(
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5&sort=relevance_score:desc`
  );
  const data = await response.json();

  // Parse papers
  const papers = data.results.map((item: any) => ({
    title: item.title,
    authors: item.authorships.map((a: any) => a.author.display_name),
    year: item.publication_year,
    link: item.doi || `https://openalex.org/${item.id}`,
    abstract: item.abstract_inverted_index
      ? invertAbstract(item.abstract_inverted_index)
      : 'No abstract available.'
  }));

  // Summarize with AI
  const abstractTexts = papers
    .map(p => `Title: ${p.title}\\nAbstract: ${p.abstract}`)
    .join('\\n\\n---\\n\\n');

  const summaryPrompt = `Based on the following academic papers, provide a concise summary
  of key research trends and technical findings related to "${query}" (in Japanese).\\n\\n${abstractTexts}`;

  const summaryResponse = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt: summaryPrompt
  });

  return {
    summary: summaryResponse.text,
    papers
  };
}

/**
 * Helper: Reconstruct abstract from inverted index
 */
function invertAbstract(invertedIndex: Record<string, number[]>): string {
  const wordList: { word: string; pos: number }[] = [];

  Object.entries(invertedIndex).forEach(([term, positions]) => {
    positions.forEach(pos => {
      wordList.push({ word: term, pos });
    });
  });

  wordList.sort((a, b) => a.pos - b.pos);
  return wordList.map(item => item.word).join(' ');
}
```

#### 5.3 Analysis Report Generation

```typescript
/**
 * Stage 3: Generate comprehensive analysis with 6 chart datasets
 */
async function generateAnalysisReport(
  query: string,
  webContext: string,
  academicContext: string
): Promise<AnalysisReport> {
  const prompt = `You are a business and technology analyst.
Based on the following context, generate a comprehensive analysis report for "${query}".

Web Information Summary:
${webContext}
---
Academic Research Summary:
${academicContext}

Generate a JSON report with:
1. Overall summary: Current state and future potential (concise)
2. Market growth forecast: 5-year projections
3. Technology maturity evaluation: 5 key perspectives
4. SWOT analysis: 3 items each with importance scores
5. Competitive landscape: 3-5 major competitors with market share
6. Potential impact: Economic, social, environmental, technological, political dimensions

Follow the exact JSON schema structure.`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        marketGrowth: {
          type: 'object',
          properties: {
            series: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: 'number' },  // Year offset (0-5)
                  y: { type: 'number' }   // Market size
                },
                required: ['x', 'y']
              }
            }
          },
          required: ['series']
        },
        techMaturity: {
          type: 'object',
          properties: {
            axes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  axis: { type: 'string' },
                  value: { type: 'number' }  // 1-10 scale
                },
                required: ['axis', 'value']
              }
            }
          },
          required: ['axes']
        },
        swot: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                value: { type: 'number' }  // Importance 1-10
              },
              required: ['label', 'value']
            }},
            weaknesses: { type: 'array', items: { /* same */ }},
            opportunities: { type: 'array', items: { /* same */ }},
            threats: { type: 'array', items: { /* same */ }}
          },
          required: ['strengths', 'weaknesses', 'opportunities', 'threats']
        },
        competition: {
          type: 'object',
          properties: {
            bars: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },  // Company name
                  value: { type: 'number' }   // Market share %
                },
                required: ['label', 'value']
              }
            }
          },
          required: ['bars']
        },
        potentialImpact: {
          type: 'object',
          properties: {
            axes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  axis: { type: 'string' },
                  value: { type: 'number' }  // Impact score 1-10
                },
                required: ['axis', 'value']
              }
            }
          },
          required: ['axes']
        }
      },
      required: ['summary', 'marketGrowth', 'techMaturity', 'swot', 'competition', 'potentialImpact']
    }
  });

  return JSON.parse(response.text);
}
```

---

## 6. Chart Regeneration

### Algorithm Overview
Modify existing chart data using natural language instructions.

### Source Code
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:365-395`

```typescript
/**
 * Regenerates chart data based on user instruction
 */
async function regenerateChart(
  query: string,
  chartName: string,
  originalData: any,
  instruction: string
): Promise<any> {
  const prompt = `Update the "${chartName}" chart data for the topic "${query}".

Current data: ${JSON.stringify(originalData)}
Instruction: "${instruction}"

Based on the instruction, generate new chart data maintaining the same JSON structure.
Return only the data.`;

  // Determine schema based on chart type
  let schema;
  switch(chartName) {
    case 'Market Growth Forecast':
      schema = marketGrowthSchema;
      break;
    case 'Technology Maturity':
      schema = techMaturitySchema;
      break;
    // ... other chart types
    default:
      throw new Error("Unknown chart type");
  }

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema
  });

  return JSON.parse(response.text);
}
```

**Example**:
```typescript
Input:
  chartName = "Market Growth Forecast"
  originalData = { series: [{x:0,y:100},{x:1,y:120},{x:2,y:145},...] }
  instruction = "Make it more pessimistic with a downturn in year 3"

Output:
  { series: [{x:0,y:100},{x:1,y:105},{x:2,y:108},{x:3,y:95},{x:4,y:100}] }
```

---

## 7. Context-Aware Chat

### Algorithm Overview
Chat assistant with full mindmap context and auto-suggested questions.

### Source Code
`/Users/apple/Downloads/10_7-scenario-mindmap-generator/services/geminiService.ts:465-521`

#### 7.1 Mindmap Serialization

```typescript
/**
 * Serializes mindmap tree into text format for AI context
 */
function serializeMindMap(node: MindMapNode, depth: number = 0): string {
  let result = `${'  '.repeat(depth)}- ${node.name}`;

  if (node.refinementType) {
    result += ` (Refinement: ${node.refinementType}, Query: "${node.refinementQuery}")`;
  }

  if (node.analysisSummary) {
    result += `\n${'  '.repeat(depth+1)}Summary: ${node.analysisSummary}`;
  }

  result += '\n';

  if (node.children) {
    for (const child of node.children) {
      result += serializeMindMap(child, depth + 1);
    }
  }

  return result;
}
```

**Example Output**:
```
- AI-Powered Healthcare Innovation
  - AI Diagnostic Imaging (Refinement: converge, Query: "Focus on radiology")
    Summary: Market size $2.5B, growing 25% annually
    - CT Scan Analysis
    - MRI Segmentation
  - Telemedicine Platforms
    - Remote Consultation
```

#### 7.2 Context-Aware Q&A

```typescript
/**
 * Answers questions with full mindmap context
 */
async function askChatAssistant(
  question: string,
  mindMapData: MindMapNode,
  selectedNodes: MindMapNode[]
): Promise<{ answer: string; sources: WebSource[] }> {
  // Build context from mindmap
  let context: string;
  if (selectedNodes.length > 0) {
    context = "User is currently focused on these scenarios:\n\n";
    context += selectedNodes.map(n => serializeMindMap(n)).join('\n');
  } else {
    context = "Context is the entire mindmap:\n\n";
    context += serializeMindMap(mindMapData);
  }

  const prompt = `You are an AI assistant analyzing scenario mindmaps.
Based on the following context, answer the user's question (in Japanese).
Search for external information if needed and cite sources.

Context:
${context}

Question:
${question}`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    tools: [{ googleSearch: {} }]  // Enable search for grounding
  });

  const answer = response.text;
  const sources = extractGroundingSources(response);

  return { answer, sources };
}
```

#### 7.3 Auto-Suggested Questions

```typescript
/**
 * Suggests 3 relevant follow-up questions
 */
async function suggestChatQuestions(
  mindMapData: MindMapNode,
  selectedNodes: MindMapNode[]
): Promise<string[]> {
  const context = selectedNodes.length > 0
    ? selectedNodes.map(n => serializeMindMap(n)).join('\n')
    : serializeMindMap(mindMapData);

  const prompt = `Based on the following mindmap/scenario context, suggest 3 concise and
  insightful questions a user might want to ask next.

Context:
${context}

Return as JSON array containing only the questions.`;

  const response = await ai.generateContent({
    model: 'gemini-2.5-flash',
    prompt,
    responseFormat: 'json',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  });

  return JSON.parse(response.text);
}
```

---

## Key Patterns & Best Practices

### 1. Structured JSON Output
Always use JSON schema enforcement for consistent data structures:
```typescript
const response = await ai.generateContent({
  model: 'gemini-2.5-flash',
  prompt,
  responseFormat: 'json',
  schema: { /* your schema */ }
});
```

### 2. Error Handling
Wrap AI calls with try-catch and provide fallbacks:
```typescript
try {
  const result = await ai.generateContent({ ... });
  return JSON.parse(result.text);
} catch (error) {
  console.error('Generation failed:', error);
  throw new Error('Failed to generate content. Please try again.');
}
```

### 3. Progressive Generation
Generate in stages rather than all at once:
```typescript
// Stage 1: Initial structure
const initial = await generateInitial();

// Stage 2: Parallel expansion
const expansions = await Promise.all(
  initial.children.map(child => generateBranch(child))
);
```

### 4. Context Awareness
Always provide rich context to AI:
```typescript
const prompt = `
Overall theme: "${query}"
Investigation objective: "${aim}"
Parent context: "${parentName}"
User's refinement query: "${refinementQuery}"

Now generate...
`;
```

### 5. Role-Based Prompting
Use different personas for different generation stages:
- "Strategist Agent" for high-level scenarios
- "Innovator Agent" for concrete applications
- "Business Analyst" for market analysis

---

**End of Algorithms Reference**

These algorithms represent the core backend logic from the reference implementation. Port them to Supabase Edge Functions and adapt prompts for OpenAI if not using Google Gemini.

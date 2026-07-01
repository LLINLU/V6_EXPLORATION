# analyze-tech-characteristics Edge Function Specification

Category: Edge Function
Type: Specification

> **Purpose**
> Run article-based technology characteristics analysis on a Level-4 "Technology" node
> and persist the result as JSON into the `node_analysis` table.

---

## 1. Overview

### 1.1 What it does

Accepts a single Level-4 Technology node and executes the following steps:

1. Load the tech node name + description from `tree_nodes`
2. Walk the `parent_id` chain upward to find the Level-1 Scenario ancestor node
3. Load tree metadata (`search_theme` → `user_query`, `description` → `user_context`) from `technology_trees`
4. Load existing papers for the node from `node_papers` — passes `null` if none, in which case the Python API performs its own article search
5. POST to Python `/v5/analyze_tech_characteristics` and consume the SSE stream
6. Extract the final `result` event and upsert into `node_analysis`

### 1.2 Related files

| Item            | Path                                                            |
|-----------------|-----------------------------------------------------------------|
| Entry point     | `supabase/functions/analyze-tech-characteristics/index.ts`      |
| Python API spec | `docs/v5-api-en/tech-characteristics-analysis.md`              |

---

## 2. Data Flow

```
POST /functions/v1/analyze-tech-characteristics
          │ { nodeId, treeId, language?, team_id? }
          ▼
  ┌──────────────────────────────────────────────┐
  │ 1. tree_nodes[nodeId]         → tech_name, tech_definition          │
  │ 2. walk parent_id chain       → scenario_name, scenario_description │
  │ 3. technology_trees[treeId]   → user_query, user_context            │
  │ 4. node_papers WHERE node_id  → articles[] or null (auto-search)    │
  └──────────────────────────────────────────────┘
          │
          ▼
  POST /v5/analyze_tech_characteristics  (SSE)
          │
          ▼  last SSE event: { type: "result", data: { table, report, derivation, raw } }
          │
          ▼
  UPSERT node_analysis  { node_id, data }
          │
          ▼
  200 JSON { success, nodeId, treeId, techName, scenarioName, papersUsed, result }
```

---

## 3. Request

### Method: POST

```
POST /functions/v1/analyze-tech-characteristics
```

### Request body

> The caller only provides `nodeId` and `treeId`. The function automatically fetches the scenario name, scenario description, tree metadata, and existing papers from the database.

```typescript
{
  nodeId:    string          // tree_nodes.id  (axis: "Technology", level: 4)
  treeId:    string          // technology_trees.id
  language?: string          // Output language — default "English"
  team_id?:  string | null   // Optional team scope (not stored, accepted for future use)
}
```

| Parameter  | Type           | Required | Description                                    |
|------------|----------------|----------|------------------------------------------------|
| `nodeId`   | string         | Yes      | Level-4 Technology node ID                     |
| `treeId`   | string         | Yes      | Technology tree ID                             |
| `language` | string         | No       | Translated output language. Default `"English"` |
| `team_id`  | string \| null | No       | Team ID (accepted but not written to DB yet)   |

### Validation

Returns `400 Bad Request` when:
- `nodeId` is missing
- `treeId` is missing

---

## 4. Internal Logic

### 4.1 Node loading and Scenario ancestor walk

```
Level 4  (Technology)  ← nodeId (input)
   ↑ parent_id
Level 3  (Function)
   ↑ parent_id
Level 2  (Purpose)
   ↑ parent_id
Level 1  (Scenario)    ← scenario_name / scenario_description used in payload
```

The function walks `parent_id` iteratively until `level === 1`.
Returns `500` if no Level-1 ancestor is found.

### 4.2 Python API payload

```typescript
{
  scenario: {
    user_query:           tree.search_theme,
    user_context:         tree.description,
    scenario_name:        scenarioNode.name,
    scenario_description: scenarioNode.description
  },
  technologies: [
    { tech_name: techNode.name, tech_definition: techNode.description }
  ],
  articles: Article[] | null,  // null when node has no papers → Python auto-searches
  language: "English"
}
```

### 4.3 SSE parsing

The Python API streams multiple SSE events. Only the last event with `type === "result"` is used:

```
data: {"type":"progress","message":"..."}
data: {"type":"result","data":{"table":{...},"report":{...},"derivation":{...},"raw":{...}}}
data: [DONE]
```

### 4.4 node_analysis upsert

```typescript
supabaseAdmin.from("node_analysis").upsert(
  { id: crypto.randomUUID(), node_id: nodeId, data: result },
  { onConflict: "node_id" }
)
```

---

## 5. Response

### Success (200 OK)

```typescript
{
  success:      true,
  nodeId:       string,        // input nodeId
  treeId:       string,        // input treeId
  techName:     string,        // techNode.name
  scenarioName: string,        // scenarioNode.name
  papersUsed:   number | null, // number of papers passed; null = Python auto-searched
  result: {
    table:      object,
    report:     object,
    derivation: object,
    raw:        object
  }
}
```

### Errors

| Status | Condition                                                      |
|--------|----------------------------------------------------------------|
| 400    | `nodeId` or `treeId` missing                                   |
| 404    | Node / tree not found in DB                                    |
| 500    | No Scenario ancestor found / Python API failure / DB write fail |
| 502    | Python API returned non-2xx                                    |
| 405    | Non-POST method                                                |

---

## 6. DB Schema

### node_analysis (existing table)

| Column    | Type | Description                            |
|-----------|------|----------------------------------------|
| `id`      | text | Primary key (auto-generated)           |
| `node_id` | text | Linked `tree_nodes` node ID            |
| `data`    | json | Full Python API result JSON            |

Upsert conflicts on `node_id` — re-running overwrites the previous result for the same node.

---

## 7. Tables used

| Table               | Operation | Purpose                              |
|---------------------|-----------|--------------------------------------|
| `tree_nodes`        | SELECT    | Load tech node + walk ancestor chain |
| `technology_trees`  | SELECT    | Get user_query / user_context        |
| `node_papers`       | SELECT    | Load existing papers for the node    |
| `node_analysis`     | UPSERT    | Persist analysis result              |

---

## 8. External dependencies

| System                                       | Method     | Purpose                       |
|----------------------------------------------|------------|-------------------------------|
| Python API `/v5/analyze_tech_characteristics` | POST (SSE) | Run technology characteristics analysis |
| Supabase (PostgreSQL)                         | SDK        | DB reads and writes           |

---

## 9. Deploy


```bash
supabase functions deploy analyze-tech-characteristics
```

### Test from Supabase Dashboard

Go to **Supabase Dashboard → Edge Functions → analyze-tech-characteristics → Test**.  
The function only requires `nodeId` and `treeId` — it automatically fetches everything else (scenario name, tree metadata, papers) from the database internally.

```json
{
  "nodeId": "<level-4-node-id>",
  "treeId": "<tree-id>",
  "language": "English"
}
```

To find valid IDs, run in the SQL editor:

```sql
-- id   → use as "nodeId"
-- tree_id → use as "treeId"
SELECT id, name, tree_id FROM tree_nodes WHERE level = 4 LIMIT 5;
```




# analyze-tech-characteristics エッジ関数仕様

カテゴリ: Edge Function  
種別: 仕様書

> **目的**
> Level-4「Technology」ノードに対して論文ベースの技術特性分析を実行し、
> 結果を JSON として `node_analysis` テーブルに保存する。

---

## 1. 概要

### 1.1 処理の流れ

Level-4 Technology ノードを受け取り、以下のステップを実行する：

1. `tree_nodes` からノードの名前・説明を取得
2. `parent_id` チェーンを遡って Level-1 Scenario 祖先ノードを特定
3. `technology_trees` からツリーのメタデータ（`search_theme` → `user_query`、`description` → `user_context`）を取得
4. `node_papers` からノードに紐づく論文を取得。存在しない場合は `null` を渡し、Python API 側が自動検索する
5. Python `/v5/analyze_tech_characteristics` に POST し、SSE ストリームを受信
6. 最終 `result` イベントを取り出して `node_analysis` に upsert する

### 1.2 関連ファイル

| 項目            | パス                                                            |
|-----------------|-----------------------------------------------------------------|
| エントリポイント | `supabase/functions/analyze-tech-characteristics/index.ts`      |
| Python API 仕様 | `docs/v5-api-en/tech-characteristics-analysis.md`              |

---

## 2. データフロー

```
POST /functions/v1/analyze-tech-characteristics
          │ { nodeId, treeId, language?, team_id? }
          ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ 1. tree_nodes[nodeId]        → tech_name, tech_definition           │
  │ 2. parent_id チェーンを遡上  → scenario_name, scenario_description  │
  │ 3. technology_trees[treeId]  → user_query, user_context             │
  │ 4. node_papers WHERE node_id → articles[] or null（自動検索）        │
  └─────────────────────────────────────────────────────────────────────┘
          │
          ▼
  POST /v5/analyze_tech_characteristics（SSE）
          │
          ▼  最終 SSE イベント: { type: "result", data: { table, report, derivation, raw } }
          │
          ▼
  UPSERT node_analysis  { node_id, data }
          │
          ▼
  200 JSON { success, nodeId, treeId, techName, scenarioName, papersUsed, result }
```

---

## 3. リクエスト

### メソッド: POST

```
POST /functions/v1/analyze-tech-characteristics
```

### リクエストボディ

> 呼び出し側が渡すのは `nodeId` と `treeId` のみ。シナリオ名・ツリーメタデータ・論文はすべて関数内部でデータベースから自動取得する。

```typescript
{
  nodeId:    string          // tree_nodes.id（axis: "Technology", level: 4）
  treeId:    string          // technology_trees.id
  language?: string          // 出力言語 — デフォルト "English"
  team_id?:  string | null   // チーム ID（受け取るが現時点では DB に保存しない）
}
```

| パラメータ  | 型             | 必須 | 説明                                        |
|-------------|----------------|------|---------------------------------------------|
| `nodeId`    | string         | Yes  | Level-4 Technology ノード ID                |
| `treeId`    | string         | Yes  | テクノロジーツリー ID                       |
| `language`  | string         | No   | 出力言語。デフォルト `"English"`             |
| `team_id`   | string \| null | No   | チーム ID（将来の利用のために受け付ける）    |

### バリデーション

以下の場合に `400 Bad Request` を返す：
- `nodeId` が未指定
- `treeId` が未指定

---

## 4. 内部ロジック

### 4.1 ノード取得と Scenario 祖先ノードの遡上

```
Level 4  (Technology)  ← nodeId（入力）
   ↑ parent_id
Level 3  (Function)
   ↑ parent_id
Level 2  (Purpose)
   ↑ parent_id
Level 1  (Scenario)    ← scenario_name / scenario_description をペイロードに使用
```

`parent_id` を `level === 1` になるまで繰り返し遡上する。  
Level-1 祖先が見つからない場合は `500` を返す。

### 4.2 Python API ペイロード

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
  articles: Article[] | null,  // ノードに論文がない場合は null → Python が自動検索
  language: "English"
}
```

### 4.3 SSE パース

Python API は複数の SSE イベントをストリーミングする。使用するのは `type === "result"` の最終イベントのみ：

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

## 5. レスポンス

### 成功（200 OK）

```typescript
{
  success:      true,
  nodeId:       string,        // 入力 nodeId
  treeId:       string,        // 入力 treeId
  techName:     string,        // techNode.name
  scenarioName: string,        // scenarioNode.name
  papersUsed:   number | null, // 渡した論文数。null = Python が自動検索
  result: {
    table:      object,
    report:     object,
    derivation: object,
    raw:        object
  }
}
```

### エラー

| ステータス | 条件                                                            |
|------------|-----------------------------------------------------------------|
| 400        | `nodeId` または `treeId` が未指定                               |
| 404        | ノードまたはツリーが DB に存在しない                             |
| 500        | Scenario 祖先が見つからない / Python API エラー / DB 書き込み失敗 |
| 502        | Python API が非 2xx を返した                                    |
| 405        | POST 以外のメソッド                                             |

---

## 6. DB スキーマ

### node_analysis（既存テーブル）

| カラム    | 型   | 説明                              |
|-----------|------|-----------------------------------|
| `id`      | text | 主キー（自動生成）                 |
| `node_id` | text | 紐づく `tree_nodes` ノード ID     |
| `data`    | json | Python API の結果 JSON 全体       |

`node_id` の競合で upsert — 同一ノードへの再実行で前回の結果を上書きする。

---

## 7. 使用テーブル

| テーブル            | 操作   | 目的                                     |
|---------------------|--------|------------------------------------------|
| `tree_nodes`        | SELECT | テックノード取得＋祖先チェーンの遡上     |
| `technology_trees`  | SELECT | user_query / user_context の取得         |
| `node_papers`       | SELECT | ノードに紐づく既存論文の取得             |
| `node_analysis`     | UPSERT | 分析結果の保存                           |

---

## 8. 外部依存

| システム                                       | 方式       | 目的                       |
|------------------------------------------------|------------|----------------------------|
| Python API `/v5/analyze_tech_characteristics`  | POST（SSE）| 技術特性分析の実行          |
| Supabase（PostgreSQL）                         | SDK        | DB 読み書き                |

---

## 9. デプロイ


```bash
supabase functions deploy analyze-tech-characteristics
```

### Supabase ダッシュボードからのテスト方法

**Supabase Dashboard → Edge Functions → analyze-tech-characteristics → Test** を開く。  
`nodeId` と `treeId` のみ渡せばよい。シナリオ名・ツリーメタデータ・論文は関数が DB から自動取得する。

```json
{
  "nodeId": "<level-4 ノードの id>",
  "treeId": "<tree_id>",
  "language": "English"
}
```

有効な ID を確認するには SQL エディタで以下を実行：

```sql
-- id     → "nodeId" として使用
-- tree_id → "treeId" として使用
SELECT id, name, tree_id FROM tree_nodes WHERE level = 4 LIMIT 5;
```

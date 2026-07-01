# ブランチ変更一覧: ysato/RDE-194-main-20260227

ベースブランチ `main` からの全変更をまとめたドキュメント。
179ファイル変更、+30,723行 / -1,566行。

---

## 目次

1. [シナリオ選択・比較機能](#1-シナリオ選択比較機能)
2. [シナリオレポート生成パイプライン](#2-シナリオレポート生成パイプライン)
3. [Multi-Axis キーワード探索 (QueryRefiner)](#3-multi-axis-キーワード探索-queryrefiner)
4. [技術特性 (TechCharacteristics) ダイアログ](#4-技術特性-techcharacteristics-ダイアログ)
5. [型定義の集約・Python v5 API スキーマ対応](#5-型定義の集約python-v5-api-スキーマ対応)
6. [UI/UX 改善](#6-uiux-改善)
7. [Edge Function 変更](#7-edge-function-変更)
8. [DB マイグレーション](#8-db-マイグレーション)
9. [インフラ・リポジトリ層の拡張](#9-インフラリポジトリ層の拡張)
10. [その他の変更](#10-その他の変更)

---

## 1. シナリオ選択・比較機能

### 概要
シナリオ一覧ページの新規作成。テーブルビュー・マインドマップ・フィルタリング・CSV エクスポートを含む包括的なシナリオ比較機能。

### 新規ファイル

| ファイル | 行数 | 内容 |
|---|---|---|
| `src/routes/ScenarioSelection.tsx` | 1,028 | シナリオ選択ページ本体 |
| `src/components/scenario/ScenarioTableView.tsx` | 4,123 | テーブルビュー（カスタムビュー・指標追加・ソート・フィルタ） |
| `src/components/scenario/ScenarioPaperPanel.tsx` | 2,061 | 論文パネル（Summary/Papers/UseCases タブ + レポート表示） |
| `src/components/scenario/ScenarioFilters.tsx` | 514 | フィルタ UI（TRL/TAM/CAGR 等の範囲・セレクト） |
| `src/components/scenario/ScenarioMindmap.tsx` | 318 | シナリオのマインドマップ表示 |
| `src/components/scenario/ScenarioChat.tsx` | 239 | シナリオ用チャット UI |
| `src/components/scenario/ScenarioCard.tsx` | 99 | シナリオカード |
| `src/components/scenario/AddEnrichmentModal.tsx` | 361 | 指標追加モーダル |
| `src/components/scenario/CustomViewModal.tsx` | 301 | カスタムビュー作成モーダル |
| `src/components/scenario/EditScenarioModal.tsx` | 237 | シナリオ編集モーダル |
| `src/components/scenario/EditQueryModal.tsx` | 181 | クエリ編集モーダル |
| `src/components/scenario/chat/` | 6 files | チャット UI サブコンポーネント群 |
| `src/components/scenario/value-rationale/` | 5 files | TAM/CAGR の導出根拠表示（Hover/Modal） |
| `src/components/scenario/CAGRIndicator.tsx` | 137 | CAGR ビジュアルインジケータ |
| `src/components/scenario/TAMIndicator.tsx` | 127 | TAM ビジュアルインジケータ |
| `src/components/scenario/TRLIndicator.tsx` | 179 | TRL ビジュアルインジケータ |
| `src/components/scenario/TRLModal.tsx` | 163 | TRL 詳細モーダル |
| `src/components/scenario/ResearchCAGRIndicator.tsx` | 146 | 研究 CAGR インジケータ |
| `src/components/scenario/MarketStructureIndicator.tsx` | 109 | 市場構造インジケータ |
| `src/components/scenario/DifficultyBadge.tsx` | 39 | 実装難易度バッジ |
| `src/components/scenario/TimeToMarketBadge.tsx` | 34 | 市場投入時間バッジ |
| `src/data/mockScenarioData.ts` | 366 | シナリオモックデータ |
| `src/services/scenarioMetricsService.ts` | 220 | シナリオ指標計算サービス |
| `src/utils/scenarioFilters.ts` | 189 | フィルタリングロジック |
| `src/types/scenario.ts` | 200 | シナリオ型定義 |

### 修正ファイル

| ファイル | 変更内容 |
|---|---|
| `src/App.tsx` | `/scenario-selection` ルート追加 |
| `src/components/TreeGenerationSection.tsx` | シナリオ選択ページへのナビゲーション追加 |
| `src/routes/TechnologyTree.tsx` | 戻るボタン・selectedKeywords 対応 |

---

## 2. シナリオレポート生成パイプライン

### 概要
Python FastAPI v5 バックエンドと連携するレポート生成。Edge Function で fire-and-forget 起動 → DB ポーリング → セクション単位で順次 UI 表示。

### データフロー
```
ユーザーがシナリオ選択 → summary タブ表示
  ↓
useScenarioReport hook:
  1. DB照会（既存レポートあり？）
  2. なければ Edge Function invoke → 202返却
  3. Edge Function (バックグラウンド):
     a. POST /v5/pipeline/search (SSE) → articles/patents/markets を DB保存
     b. POST /v5/pipeline/analyze (SSE) → セクション完了ごとに DB保存
  4. Frontend: scenario_report_sections をポーリング → セクション単位で順次表示
  5. 全完了 → ポーリング停止
  6. エラー時 → ダミーデータにフォールバック
```

### 新規ファイル

| ファイル | 行数 | 内容 |
|---|---|---|
| `src/hooks/useScenarioReport.ts` | 353 | レポート hook（DB 照会 → ポーリング → データ構築） |
| `src/services/scenarioReportService.ts` | 140 | Edge Function 呼び出し + DB 照会 |
| `src/services/reportTransformService.ts` | 437 | API レスポンス → UI 型変換 |
| `src/services/dummyReportDataService.ts` | 446 | フォールバック用ダミーデータ |
| `src/types/report.ts` | 1,334 | レポート型定義（フロントエンド + API 型） |
| `src/components/scenario/report/` | 11 files | レポート UI コンポーネント群 |
| `src/components/scenario/report/sections/` | 17 files | セクション別表示コンポーネント |
| `src/components/scenario/report/charts/` | 1 file | Recharts 設定 |

### レポートセクション構成

| セクション | コンポーネント | データソース |
|---|---|---|
| Executive Summary | `ExecutiveSummarySection` | TRL + Market + 検索結果から派生 |
| TRL Analysis | `TrlAnalysisSection` | `/v5/pipeline/analyze` → trl |
| Market Analysis | `MarketAnalysisSection` | `/v5/pipeline/analyze` → market |
| Social Issues | `SocialIssuesSection` | `/v5/pipeline/analyze` → social_issue |
| Technical Competitors | `TechnicalCompetitorsSection` | `/v5/pipeline/analyze` → technical_competitors |
| Research Landscape | `ResearchLandscapeSection` | 検索結果から派生 |
| Market Implementations | `MarketImplementationsSection` | 検索結果から派生 |

---

## 3. Multi-Axis キーワード探索 (QueryRefiner)

### 概要
検索クエリを多軸キーワードで精緻化するコンポーネント。Python v5 の `/v5/generate-axes` / `/v5/generate-keywords-for-axis` に対応。

### 新規ファイル

| ファイル | 行数 | 内容 |
|---|---|---|
| `src/components/QueryRefiner.tsx` | 901 | QueryRefiner UI（軸推薦 → キーワード生成 → ソースプール） |
| `src/services/multiAxisService.ts` | 255 | 軸・キーワード・クエリサマリー API サービス |
| `src/services/sourcePoolService.ts` | 32 | ソースプール生成 API サービス |
| `src/components/source-pool/SourcePoolOverview.tsx` | 69 | ソースプール概要表示 |
| `src/components/source-pool/SourcePoolDetailPanel.tsx` | 207 | ソースプール詳細パネル |
| `src/types/axis.ts` | 152 | Axis/Keyword/TechCharacteristic 型 + API 型 |
| `src/types/sourcePool.ts` | 120 | ソースプール型 + API 型 |
| `src/app/api/generate-axes/route.ts` | 96 | Next.js API Route（軸生成） |
| `src/app/api/generate-keywords-for-axis/route.ts` | 100 | Next.js API Route（キーワード生成） |
| `src/app/api/generate-query-summary/route.ts` | 119 | Next.js API Route（クエリサマリー） |
| `src/app/api/generate-source-pool/route.ts` | 177 | Next.js API Route（ソースプール） |
| `src/app/api/generate-tech-characteristics/route.ts` | 106 | Next.js API Route（技術特性） |
| `src/app/api/refine-query/route.ts` | 82 | Next.js API Route（クエリ精緻化） |
| `supabase/functions/generate-axes/index.ts` | 111 | Edge Function |
| `supabase/functions/generate-keywords-for-axis/index.ts` | 123 | Edge Function |

### 修正ファイル

| ファイル | 変更内容 |
|---|---|
| `src/components/technology-tree/QueryDisplay.tsx` | QueryRefiner 統合、initialKeywords prop 追加 |
| `src/hooks/useTreeGeneration.ts` | 軸・キーワード・技術特性フロー統合 |

---

## 4. 技術特性 (TechCharacteristics) ダイアログ

### 概要
TED モードでのツリー生成前に技術特性を確認・編集するダイアログ。

### 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/components/TechCharacteristicsTable.tsx` | 技術特性確認ダイアログ |
| `src/data/mockTechStrengths.ts` | モック技術強み |

### 修正ファイル

| ファイル | 変更内容 |
|---|---|
| `src/hooks/useTreeGeneration.ts` | TED モード時の技術特性フロー追加 |
| `src/hooks/tree/useTedGeneration.ts` | 技術特性をツリー生成に統合 |

---

## 5. 型定義の集約・Python v5 API スキーマ対応

### 概要
全てのデータ型定義を `src/types/` に集約。Python v5 バックエンド（86スキーマファイル）の TypeScript 型を対応する既存ファイルに配置。ローカル型定義を `@/types/` からのインポート + 再エクスポートに統一。

### 新規型定義ファイル

| ファイル | 行数 | 内容 |
|---|---|---|
| `src/types/report.ts` | 1,334 | レポート表示型 + API分析型（TRL/Market/Social Issue/Technical Competitors/Citation/Conference/Central Researcher） + Artifact型 |
| `src/types/scenario.ts` | 200 | シナリオ選択・比較用型 |
| `src/types/axis.ts` | 152 | 軸/キーワード/技術特性 + API 型 |
| `src/types/sourcePool.ts` | 120 | ソースプール型 + ApiArticle/ApiPatent/ApiMarket |
| `src/types/services.ts` | 180 | サービス層共通型（PaperAnalysis, Polling, ChatGPT等） |
| `src/types/ui.ts` | 128 | UI共通型（PathState, MindMapNode, ScenarioChatDisplayMode等） |
| `src/types/enrichment.ts` | 126 | エンリッチメントシステム型 |
| `src/types/infrastructure.ts` | 97 | インフラ層型（Tree, Project, DuplicateTreeRequest等） |
| `src/types/admin.ts` | 81 | 管理系型（User, Team, SystemStats等） |

### 修正型定義ファイル

| ファイル | 変更内容 |
|---|---|
| `src/types/tree.ts` | +263行: ApiQueryTag, ApiQueryHit, ApiBaseDerivationOutput, ApiBaseTableOutput, ソースツリー型 |

### ローカル型 → `@/types/` 移行済みファイル（29箇所）

**UI types → `@/types/ui`:**
- `src/hooks/tree/state/usePathState.ts` (PathState)
- `src/hooks/tree/useNodeOperations.ts` (PathState)
- `src/hooks/useTechnologyTree.ts` (TechnologyTreeState)
- `src/utils/mindMapDataTransform.ts` (MindMapNode, MindMapConnection)
- `src/utils/technologyTreeNavigation.ts` (NodePath)
- `src/components/scenario/chat/ScenarioChatHeader.tsx` (ScenarioChatDisplayMode)
- `src/components/scenario/AddEnrichmentModal.tsx` (AvailableEnrichment, MetricCategory)
- `src/components/scenario/CustomViewModal.tsx` (AvailableColumn)
- `src/components/scenario/value-rationale/types.ts` (ValueRationale, CAGRCategoryInfo)
- `src/components/technology-tree/card-based/AddScenarioModal.tsx` (ManualScenarioInput, AIGenerationInput)

**Infrastructure types → `@/types/infrastructure`:**
- `src/infrastructure/supabaseRepository.ts` (Tree, Project 等 12型)
- `src/infrastructure/edgeFunctions.ts` (DuplicateTreeRequest, DuplicateTreeResponse)
- `src/hooks/useUserDetail.ts` (UserDetails)

**Enrichment types → `@/types/enrichment`:**
- `src/services/enrichmentStatus.ts`, `nodeEnrichmentService.ts`, `enrichmentQueue.ts`
- `src/hooks/useEnrichmentQueue.ts`, `src/stores/enrichedDataStore.ts`

**Admin/Services types → `@/types/admin`, `@/types/services`:**
- `src/hooks/useUserManagement.ts`, `useSystemMonitoring.ts`, `usePolling.ts`, `useScenarioReport.ts`
- `src/services/paperAnalysisService.ts`, `savedItemsService.ts`, `multiAxisService.ts`
- `src/utils/csvDownload.ts`, `researchContextParser.ts`, `insightsDataGenerator.ts`
- `src/hooks/tree/services/chatGptService.ts`, `contextChatService.ts`, `nodeContextService.ts`

---

## 6. UI/UX 改善

### 新規ファイル

| ファイル | 内容 |
|---|---|
| `src/components/icons/ExportIcon.tsx` | CSV エクスポートアイコン |
| `src/components/sidebar/SidebarHeader.tsx` | サイドバーヘッダー |
| `src/components/technology-tree/components/TabNavigator.tsx` | タブナビゲータ |
| `src/utils/csvExport.ts` | CSV エクスポートユーティリティ |
| `src/utils/mockPaperData.ts` | モック論文データ |
| `design-system/` | デザインシステムトークン・スクリプト |

### 修正ファイル

| ファイル | 変更内容 |
|---|---|
| `src/components/ui/badge.tsx` | バリアント追加 |
| `src/components/ui/dialog.tsx` | ダイアログ改善 |
| `src/components/ui/checkbox.tsx`, `select.tsx`, `sheet.tsx`, `switch.tsx`, `drawer.tsx` | Radix UI 更新 |
| `src/components/technology-tree/chat/ChatAskAIButton.tsx` | アニメーション追加 |
| `src/components/technology-tree/components/TabContent.tsx` | CSV エクスポート・フィルタ・保存機能追加 |
| `src/components/technology-tree/mindmap/` | MindMap コンテキスト・レンダラー改善 |
| `src/index.css` | カスタムスタイル追加 |
| `tailwind.config.ts` | デザインシステムカラートークン追加 |
| `src/components/technology-tree/card-based/AddScenarioModal.tsx` | TED/FAST モード別 UI |

---

## 7. Edge Function 変更

| ファイル | 行数 | 内容 |
|---|---|---|
| `supabase/functions/scenario-report-generate/index.ts` | 875 | レポート生成メイン（SSE コンシューマ、search→analyze パイプライン） |
| `supabase/functions/scenario-report-section/index.ts` | 216 | セクション単位リトライ |
| `supabase/functions/scenario-chat/index.ts` | 267 | シナリオチャット |
| `supabase/functions/generate-axes/index.ts` | 111 | 軸生成 |
| `supabase/functions/generate-keywords-for-axis/index.ts` | 123 | キーワード生成 |
| `supabase/functions/generate-tree-v3/index.ts` | 変更 | ツリー生成 v3 改修 |

---

## 8. DB マイグレーション

| ファイル | 内容 |
|---|---|
| `supabase/migrations/20260227_create_scenario_reports.sql` | `scenario_reports` + `scenario_report_sections` テーブル作成 |
| `supabase/migrations/add_keyword_axes_table.sql` | `keyword_axes` テーブル作成 |

### scenario_reports テーブル
```sql
scenario_reports (
  id, scenario_id, tree_id, scenario_name, scenario_description,
  user_query, user_context,
  status: pending|searching|analyzing|done|error,
  search_status: pending|running|done|error,
  articles JSONB, patents JSONB, markets JSONB, technologies JSONB,
  team_id, user_id, created_at, updated_at
)

scenario_report_sections (
  id, report_id (FK), section_type, status, error_message,
  progress, raw_data JSONB, transformed_data JSONB,
  created_at, updated_at,
  UNIQUE(report_id, section_type)
)
```

---

## 9. インフラ・リポジトリ層の拡張

### 修正ファイル

| ファイル | 変更内容 |
|---|---|
| `src/infrastructure/supabaseRepository.ts` | `fetchTreesBySearchQuery`, `updateSearchName`, `deleteTree`, `fetchTreesByTeam`, `updateProjectName` メソッド追加。型定義を `@/types/infrastructure` に移行 |
| `src/infrastructure/edgeFunctions.ts` | 型定義を `@/types/infrastructure` に移行 |
| `src/services/types.ts` | `IDatabaseRepository` に新メソッド追加、`TreeSearchOptions` 追加 |
| `src/services/__tests__/treeService.test.ts` | テストモック更新 |
| `src/services/__tests__/projectService.test.ts` | テストモック更新 |
| `src/stores/__tests__/treeListStore.test.ts` | テスト追加 |

---

## 10. その他の変更

| ファイル | 変更内容 |
|---|---|
| `src/hooks/usePolling.ts` | 汎用ポーリング hook の強化 |
| `src/utils/databaseTreeConverter.ts` | ジェネリックコンバータ関数追加 |
| `src/components/AuthProvider.tsx` | 認証プロバイダー改善 |
| `next.config.mjs` | 設定追加 |
| `package.json` | `recharts`, `react-csv` 等の依存追加 |
| `.gitignore` | 追加エントリ |
| `FEATURE_GAP_SUMMARY.md` | 機能ギャップ分析 |
| `feature-gap-analysis.md` | 詳細ギャップ分析 |
| `implementation-guide.md` | 実装ガイド |
| `algorithms-to-port.md` | ポーティング対象アルゴリズム |

---

## ファイル統計

| カテゴリ | 新規ファイル数 | 修正ファイル数 |
|---|---|---|
| シナリオ UI | 54 | 0 |
| レポート生成 | 22 | 0 |
| QueryRefiner / Multi-Axis | 14 | 2 |
| 型定義 | 9 | 1 |
| Edge Functions | 5 | 1 |
| DB マイグレーション | 2 | 0 |
| API Routes | 6 | 0 |
| UI/UX 改善 | 6 | 12 |
| インフラ層 | 0 | 5 |
| テスト | 0 | 3 |
| ドキュメント・設定 | 8 | 3 |
| **合計** | **~126** | **~27** |

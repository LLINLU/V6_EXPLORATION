# シナリオレポート生成パイプライン — 詳細設計

## 1. アーキテクチャ概要

Edge Function を**薄型化** (DB insert のみ) し、重い処理を **Render Background Worker (Rails + GoodJob)** で実行するアーキテクチャ。

```mermaid
graph LR
    subgraph "Frontend"
        FE["React SPA"]
    end

    subgraph "Supabase"
        EF_GEN["scenario-report-generate<br/>(薄型: DB insert + 202)"]
        EF_SEC["scenario-report-section<br/>(薄型: status reset + 202)"]
        DB[("PostgreSQL<br/>scenario_reports<br/>scenario_report_sections")]
    end

    subgraph "Render"
        POLLER["ReportPollerJob<br/>(cron 10秒)"]
        ORCH["ReportOrchestratorJob<br/>(全パイプライン)"]
        RETRY["SectionRetryPollerJob<br/>(cron 15秒)"]
    end

    subgraph "External"
        SEARCH["Search API<br/>/v5/pipeline/search"]
        ANALYZE["Search API<br/>/v5/analyze_*"]
    end

    FE -->|"1. Generate"| EF_GEN
    FE -->|"4. Retry"| EF_SEC
    FE -->|"3. ポーリング (3秒間隔)"| DB
    EF_GEN -->|"INSERT"| DB
    EF_SEC -->|"UPDATE status=pending"| DB
    POLLER -->|"SELECT status=pending"| DB
    POLLER -->|"enqueue"| ORCH
    ORCH -->|"Phase 1"| SEARCH
    ORCH -->|"Phase 2"| ANALYZE
    ORCH -->|"UPDATE"| DB
    RETRY -->|"SELECT retry対象"| DB
    RETRY -->|"UPDATE"| DB
    RETRY -->|"呼び出し"| ANALYZE

    style FE fill:#3b82f6,color:#fff
    style EF_GEN fill:#22c55e,color:#fff
    style EF_SEC fill:#22c55e,color:#fff
    style DB fill:#f59e0b,color:#fff
    style POLLER fill:#8b5cf6,color:#fff
    style ORCH fill:#8b5cf6,color:#fff
    style RETRY fill:#8b5cf6,color:#fff
    style SEARCH fill:#ef4444,color:#fff
    style ANALYZE fill:#ef4444,color:#fff
```

---

## 2. 処理フロー (時系列)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant EF as Edge Function<br/>(scenario-report-generate)
    participant DB as PostgreSQL
    participant Poller as ReportPollerJob<br/>(cron 10s)
    participant Orch as ReportOrchestratorJob
    participant API as Search API

    User->>FE: レポート生成ボタン

    %% Step 1: Edge Function (薄型)
    FE->>EF: POST triggerReportGeneration()
    EF->>DB: INSERT scenario_reports (status=pending)
    EF->>DB: INSERT scenario_report_sections × 7
    EF-->>FE: 202 { reportId, status: "processing" }

    %% Step 2: Frontend polling starts
    FE->>FE: startPolling(reportId)

    %% Step 3: Worker detects pending report
    Poller->>DB: SELECT WHERE status='pending'
    Poller->>Orch: perform_later(report_id)

    %% Phase 1: Search
    Orch->>DB: UPDATE status='searching'
    Orch->>API: POST /v5/pipeline/search (SSE)
    API-->>Orch: articles, patents, markets
    Orch->>DB: UPDATE articles, patents, markets<br/>status='search_done'

    Note over FE,DB: Frontend ポーリングで search_done を検出

    %% Phase 2: Analyze (並列)
    Orch->>DB: UPDATE status='analyzing'
    par trl
        Orch->>API: POST /v5/analyze_trl
        API-->>Orch: JSON result
        Orch->>DB: UPDATE section raw_data, status='done'
    and market
        Orch->>API: POST /v5/analyze_market
        API-->>Orch: JSON result
        Orch->>DB: UPDATE section raw_data, status='done'
    and social_issue
        Orch->>API: POST /v5/analyze_social_issue
        API-->>Orch: JSON result
        Orch->>DB: UPDATE section raw_data, status='done'
    and technical_competitors
        Orch->>API: POST /v5/analyze_technical_competitors
        API-->>Orch: JSON result
        Orch->>DB: UPDATE section raw_data, status='done'
    end

    Note over FE,DB: Frontend ポーリングで各 section の完了を検出・表示更新

    %% Phase 3: Derived (並列)
    par research_landscape
        Orch->>DB: UPDATE section transformed_data, status='done'
    and market_implementations
        Orch->>DB: UPDATE section transformed_data, status='done'
    and executive_summary
        Orch->>DB: UPDATE section transformed_data, status='done'
    end

    %% Phase 4: Finalize
    Orch->>DB: UPDATE report status='done'
    FE->>DB: poll → status='done' → stopPolling()
    FE->>User: レポート表示完了
```

---

## 3. ステータス遷移

### 3.1 scenario_reports.status

```mermaid
stateDiagram-v2
    [*] --> pending: Edge Function INSERT
    pending --> searching: Worker Phase 1 開始
    searching --> search_done: Search 完了
    searching --> error: Search 失敗
    search_done --> analyzing: Worker Phase 2 開始
    analyzing --> done: Phase 3-4 完了
    analyzing --> done: 一部エラーでも完了扱い
    error --> [*]
    done --> [*]
```

### 3.2 scenario_report_sections.status

```mermaid
stateDiagram-v2
    [*] --> pending: Edge Function INSERT
    pending --> running: Worker 処理開始
    running --> done: 処理成功
    running --> error: 処理失敗 (3回リトライ後)
    error --> pending: リトライリクエスト (Edge Function)
    pending --> running: Worker 再処理
    done --> [*]
```

### 3.3 scenario_reports.search_status

```mermaid
stateDiagram-v2
    [*] --> pending: 初期状態
    pending --> running: Search 開始
    running --> done: Search 成功
    running --> error: Search 失敗
```

---

## 4. セクション詳細

### 4.1 Analysis Sections (外部 API 呼び出し)

| セクション | API エンドポイント | タイムアウト | 格納先 | リトライ |
|---|---|---|---|---|
| `trl` | `POST /v5/analyze_trl` | 900s | `raw_data` | 3回 |
| `market` | `POST /v5/analyze_market` | 900s | `raw_data` | 3回 |
| `social_issue` | `POST /v5/analyze_social_issue` | 900s | `raw_data` | 3回 |
| `technical_competitors` | `POST /v5/analyze_technical_competitors` | 900s | `raw_data` | 3回 |

### 4.2 Derived Sections (ローカル計算)

| セクション | データソース | 格納先 | 処理時間 |
|---|---|---|---|
| `research_landscape` | `report.articles` + `report.patents` | `transformed_data` | < 1s |
| `market_implementations` | `report.markets` | `transformed_data` | < 1s |
| `executive_summary` | Analysis セクションの `raw_data` + search 結果 | `transformed_data` | < 1s |

---

## 5. データ構造

### 5.1 Analysis セクション → `raw_data` の構造

各 `/v5/analyze_*` エンドポイントからの JSON レスポンスがそのまま格納される。

**TRL (`raw_data`):**

```json
{
  "raw": {
    "report": {
      "technologies": [
        {
          "technology_name": "...",
          "integrated_trl": 7,
          "feasibility_assessment": "...",
          "integrated_reasoning": "..."
        }
      ],
      "final_summary": "..."
    }
  },
  "table": {
    "rows": [
      {
        "technology_name": "...",
        "integrated_trl": 7,
        "article_trl": 6,
        "patent_trl": 8,
        "market_trl": 7,
        "feasibility_assessment": "...",
        "integrated_reasoning": "..."
      }
    ]
  }
}
```

**Market (`raw_data`):**

```json
{
  "data": {
    "tam_value": "1.2兆円",
    "sam_value": "3,000億円",
    "cagr": "12.5%",
    "summary": "...",
    "segments": [
      {
        "segment_name": "...",
        "share_percent": 35,
        "estimated_size": "4,200億円"
      }
    ]
  }
}
```

**Social Issue (`raw_data`):**

```json
{
  "raw": {
    "solutions": [
      {
        "title": "...",
        "issue_title": "...",
        "reason_annotated": "...",
        "cited_sources": [
          { "url": "...", "title": "..." }
        ]
      }
    ]
  }
}
```

**Technical Competitors (`raw_data`):**

```json
[
  {
    "technology_name": "...",
    "table": {
      "unique_companies": 15,
      "analyzed_companies": 10,
      "rows": [
        {
          "rank": 1,
          "company_name": "...",
          "country": "JP",
          "patent_count": 42
        }
      ]
    }
  }
]
```

### 5.2 Derived セクション → `transformed_data` の構造

**Research Landscape:**

```json
{
  "articleCommentary": "45件の論文が見つかりました。",
  "articleYearlyData": [
    { "year": 2020, "count": 5 },
    { "year": 2021, "count": 12 }
  ],
  "patentCommentary": "23件の特許が見つかりました。",
  "patentYearlyData": [
    { "year": 2020, "count": 3 }
  ],
  "topJournals": [
    { "name": "Nature", "count": 8 }
  ]
}
```

**Market Implementations:**

```json
[
  {
    "product": "製品名",
    "company": "企業名",
    "stage": "commercial",
    "description": "...",
    "urls": ["https://..."],
    "year": 2024
  }
]
```

**Executive Summary:**

```json
{
  "narrative": "分析結果の要約テキスト...",
  "findings": ["発見1", "発見2"],
  "marketRows": [
    { "index": 1, "label": "TAM", "value": "1.2兆円" }
  ],
  "researchRows": [
    { "index": 1, "label": "論文数", "value": "45件" }
  ]
}
```

---

## 6. Frontend データ変換フロー

```mermaid
graph TD
    DB_RAW["DB: raw_data (JSONB)"]
    DB_TRANS["DB: transformed_data (JSONB)"]
    TRANSFORM["reportTransformService.ts<br/>transformSectionsToReportData()"]
    REPORT["ScenarioReportData<br/>(Frontend 表示型)"]

    DB_RAW -->|"trl, market,<br/>social_issue,<br/>technical_competitors"| TRANSFORM
    DB_TRANS -->|"research_landscape,<br/>market_implementations,<br/>executive_summary"| TRANSFORM
    TRANSFORM --> REPORT

    subgraph "変換関数"
        T1["transformTrl()"]
        T2["transformMarket()"]
        T3["transformSocialIssue()"]
        T4["transformTechnicalCompetitors()"]
        T5["transformResearchLandscape()"]
        T6["transformMarketImplementations()"]
        T7["transformExecutiveSummary()"]
    end

    TRANSFORM --> T1
    TRANSFORM --> T2
    TRANSFORM --> T3
    TRANSFORM --> T4
    TRANSFORM --> T5
    TRANSFORM --> T6
    TRANSFORM --> T7
```

---

## 7. リトライフロー

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant EF as Edge Function<br/>(scenario-report-section)
    participant DB as PostgreSQL
    participant Retry as SectionRetryPollerJob<br/>(cron 15s)
    participant API as Search API

    User->>FE: セクションリトライボタン
    FE->>EF: POST retryReportSection(reportId, sectionType)
    EF->>DB: UPDATE status='pending',<br/>error_message=null,<br/>progress=0,<br/>updated_at=now()
    EF-->>FE: 202 Accepted
    FE->>FE: startPolling(reportId)

    Note over Retry,DB: 検出条件:<br/>section.status = 'pending'<br/>AND report.status != 'pending'<br/>AND updated_at > created_at + 30s

    Retry->>DB: SELECT retry 対象セクション
    alt Analysis セクション
        Retry->>API: POST /v5/analyze_{type}
        API-->>Retry: JSON result
        Retry->>DB: UPDATE raw_data, status='done'
    else Derived セクション
        Retry->>Retry: DerivedSectionBuilder でローカル計算
        Retry->>DB: UPDATE transformed_data, status='done'
    end

    FE->>DB: poll → section status='done'
    FE->>User: セクション表示更新
```

---

## 8. Worker ジョブ構成

### 8.1 GoodJob 設定

```ruby
# config/initializers/good_job.rb
config.good_job.execution_mode = :external     # Worker プロセスのみ
config.good_job.poll_interval  = 5             # 5秒ごとにジョブキュー確認
config.good_job.max_threads    = 3             # 最大 3 並行ジョブ
config.good_job.shutdown_timeout = 60          # graceful shutdown

config.good_job.cron = {
  report_poller:        { cron: "*/10 * * * * *", class: "ReportPollerJob" },
  section_retry_poller: { cron: "*/15 * * * * *", class: "SectionRetryPollerJob" }
}
```

### 8.2 ジョブ一覧

| ジョブ | トリガー | 処理内容 | 重複防止 |
|---|---|---|---|
| `ReportPollerJob` | cron (10秒) | pending レポート検出 → Orchestrator enqueue | - |
| `ReportOrchestratorJob` | ReportPollerJob からの enqueue | 全パイプライン実行 (Search → Analyze × 4 → Derived × 3 → Finalize) | GoodJob Concurrency (total_limit: 1, key: report_id) |
| `SectionRetryPollerJob` | cron (15秒) | retry 対象セクション検出 → 個別再処理 | - |

### 8.3 DB 接続プール

```yaml
# config/database.yml
pool: 15  # GoodJob(3) + Analysis並列(4) + Derived並列(3) + margin(5)
```

Analysis/Derived の並列スレッドは `ActiveRecord::Base.connection_pool.with_connection` で明示的に接続管理。

---

## 9. Search API エンドポイント

### 9.1 Search Pipeline

```text
POST /v5/pipeline/search
Content-Type: application/json
Authorization: Basic <base64>

Request Body:
{
  "scenario": {
    "user_query": "...",
    "user_context": "...",
    "scenario_name": "...",
    "scenario_description": "..."
  },
  "technologies": [
    { "tech_name": "...", "tech_definition": "..." }
  ],
  "language": "Japanese"
}

Response: SSE stream
  data: {"type": "progress", "phase": "...", "progress": 50, ...}
  data: {"type": "result", "data": {"articles": [...], "patents": [...], "markets": [...]}}
```

**タイムアウト:** 600 秒 (10 分)

### 9.2 Analyze Endpoints

```text
POST /v5/analyze_{trl|market|social_issue|technical_competitors}
Content-Type: application/json
Authorization: Basic <base64>

Request Body:
{
  "scenario": { ... },
  "technologies": [...],
  "articles": [...],
  "patents": [...],
  "markets": [...],
  "language": "Japanese"
}

Response: JSON (セクション固有の構造)
```

**タイムアウト:** 900 秒 (15 分)

---

## 10. ファイル構成

```text
rails/
├── Gemfile                              # Ruby 依存関係
├── Procfile                             # Render: worker: bundle exec good_job start
├── Rakefile
├── config.ru
├── .ruby-version                        # 3.3.0
├── app/
│   ├── models/
│   │   ├── application_record.rb
│   │   ├── scenario_report.rb           # 既存テーブルマッピング
│   │   └── scenario_report_section.rb   # 既存テーブルマッピング
│   ├── services/
│   │   ├── search_api_client.rb         # Search API HTTP クライアント
│   │   ├── sse_consumer.rb              # SSE レスポンスパーサー
│   │   └── derived_section_builder.rb   # Derived セクション計算
│   └── jobs/
│       ├── application_job.rb
│       ├── report_poller_job.rb          # cron: pending レポート検出
│       ├── report_orchestrator_job.rb    # 全パイプライン実行
│       └── section_retry_poller_job.rb   # cron: retry セクション検出
├── config/
│   ├── application.rb                    # Rails 8 API-only
│   ├── boot.rb
│   ├── database.yml                      # DATABASE_URL, pool: 15
│   ├── environment.rb
│   ├── routes.rb                         # 空 (Worker のみ)
│   ├── environments/
│   │   ├── production.rb
│   │   └── development.rb
│   └── initializers/
│       ├── good_job.rb                   # GoodJob + cron 設定
│       └── secret_key_base.rb
└── db/
    └── migrate/
        └── 20260301000001_create_good_jobs.rb  # GoodJob テーブル
```

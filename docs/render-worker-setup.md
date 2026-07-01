# Render Background Worker セットアップガイド

## 概要

Supabase Edge Function を薄型化し、重い処理を Render Background Worker (Rails + GoodJob) で実行するアーキテクチャ。

```
Frontend → Edge Function (DB INSERT のみ, 202返却)
                ↓
         PostgreSQL (Supabase)
                ↓
         Render Worker (GoodJob) → Search API
```

## アーキテクチャ

| コンポーネント | 役割 |
|---|---|
| Edge Function `scenario-report-generate` | レポート + 7セクションを DB INSERT → 202 返却 |
| Edge Function `scenario-report-section` | セクション status を `pending` にリセット → 202 返却 |
| Render Worker (Rails + GoodJob) | パイプライン実行 (Search → Analyze → Derived → Done) |
| Frontend (React) | 3秒ポーリングで DB から進捗取得・表示 |

## パイプラインフロー

```
ReportPollerJob (10秒ごと)
  └→ scenario_reports WHERE status='pending' を検出
     └→ ReportOrchestratorJob をエンキュー

ReportOrchestratorJob (レポートごとに1つ)
  ├─ Phase 1: Search   → POST /v5/pipeline/search (SSE, ~5分)
  ├─ Phase 2: Analyze  → 4セクション並列 (各5-10分, 3回リトライ)
  │   ├─ trl
  │   ├─ market
  │   ├─ social_issue
  │   └─ technical_competitors
  ├─ Phase 3: Derived  → 3セクション並列 (ローカル計算, <30秒)
  │   ├─ research_landscape
  │   ├─ market_implementations
  │   └─ executive_summary
  └─ Phase 4: Finalize → report.status = 'done'

SectionRetryPollerJob (15秒ごと)
  └→ フロントエンドからリトライされたセクションを検出・再処理
```

## Render サービス設定

| 項目 | 値 |
|---|---|
| サービス名 | `memory-ai-app-preview` |
| サービスID | `srv-d6i3ocggjchc73d2t0k0` |
| タイプ | Background Worker |
| ランタイム | Ruby |
| ブランチ | `preview` |
| Root Directory | `rails` |
| Build Command | `bundle install` |
| Start Command | `bundle exec good_job start --enable-cron` |
| Pre-deploy Command | `bundle exec rails db:migrate` |

## 環境変数

| 変数 | 説明 | 例 |
|---|---|---|
| `DATABASE_URL` | Supabase Connection Pooler (Session mode) | `postgresql://postgres.xxx:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` |
| `SEARCH_API_URL` | Search API のベース URL | `https://search-api.stg.memoryai.jp` |
| `SEARCH_API_USER` | Search API Basic Auth ユーザー | `admin` |
| `SEARCH_API_PASS` | Search API Basic Auth パスワード | (設定済み) |
| `RAILS_ENV` | Rails 環境 | `production` |
| `SECRET_KEY_BASE` | Rails シークレットキー | (Render 自動生成) |
| `RAILS_LOG_TO_STDOUT` | ログ出力先 | `1` |
| `GOOD_JOB_ENABLE_CRON` | GoodJob cron 有効化 | `1` |

### DATABASE_URL の注意点

- **IPv4 必須**: Render は IPv6 非対応。Supabase Direct Connection (IPv6) は使用不可
- **Connection Pooler (Supavisor) Session mode** を使用すること
- パスワードに `$` 等の特殊文字がある場合は URL エンコード必須 (`$` → `%24`)
- コロンとパスワードの間にスペースを入れないこと

## DB テーブル

テーブルは Supabase マイグレーションで管理。Worker の Rails マイグレーションは GoodJob テーブルのみ。

```
scenario_reports
  ├─ id (UUID)
  ├─ scenario_id, tree_id, scenario_name
  ├─ status: pending → searching → search_done → analyzing → done | error
  ├─ search_status: pending → running → done | error
  ├─ articles, patents, markets, technologies (JSONB)
  └─ user_id, team_id, created_at, updated_at

scenario_report_sections
  ├─ id (UUID)
  ├─ report_id (FK → scenario_reports)
  ├─ section_type: trl | market | social_issue | technical_competitors |
  │                 executive_summary | research_landscape | market_implementations
  ├─ status: pending → running → done | error
  ├─ progress (0-100)
  ├─ raw_data (JSONB) - API レスポンス
  └─ transformed_data (JSONB) - 変換済みデータ
```

## Rails アプリ構成 (`rails/`)

```
rails/
├── Gemfile                              # gem 定義
├── Gemfile.lock                         # ロックファイル (Render 必須)
├── .ruby-version                        # 3.4.4
├── config/
│   ├── application.rb                   # API-only, GoodJob 設定
│   ├── database.yml                     # DATABASE_URL 使用
│   ├── environments/production.rb       # ログ設定等
│   └── initializers/good_job.rb         # cron 設定
├── app/
│   ├── models/
│   │   ├── scenario_report.rb           # 既存テーブルマッピング
│   │   └── scenario_report_section.rb   # 同上
│   ├── jobs/
│   │   ├── report_poller_job.rb         # pending レポート検出 (cron)
│   │   ├── report_orchestrator_job.rb   # パイプライン実行
│   │   └── section_retry_poller_job.rb  # retry 検出 (cron)
│   └── services/
│       ├── search_api_client.rb         # Search API HTTP クライアント
│       ├── sse_consumer.rb              # SSE レスポンスパーサー
│       └── derived_section_builder.rb   # Derived セクション計算
└── db/
    ├── schema.rb                        # version: 0 (GoodJob テーブルはマイグレーションで作成)
    └── migrate/
        └── 20260301000001_create_good_jobs.rb
```

## デプロイ手順

### 初回セットアップ

1. Render Dashboard でサービスを作成 (Background Worker)
2. Root Directory を `rails` に設定
3. Start Command を `bundle exec good_job start --enable-cron` に設定
4. Pre-deploy Command を `bundle exec rails db:migrate` に設定
5. 環境変数を設定 (上記テーブル参照)
6. `preview` ブランチにプッシュ → 自動デプロイ

### Edge Function デプロイ

```bash
npx supabase functions deploy scenario-report-generate
npx supabase functions deploy scenario-report-section
```

### DB マイグレーション (Supabase 側)

```bash
npx supabase db push
```

## 動作確認方法

### 1. Worker が起動しているか

```bash
# GoodJob プロセス確認
curl "https://mlhxwypwicflpahwpmlg.supabase.co/rest/v1/good_job_processes?select=id,state" \
  -H "apikey: <ANON_KEY>"
# → state.cron_enabled が true であること
```

### 2. Cron ジョブが動いているか

```bash
# 最近のジョブ実行を確認
curl "https://mlhxwypwicflpahwpmlg.supabase.co/rest/v1/good_jobs?select=job_class,created_at,error&limit=5&order=created_at.desc" \
  -H "apikey: <ANON_KEY>"
# → ReportPollerJob, SectionRetryPollerJob が定期実行されていること
```

### 3. レポート生成 E2E テスト

1. フロントエンドでシナリオレポートを生成
2. `scenario_reports.status` が `pending` → `searching` → `search_done` → `analyzing` → `done` と遷移
3. 各 `scenario_report_sections.status` が `pending` → `running` → `done` と遷移

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `good_jobs` テーブルが存在しない | `schema.rb` の version が高すぎてマイグレーションがスキップ | `schema.rb` の version を 0 に、`schema_migrations` の該当エントリを削除して再デプロイ |
| `cron_enabled: false` | GoodJob cron が有効化されていない | Start Command に `--enable-cron` を追加、環境変数 `GOOD_JOB_ENABLE_CRON=1` を追加 |
| `URI::InvalidURIError` | DATABASE_URL のパスワードに特殊文字 | `$` → `%24` 等の URL エンコード、スペースを削除 |
| `IPv6 connection failed` | Supabase Direct Connection は IPv6 | Connection Pooler (Supavisor Session mode) を使用 |
| `SSL_read: unexpected eof` | Search API への長時間接続が切断 | Search API 側の安定性を確認、リトライで対応 |
| `Bundler frozen mode` | `Gemfile.lock` の RUBY VERSION が不一致 | `.ruby-version` と `Gemfile.lock` の RUBY VERSION を一致させる |
| セクションが全て pending のまま | Worker がレポートを検出していない | `good_jobs` テーブル存在確認、cron_enabled 確認 |

## 既知の課題

1. **Search API 接続安定性**: Render → Search API 間で SSL 接続断 / 502 が発生することがある
2. **重複レポート**: 同時リクエストで同一シナリオの重複レポートが作成される race condition
3. **`render.yaml` は既存サービスに自動適用されない**: Dashboard での手動設定が必要

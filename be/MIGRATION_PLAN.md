# Supabase → Self-Hosted Backend Migration Plan

## Overview

Migrate the app off Supabase entirely and bring the backend into this repo under `be/`. The four Supabase services in use are:

| Service | Used For | Replace With |
|---|---|---|
| **Auth** | Session management, JWT issuance | AWS Cognito |
| **PostgREST** | Database CRUD via `supabase.from()` | Express API routes + Drizzle ORM |
| **Edge Functions** | 44 Deno serverless functions | Express route handlers in `be/src/controllers/` |
| **Database** | PostgreSQL | **AWS Aurora PostgreSQL** (IAM auth via RDS Signer) |

> Supabase Realtime and Storage are **not** in use — nothing to migrate there.

---

## Proposed Stack

| Layer | Choice | Rationale |
|---|---|---|
| API server | **Express + TypeScript** | Minimal overhead, familiar, colocated in repo under `be/` |
| ORM | **Drizzle ORM** | TypeScript-first, schema-as-code, excellent PostgreSQL support |
| Auth | **AWS Cognito** | Managed auth, JWT issuance, scales with team — Supabase JWT kept as transitional fallback |
| Database | **Neon** (serverless PostgreSQL) | Serverless, no infra, free tier, same PostgreSQL dialect |
| Dev runtime | **tsx** | Run TypeScript server without compilation step during dev |
| Process manager | **concurrently** | Run frontend (Vite) + backend (Express) in parallel |

---

## Backend Directory Structure (`be/src/`)

```
be/
├── MIGRATION_PLAN.md
└── src/
    ├── index.ts                    # Express app entry point + startup wiring
    ├── controllers/                 # Express route handlers (one file per resource/feature)
    │   ├── index.ts
    │   ├── scenarioReport.ts
    │   ├── job.ts
    │   ├── result.ts
    │   └── ...                     # One file per ported edge function
    ├── services/                   # Business logic + table operations (no HTTP)
    │   ├── index.ts
    │   ├── jobService.ts           # jobs table: create, get, updateStatus, hasActiveJob
    │   ├── resultService.ts        # requests + results tables
    │   └── usageService.ts         # usage table
    ├── middleware/                 # Express middleware
    │   ├── index.ts
    │   └── providers/
    │       ├── index.ts
    │       ├── cognito.ts          # Cognito JWT verifier (aws-jwt-verify)
    │       └── supabase.ts         # Supabase JWT verifier — REMOVE after migration
    ├── worker/                     # SQS queue processing
    │   ├── index.ts
    │   ├── pipeline.ts
    │   └── validate.ts
    ├── queue/                      # SQS client, enqueue, long-poll worker loop
    │   └── index.ts
    └── db/                         # Database infrastructure
        ├── index.ts
        ├── pool.ts                 # pg connection pool (current)
        ├── client.ts               # Drizzle client (Phase 2)
        ├── migrate.ts
        ├── schema.sql
        └── schema/                 # Drizzle schema per table (Phase 2)
            ├── trees.ts
            ├── nodes.ts
            ├── papers.ts
            └── ...
```

**Repo-level changes:**
```
memory-ai-app/
├── src/                            # Frontend (unchanged)
│   ├── infrastructure/
│   │   ├── apiRepository.ts        # NEW: replaces supabaseRepository.ts (Phase 4)
│   │   └── apiFunctions.ts         # NEW: replaces edgeFunctions.ts (Phase 5)
├── be/                             # Backend (this directory)
├── supabase/                       # DEPRECATED — removed in Phase 7
└── package.json                    # Updated with be/ scripts and deps
```

---

## Migration Phases

---

### Phase 1 — Backend Foundation ✅ In Progress

**Goal:** Express server running in `be/` with a DB connection. No frontend changes yet.

**Steps:**

1. ✅ Create `be/src/` directory structure (components, services, middleware, worker, queue, db)
2. ✅ Express app with CORS, JSON middleware, health check route (`GET /health`)
3. ✅ pg connection pool (`be/src/db/pool.ts`)
4. ✅ SQS queue setup (`be/src/queue/index.ts`)
5. ✅ Worker pipeline scaffolded (`be/src/worker/pipeline.ts`)
6. ✅ Route handlers for scenario report, job status, result (`be/src/controllers/`)
7. Add scripts to root `package.json`:
   - `"be:dev"` — `tsx watch be/src/index.ts`
   - `"dev:full"` — `concurrently "npm run dev" "npm run be:dev"`

**Deliverable:** Express server on port 3001 with `/health` returning 200.

---

### Phase 2 — Database Schema & Migration ✅ Done (Aurora + Drizzle)

**Goal:** Aurora PostgreSQL に対する schema を Drizzle で管理する。Neon を使う当初案は破棄、Aurora 継続が確定。

**Implemented (本リポジトリ):**

- `be/drizzle.config.ts` — drizzle-kit 設定 (schema 入力 / migrations 出力 / `breakpoints: true`)
- `be/src/db/schema/*.ts` — 5 テーブル (jobs / requests / results / usage / userPlans) + barrel
- `be/src/db/migrations/0000_init.sql` — drizzle-kit が生成 (read-only)
- `be/src/db/connection.ts` — RDS Signer + CA bundle で `pg.ClientConfig` を組み立て、pool / migrate 両方から共有
- `be/src/db/client.ts` — `drizzle(pool)` インスタンス。サービス層が import する
- `be/src/db/migrate.ts` — drizzle-migrator runner (Pool ではなく `pg.Client`、Aurora 安全弁の `SET lock_timeout` 等を session に適用)
- `be/src/services/{job,result,usage,reportLimit}Service.ts` — Drizzle クエリビルダで完全書き換え
- `infrastructure/{stg,prd}/mlab-{env}-memoryai-migrate-task.json` — migrate 用 ECS Fargate task definition (BE Service と同 Task Role を共有 / image は `:PLACEHOLDER`)
- `.github/workflows/_deploy-memoryai-backend.yml` — `generate-image-tag` → `build-and-push` → `db-migrate` → `deploy` の 4 job 構成。db-migrate 失敗時は deploy がスキップされる
- `.github/workflows/ci.yml` — `be-lint-and-test` ジョブを追加。`npm audit --audit-level=high --omit=dev` / `drizzle-kit check` / build / test を blocking で実行

開発者向けの普段の手順書 (パターン A / B / C、Aurora 安全運用ルール、ロールバック等) は `src/db/MIGRATIONS.md` を参照。

**外部に残るタスク (本リポジトリ外):**

- AWS: CloudWatch ロググループ `/ecs/mlab-{stg,prd}-memoryai-migrate` を作成し、retention 2 年に設定
- GitHub Settings: Branch protection の Required checks に `BE Lint, Build and Test` を追加 (`main` / `prod` 両方)
- STG で deploy workflow を 1 回走らせて smoke test

**Note on Phase 5 schema additions:** Supabase 由来の他テーブル (technology_trees, tree_nodes, node_papers, scenario_reports 等) を Aurora に持ってくる作業は **Phase 5 (Edge Functions Migration) と一体で実施する**。各 Edge Function を Express に移植する際、必要となるテーブルを `be/src/db/schema/` に追加してパターン A の手順で migration を生成する。Phase 2 の追加対象テーブル一覧:

  - `trees.ts` — `technology_trees`
  - `nodes.ts` — `tree_nodes` (self-referencing parent_id)
  - `papers.ts` — `node_papers`, `node_papers_summary`
  - `usecases.ts` — `node_use_cases`, `node_usecases_summary`
  - `market.ts` — `node_marketinfo`
  - `projects.ts` — `projects`, `project_trees`
  - `teams.ts` — `teams`, `teams_members`
  - `users.ts` — `user_profiles`
  - `saved.ts` — `saved_papers`, `saved_use_cases`
  - `reports.ts` — `scenario_reports`, `scenario_report_sections`
  - `releases.ts` — `user_release_views`
  - `enums.ts` — `axis_type` enum 等
  - PostgreSQL functions — `get_user_team_trees_and_nodes(user_id)` 等は `--custom` migration で再現する想定

**Data migration (Phase 6 cutover 時):** Supabase から Aurora への 1 回限りデータ移行スクリプトは `be/src/scripts/migrate-data.ts` として Phase 6 直前に書く。本フェーズではスコープ外。

---

### Phase 3 — Authentication

**Goal:** Replace Supabase Auth with AWS Cognito.

**Current state (post RDE-283):** Authentication is **fully delegated to API Gateway + Lambda Authorizer**. The Authorizer verifies the `Authorization: Bearer <Supabase JWT>` header and forwards `context.authorizer.userId` as the `X-User-Id` header (overriding any client-supplied value). The Express BE only reads `X-User-Id` via `requireAuth` and trusts it because:

- API Gateway's `request_parameters` overrides any client-supplied `X-User-Id`.
- The ALB is internal-SG and only reachable from API Gateway via VPC Link.

This means **the BE itself does not validate JWTs**. Phase 3's switch to Cognito therefore only requires changes to the Lambda Authorizer; the Express BE is expected to remain unchanged.

**Strategy:** Swap the Lambda Authorizer's verification logic from Supabase JWT (HS256) to Cognito JWT (RS256, JWKS). The Authorizer continues to emit `context.authorizer.userId` so `X-User-Id` semantics are preserved end-to-end.

**Steps:**

1. **Update the Lambda Authorizer** (`memlab-terraform/lambda/authorizer/main.py`):
   - Replace `jwt.decode(..., algorithms=["HS256"], ...)` with Cognito JWKS verification (e.g. via `python-jose` or `aws-jwt-verify` if rewritten in Node)
   - Keep returning `context={"userId": <sub>}` so the API Gateway integration mapping still works
   - Issuer becomes `https://cognito-idp.<region>.amazonaws.com/<userPoolId>`

2. **Frontend: replace `AuthProvider.tsx`:**
   - Swap Supabase auth calls → Cognito Hosted UI or Amplify SDK
   - Update `apiClient` (`src/lib/apiClient.ts`) to send the Cognito access token in `Authorization: Bearer ...`

3. **Migrate existing users:**
   - Export user accounts from Supabase Auth
   - Import into Cognito User Pool via admin SDK
   - Force password reset if hash format incompatible

4. **Port admin role logic:**
   - Replace `is-app-admin` edge function → Cognito group membership check (in Authorizer or BE)
   - Port `admin-create-user`, `admin-delete-user`, `admin-reset-password` → Express routes (these will need first-party verification of Cognito groups)

5. **(Optional, defensive)** If the trust model ever needs to move off "API Gateway + internal ALB", populate `be/src/middleware/providers/` with first-party JWT verifiers. The directory is reserved for that future. Until then, the trust comment in `be/src/middleware/auth.ts` documents the assumption.

**New env vars (Authorizer Lambda):**
```
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1

# Transitional — keep until all users have migrated
SUPABASE_JWT_SECRET=your-jwt-secret
```

**Deliverable:** Cognito tokens issued by the frontend, validated by the Lambda Authorizer, with `X-User-Id` continuing to flow into the BE unchanged.

---

### Phase 4 — Database API Layer (replacing PostgREST)

**Goal:** Create Express REST endpoints for all `supabaseRepository.ts` operations. Swap the frontend data layer.

**Steps:**

1. **Create route files** in `be/src/controllers/` — one file per table group:

   | Route file | Endpoints |
   |---|---|
   | `trees.ts` | GET `/api/trees`, GET `/api/trees/:id`, PATCH `/api/trees/:id`, DELETE `/api/trees/:id` |
   | `nodes.ts` | GET `/api/nodes?treeId=`, GET `/api/nodes/:id/children-counts` |
   | `papers.ts` | GET `/api/papers?nodeId=`, POST `/api/papers`, PATCH `/api/papers/:id` |
   | `usecases.ts` | GET `/api/use-cases?nodeId=`, POST `/api/use-cases`, PATCH `/api/use-cases/:id` |
   | `market.ts` | GET `/api/market-info?nodeId=`, POST `/api/market-info` |
   | `summaries.ts` | GET `/api/summaries/:nodeId`, POST `/api/summaries` |
   | `projects.ts` | GET `/api/projects`, POST `/api/projects`, PATCH `/api/projects/:id`, DELETE `/api/projects/:id` |
   | `project-trees.ts` | GET `/api/projects/:id/trees`, POST `/api/projects/:id/trees`, DELETE `/api/projects/:id/trees/:treeId`, PATCH `/api/projects/:id/trees/:treeId/position` |
   | `saved.ts` | GET `/api/saved/papers`, POST `/api/saved/papers`, DELETE `/api/saved/papers/:id` (same for use-cases) |
   | `reports.ts` | GET `/api/reports/:treeId`, POST `/api/reports`, GET `/api/reports/:id/sections` |
   | `users.ts` | GET `/api/users/:id` |

2. **All routes:** apply `requireAuth` middleware, scope queries to `req.user.teamId` (replaces RLS)

3. **Create `src/infrastructure/apiRepository.ts`:**
   - Drop-in replacement for `supabaseRepository.ts`
   - Same exported function signatures
   - Implemented with `fetch` calls to the new Express endpoints

4. **Update all imports** across `src/` from `supabaseRepository` → `apiRepository`

5. **Handle remaining direct `supabase.from()` calls:**
   - `grep -r "supabase.from" src/`
   - Move each into `apiRepository.ts` and expose as a function

**Deliverable:** All database reads/writes go through the new Express API. `@supabase/supabase-js` no longer needed for data access.

---

### Phase 5 — Edge Functions Migration (44 functions)

**Goal:** Port all Supabase Edge Functions to Express route handlers in `be/src/controllers/`.

**Common conversion pattern per function:**
- `Deno.env.get("X")` → `process.env.X`
- `supabase` client (service role) → Drizzle client from `be/src/db/client.ts`
- `Deno.serve(handler)` → `router.post('/function-name', requireAuth, handler)`
- CORS headers → handled globally by Express `cors()` middleware
- `new Response(JSON.stringify(...))` → `res.json(...)`
- SSE: `new Response(readable stream)` → `res.write()` + `res.flush()`

**Recommended migration order** (by risk/dependency):

**Batch A — Utilities (lowest risk):**
- `api-health-check` → `GET /functions/health`
- `is-app-admin` → inline in auth middleware (Phase 3)
- `duplicate-tree` → `POST /functions/duplicate-tree`

**Batch B — Chat & Context:**
- `chat-gpt` → `POST /functions/chat-gpt`
- `context-chat` → `POST /functions/context-chat`
- `scenario-chat` → `POST /functions/scenario-chat`
- `research-context` → `POST /functions/research-context`
- `paper-deep-analysis` → `POST /functions/paper-deep-analysis`

**Batch C — Node Enrichment:**
- `node-enrichment-papers-v2` → `POST /functions/node-enrichment-papers`
- `node-enrichment-usecases` → `POST /functions/node-enrichment-usecases`
- `node-enrichment` → `POST /functions/node-enrichment`
- `node-trl-calculation` → `POST /functions/node-trl-calculation`

**Batch D — Scenario Analysis:**
- `scenario-preanalyze` → `POST /functions/scenario-preanalyze`
- `scenario-analyze-market` → `POST /functions/scenario-analyze-market`
- `scenario-analyze-trl` → `POST /functions/scenario-analyze-trl`
- `scenario-analyze-social-issue` → `POST /functions/scenario-analyze-social-issue`
- `scenario-market-impls` → `POST /functions/scenario-market-impls`
- `search-scenario-patents` → `POST /functions/search-scenario-patents`

**Batch E — Tree Generation (highest risk):**
- `generate-tree-v3` → `POST /functions/generate-tree-v3`
- `generate-tree-fast-v3` → `POST /functions/generate-tree-fast-v3`
- `generate-tree-from-v5` → `POST /functions/generate-tree-from-v5`
- `generate-scenarios` → `POST /functions/generate-scenarios`
- `generate-scenarios-sse` → `POST /functions/generate-scenarios-sse`
- `generate-axes`, `generate-keywords-for-axis`, `generate-ted-layer`, `generate-technical-strengths` → respective routes

**Batch F — Reports & Evaluation:**
- `scenario-report-generate` → `POST /functions/scenario-report-generate`
- `scenario-report-section` → `POST /functions/scenario-report-section`
- `evaluate-ted-layer` → `POST /functions/evaluate-ted-layer`

**Update `src/infrastructure/`:**
- Create `src/infrastructure/apiFunctions.ts` replacing `edgeFunctions.ts`
- Same exported function signatures
- Replace `supabase.functions.invoke('name', { body })` → `fetch('/functions/name', { method: 'POST', body })`

**Deliverable:** All 44 edge functions ported. Supabase Edge Functions no longer invoked.

---

### Phase 6 — Final Frontend Cutover

**Goal:** Remove all remaining Supabase SDK usage from the frontend.

**Steps:**

1. Confirm no remaining Supabase calls: `grep -r "supabase\." src/`
2. Remove `src/integrations/supabase/` directory
3. Remove `@supabase/supabase-js` from `package.json`
4. Remove Supabase env vars from `.env.local` and hosting config
5. Add backend base URL env var:
   - `VITE_API_BASE_URL=http://localhost:3001` (dev) / production URL
6. Update all fetch calls in `apiRepository.ts` and `apiFunctions.ts` to use `VITE_API_BASE_URL`

**Deliverable:** Zero Supabase SDK imports in `src/`. Frontend talks only to `be/`.

---

### Phase 7 — Cleanup & Decommission

**Goal:** Remove all Supabase artifacts and decommission the Supabase project.

**Steps:**

1. Create git tag `pre-migration` as hard rollback point
2. Remove `supabase/` directory from repo
3. Remove `supabase` CLI package from `package.json`
4. Remove Supabase-related scripts from `package.json` (`generate-types`, `test:deno`, `test:deno:watch`, `test:deno:coverage`)
5. Port any Deno tests to Jest
6. Update `CLAUDE.md` to reflect new architecture and commands
7. Pause / delete the Supabase project (after ≥2 weeks stable in prod on new stack)

---

## Environment Variables Summary

### Current (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # edge functions only
OPENAI_API_KEY                   # edge functions only
SEARCH_API_USER                  # edge functions only
SEARCH_API_PASS                  # edge functions only
```

### After Migration
```
# Frontend
VITE_API_BASE_URL=http://localhost:3001

# Backend (be/)
DATABASE_URL=postgresql://...
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
OPENAI_API_KEY=...
SEARCH_API_USER=...
SEARCH_API_PASS=...
PORT=3001

# Transitional — remove after Phase 3 cutover
SUPABASE_JWT_SECRET=...
```

---

## Risk & Rollback Strategy

| Risk | Mitigation |
|---|---|
| Data loss during migration | Run data migration in read-only mode first; validate row counts before cutover |
| Auth token incompatibility | Keep Supabase JWT verifier active as fallback during Phase 3 — remove only after full Cognito cutover |
| Edge function behavior differences | Run old (Supabase) and new (Express) in parallel behind a feature flag during Phase 5 |
| Password hash migration | Prefer forced password reset over hash format assumptions |
| Production downtime | Blue/green deployment — new backend live before cutting DNS |

**Rollback:** Until Phase 6 is merged, the old Supabase path remains untouched. Git tag `pre-migration` as hard rollback point before Phase 7.

---

## Phase Timeline

| Phase | Effort | Can Parallelize? |
|---|---|---|
| Phase 1 — Backend Foundation | Small | No (prerequisite for all) — ✅ In Progress |
| Phase 2 — DB Schema & Migration | Medium | After Phase 1 |
| Phase 3 — Auth (Cognito) | Medium | After Phase 2 |
| Phase 4 — DB API Layer | Large | After Phase 2, parallel with Phase 3 |
| Phase 5 — Edge Functions | Large | After Phase 1, parallel with 3 & 4 |
| Phase 6 — Frontend Cutover | Small | After Phases 3, 4, 5 complete |
| Phase 7 — Cleanup | Small | After Phase 6 stable in prod ≥2 weeks |

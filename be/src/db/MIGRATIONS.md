# Database Migrations

Operational guide for schema changes against Aurora PostgreSQL.

---

## TL;DR

```bash
# 1. Edit be/src/db/schema/*.ts
# 2. Generate migration SQL
cd be && npm run db:generate
# 3. Commit the generated 000N_*.sql (do NOT hand-edit it)
# 4. Open PR — CI runs drizzle-kit check
# 5. Merge to main → STG db-migrate runs automatically → STG BE deploys
```

For anything beyond a routine column add, jump to the relevant section below.

---

## 1. Core principles

### 1.1 Auto-generated files are read-only

Files emitted by `drizzle-kit generate` (`migrations/000N_*.sql`, `migrations/meta/*.json`) **must never be hand-edited**. `drizzle-kit check` compares `meta/000N_snapshot.json` against `schema/*.ts` — manual edits silently bypass the check, get clobbered on the next regenerate, and become unreviewable.

### 1.2 For manual SQL, use `--custom`

```bash
npm run db:generate -- --custom --name=<short_label>
# → migrations/0NNN_<short_label>.sql (empty file)
```

Always start a custom file with `-- custom migration` so it is identifiable in review.

### 1.3 Session settings live in the runner

`SET lock_timeout = '5s'` and friends are applied once per session in [migrate.ts](migrate.ts). **Do not copy them into individual migration files.**

---

## 2. Workflows

### Pattern A — routine schema change (90% of cases)

```bash
# 1. Edit schema/*.ts (e.g. add `priority: integer(...)` to schema/jobs.ts)
# 2. Generate
npm run db:generate -- --name=add_jobs_priority
# 3. Read-only review of the generated SQL — do NOT edit it
# 4. Local check
npm run db:check  # → "Everything's fine 🐶🔥"
# 5. Open PR
```

### Pattern B — DDL not expressible by the diff engine (e.g. `CREATE INDEX CONCURRENTLY`)

drizzle-migrator wraps each migration file in a transaction, so `CONCURRENTLY` errors out as-is. Workaround: a custom file split by `--> statement-breakpoint` (enabled by `breakpoints: true` in `drizzle.config.ts`).

```bash
# 1. Do NOT add the index to TS schema yet.
# 2. Create an empty custom migration:
npm run db:generate -- --custom --name=add_jobs_email_idx_concurrent
```

```sql
-- custom migration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_email ON jobs (email);
--> statement-breakpoint
```

```bash
# 3. Now declare the index in schema/jobs.ts so the next regenerate sees it
#    (otherwise the next `db:generate` will emit a DROP INDEX).
# 4. npm run db:check
```

### Pattern C — expand-then-contract (mandatory once we have users)

NOT-NULL adds, column drops, and type changes must NOT be completed in one release. See §4.

---

## 3. Aurora safety rules

### 3.1 Session GUCs (set once in `migrate.ts`)

```sql
SET lock_timeout = '5s'                          -- give up DDL when blocked
SET statement_timeout = '60s'                    -- prevent runaway ALTERs
SET idle_in_transaction_session_timeout = '60s'  -- close abandoned transactions
```

Aurora has a single writer; long-held locks become outages immediately.

### 3.2 DDL rules

| Pattern | Rule |
|---|---|
| Add index | Use `CREATE INDEX CONCURRENTLY` outside a transaction (Pattern B). |
| Add NOT NULL column | Forbidden as a single step. Split via expand-then-contract (§4). |
| Drop column | Wait at least one release; the prior release is your rollback target. |
| Type change | New column → backfill → drop old (3 releases). |
| Bulk backfill (>100k rows) | Do not run inside a migration. Use a one-shot ECS task or batch worker. |

---

## 4. Expand-then-contract

> Not required pre-launch. Mandatory once the first user exists.

### Release N (expand) — backward-compatible new shape
```sql
ALTER TABLE jobs ADD COLUMN email TEXT NULL;
```
- App: start writing the new column; treat reads as nullable.
- Existing rows: backfill via a separate job.

### Release N+1 (contract) — drop compatibility
```sql
ALTER TABLE jobs ALTER COLUMN email SET NOT NULL;
```

This pattern keeps "old BE × new schema" runnable during rollback.

---

## 5. Rollback

**Drizzle is forward-only**: roll forward with a reverse migration; do not author down migrations.

| Situation | Action |
|---|---|
| Roll back BE only | Revert ECS task definition revision by one. If expand-then-contract was followed, leaving the DB on the new schema is fine. |
| Roll back schema too | Author a reverse migration and ship it through the normal flow. |
| Manual `psql` rollback | **Forbidden.** It desynchronizes history from reality. |

---

## 6. Inspecting applied state

drizzle-orm/migrator auto-creates `drizzle.__drizzle_migrations` on first run and records the sha256 hash of each applied file.

```sql
SELECT id, hash, to_timestamp(created_at / 1000) AS applied_at
FROM drizzle.__drizzle_migrations
ORDER BY id;
```

Run this in both STG and PRD to detect drift. The `db-migrate` GH Actions job runs **before** the BE Service rolling deploy and skips deploy on failure — see [.github/workflows/_deploy-memoryai-backend.yml](../../../.github/workflows/_deploy-memoryai-backend.yml).

---

## 7. Drizzle gotchas

| # | Gotcha | Mitigation |
|---|---|---|
| 1 | `timestamp` columns return `Date` by default and bite you on TZ. | Always set `withTimezone: true` (already applied across `schema/*.ts`). |
| 2 | `pgEnum` rename produces destructive SQL. | Rename via `--custom`, or use TEXT + CHECK constraint (preferred here). |
| 3 | `relations()` is separate from FK constraints. | Required if you use the query API for joins. FKs alone do not infer joins. |
| 4 | `drizzle-kit pull` (introspect) is not a continuous source of truth. | Useful for one-time bootstrapping only. |
| 5 | `InferModel` is deprecated. | Use `typeof table.$inferSelect` / `$inferInsert` (already adopted). |

---

## See also

- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations)
- [drizzle-kit generate](https://orm.drizzle.team/docs/drizzle-kit-generate)

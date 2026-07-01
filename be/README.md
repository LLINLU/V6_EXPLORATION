# be — Report Generation service

Backend service for asynchronous report generation. First step of moving LLM-heavy flows off Supabase Edge Functions.

Linear: [RDE-302](https://linear.app/memorylab/issue/RDE-302)

## Stack

- Express 5 + TypeScript (ESM, Node 24)
- Aurora PostgreSQL via `pg` for persistence (IAM auth in prod via `@aws-sdk/rds-signer`)
- **Drizzle ORM** for schema-as-code, query builder, and migrations (drizzle-kit)
- AWS SQS for async job queue + retry
- `zod` for request validation
- `pino` for structured logging (`pino-pretty` in dev)
- Vitest for tests

## Prerequisites

- Node.js 24 (Active LTS). Lower bound enforced via `engines` + `.npmrc` `engine-strict=true`.
- PostgreSQL 14+ (local) / Aurora PostgreSQL (stg/prd)

## Setup

```bash
cd be
npm install                          # installs deps; uses --ignore-scripts in CI/Docker
cp .env.example .env                 # fill in DATABASE_URL (or DB_HOST + DB_* for IAM)
npm run db:migrate                   # apply migrations to DATABASE_URL / DB_HOST
npm run dev                          # tsx watch mode
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | `tsx` watch mode (hot reload) |
| `npm run build` | TypeScript build to `dist/` |
| `npm start` | Run compiled `dist/index.js` |
| `npm run db:generate` | Generate a new migration SQL from `src/db/schema/*.ts` (read-only output, do not hand-edit) |
| `npm run db:check` | Verify `schema/*.ts` and `migrations/meta/*_snapshot.json` are in sync |
| `npm run db:migrate` | Apply pending migrations to the configured DB (idempotent — applied list is tracked in `drizzle.__drizzle_migrations`) |
| `npm test` | Run all tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with v8 coverage report |

For day-to-day schema changes (add a column, add an index, etc.), see [src/db/MIGRATIONS.md](src/db/MIGRATIONS.md).

## Authentication

All routes except `GET /health` require an `X-User-Id` header. Requests without it receive `401 Unauthorized`. The header is set by the upstream API Gateway + Lambda Authorizer; the BE itself does not validate JWTs.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/scenario-report-generate` | required | Submit a scenario for report generation |
| `POST` | `/query-report` | required | Submit a query for technology landscape report generation |
| `GET` | `/query-report/:id` | required | Poll query report status or fetch final query report |
| `GET` | `/job/:id` | required | Poll job status (`queued` / `running` / `done` / `failed`) |
| `GET` | `/result/:id` | required | Fetch final report when status is `done` |
| `GET` | `/health` | — | Liveness |

Query Report design/spec: [../docs/architecture/query-report-generation.md](../docs/architecture/query-report-generation.md).

## Project layout

```
be/
├── drizzle.config.ts           # drizzle-kit config (schema input, migrations output, breakpoints)
└── src/
    ├── controllers/             # Express routes
    ├── middleware/              # Auth and other request middleware
    ├── db/
    │   ├── schema/              # TS schema definitions (1 file per table + barrel)
    │   ├── migrations/          # drizzle-kit managed (read-only)
    │   ├── connection.ts        # pg.ClientConfig builder (RDS Signer + CA bundle)
    │   ├── client.ts            # drizzle ORM instance — service layer imports `db` from here
    │   ├── pool.ts              # pg.Pool used by `client.ts`
    │   ├── migrate.ts           # one-shot migration runner (ECS RunTask entrypoint)
    │   └── MIGRATIONS.md        # day-to-day schema-change guide
    ├── queue/                   # SQS client, enqueue, long-poll worker loop
    ├── services/                # business logic — uses Drizzle query builder via `db`
    ├── worker/                  # pipeline: generate → validate → persist
    ├── logger.ts                # pino instance
    └── index.ts                 # entry point
```

## Data model

| Table | Purpose |
|---|---|
| `jobs` | Status + progress per job |
| `requests` | Audit log of input payload (one row per POST; write-only — no service reads) |
| `results` | Validated final JSON (one row per completed run; latest by `validated_at` wins) |
| `usage` | Token + cost per pipeline step |
| `user_plans` | Per-user plan (`free` / `unlimited`) and monthly report limit override |

FKs from children (`requests` / `results` / `usage`) to `jobs` use the default `ON DELETE NO ACTION` — there is no cascading delete, by design. We have no use case yet that deletes a job, and `NO ACTION` keeps an accidental `DELETE FROM jobs` from cascading into a multi-table data loss. If a delete flow is added later, decide its semantics (cascade vs explicit child deletes vs `SET NULL`) in the same PR.

## Migrations

Schema is the source of truth: edit `src/db/schema/*.ts`, run `npm run db:generate`, commit the generated SQL. `drizzle-kit check` is a Required CI check that catches drift between TS schema and migration files. See [src/db/MIGRATIONS.md](src/db/MIGRATIONS.md) for the full developer workflow including:

- The auto-generated vs `--custom` file split (and why generated files are read-only)
- Aurora safety belts (`SET lock_timeout`, etc.) applied by `migrate.ts`
- `CREATE INDEX CONCURRENTLY` workflow via `--> statement-breakpoint`
- Expand-then-contract pattern (mandatory after launch)
- Forward-only rollback strategy

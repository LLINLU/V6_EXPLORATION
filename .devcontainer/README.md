# Dev container

Opens the repo in a Docker-based dev environment with Node 20, Deno, and a Postgres 17 service pre-wired for the `be/` scenario report service.

## What you get

| Service | Image | Purpose |
|---|---|---|
| `app` | `mcr.microsoft.com/devcontainers/typescript-node:1-20` | Your dev shell — Node 20, git, build tools. Deno added via devcontainer feature. |
| `postgres` | `postgres:17-alpine` | Shared DB for `be/` + pg-boss. Auto-created `memory_ai` database with user `memory_ai`. |

`DATABASE_URL=postgresql://memory_ai:memory_ai@postgres:5432/memory_ai` is set in the `app` container automatically.

## Ports forwarded

- `3001` — `be/` (scenario report API)
- `8080` — Next.js dev server
- `5432` — Postgres (if you want to connect with a local GUI)

## Quick start (after VS Code / Codespaces opens the container)

```bash
cd be
npm install            # already run as postCreateCommand
npm run db:migrate     # apply be/src/db/schema.sql to Postgres
npm run dev            # http://localhost:3001/health
```

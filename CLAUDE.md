# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server on localhost:8080
- `npm run build` - Production build using Vite
- `npm run build:dev` - Development build using Vite
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Testing
- `npm test` - Run all tests (Jest + Deno)
- `npm run test:jest` - Run Jest tests only
- `npm run test:deno` - Run Deno tests for edge functions
- `npm run test:deno:watch` - Run Deno tests in watch mode
- `npm run test:deno:coverage` - Run Deno tests with coverage report

### Database Types
- `npm run generate-types` - Generate TypeScript types from Supabase schema
- Direct command: `npx supabase gen types typescript --project-id=mnnvcyrohovytovydaig > src/integrations/supabase/types/database.types.ts`

### Supabase Edge Functions
- Deploy single function: `npx supabase functions deploy <function-name>`
- Deploy all functions: `npx supabase functions deploy`
- Local development: `npx supabase functions serve`

## Before Deploy Edge Functions
- Make sure to ask user if you really want to deploy it, because it might affect the prod environment edge function and the prod might fail

## Backend Migration Status

The backend is actively migrating off Supabase onto a self-hosted Express server in `be/`. See `be/MIGRATION_PLAN.md` for the full plan.

**Current phase: Phase 2 — DB Schema & Migration ✅ done (Drizzle on Aurora). Next: Phase 3 (Auth) and Phase 5 (Edge Functions porting).**

| Phase | Status |
|---|---|
| Phase 1 — Backend Foundation | ✅ Done |
| Phase 2 — DB Schema & Migration (Drizzle on Aurora) | ✅ Done — see `be/src/db/MIGRATIONS.md` |
| Phase 3 — Auth (Cognito, Supabase JWT transitional) | ⬜ Not started |
| Phase 4 — DB API Layer (replacing PostgREST) | ⬜ Not started |
| Phase 5 — Edge Functions Migration (44 functions) | ⬜ Not started |
| Phase 6 — Frontend Cutover | ⬜ Not started |
| Phase 7 — Cleanup & Decommission | ⬜ Not started |

**Update this table as phases complete.** `be/MIGRATION_PLAN.md` is the source of truth for what each phase involves.

### `be/` Backend Structure
```
be/src/
├── controllers/     # Express route handlers
├── services/       # Business logic + table operations
├── middleware/     # Auth middleware (Cognito + Supabase JWT)
│   └── providers/
├── worker/         # SQS queue processing
├── queue/          # SQS client, enqueue, long-poll worker loop
└── db/             # DB connection + schema (Drizzle in Phase 2)
```

**Auth (Phase 3 target):** AWS Cognito as primary, Supabase JWT as transitional fallback. Both handled in `be/src/middleware/auth.ts`. Remove Supabase provider after full Cognito cutover.

---

## Architecture Overview

### Project Structure
This is a React-based AI research tool built with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **UI Components**: shadcn/ui components built on Radix UI
- **Backend**: Supabase (PostgreSQL + Edge Functions) — **migrating to `be/` Express server**
- **State Management**: Zustand stores + React Query for server state
- **Routing**: React Router v6

### Core Application Flow
1. **Index Page** (`/`) - Tree generation interface with search functionality
2. **Technology Tree Page** (`/technology-tree`) - Main interactive tree visualization
3. **Research Context Page** (`/research-context`) - Contextual research interface
4. **Search Results Page** (`/search-results`) - Search result display
5. **Admin Page** (`/admin`) - Administrative controls

### Key Architectural Patterns

#### Supabase Edge Functions Pattern
All edge functions follow a consistent pattern:
- Standardized CORS handling with OPTIONS preflight
- Fire-and-forget processing (immediate response, background work continues)
- Staged processing (e.g., tree structure first, enrichment second)
- Error isolation (individual failures don't cascade)
- Database polling for results (not direct API response waiting)

#### State Management Architecture
- **useTechnologyTree** - Primary tree state and operations
- **useChatContextStore** (Zustand) - Global chat context and node selection
- **useEnrichedData** - Tracks enrichment status per node
- **Event-driven updates** - Custom events for cross-component communication
- **In-memory caching** - Sets/Maps prevent duplicate API calls

#### Enrichment Queue System
The `enrichmentQueue` service implements sophisticated queue management:
- Singleton pattern with concurrent processing limits
- Database polling instead of API response waiting
- Real-time status tracking (waiting → fetching → done/error)
- Automatic retry with exponential backoff
- Health monitoring with recovery mechanisms

#### Component Patterns
- **Compound components**: Features split into logical sub-components
- **Custom hooks per component**: Complex logic extracted to hooks
- **Unified interfaces**: Components work across multiple contexts
- **Progressive disclosure**: UI elements appear based on data availability

#### Chat and Messaging System
- **Message grouping**: Consecutive messages from same user auto-grouped
- **Mention processing**: `/mention` syntax with custom highlighting
- **HTML content support**: Safe parsing and rendering
- **Multiple render modes**: Different styles for different contexts
- **Streaming support**: Real-time updates for long operations

### Tree Generation Flow
1. User inputs search query on Index page
2. Edge function generates tree structure (fire-and-forget)
3. Frontend polls database for tree completion
4. User navigates to TechnologyTree page
5. Progressive enrichment begins automatically
6. Real-time updates via event bus and polling

### Node Enrichment System
- **nodeEnrichmentService** - Orchestrates enrichment operations
- **Selective enrichment** - Checks existing data before API calls
- **Streaming callbacks** - Real-time progress updates
- **Three types**: Papers, use cases, and combined enrichment
- **Status persistence** - Tracks enrichment state across sessions

### Deep Analysis (Paper Analysis) Flow
1. User clicks analysis button on paper card
2. `PaperAnalysisDialog` opens for direction input
3. User specifies analysis focus (optional)
4. `paper-deep-analysis` edge function processes request
5. Response displayed with rich formatting and mention support

### Authentication & Teams
- Supabase Auth with team-based access control
- **AuthProvider** wraps app with authentication context
- **PrivateRoute** component protects authenticated routes
- Team management in admin interface

## Important Conventions

### TypeScript Patterns
- Strict mode enabled
- Extensive use of literal union types for status tracking
- Optional chaining for defensive programming
- Auto-generated database types (do not edit manually)

### UI/UX Patterns
- All components use shadcn/ui with Tailwind CSS
- Loading states for all async operations
- Error boundaries to prevent cascade failures
- Toast notifications for user feedback
- Path aliases: `@/` maps to `src/`

### English Copy & Wording
- Avoid AI-sounding words like "generated", "generate", "generation" in English UI copy and strings — use natural alternatives (e.g. "create", "build", "produce", "explore")
- Exception: use "generated" only when describing output from a deterministic function or code process (not an LLM), where the technical meaning is exact

### API Integration Patterns
- Check data existence before making API calls
- Use fire-and-forget pattern for long operations
- Poll database for results instead of waiting
- Implement proper error handling and recovery

## Supabase Project Details
- Project ID: `mnnvcyrohovytovydaig`
- Edge Functions in `supabase/functions/` directory
- Database schema auto-generates TypeScript types
- Uses Supabase CLI for deployment and development
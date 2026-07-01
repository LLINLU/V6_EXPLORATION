# Suggested Commands for Memory AI v3

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server on localhost:8080
- `npm run build` - Production build using Vite
- `npm run build:dev` - Development build using Vite
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

### Database Types Generation
- `npm run generate-types` - Generate TypeScript types from Supabase schema
- Direct command: `npx supabase gen types typescript --project-id=mnnvcyrohovytovydaig > src/integrations/supabase/types/database.types.ts`

### Supabase Edge Functions
- Deploy single function: `npx supabase functions deploy <function-name>`
- Deploy all functions: `npx supabase functions deploy`
- Local development: `npx supabase functions serve`

**IMPORTANT**: Always ask user for confirmation before deploying edge functions as it affects production environment

### System Commands (macOS/Darwin)
- `ls` - List files and directories
- `cd` - Change directory
- `pwd` - Print working directory
- `git status` - Check git status
- `git diff` - View changes
- `git log` - View commit history
- `rg` (ripgrep) - Fast search tool (preferred over grep)
- `find` - Find files/directories

### Initial Setup
- `npm install` - Install dependencies
- `npx supabase login` - Authenticate with Supabase CLI (if needed)

### Testing
No dedicated test framework detected. Manual testing via development server.

## Post-Task Commands
After completing any coding task, always run:
1. `npm run lint` - Check for linting errors
2. `npm run build` - Verify production build works

If lint/typecheck commands are needed but not found, ask user for the correct commands and suggest adding them to CLAUDE.md.
# Memory AI v3 Project Overview

## Project Purpose
Memory AI v3 is an advanced AI research tool designed for generating and exploring technology trees. It provides users with:
- Interactive tree generation from search queries
- Visual exploration of technology relationships
- Deep analysis of research papers
- Contextual research interfaces
- Progressive enrichment of nodes with papers and use cases

## Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components (built on Radix UI)
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **State Management**: 
  - Zustand for global state (chat context, selections)
  - React Query for server state
- **Routing**: React Router v6
- **Package Manager**: npm (with package-lock.json)

## Architecture Highlights
- Fire-and-forget pattern for long operations
- Database polling for results (not direct API response waiting)
- Event-driven updates across components
- Singleton enrichment queue with concurrent processing limits
- Progressive disclosure UI patterns
- Compound components with custom hooks

## Key Features
1. Tree generation with multiple search modes (quick/deep)
2. Node enrichment with papers and use cases
3. Real-time chat interface with mention support
4. Paper deep analysis functionality
5. Team-based access control
6. Admin interface for system management

## Supabase Project
- Project ID: mnnvcyrohovytovydaig
- Edge Functions in supabase/functions/ directory
- Auto-generated TypeScript types from database schema
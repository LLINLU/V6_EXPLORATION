# Memory AI v3 Project Structure

## Root Directory
```
memory-ai-v3/
├── src/                    # Source code
├── supabase/              # Supabase edge functions
├── public/                # Static assets
├── .vscode/               # VSCode settings
├── api-specifications/    # API documentation
├── package.json           # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind CSS config
├── CLAUDE.md             # AI assistant instructions
└── README.md             # Project documentation
```

## Source Directory Structure
```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── technology-tree/ # Tree visualization components
│   ├── research-context/# Research interface components
│   ├── search-results/  # Search results components
│   ├── admin/           # Admin interface components
│   ├── shared/          # Shared/common components
│   └── sidebar/         # Sidebar components
├── pages/               # Page components (routes)
├── hooks/               # Custom React hooks
├── services/            # Business logic and API calls
├── stores/              # Zustand state stores
├── utils/               # Utility functions
├── integrations/        # External integrations
│   └── supabase/        # Supabase client and types
├── types/               # TypeScript type definitions
├── lib/                 # Library configurations
├── data/                # Static data
├── assets/              # Images and other assets
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Supabase Functions Structure
```
supabase/functions/
├── generate-tree/              # Tree generation
├── generate-tree-fast/         # Fast tree generation
├── node-enrichment/            # Node enrichment
├── node-enrichment-papers/     # Paper enrichment
├── node-enrichment-usecases/   # Use case enrichment
├── paper-deep-analysis/        # Deep paper analysis
├── context-chat/               # Context chat functionality
├── research-context/           # Research context
├── admin-*/                    # Admin functions
└── shared/                     # Shared utilities
```

## Key Component Organization
- **Page Components**: Full page layouts in `/pages`
- **Feature Components**: Grouped by feature in `/components`
- **UI Components**: Reusable UI elements in `/components/ui`
- **Compound Components**: Complex features split into sub-components
- **Custom Hooks**: Logic extraction in `/hooks`

## Import Path Resolution
- `@/` alias points to `src/` directory
- Allows clean imports like `@/components/ui/button`

## Database Types
- Auto-generated in `src/integrations/supabase/types/database.types.ts`
- DO NOT manually edit - use `npm run generate-types`

## Configuration Files
- `vite.config.ts`: Dev server on port 8080, path aliases
- `tsconfig.json`: TypeScript with relaxed strict mode
- `tailwind.config.ts`: Tailwind CSS customization
- `components.json`: shadcn/ui component configuration
- `.env.example`: Environment variable template
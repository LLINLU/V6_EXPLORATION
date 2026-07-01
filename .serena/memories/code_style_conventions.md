# Code Style and Conventions

## TypeScript Configuration
- TypeScript with relaxed strict mode:
  - `noImplicitAny`: false
  - `noUnusedParameters`: false
  - `noUnusedLocals`: false
  - `strictNullChecks`: false
- Path alias: `@/` maps to `src/`
- `skipLibCheck`: true for faster builds
- `allowJs`: true

## ESLint Rules
- Based on recommended JS/TS configurations
- React Hooks plugin enabled
- React Refresh plugin for HMR
- `@typescript-eslint/no-unused-vars`: disabled
- Ignores `dist` directory

## Component Patterns
- **Functional Components**: All components use function syntax with TypeScript interfaces
- **File Naming**: PascalCase for component files (e.g., `TechnologyHeader.tsx`)
- **Component Structure**:
  ```tsx
  interface ComponentNameProps {
    prop1: string;
    prop2?: number;
  }
  
  export const ComponentName = ({ prop1, prop2 }: ComponentNameProps) => {
    // hooks
    // logic
    // return JSX
  };
  ```

## Styling Conventions
- **Tailwind CSS**: Primary styling method
- **shadcn/ui**: Pre-built components from component library
- **No CSS-in-JS**: Use Tailwind classes directly
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## State Management Patterns
- **Local State**: useState for component-specific state
- **Global State**: Zustand stores (e.g., `useChatContextStore`)
- **Server State**: React Query with custom hooks
- **Event-driven**: Custom events for cross-component communication

## Import Organization
1. External dependencies
2. Supabase/integrations
3. Components (using @/ alias)
4. Hooks
5. Utils/services
6. Types

## Best Practices
- Use optional chaining (`?.`) for defensive programming
- Prefer literal union types for status tracking
- Extract complex logic to custom hooks
- Follow fire-and-forget pattern for long operations
- Implement proper error boundaries
- Always show loading states for async operations
- Use toast notifications for user feedback

## Naming Conventions
- **Variables/Functions**: camelCase
- **Components**: PascalCase
- **Types/Interfaces**: PascalCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: Component files match component name

## Database Type Usage
- Import generated types: `import type { Database } from '@/integrations/supabase/types/database.types'`
- Use specific table types as needed
- Never manually edit generated types
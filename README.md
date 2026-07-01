# Project info

This application was originally built with Lovable.

To check out the LIVE deployed app, go to the #prd_planning channel on Slack and see the Channel Overview.

## What technologies are used for this project?

This project is built with:

- React
- TypeScript
- Supabase (Backend & Authentication)
- Vite
- shadcn-ui
- Tailwind CSS


## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Release Assets Storage

Release assets (videos and screenshots) for the Releases page are stored in Supabase Storage:

- **Bucket**: `github-releases-asset`
- **Path structure**: `releases/{release_folder}/{file_name}`
- **Example**: `releases/global_search/1.mov`

The application uses environment variables to construct asset URLs dynamically:
- `NEXT_PUBLIC_SUPABASE_URL` - Base Supabase URL
- Storage path: `/storage/v1/object/public/github-releases-asset/releases`

## Supabase Database Schema Management

This project uses Supabase as the backend database. Database type definitions are automatically generated and stored in `src/integrations/supabase/types/database.types.ts`.

### Generating Database Types

To regenerate the database types after making schema changes in Supabase:

```sh
# Method 1: Using npm script (recommended)
npm run generate-types

# Method 2: Direct command
npx supabase gen types typescript --project-id=mnnvcyrohovytovydaig > src/integrations/supabase/types/database.types.ts
```

### Prerequisites for Type Generation

Before running type generation commands, ensure you have:

1. **Supabase CLI installed**: The commands use `npx supabase`
2. **Proper authentication**: If you encounter permission errors, you may need to authenticate:
   ```sh
   npx supabase login
   ```
3. **Project access**: Ensure you have appropriate access to the Supabase project

### Database Schema Structure

The current database includes the following main tables:
- `teams` - Team management
- `technology_trees` - Main tree structures
- `tree_nodes` - Individual nodes within trees
- `user_profiles` - User profile information

### Type Usage in Code

Import and use the generated types:

```typescript
import type { Database } from '@/integrations/supabase/types/database.types';

// Use specific table types
type TechnologyTree = Database['public']['Tables']['technology_trees']['Row'];
type TreeNode = Database['public']['Tables']['tree_nodes']['Row'];
```

## How do I deploy this project?

1. Once you're done with your feature, update your local branch with the latest `main` branch (but don't update `main` yet)
2. Push your local branch and open a pull request to merge it with `main`.
3. Even if all your tests pass, DON'T CONFIRM MERGE YET!
4. Assign the PR to whoever is on **QA (test) duty** at the moment to test the application with your branch. Once they're done, they will make the merge.


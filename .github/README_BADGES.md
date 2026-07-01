# Adding Badges to README

Add the following badge to your project README to display CI status at a glance.

## GitHub Actions CI Status Badge

```markdown
[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
```

**Usage:**
1. Replace `YOUR_USERNAME` with your GitHub username
2. Replace `YOUR_REPO` with your repository name
3. Add near the top of your README.md

## Sample README Section

```markdown
# Memory AI App

[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)

## Development

### Prerequisites

- Node.js 20 or higher
- npm

### Setup

\`\`\`bash
npm install
\`\`\`

### Start Development Server

\`\`\`bash
npm run dev
\`\`\`

### Run Tests

\`\`\`bash
npm test
\`\`\`

### CI/CD

This project uses GitHub Actions for automated checks.
See [CI/CD Guide](.github/CI_CD_GUIDE.md) for details.

#### Local Checks

\`\`\`bash
# Run all checks
npm run check:errors-only && npm run build && npm test
\`\`\`
```

## Other Badge Examples

### Test Coverage (can be added in the future)

```markdown
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/YOUR_USERNAME/YOUR_REPO)
```

### License

```markdown
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
```

### Node.js Version

```markdown
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
```

### Tech Stack

```markdown
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.50-green?logo=supabase)](https://supabase.com/)
[![Jest](https://img.shields.io/badge/Jest-30.2-red?logo=jest)](https://jestjs.io/)
[![Biome](https://img.shields.io/badge/Biome-2.1-60a5fa)](https://biomejs.dev/)
```

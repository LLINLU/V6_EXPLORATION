# CI/CD Guide

## Overview

This project uses GitHub Actions to automatically perform code quality checks.

## Automated Checks

When you create a Pull Request or push code, the following checks run automatically:

1. **📝 Lint Check** (`npm run check:errors-only`)
   - Code quality check with Biome
   - Fails if errors are found

2. **🏗️ Build Check** (`npm run build`)
   - Builds Next.js project
   - Fails if build errors occur

3. **🧪 Test Check** (`npm run test`)
   - Runs Jest unit tests
   - Fails if any tests fail

## Running Locally

You can pre-check before pushing with these commands:

```bash
# Run all checks at once
npm run check:errors-only && npm run build && npm run test

# Or run individually
npm run check:errors-only  # Lint check
npm run build              # Build check
npm run test               # Test check
```

## Merge Rules

When branch protection is enabled:
- ✅ All CI checks must pass
- ✅ Pull Request required (no direct push)
- ✅ Code review approval required (depending on settings)

## When CI Fails

1. Check error logs in GitHub Actions tab
2. Run the failing command locally to reproduce
3. Fix the error
4. Commit and push
5. CI will automatically re-run

## Workflow Files

- `.github/workflows/ci.yml` - Main CI workflow

## References

- [Branch Protection Guide](BRANCH_PROTECTION.md)
- [Pull Request Template](pull_request_template.md)
- [README Badges Guide](README_BADGES.md)

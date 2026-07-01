# Branch Protection Setup Guide

This repository uses two protected branches with different merge-source rules:

- `main`: pull requests must come from branches matching `*/*`
- Exception: code owners may also open pull requests from `prod` into `main`
- `prod`: pull requests must come from branches matching `release/*`
- Exception: code owners may also open pull requests from `main` into `prod`

These source-branch restrictions are enforced by the GitHub Actions workflow at [.github/workflows/enforce-branch-sources.yml](/Users/josh/Development/memory/memory-ai-app/.github/workflows/enforce-branch-sources.yml).

## Required GitHub Settings

GitHub Actions cannot grant direct-push exceptions on protected branches by itself. To allow code owners to push directly to `main` and `prod`, configure branch protection or rulesets in GitHub and add the code owners as bypass actors.

Code owners for bypass:

- `@joshdanielai`
- `@cn-eveer`
- `@r4ynode`
- `@YUYA556223`

## Ruleset Recommendation

Create branch rules for `main` and `prod` in GitHub:

1. Go to repository `Settings` -> `Rules` -> `Rulesets` or `Branches`
2. Create one rule for `main`
3. Create one rule for `prod`

## `main` Rule

Branch name pattern:

```text
main
```

Recommended settings:

- Require a pull request before merging
- Require approvals: at least 1
- Require review from code owners
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Restrict direct pushes for everyone except bypass actors

Required checks:

- `Lint, Build and Test`
- `BE Lint, Build and Test`
- `validate-source-branch`

The `BE Lint, Build and Test` check runs `npm audit`, `drizzle-kit check` (schema/migration consistency), build, and tests for `be/`. See [.github/workflows/ci.yml](/.github/workflows/ci.yml).

Behavior:

- PRs into `main` pass only when the source branch matches `*/*`
- Code owners may also open PRs from `prod` into `main`
- Direct pushes should be blocked for non-bypass users
- Code owners can be added to the bypass list so they can push directly when needed

## `prod` Rule

Branch name pattern:

```text
prod
```

Recommended settings:

- Require a pull request before merging
- Require approvals: at least 1
- Require review from code owners
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Restrict direct pushes for everyone except bypass actors

Required checks:

- `Lint, Build and Test`
- `BE Lint, Build and Test`
- `validate-source-branch`

The `BE Lint, Build and Test` check runs `npm audit`, `drizzle-kit check` (schema/migration consistency), build, and tests for `be/`. See [.github/workflows/ci.yml](/.github/workflows/ci.yml).

Behavior:

- PRs into `prod` pass only when the source branch matches `release/*`
- Code owners may also open PRs from `main` into `prod`
- Direct pushes should be blocked for non-bypass users
- Code owners can be added to the bypass list so they can push directly when needed

## Important Limitation

The workflow enforces source branch names for pull requests only. Direct-push access control must be configured in GitHub branch protection or rulesets; it is not controlled by files in this repository.

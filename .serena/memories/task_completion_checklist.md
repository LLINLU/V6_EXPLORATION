# Task Completion Checklist

When completing any coding task in Memory AI v3, follow these steps:

## 1. Code Quality Checks
- [ ] Run `npm run lint` to check for ESLint errors
- [ ] Fix any linting issues that appear
- [ ] Ensure no TypeScript errors in the IDE

## 2. Build Verification
- [ ] Run `npm run build` to verify production build succeeds
- [ ] Fix any build errors that occur
- [ ] Check console for any warnings

## 3. Functional Testing
- [ ] Start dev server with `npm run dev`
- [ ] Test the implemented feature manually
- [ ] Check browser console for errors
- [ ] Verify UI renders correctly
- [ ] Test responsive behavior if UI changes were made

## 4. Database Considerations
- [ ] If database schema was modified, regenerate types with `npm run generate-types`
- [ ] Update any TypeScript interfaces that use database types
- [ ] Ensure all database queries still work

## 5. Edge Functions (if applicable)
- [ ] Test edge functions locally with `npx supabase functions serve`
- [ ] **IMPORTANT**: Ask user for confirmation before deploying
- [ ] Only deploy after explicit user approval

## 6. Code Review Checklist
- [ ] Code follows existing patterns in the codebase
- [ ] No hardcoded values that should be configurable
- [ ] Proper error handling implemented
- [ ] Loading states added for async operations
- [ ] Toast notifications for user actions
- [ ] No console.log statements left in production code

## 7. Git Considerations
- [ ] Review changes with `git status` and `git diff`
- [ ] Ensure no sensitive information in commits
- [ ] Stage only intended changes

## Notes
- If lint or typecheck commands fail or are missing, ask the user for the correct commands
- Suggest adding any missing commands to CLAUDE.md for future reference
- Always prioritize following existing patterns over introducing new ones
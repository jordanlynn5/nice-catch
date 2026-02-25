# Bug Fix Workflow

## Steps
1. Read the relevant files and understand the current behavior
2. Write a 2-3 sentence diagnosis BEFORE making any edits
3. Make the minimal fix needed
4. Run `npx tsc --noEmit` to verify no type errors
5. Run `npm test` to verify no regressions
6. If fix doesn't work after 2 attempts, write a plan document instead of continuing to iterate

## Usage
Invoke with `/bugfix` when you encounter a bug that needs fixing.

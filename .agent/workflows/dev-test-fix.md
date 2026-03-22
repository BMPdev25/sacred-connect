---
description: Develop → Test → Fix loop. After finishing code changes, run tests, log bugs, fix them, re-test until clean, then proceed to next phase.
---

# Develop → Test → Fix Workflow

// turbo-all

This workflow defines the automated loop that runs after every development phase. Follow these steps exactly.

---

## Step 1: Identify Changed Files

After finishing a development task, list all files that were created or modified. Group them:

- **Frontend files** (in `sacred-connect/`)
- **Backend files** (in `BMPserver/`)

This determines which test suites to run.

---

## Step 2: Check for Existing Tests

Look for existing test files that cover the changed code:

- **Frontend tests**: `sacred-connect/__tests__/*.test.ts(x)`
- **Backend model tests**: `BMPserver/tests/models/*.test.js`
- **Backend integration tests**: `BMPserver/tests/integration/*.test.js`

If existing tests cover the changed code, note them for Step 4.

---

## Step 3: Create Missing Tests

For each changed file that does NOT have test coverage:

### Backend (Node/Express):
- Create test file at `BMPserver/tests/` matching the source structure
- Use `jest`, `supertest`, and `mongodb-memory-server`
- Test: API endpoints return correct status codes, model validations, edge cases

### Frontend (React Native/Expo):
- Create test file at `sacred-connect/__tests__/`
- Use `jest` with `react-native` preset and `@testing-library/react-native`
- Test: Component renders without crashing, key text/elements present, handler logic

> **Important**: Keep tests focused and minimal. Test the behavior that changed, not the entire file.

---

## Step 4: Run All Relevant Tests

Run the test suites:

### Backend tests:
```
cd c:\Users\pgopa\OneDrive\Documents\GitHub\BMPserver && npx jest --verbose --forceExit 2>&1
```

### Frontend tests:
```
cd c:\Users\pgopa\OneDrive\Documents\GitHub\sacred-connect && npx jest --verbose --forceExit 2>&1
```

If only backend or only frontend changed, run only the relevant suite.

---

## Step 5: Also Run Static Analysis

Check for TypeScript/lint issues in the changed frontend files:

```
cd c:\Users\pgopa\OneDrive\Documents\GitHub\sacred-connect && npx tsc --noEmit 2>&1 | Select-String -Pattern "error TS" | Select-Object -First 30
```

> Note: Some pre-existing TS errors may appear. Focus only on errors in files YOU changed.

---

## Step 6: Compile Bug Report

After running tests and static analysis, create a structured bug list:

For each failure, record:
- **File**: which file has the issue
- **Type**: test failure / TS error / runtime error
- **Error message**: exact error
- **Severity**: critical (blocks app) / moderate (wrong behavior) / minor (cosmetic)

If **zero bugs found** → Skip to Step 8.

---

## Step 7: Fix → Re-Test Loop

For each bug in the report:

1. **Fix the bug** in the source code
2. **Re-run the specific failing test** to confirm fix
3. **Mark the bug as resolved** in the report

Once all bugs are fixed, re-run the **full test suite** one final time (Step 4) to catch regressions.

If new failures appear → Add to bug report and repeat this step.  
If all tests pass → Proceed to Step 8.

---

## Step 8: Update Checklist & Move to Next Phase

1. Mark the completed items as `[x]` in the task checklist (`task.md`)
2. Notify the user with a summary of:
   - What was built
   - Tests that were run/created
   - Bugs found and fixed (if any)
   - Confirmation that all tests pass
3. Ask user for approval to proceed to the next phase

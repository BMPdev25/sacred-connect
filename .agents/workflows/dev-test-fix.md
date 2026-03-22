---
description: Develop → Test → Fix loop. After finishing code changes, run tests, log bugs, fix them, re-test until clean, then proceed to next phase.
---

# Dev → Test → Fix Workflow

## Steps

1. **Develop**: Implement the code changes for the current phase/feature.

// turbo
2. **Run Backend Tests**: Execute `npm test` in `c:\Users\pgopa\OneDrive\Documents\GitHub\BMPserver` to run Jest tests.

3. **Log Bugs**: If any tests fail, note each failure (file, test name, error message).

4. **Fix Bugs**: Apply targeted fixes for each logged bug. Do NOT re-implement features from scratch.

// turbo
5. **Re-Test**: Run `npm test` in `c:\Users\pgopa\OneDrive\Documents\GitHub\BMPserver` again after fixes.

6. **Loop**: Repeat steps 3–5 until all tests pass cleanly.

// turbo-all

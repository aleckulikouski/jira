---
name: implement-issue
description: Implement a single issue by writing the necessary code and documentation.
---

# Locate the ISSUE

Ask the user for the ISSUE file path (e.g. `issues/002-auth.md`).

If the ISSUE is not already in your context window, read it from the file.

# EXPLORATION

Explore the repo.

# IMPLEMENTATION

Use /tdd to complete the task.

# FEEDBACK LOOPS

Before committing, run the feedback loops:

- `npm run test` to run the tests
- `npm run typecheck` to run the type checker

# THE ISSUE

If the task is complete, move the issue file to `issues/done/`.

If the task is not complete, add a note to the issue file with what was done.

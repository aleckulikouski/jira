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
Also invoke /angular-developer for Angular specific tasks.

# FRONTEND

Components guidelines:
 - located in separate folders each
 - separate files for the html and styles
 - change Detection Strategy set to OnPush
 - all subscriptions should be cleaned up in a modern way using the `takeUntilDestroyed` with the `destroyRef` from `@angular/core`
 - templates should use modern @ syntax
 - components interact with the store only via facades, and never directly

# FEEDBACK LOOPS

Before committing, run the feedback loops:

- `npm run test` to run the tests
- `npm run typecheck` to run the type checker
- launch the app, with help of `chrome-devtools` MCP and check the implementation, check the console for errors and warnings, and check the network tab for any failed requests

# THE ISSUE

If the task is complete, start BE and FE with `npm run start` so I can check the implementation.

If the task is complete, move the issue file to `issues/done/`.

If the task is not complete, add a note to the issue file with what was done.

---
description: Load local project and environment context
---

Read the context file at `$ARGUMENTS`. Resolve `~` against the home directory and relative paths against the current project. If the path is missing or unreadable, stop and request a valid path.

Use its contents as ongoing session context and constraints. Do not execute unrelated tasks merely because they appear in the file. Confirm the loaded path and briefly summarize the important constraints.

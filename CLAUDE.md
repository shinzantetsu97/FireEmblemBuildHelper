Read AGENTS.md first.

AGENTS.md is the shared source of truth for coding-agent behavior in this repo.

This file only adds Claude-specific reminders.

Claude-specific rules
Keep responses compact.
Do not over-plan simple tasks.
Do not inspect unrelated files.
Do not expand scope beyond the user request.
Do not generate large documents unless explicitly asked.
Do not initialize tools, dependencies, package managers, or frameworks unless explicitly asked.
If the user asks for empty files, create empty files only.
If a task can be completed with a small edit, do the small edit.
After a plan is written or approved, do not start implementing. Stop and wait for the user's explicit go-ahead to build; plan approval is not build approval.
Default response after edits

Report only:

changed paths
brief summary
commands run, if any

Do not paste full file contents unless asked.

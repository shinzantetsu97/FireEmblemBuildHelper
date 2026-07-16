# Post-Verification Commit, Push, and Merge

Manual verification has passed for the current milestone.

Important:
Do not make feature changes in this step. Only handle git status, final checks, add, commit, push, and merge.

Task:
1. Show current branch name.
2. Show git status.
3. Confirm this is the expected feature branch for the milestone.
4. Show a concise changed-file summary:
   git diff --stat

5. Run final validation commands:
   - npm run typecheck
   - npm run dev

For npm run dev:
- Run it as a dry run.
- Confirm it starts successfully and prints the expected startup message.
- Stop the process after confirming it starts.
- If npm run dev is long-running, do not leave it running.
- If npm run dev fails, STOP and report the failure.

If this milestone touched database initialization, also run:
- npm run db:init

If this milestone touched the backend server, also run:
- npm run dev:server

For npm run dev:server:
- Run it as a dry run.
- Confirm the server starts successfully.
- If possible, verify the relevant endpoint, such as GET /api/health.
- Stop the server after confirming it works.
- If npm run dev:server fails, STOP and report the failure.

6. Stage the relevant changed files for this milestone.
   - Include source/config/package files changed by the milestone.
   - Include docs/codex-prompts files if they are part of the prompt archive for this milestone.
   - Do not stage unrelated files.
   - Do not stage local database files such as data/app.db.

7. Create a clear commit message.
8. Push the feature branch to origin.
9. Switch to main:
   git switch main
10. Pull latest main:
   git pull origin main
11. Merge the feature branch into main.
12. Push main to origin.
13. Show final git status.

Use a commit message appropriate to the milestone, for example:
- chore: add SQLite notes initialization
- chore: add backend server skeleton
- feat: add notes repository
- feat: add notes API routes

Do not:
- Modify code.
- Add new implementation work.
- Add files that were not part of the verified milestone.
- Stage unrelated files.
- Stage local SQLite database files.
- Delete branches unless I explicitly ask.

If there are merge conflicts, STOP and ask me what to do.
If main has diverged or git pull fails, STOP and ask me what to do.
If validation checks fail, STOP and report the failure.
If there are unexpected changed files, STOP and ask me what to do.

After completing, STOP and report:
- Branch merged
- Commit hash
- Files committed
- Commands run
- Whether each command passed
- Final git status
- Any issues or uncertainties

After STOP and report, ask whether the user wants to prune the merged feature branch.

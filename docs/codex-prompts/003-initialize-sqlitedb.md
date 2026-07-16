# Milestone 2 - SQLite DB Init for Profile Notes

> **Historical archive:** This prompt records an earlier local-backend exploration. The current public architecture is a static React site with browser-local IndexedDB; do not use this prompt as a current implementation plan. It is retained for project history.

We are working on FireEmblemBuildHelper, a Fire Emblem planning project. The first supported game target will be Fire Emblem Fates / Fire Emblem if / FE14.

Important working style:
Complete ONLY Milestone 2. After finishing, STOP and report results. Do not proceed to server skeleton, API routes, frontend, spreadsheet parsing, auth, or Fire Emblem rules.

Branch workflow:
Before making code changes:
1. Make sure the working tree has no uncommitted changes outside docs/codex-prompts/.
2. Switch to main:
   git switch main
3. Pull the latest main:
   git pull origin main
4. Create a new branch named:
   feature/db-init-notes
5. Switch to that new branch:
   git switch feature/db-init-notes
6. Confirm the current branch is feature/db-init-notes before making changes.

It is acceptable to use:
git switch -c feature/db-init-notes
as long as the final current branch is feature/db-init-notes.

If the branch already exists, STOP and ask me what to do.
If the working tree has uncommitted changes outside docs/codex-prompts/, STOP and ask me what to do.

Milestone 2 goal:
Create an idempotent SQLite database initialization script for profiles and notes.

Current project already has backend dependencies installed:
- express
- better-sqlite3
- zod
- @types/express
- @types/better-sqlite3

Do not add new dependencies in this milestone unless absolutely necessary. If you believe a new dependency is required, STOP and explain why before adding it.

Do not change dependencies or devDependencies in package.json in this milestone.

Database path:
data/app.db

Create the scripts/ folder if it does not already exist.

Create a script:
scripts/init-db.ts

Add npm script to package.json:
"db:init": "tsx scripts/init-db.ts"

Do not modify package.json in any other way.

Ensure data/app.db is not tracked by git. If .gitignore already covers *.db or data/app.db, leave it. Otherwise update .gitignore to ignore local SQLite database files.

Create tables if they do not exist:

profiles:
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL

notes:
- id TEXT PRIMARY KEY
- profile_id TEXT NOT NULL
- title TEXT
- content TEXT NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE

Rationale:
- profiles represents a user's planning workspace.
- notes belongs to profiles.
- Do not create a seed_data table.
- Do not create a users table yet.
- Auth is intentionally out of scope for this milestone.
- Later, profiles may belong to authenticated users, but not yet.

Idempotency requirements:
- Use CREATE TABLE IF NOT EXISTS.
- Enable SQLite foreign keys with PRAGMA foreign_keys = ON.
- Wrap schema creation and seed inserts in a transaction.
- Use stable fixed IDs for seed rows.
- Use INSERT OR IGNORE for seed rows.
- db:init must not drop existing tables.
- db:init must not delete user data.
- Running npm run db:init multiple times must not duplicate notes.

Timestamp requirements:
- Use a consistent timestamp format for created_at and updated_at.
- Prefer new Date().toISOString().

Seed local development profile:
- id: profile_1
- name: Default Profile

Seed local development notes:
1.
id: note_seed_1
title: 贪得无厌
content: 我在做贪得无厌的事情

2.
id: note_seed_2
title: 非常滴珍贵
content: 这个火纹project啊他非常滴珍贵

3.
id: note_seed_3
title: 保熟吗
content: 你这应用他保熟吗？

4.
id: note_seed_4
title: 劈应用
content: 你TMD劈我应用是吧（被捅）

Important:
These seed notes are local development sanity-check data only. Do not design them as production onboarding data for future users.

After db:init completes, print a short summary showing:
- number of profiles
- number of notes for profile_1

Expected summary after running db:init once:
- profiles: 1
- notes for profile_1: 4

Expected summary after running db:init twice:
- profiles: 1
- notes for profile_1: 4

Do not:
- Create API routes yet.
- Create server skeleton yet unless absolutely necessary.
- Create frontend code yet.
- Add auth.
- Parse spreadsheets.
- Add Fire Emblem rules.
- Add new dependencies unless you stop and ask first.
- Change package.json except for adding the db:init script.
- Commit, push, or merge.

Acceptance criteria:
- npm run typecheck passes.
- npm run db:init succeeds.
- Running npm run db:init twice succeeds and does not duplicate notes.
- data/app.db is created.
- data/app.db is ignored by git.
- package.json only changes by adding the db:init script, unless there is a clearly justified reason.
- package.json dependencies and devDependencies do not change.
- The db:init summary shows exactly 1 profile and exactly 4 notes for profile_1 after repeated runs.

After completing Milestone 2, STOP and report:
- Current branch name
- Files created or modified
- package.json changes, if any
- .gitignore changes, if any
- Commands run
- Whether each command passed
- The db:init summary output after first run
- The db:init summary output after second run
- How idempotency is handled
- Any assumptions made
- Any issues or uncertainties

Do not commit, push, or merge yet. I will manually verify first.

---

## Execution Notes So Far

- The first attempt to execute this prompt stopped because the working tree had an untracked `docs/codex-prompts/003-initialize-sqlitedb.md` file. The prompt wording was updated to allow uncommitted changes under `docs/codex-prompts/` while still stopping for uncommitted changes elsewhere.
- During execution, the branch workflow completed successfully and work continued on `feature/db-init-notes`.
- `npm run typecheck` passed.
- `npm run db:init` passed once and printed `profiles: 1` and `notes for profile_1: 4`.
- `npm run db:init` passed a second time and printed `profiles: 1` and `notes for profile_1: 4`, confirming seed rows were not duplicated.
- `data/app.db` was created.
- Verification that `data/app.db` is ignored by Git was attempted with `git check-ignore`, but the Git verification command was rejected by the user before completion.
- User discovered that the Chinese seed title/content strings were not preserved correctly in `scripts/init-db.ts`; they appeared as mojibake/gibberish, while the prompt file itself displays the intended Chinese text correctly. The likely cause is UTF-8 Chinese text being copied from an earlier garbled command-output rendering.
- Because `db:init` uses `INSERT OR IGNORE`, fixing the script text alone will not update already-inserted seed rows in the existing local `data/app.db`.
- User approved the clean fix: replace the mojibake strings in `scripts/init-db.ts` with the intended Chinese text, remove the generated local `data/app.db`, and rerun `npm run db:init` twice.
- After the clean fix, both `npm run db:init` runs printed `profiles: 1` and `notes for profile_1: 4`.
- `npm run typecheck` passed again after the seed text fix.
- A direct SQLite readback confirmed the corrected seed note text was stored, including `note_seed_4` with title `劈应用` and content `你TMD劈我应用是吧（被捅）`.
- `git check-ignore -v data/app.db` was rerun successfully after the clean fix and confirmed `.gitignore` ignores the generated database via `*.db`.

---

## Results

Completed Milestone 2.

Branch workflow:
- Started from `main`.
- Pulled latest `main` from `origin`.
- Created and worked on `feature/db-init-notes`.
- After user verification, committed the feature branch and merged it back into `main`.
- Final merged commit: `eebad1c feat: initialize SQLite notes database`.
- `main` was pushed to `origin`.

Files created:
- `scripts/init-db.ts`
- `docs/codex-prompts/003-initialize-sqlitedb.md`
- `docs/codex-prompts/templates/post-verification-commit-merge.md`

Files modified:
- `package.json`

Generated local files:
- `data/app.db` was created by `npm run db:init`.
- `data/app.db` is ignored by Git via the existing `*.db` rule in `.gitignore`.

`package.json` changes:
- Added the `db:init` script:
  - `tsx scripts/init-db.ts`
- No dependencies or devDependencies were changed.

`.gitignore` changes:
- None.
- Existing `*.db` rule already covers `data/app.db`.

Database schema created:
- `profiles`
- `notes`

Seed data created:
- One local development profile:
  - `profile_1`
  - `Default Profile`
- Four local development notes for `profile_1`.

Commands run:
- `git switch main` passed.
- `git pull origin main` passed.
- `git switch -c feature/db-init-notes` passed.
- `npm run typecheck` passed.
- `npm run db:init` passed.
- `npm run db:init` passed a second time.
- `npm run dev` passed during post-verification.
- `git check-ignore -v data/app.db` passed.
- Direct SQLite readback with `better-sqlite3` passed.
- `git add ...` passed.
- `git commit -m "feat: initialize SQLite notes database"` passed.
- `git push -u origin feature/db-init-notes` passed.
- `git switch main` passed.
- `git pull origin main` passed.
- `git merge feature/db-init-notes` passed as a fast-forward.
- `npm run typecheck` passed again on `main`.
- `npm run dev` passed again on `main`.
- `npm run db:init` passed again on `main`.
- `git push origin main` passed.

Final `db:init` summary:
- `profiles: 1`
- `notes for profile_1: 4`

Idempotency:
- Uses `CREATE TABLE IF NOT EXISTS`.
- Enables SQLite foreign keys with `PRAGMA foreign_keys = ON`.
- Wraps schema creation and seed inserts in a transaction.
- Uses stable fixed IDs for seed rows.
- Uses `INSERT OR IGNORE` for seed rows.
- Does not drop existing tables.
- Does not delete user data.
- Running `npm run db:init` repeatedly does not duplicate notes.

Assumptions:
- `data/app.db` is local development data and should remain ignored.
- Seed notes are local sanity-check data only, not production onboarding data.
- The local generated database could be regenerated during development after the encoding issue was found.

Issues / uncertainties:
- The first execution attempt stopped because the prompt file itself was untracked; the prompt was updated to allow uncommitted changes under `docs/codex-prompts/`.
- The initial seed note strings copied into `scripts/init-db.ts` were mojibake. User noticed this, the script was corrected, and `data/app.db` was regenerated.
- The feature branch was merged but not pruned.

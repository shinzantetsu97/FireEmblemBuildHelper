Create a minimal Node.js + TypeScript project for a future Fire Emblem planning app.

Important working style:
Work in small milestones. For this task, complete ONLY Milestone 1. After Milestone 1 is complete, STOP and report what you changed. Do not proceed to spreadsheet parsing, SQLite, backend APIs, or React.

Project context:
This project is called FireEmblemBuildHelper. It is intended to become a Fire Emblem planning tool. The first supported game target will be Fire Emblem Fates, also known as Fire Emblem if / FE if / FE14. Later, the project may support other Fire Emblem games, but do not design for every game yet.

Milestone 1 goal:
Set up a clean Node.js + TypeScript project that can run a simple TypeScript entry script.

Create this structure:

FireEmblemBuildHelper/
  src/
    index.ts
  data/
    raw/
    seed/
    reports/
  package.json
  tsconfig.json
  README.md
  .gitignore

Dependencies/dev dependencies:
- typescript
- tsx

Do not install xlsx, zod, SQLite, React, Express, Fastify, or any other libraries yet.

package.json requirements:
- Set the package name to something appropriate, such as "fire-emblem-build-helper".
- Add script:
  "dev": "tsx src/index.ts"
- Add script:
  "typecheck": "tsc --noEmit"

src/index.ts:
- Print a simple startup message:
  "FireEmblemBuildHelper project is running."

README.md:
Briefly explain:
- FireEmblemBuildHelper is a Fire Emblem planning project.
- The first stage of the project is to support Fire Emblem Fates / Fire Emblem if / FE14.
- The project may later support build planning, run planning, character notes, and spreadsheet-based seed data.
- Current milestone is only Node + TypeScript project setup.
- data/raw will later hold source files such as spreadsheets and documents.
- data/seed will later hold generated seed JSON.
- data/reports will later hold parser/validation reports.

.gitignore:
Include at least:
- node_modules
- dist
- .env
- *.log
- *.sqlite
- *.db
- .DS_Store

Do not:
- Parse the spreadsheet yet.
- Add placeholder parser scripts yet.
- Add SQLite yet.
- Add backend API yet.
- Add frontend/React yet.
- Add auth yet.
- Infer Fire Emblem rules yet.
- Over-generalize for every Fire Emblem game yet.

Acceptance criteria:
- npm install works.
- npm run dev prints "FireEmblemBuildHelper project is running."
- npm run typecheck passes.
- Folder structure exists as described.

After completing Milestone 1, STOP and report:
- Files created or modified
- Commands run
- Whether each command passed
- Any assumptions made
- Any issues or uncertainties

---

## Results

Completed Milestone 1.

Files created:
- `src/index.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `README.md`
- `.gitignore`

Folders created:
- `src`
- `data/raw`
- `data/seed`
- `data/reports`

Additional repo-readiness files created:
- `data/raw/.gitkeep`
- `data/seed/.gitkeep`
- `data/reports/.gitkeep`

Commands run:
- `Get-Content -Raw -LiteralPath prompt.txt` passed.
- `Get-ChildItem -Force` passed.
- `git status --short` failed because `git` was not installed or not on PATH at the time.
- `rg --files` passed.
- `New-Item -ItemType Directory -Force -Path src,data\raw,data\seed,data\reports` passed.
- `npm install` first attempt timed out in the restricted sandbox.
- `npm install` with registry access passed.
- `npm run dev` passed and printed `FireEmblemBuildHelper project is running.`
- `npm run typecheck` passed.

Assumptions:
- Used `fire-emblem-build-helper` as the package name.
- Used a minimal modern TypeScript config with `NodeNext` module settings.
- Kept dependencies limited to `typescript` and `tsx`.

Issues / uncertainties:
- Git was not installed or not on PATH during initial project setup.
- After this milestone, the user chose to install Git and connect this folder to their own GitHub repository.
- No spreadsheet parsing, SQLite, backend, React, auth, or Fire Emblem rules were added.

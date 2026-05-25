# Milestone 1 - Backend Dependency Setup

## Notes / Prompt Revision History

The earlier version of this prompt asked Codex to install backend dependencies directly.

That is less ideal because it can make dependency changes harder to review. For this project, dependency changes should be explicit and auditable.

Updated approach:
- First update package.json intentionally with the exact dependencies/devDependencies needed.
- Then run npm install.
- Then run validation commands.
- Report package.json and package-lock.json changes.

This makes the dependency list easier to review before moving to the next milestone.

---

We are working on FireEmblemBuildHelper, a Fire Emblem planning project. The first supported game target will be Fire Emblem Fates / Fire Emblem if / FE14.

Important working style:
Complete ONLY Milestone 1. After finishing, STOP and report results. Do not proceed to database setup, API routes, frontend, spreadsheet parsing, auth, or Fire Emblem rules.

Milestone 1 goal:
Prepare the minimal backend dependency setup for a small TypeScript REST API with SQLite and Zod.

Current project already has:
- Node.js
- TypeScript
- tsx
- package.json
- tsconfig.json
- src/index.ts
- npm scripts such as dev and typecheck

Task:
Update package.json with the minimal dependencies needed for the upcoming notes backend, then run npm install.

Before changing package.json, briefly state which dependencies you plan to add and why.

Expected dependencies:

dependencies:
- express
- better-sqlite3
- zod

devDependencies:
- @types/express
- @types/better-sqlite3

Rationale:
- express: simple REST API framework
- better-sqlite3: lightweight local SQLite access for Node.js
- zod: runtime validation for API request bodies
- @types/express: TypeScript types for Express
- @types/better-sqlite3: TypeScript types for better-sqlite3

Do not add unrelated libraries.
Do not add:
- React
- Vite
- frontend libraries
- SQLite ORMs
- auth libraries
- GraphQL
- spreadsheet parsing libraries
- testing frameworks
- logging frameworks
- validation libraries other than Zod

package.json requirements:
- Keep existing scripts working.
- Keep existing "dev" script.
- Keep existing "typecheck" script.
- Do not add db:init yet.
- Do not add dev:server yet unless a server entry file already exists.
- Do not create a server entry file in this milestone.

Commands to run after editing package.json:
- npm install
- npm run typecheck
- npm run dev

Acceptance criteria:
- package.json explicitly lists the backend dependencies/devDependencies above.
- npm install succeeds.
- package-lock.json is updated.
- npm run typecheck passes.
- Existing npm run dev still works.
- No database files are created.
- No API routes are created.
- No frontend files are created.

Do not:
- Create database tables yet.
- Create SQLite database file yet.
- Create API endpoints yet.
- Create frontend code yet.
- Parse spreadsheets yet.
- Add auth.
- Add Fire Emblem rules.

After completing Milestone 1, STOP and report:
- Dependencies added
- Files modified
- package.json changes
- package-lock.json changes
- Commands run
- Whether each command passed
- Any assumptions made
- Any issues or uncertainties

---

## Results

Completed Milestone 1.

Dependencies added:
- `express`
- `better-sqlite3`
- `zod`

Dev dependencies added:
- `@types/express`
- `@types/better-sqlite3`

Files modified:
- `package.json`
- `package-lock.json`

`package.json` changes:
- Added runtime dependencies:
  - `better-sqlite3`: `^11.9.1`
  - `express`: `^4.18.2`
  - `zod`: `^3.24.2`
- Added dev dependencies:
  - `@types/better-sqlite3`: `^7.6.12`
  - `@types/express`: `^4.17.21`
- Preserved existing scripts:
  - `dev`
  - `typecheck`
- Did not add `dev:server` or `db:init`.

`package-lock.json` changes:
- Updated by `npm install`.
- Added lockfile entries for the backend dependencies and their transitive packages.

Commands run:
- `Get-Content -Raw docs\codex-prompts\002-install-backend-dependencies.md` passed.
- `npm install` passed.
- `npm run typecheck` passed.
- `npm run dev` passed and printed `FireEmblemBuildHelper project is running.`
- Git status/diff inspection passed.

Assumptions:
- Used Express as the REST framework.
- Used `better-sqlite3` as the lightweight Node SQLite package.
- Did not add `@types/node` because the updated prompt listed only `@types/express` and `@types/better-sqlite3`.

Issues / uncertainties:
- `npm install` emitted a deprecation warning for transitive package `prebuild-install@7.1.3`, but install completed and found `0 vulnerabilities`.
- No database files, API routes, frontend files, auth, spreadsheet parsing, or Fire Emblem rules were created.

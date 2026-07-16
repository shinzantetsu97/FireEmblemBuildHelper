# Milestone 3 - React Browser-Local Notes Workspace

We are working on FireEmblemBuildHelper, a Fire Emblem planning project. Fire Emblem Fates / Fire Emblem if / FE14 is the first supported game.

## Important Working Style

Complete only this milestone. After finishing, stop and report the results. Do not proceed to Fates spreadsheet parsing, game-data views, build planning, run planning, pairings, child inheritance, combat simulation, authentication, cloud sync, or hosted backend work.

Read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/PRODUCT.md`, and `docs/ROADMAP.md` before editing.

The product is web-first and static-site capable. Public player-created data must live in browser-local IndexedDB, not in the existing SQLite development database or a hosted API.

## Branch Workflow

Before making code or dependency changes:

1. Inspect the working tree with `git status --short`.
2. Ask the user whether this milestone should use a new branch, unless they have already explicitly named or approved a branch for it in the current conversation.
3. Do not switch branches, pull, merge, commit, or push unless the user explicitly asks.

If the user chooses a branch, preserve all existing uncommitted changes and follow their direction. Do not reset, stash, or revert unrelated work.

## Goal

Create the first usable public-app slice: a React notes workspace that runs as a static web application, saves notes in browser-local IndexedDB, persists after reload, warns visibly about browser-data loss, and lets the user export and import backups.

This is a notes workspace, not yet a Fates planner. It proves the frontend, browser persistence, backup model, and interaction patterns that later run-plan features will use.

## Approved Frontend Stack

Use only the agreed frontend stack:

- React with TypeScript;
- Vite;
- React-Bootstrap and Bootstrap;
- Lucide React;
- `idb` as the IndexedDB wrapper;
- regular CSS files and CSS custom properties.

Do not use Angular, Tailwind, Material UI, Chakra, Sass, CSS-in-JS, another component toolkit, a state-management library, a routing library, a hosted API, or a browser-storage replacement.

The existing `better-sqlite3`, Express, and Zod dependencies are development/data-tooling leftovers from an earlier local-backend direction. Do not remove them in this milestone. Do not add API routes or make the public frontend depend on them.

## Dependency Setup

Before changing `package.json`, state the exact dependencies and why each is needed. The expected additions are:

Runtime dependencies:

- `react`
- `react-dom`
- `react-bootstrap`
- `bootstrap`
- `lucide-react`
- `idb`

Development dependencies:

- `vite`
- `@vitejs/plugin-react`
- `@types/react`
- `@types/react-dom`

Update `package.json` intentionally, then run `npm install`. Keep the existing `db:init` script. Replace the current `dev` command with Vite's development command and add `build` and `preview` commands. Keep `typecheck` working for the frontend source.

## Application Structure

Create only the files needed for this milestone. A reasonable structure is:

```text
index.html
vite.config.ts
src/
  main.tsx
  App.tsx
  app.css
  storage.ts
  types.ts
```

Small additional components or helpers are acceptable when they make the notes UI clearer. Do not introduce folders or abstractions for future Fates entities that this milestone does not use.

Update TypeScript configuration for a React browser application, including DOM types and Vite client types. Keep source typechecking separate from generated output and dependency folders.

## Browser Data Model

Use an IndexedDB database with an explicit database version. The database must contain enough structure for:

- a default local workspace;
- notes owned by a workspace;
- metadata, including when a workspace was last exported.

Use stable IDs generated in the browser and ISO timestamps for created and updated times. A note has, at minimum:

```text
id
workspaceId
title
content
createdAt
updatedAt
```

The first launch should create a default workspace automatically. Do not require sign-up, profile creation, or any network request.

The storage code must be isolated from React components so later run-plan records can use the same persistence boundary.

## Notes Workspace UI

Build a focused, responsive notes workspace using React-Bootstrap primitives and a small project CSS layer.

Required behavior:

- Show the default workspace and its notes.
- Create a note with a title and content.
- Edit a note's title and content.
- Delete a note only after confirmation.
- Persist note changes immediately to IndexedDB.
- Reloading the page preserves the workspace and notes.
- Handle a loading state and a storage error state without silently losing edits.

Required controls and interaction rules:

- Use familiar Lucide icons for edit, delete, import, and export actions, with tooltips for icon-only controls.
- Use labeled text buttons only for clear commands such as creating a note or downloading a backup.
- Use a modal or side panel for note editing; do not create nested card layouts.
- Keep controls compact and stable on desktop and mobile.
- Do not add non-functional navigation items, fake pages, or “coming soon” screens.

## Browser-Data Warning

Display a prominent, persistent warning in the workspace. It must communicate that plans are saved only in this browser and may be lost if site data is cleared, private browsing is used, or the user changes browsers or devices.

The warning must include an obvious backup action. Do not make it a one-time dismissible onboarding message.

## Backup and Readable Export

Provide two distinct exports for the active workspace:

1. A versioned JSON backup, for example `fire-emblem-build-helper-backup.json`.
2. A human-readable text summary, for example `fire-emblem-build-helper-notes.txt`.

The JSON backup must include a format identifier, format version, export timestamp, workspace record, notes, and enough metadata for a future migration. JSON is the only import format.

The text summary must be easy to read in a normal text editor. It should identify the workspace and export date, then list each note with its title, content, and relevant timestamps. It is not an import format.

Implement JSON import with these requirements:

- Validate the format identifier, version, workspace, and note shape before writing data.
- Reject unsupported or malformed files with a clear in-app error.
- Never overwrite existing notes during import.
- Import into a new restored workspace with a clear restored name and fresh internal IDs when necessary.
- Update the UI to show the restored workspace after import.

After a successful JSON export, persist and display the workspace's last-exported timestamp.

## Styling

Import Bootstrap's local package CSS. Add a regular application stylesheet that defines a restrained project token layer using CSS custom properties and selectively overrides Bootstrap variables.

The result should feel like a focused planning tool: dense enough for repeated note-taking, readable for long-form content, and distinct from untouched Bootstrap defaults. Avoid decorative landing-page composition, gradients, excessive cards, and placeholder game art.

## README

Update `README.md` so it accurately describes the current frontend milestone and how to run the development server. Do not describe unsupported Fates planner features as implemented.

## Verification

Run the narrowest relevant commands after implementation:

- `npm install`
- `npm run typecheck`
- `npm run build`

Start the Vite development server and test the app in a browser. Verify all of the following manually:

1. The workspace loads without a network or backend dependency.
2. The browser-data warning and backup action are visible.
3. A note can be created, edited, and deleted with confirmation.
4. A created or edited note remains after a page reload.
5. JSON and text exports download with useful content.
6. A valid JSON backup imports into a new restored workspace without overwriting existing notes.
7. An invalid JSON file produces a visible error and does not change stored notes.
8. The notes workspace is usable at desktop and mobile widths.

Do not use the existing SQLite database as part of this verification. Do not modify `scripts/init-db.ts` unless there is a compiler-config problem that cannot be solved otherwise; explain any such change before making it.

## Acceptance Criteria

- The project runs as a Vite React application.
- The notes workspace is fully functional using browser-local IndexedDB.
- No public-user action requires Express, SQLite, a server, an account, or a network request.
- Browser-data-loss warning remains visible and includes backup access.
- JSON backup/import is versioned, validated, and non-destructive.
- Text export is readable and clearly not an import format.
- `npm run typecheck` and `npm run build` pass.
- The browser interaction checks above pass.
- Existing unrelated files and user changes remain intact.

After completing the milestone, stop and report:

- branch and working-tree status;
- dependencies added and why;
- files created or modified;
- browser data model and import/export format;
- commands run and whether they passed;
- browser behaviors verified;
- assumptions, limitations, and follow-up work.

Do not commit, push, or merge unless the user explicitly asks.

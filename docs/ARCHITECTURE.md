# Architecture

## Current Architecture

FireEmblemBuildHelper is a web-first TypeScript application. The public product is intended to run as a static website, without a hosted backend, user accounts, or a runtime API. The frontend uses React and Vite.

The repository currently includes Node.js, SQLite through `better-sqlite3`, Express, and Zod from the initial local-backend exploration. Those tools may remain useful for development, data import, validation, and local administration, but they are not the persistence contract for public users.

## Static Hosting

GitHub Pages is the initial public hosting target. A GitHub Actions workflow builds the Vite application and deploys the generated `dist/` artifact when changes reach `main`.

The default project-site address is `https://shinzantetsu97.github.io/FireEmblemBuildHelper/`. Production builds use that repository path as their Vite base; local development continues to run from `/`.

A custom domain may replace the default address later. It requires a domain the project controls plus GitHub Pages and DNS configuration, but does not require a hosted application backend.

## Frontend Stack

The initial frontend stack is:

- React with TypeScript for the application UI;
- Vite for local development and static production builds;
- React-Bootstrap and Bootstrap for accessible, responsive UI primitives;
- Lucide React for familiar action icons;
- regular CSS files with CSS custom properties for the project visual system;
- `idb` as the small IndexedDB wrapper for browser-local user data.

Bootstrap is the only component toolkit. Project CSS may tune Bootstrap variables and add application-specific styling, but the app will not add a second component system, Tailwind, Sass, or CSS-in-JS unless a later need justifies it.

The first supported ruleset is Fire Emblem Fates / Fire Emblem if / FE14. Game data and game-specific calculations will be introduced separately from player-created planning data.

## Browser-Local Persistence

### Decision

IndexedDB is the canonical store for player-created data in the public web application. A user's plans live in that browser's site storage on that device.

The application has no hosted backend, online account, authentication, cloud synchronization, or multi-device collaboration in Phase 1. A local profile represents a planning workspace in that browser, not a verified identity.

`data/app.db` is a development-only SQLite database. It is not a public user's saved-plan database and remains intentionally ignored by Git.

### Ownership Model

The initial ownership chain is:

```text
browser on one device
  -> profile
    -> notes
    -> projects / run plans
      -> build plans
      -> future game-specific planning records
```

`profile_1` is the seeded development-database profile. The first user-facing flow may present a default workspace rather than asking a solo browser user to create an account.

A profile may own multiple saved projects or run plans. A project/run plan belongs to one game and captures campaign-level choices such as route and difficulty. Build plans will belong to a project/run plan when that feature is introduced.

### Data Boundaries

Browser-local storage holds user-created and user-edited state:

- profiles;
- notes;
- projects and run plans;
- build plans and ordered build steps;
- local planning choices, statuses, and annotations.

Curated game data follows a separate build and distribution path:

```text
raw source files -> normalized seed data -> validation reports -> runtime game data
```

Raw sources, normalized seed files, validation reports, and generated runtime data must not be conflated with user plans. The public site will ship only the runtime data it needs; the exact build process will be decided during the Fates data-foundation phase.

### Data Protection and Portability

Clearing browser site data, using private browsing, changing browsers, or switching devices can remove access to browser-local plans. The user interface must make this risk highly visible and explain that export is the user's backup mechanism.

Export and import of a versioned JSON run-plan format are Phase 1 requirements for any publicly usable planning workflow. A backup must contain the player's created planning data and enough version metadata to validate or migrate it in a later app version.

The app should also offer a separate, human-readable text export of a run plan. It is a reference summary for the player, not a backup or import format. This keeps restoration reliable for the application while giving non-technical players a file they can open and read without inspecting JSON. A richer document or print export can be considered once run plans contain enough detail to benefit from it.

Browser-storage schema changes must preserve accessible plans where possible. The frontend should use explicit versioning and migration logic before public plan data exists.

### Deferred Capabilities

The following are intentionally outside the initial persistence design:

- sign-in and authenticated users;
- cloud backups or synchronization;
- concurrent multi-user editing;
- sharing through a central service;
- a hosted API for player-created data.

Sharing can later build on the exported project format without adding a hosted database.

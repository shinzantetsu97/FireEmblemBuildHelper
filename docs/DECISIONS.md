# Decisions

## 2026-07-17: Run Plans Own Persistent Unit Configurations

**Status:** Accepted

Interactive unit-page choices are future build data, not disposable presentation state. Corrin's gender, boon, bane, and Talent; an offspring unit's variable parent; planned support pairings; and later class or skill choices must be able to survive page navigation, opening the unit JSON inspector, browser reloads, and switching between units.

IndexedDB remains the canonical public-app store. A profile owns one or more projects or run plans, and each run plan owns its unit configurations. Configurations will reference curated game concepts by stable IDs rather than copying display names or entire game-data records. Values calculated from a configuration should normally be resolved from the current curated data at read time rather than stored as duplicated facts.

The implementation may use in-memory React state as a working cache, but that cache is not the persistence contract. URL parameters may later support links to particular views, and `localStorage` may hold small interface preferences, but neither replaces IndexedDB for saved builds. No new frontend state-management dependency is selected by this decision.

Two different JSON purposes must remain explicit:

- **Unit JSON inspection/export** exposes the read-only curated record for auditing and developer-friendly reference. It should use compact actions on the unit page instead of occupying a permanent page tab.
- **Run-plan JSON export/import** is the versioned backup and restore format for player-created profiles, configurations, notes, and builds.

Both formats require an explicit schema version, but importing a curated unit record must never overwrite a player's saved run plan. IndexedDB schema migrations and exported run-plan migrations must be tested before persisted unit configurations are considered stable.

See the Phase 3 mini-refactor and Phase 4 planner sections in [ROADMAP.md](ROADMAP.md).

## 2026-07-14: Browser-Local Persistence for the Public App

**Status:** Accepted

FireEmblemBuildHelper will be a static, web-first application without a hosted backend for player-created data. IndexedDB will be the canonical store for player-created data in the public app.

A browser-local profile is a planning workspace, not an authenticated account. Each profile may own multiple saved projects or run plans; those plans will later own build plans and other game-specific planning records.

Because browser storage can be cleared and does not synchronize across devices, JSON import and export of versioned run-plan data are required for a publicly usable planning workflow. The interface must make the risk of clearing site data highly visible.

The app will also offer a separate human-readable text export. That file is for reading and reference; JSON remains the only supported restore format. This prevents a pleasant-looking summary from becoming an unreliable source of application state.

The existing SQLite setup remains development tooling. Authentication, cloud synchronization, collaboration, and a hosted API are deferred.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the ownership model and data boundaries.

## 2026-07-14: React and Bootstrap Frontend

**Status:** Accepted

The public frontend will use React with TypeScript and Vite. React-Bootstrap and Bootstrap will supply the initial responsive, accessible UI primitives; Lucide React will supply familiar action icons.

Styling will use regular CSS files and CSS custom properties, including Bootstrap's CSS variables. This permits a distinctive Fire Emblem planner visual system without adding Sass or CSS-in-JS at the outset.

The application will not use Angular, Tailwind, Material UI, Chakra, or another component toolkit alongside React-Bootstrap. `idb` is the selected small wrapper around IndexedDB for browser-local user data.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the stack's role in the public static-site architecture.

## 2026-07-14: GitHub Pages Static Hosting

**Status:** Accepted

The initial public deployment target is GitHub Pages. GitHub Actions will build the Vite app and deploy its `dist/` output from `main`.

The initial public address uses GitHub Pages' project-site form: `https://shinzantetsu97.github.io/FireEmblemBuildHelper/`. The production Vite base path is configured for that address. A custom domain can be introduced later without adding an application backend.

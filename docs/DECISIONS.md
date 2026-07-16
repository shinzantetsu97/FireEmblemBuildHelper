# Decisions

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

# FE6 Data Viewer Frontend Plan

## Purpose

Build the first public FE6 frontend as a small, read-only reference viewer backed by the checked-in FE6 runtime JSON.

The viewer should feel like the existing FE14 pages while remaining faithful to FE6. It will provide:

- a searchable unit directory and unit detail pages;
- a class directory and class detail pages;
- one tabbed weapon and item directory;
- local, provenance-tracked FE6 character portraits;
- direct, GitHub Pages-safe routes and read-only JSON inspection.

This plan covers frontend implementation and the character-portrait asset step needed by that frontend. The curated FE6 pipeline and its generated runtime JSON are the input contract; the browser must not scrape Serenes Forest or Fandom.

## Product Boundary

This milestone is a data viewer, not an FE6 planner.

In scope:

- the 54 playable story units already present in `data/runtime/fe6/units.json`;
- all 67 normalized FE6 class records, visibly distinguished by tier and usage;
- all 93 weapons and staves plus 34 items in `data/runtime/fe6/weapons-items.json`;
- English display names adjusted to the project's fan-translation / Fire Emblem Heroes naming policy;
- Japanese names, romanizations, and aliases where the runtime record provides them;
- source provenance and read-only JSON views;
- English and Simplified Chinese application chrome using the existing locale fallback behavior.

Out of scope:

- Trial Map-only units;
- bosses or NPC character pages;
- support conversations, support growth, or pair-building controls;
- class skills, reclassing, children, inheritance, or FE14 route controls;
- growth simulation, combat forecasting, inventory editing, or run planning;
- weapon/item detail routes;
- live source requests, a backend, or new frontend dependencies.

## Existing Contracts to Preserve

Follow the current FE14 conventions rather than forking the overall site design:

- centralize route parsing in `src/router.tsx` and page selection in `src/App.tsx`;
- let the shared header own game navigation and locale selection;
- use game-library cards as entry points from the home page;
- reuse the established Bootstrap container, heading, filter, card/table, and responsive patterns;
- give detail pages a back link, record header, Overview/JSON controls, and compact provenance;
- import game data statically from checked-in runtime JSON;
- bundle images locally and resolve them through a tested asset map;
- localize UI strings through `useLocale`, while curated names retain source-language fields;
- test components and routes with Vitest and Testing Library.

Extract a shared presentation primitive only when FE14 and FE6 mean the same thing. FE6 joins, class rules, stat labels, and data adapters belong under `src/games/fe6/`.

## Routes and Navigation

Add these public routes:

```text
/FE6                 -> /FE6/Units, or the same unit-directory view
/FE6/Units
/FE6/Units/:slug
/FE6/Classes
/FE6/Classes/:slug
/FE6/Weapons
```

Keep every existing FE14 URL unchanged.

Make shared directory/detail route shapes game-aware, for example with a `gameId: "fe14" | "fe6"` discriminant. FE14-only skill and personal-skill route kinds remain FE14-only. This prevents `unit-detail` and similar kinds from silently meaning FE14 as more games are added.

Navigation changes:

- add an FE6 game-library card linking to `/FE6/Units`;
- add an FE6 header menu with `Units`, `Classes`, and `Weapons & Items`;
- do not show Skills, Personal Skills, route, generation, or offspring links under FE6;
- derive the active game and section from the parsed route;
- preserve direct-load and browser back/forward behavior under the GitHub Pages base path.

Unknown FE6 unit or class slugs use the existing not-found presentation. A malformed FE6 URL must not fall through to an FE14 page.

## Frontend Data Boundary

Create an adapter such as `src/games/fe6/data.ts` that statically imports:

```text
data/runtime/fe6/units.json
data/runtime/fe6/classes.json
data/runtime/fe6/weapons-items.json
```

Expose typed, read-only collections and lookup helpers rather than making components traverse raw payloads directly. At minimum provide:

- canonically ordered unit, class, weapon, and item collections;
- unit and class lookup by stable ID and route slug;
- class-name and support-partner joins;
- search over English, Japanese, romanized, fan, official-Japanese, and alias names;
- display helpers for joins, weapon ranks, sources, range values, currency, and null/not-applicable states;
- exact conversion of affinity `bonusHalfUnits` into readable half-point values;
- selection of a recruitment/base-stat variant without mutating the curated record.

Do not infer new game facts in React components:

- Hard-mode records are rounded expected values, not fixed bases;
- label `power` as `Str/Mag` rather than guessing from the current class;
- keep zero, `null`, missing, unobtainable, and not applicable distinct;
- a source class has zero or one promotion target even when several source classes share a target;
- Heroes-adjusted English is the primary name, with older fan/source names retained as aliases.

## Character Portrait Assets

Use FE6 in-game character portraits for the unit directory and detail header. Do not use battle animations, Heroes artwork, or generated substitutes when a Binding Blade portrait is available.

First inventory the repository for an existing local portrait for each of the 54 runtime unit IDs. Fetch only missing files from the user-approved [Fandom FE6 character list](https://fireemblem.fandom.com/wiki/List_of_characters_in_Fire_Emblem:_The_Binding_Blade) and its character gallery/file pages.

The list is useful for roster discovery, while individual gallery pages distinguish Binding Blade portraits from artwork and battle sprites. Because Fandom may reject automated requests, acquisition must support a reviewed manual download without bypassing access controls.

Proposed layout:

```text
data/sources/fe6/character-portraits.json
scripts/data/fe6/fetch-character-portraits.ts
src/games/fe6/assets/character_portraits/
src/games/fe6/portraitAssets.ts
```

The manifest records, per unit:

```text
unitId
sourceListUrl
sourceGalleryOrFileUrl
sourceImageUrl
localFileName
mimeType
width
height
sha256
dateChecked
reviewStatus
rightsNote
```

Asset rules:

- use stable unit IDs for manifest identity;
- download the original portrait file when available, not a transient thumbnail;
- keep source-page attribution separate from ownership of the game image;
- reject HTML, challenge pages, zero-byte files, mismatched MIME types, and duplicate destinations;
- avoid runtime hotlinks;
- use `import.meta.glob` or an equally explicit Vite resolver and fail visibly for a missing portrait;
- validate that every in-scope unit resolves exactly once;
- render pixel art with stable dimensions and crisp image scaling;
- use localized character-name alt text on detail pages and empty alt text only when adjacent card text makes a thumbnail decorative.

If a portrait cannot be sourced confidently, stop for review rather than selecting similarly named FE7 art or substituting Heroes art.

## Unit Directory

Create a canonically ordered `/FE6/Units` page following the FE14 unit-card layout.

Each card shows:

- portrait;
- display-order number;
- primary English display name;
- starting class;
- recruitment chapter or concise multi-join label;
- a direct link to `/FE6/Units/:slug`.

Add one text search field matching all reviewed name fields and aliases. Do not copy FE14's route and generation filters: they have no equivalent meaning for this roster. Preserve runtime order when search is empty and relative canonical order in filtered results.

Provide a clear empty-search state, lazy-load portraits, and remain usable at phone widths without page-level horizontal scrolling.

## Unit Detail Page

Follow the FE14 detail shell:

- back link to the FE6 unit directory;
- portrait-led header with primary name, Japanese name, romanization, aliases, and compact recruitment/class facts;
- `Overview` and `JSON` controls;
- compact source references after player-facing facts.

The Overview contains exactly two top-level sections: `Character Profile` and `Supports`.

### Character Profile

Recruitment:

- show every chapter/route join and reviewed condition;
- keep alternatives together instead of duplicating the unit;
- when a recruitment option changes starting level, bases, or weapon ranks, let the reader choose the option and visibly update affected values;
- render Cath's repeated appearances, Percival's alternatives, Hugh's price condition, and Gonzalez's Chapter 10B override from data rather than hard-coded page prose.

Starting facts:

- starting class linked to its FE6 class page;
- starting level;
- constitution and movement;
- starting weapon levels grouped by weapon type.

Stat profile:

- one comparison table with rows `HP`, `Str/Mag`, `Skl`, `Spd`, `Lck`, `Def`, and `Res`;
- columns `Base`, `Growth`, `Base Class Cap`, and `Promoted Class Cap`;
- growth values shown as percentages;
- truthful not-applicable states for prepromoted and non-promoting units;
- optional Hard-mode snapshots only when present, labeled `Expected Hard-mode bases (rounded)`;
- no unlabeled mixing of fixed Normal bases and expected Hard bases.

Affinity:

- show the affinity name;
- show Attack, Defense, Accuracy, Avoid, Critical, and Critical Evade contributions;
- convert half-units exactly, so `1` renders as `0.5` and `5` as `2.5`;
- explain that this is one unit's affinity contribution, not a pair or rank total.

### Supports

Render one flat, canonically ordered list of support partners. Each partner links to its FE6 unit page and may include its portrait. Do not add tabs, romantic labels, conversation text, rank selectors, or FE14 pairing controls.

If no partners are listed, render an explicit empty state.

### JSON and Provenance

Reuse the FE14 read-only JSON explorer for the selected runtime record. Add `Export JSON` only if the existing browser download helper can be reused without creating a second export convention.

Collect and de-duplicate source references into a compact `Sources` section. The default profile must remain readable without opening JSON.

## Class Directory and Detail Page

Create `/FE6/Classes` with canonical ordering, text search, and filters for `All`, `Base`, `Promoted`, `Special`, `Enemy-only`, and `NPC-only`, matching the runtime `tier` values. Do not infer player availability from a class name.

Each directory entry shows:

- class name and gender variant where applicable;
- tier/group;
- usable weapon types;
- promotion target or `Does not promote`.

Create `/FE6/Classes/:slug` with the same detail shell and Overview/JSON convention. Its overview shows:

- class base stats;
- maximum stats;
- constitution and movement;
- usable weapons and base weapon ranks;
- promotion target;
- promotion stat, constitution, movement, and weapon-rank gains when present;
- reviewed notes and source references.

Do not render a Skills section. Multiple classes leading to Berserker appear as separate single-promotion relationships on their respective pages, not as a branching promotion tree.

## Weapon and Item Directory

Create one `/FE6/Weapons` page following the FE14 tabbed directory and responsive-table conventions.

Use this tab order:

1. Swords
2. Lances
3. Axes
4. Bows
5. Staves
6. Anima
7. Light
8. Dark
9. Items

Use fields appropriate to each category:

- combat weapons: Name, Rank, Rng, Wt, Mt, Hit, Crit, Uses, Worth, Effect;
- staves: Name, Rank, Rng, Uses, Worth, Staff EXP, Effect;
- items: Name, Uses, Worth, Effect.

Presentation rules:

- preserve formula and `All` staff ranges as authored display values;
- use an em dash only for verified not-applicable values, never for numeric zero;
- format numeric Worth consistently and distinguish unsold/unknown if introduced later;
- display availability flags such as unobtainable or Trial Map-only as text badges;
- distinguish the Torch staff and Torch item by category and stable ID;
- give abbreviated column headers accessible full labels;
- use responsive table containers or compact records on narrow screens;
- do not require weapon/item icons for this milestone, and do not invent or hotlink them.

## Localization and Naming

Add FE6 page chrome to the existing English and Simplified Chinese catalogs. English remains the key contract; Simplified Chinese keeps the existing English fallback.

Curated FE6 names are data, not interface-message keys:

- show runtime `names.en` as the default name;
- show Japanese and romanized names in the unit header when present;
- index fan names, official-Japanese names, and aliases for search;
- preserve UTF-8 and add `lang="ja"` to Japanese text;
- do not independently translate weapon, item, or class names in components.

## Responsive and Accessibility Requirements

- keep heading order and landmarks consistent with FE14 pages;
- associate every filter with a visible label;
- make cards, tabs, view controls, and back links keyboard operable with visible focus;
- use semantic tables with scoped headers;
- never convey tier, availability, or selected state by color alone;
- keep portrait dimensions stable to prevent layout shift;
- allow long recruitment conditions and aliases to wrap;
- avoid page-level horizontal overflow at phone, tablet, and desktop widths;
- preserve useful focus when switching tabs or Overview/JSON views.

## Proposed File Layout

```text
src/games/fe6/
  data.ts
  data.test.ts
  portraitAssets.ts
  portraitAssets.test.ts
  assets/character_portraits/
  components/
    Fe6UnitDirectory.tsx
    Fe6UnitDetail.tsx
    Fe6UnitOverview.tsx
    Fe6ClassDirectory.tsx
    Fe6ClassDetail.tsx
    Fe6WeaponItemDirectory.tsx
  pages/
    Fe6UnitIndexPage.tsx
    Fe6UnitDetailPage.tsx
    Fe6ClassIndexPage.tsx
    Fe6ClassDetailPage.tsx
    Fe6WeaponItemDirectoryPage.tsx
```

Exact splits may stay smaller when a file has only one caller. Update shared files only where necessary:

```text
src/router.tsx
src/App.tsx
src/App.test.tsx
src/components/AppHeader.tsx
src/components/home/GameLibrary.tsx
src/i18n/en.ts
src/i18n/zhHans.ts
src/styles/app.css
```

## Test Plan

### Data and assets

- runtime IDs are unique and every referenced class/support partner resolves;
- runtime order is preserved;
- all name fields and aliases participate in search;
- every story unit has exactly one valid local portrait manifest entry;
- asset resolution rejects missing files and remote runtime URLs;
- affinity half-unit formatting is exact;
- fixed, expected, null, zero, and not-applicable values remain distinct.

### Routing and navigation

- `/FE6`, unit directory/detail, class directory/detail, and weapons routes parse correctly;
- direct navigation and back/forward work under the configured base path;
- FE6 header active states are correct;
- FE14 routes and active states remain unchanged;
- unknown FE6 slugs render not found without an FE14 fallback.

### Unit views

- the directory renders 54 units in canonical order;
- English, Japanese, romanized, and legacy aliases find the expected unit;
- Roy covers an ordinary unpromoted profile;
- Marcus covers a prepromoted unit;
- Merlinus covers a nonstandard/non-promoting case;
- Rutger or another sourced unit verifies the expected Hard-mode label;
- Gonzalez verifies a recruitment-specific starting override;
- Cath and Percival verify multiple recruitment entries;
- Thea verifies Heroes-adjusted naming and retained aliases;
- support links resolve as one flat list;
- JSON exposes the unmodified runtime record.

### Class views

- Lord promotes only to Master Lord;
- every source class exposes at most one target;
- multiple incoming Berserker promotions do not become a branching source tree;
- non-promoting and special classes show not applicable;
- gender variants remain distinct where runtime distinguishes them;
- no class page renders an empty Skills section.

### Weapons and items

- tabs appear in locked order and row counts match runtime categories;
- combat, staff, and item columns differ as specified;
- fixed, formula, and `All` ranges render correctly;
- zero Crit remains `0` while not-applicable remains distinct;
- Torch staff and Torch item appear in the correct categories;
- availability flags remain visible.

### Localization, accessibility, and regression

- English and Simplified Chinese chrome and fallbacks behave consistently;
- Japanese names retain UTF-8 and the right language attribute;
- filters, tabs, abbreviated headers, and JSON controls have accessible names;
- keyboard navigation works for interactive controls;
- phone, tablet, and desktop layouts have no page-level overflow;
- existing FE14 unit, skill, personal-skill, and weapon pages continue to pass.

## Implementation Sequence

1. Confirm the implementation branch and preserve the current worktree.
2. Add FE6 frontend types/adapters and focused tests against runtime JSON.
3. Make shared route shapes game-aware, add FE6 routes, and lock FE14 regressions.
4. Inventory portraits, build the manifest and resolver, acquire only missing assets, and verify 54-of-54 coverage.
5. Add the FE6 game-library card, header navigation, and localized messages.
6. Build the unit directory and unit detail Overview/JSON views.
7. Build the class directory and class detail Overview/JSON views.
8. Build the tabbed weapon/item directory with category-appropriate columns.
9. Add responsive styling, reusing FE14 classes only where semantics match.
10. Add focused data, asset, component, routing, accessibility, localization, and FE14 regression tests.
11. Run validation, typecheck, tests, build, and responsive visual inspection.

Recommended verification commands:

```text
npm run data:validate:fe6
npm run data:build:fe6
npm run typecheck
npm test
npm run build
```

## Acceptance Criteria

- FE6 is reachable from the library and header without changing FE14 URLs.
- All six FE6 routes work on direct load and client navigation.
- The unit directory contains all 54 story units in canonical order and supports reviewed-name search.
- Every unit has a locally bundled, provenance-tracked Binding Blade portrait or an approved exception.
- Unit pages contain the requested Character Profile and one flat Supports list, with no FE14-only sections.
- Recruitment variants, expected Hard bases, caps, weapon levels, affinity, and half-point bonuses are labeled truthfully.
- Class pages show the single-promotion model and never render a Skills section.
- The weapon/item directory uses the requested order and category-appropriate fields.
- Names follow the approved fan-translation / Heroes-adjusted policy while preserving Japanese and legacy aliases.
- Source provenance and read-only JSON are inspectable without overwhelming the default view.
- The viewer is keyboard accessible, responsive, and usable in existing locales.
- The site remains static and performs no runtime request to Serenes Forest or Fandom.
- FE6 validation, typecheck, tests, production build, and FE14 regressions pass.

## Stop Conditions

Stop and ask for review if:

- a portrait cannot be identified as the FE6 in-game portrait;
- asset acquisition would require bypassing access controls or hotlinking;
- a portrait source or rights note cannot be recorded adequately;
- a runtime relation needed by the viewer is missing or ambiguous;
- implementation would need to reinterpret a curated fact rather than present it;
- a shared-component change would materially alter an FE14 page;
- a route change would break an existing public FE14 URL;
- implementation would require a backend, runtime scraping, or a new dependency.

# FE14 Build Helper — Big Chinese (zh-Hans) Language Patch

## Context

The site is currently English-only. There is **no i18n infrastructure**: UI strings are hardcoded in ~6,500 lines of TSX, and components read game display strings from English-only fields (`identity.displayName`, `names.en`, class `label`, class `displayName`). The data model already anticipates localization — unit records carry a `names` object with `{ en, ja, jaLatn, zhHans }`, and a Chinese source workbook (`火纹if.xlsx`, source id `fe14-workbook-cn`) is already in the repo — but Chinese coverage is partial and unused at runtime.

Goal: a **full** zh-Hans patch (names, all descriptions/effects, freeform prose, and UI chrome) selectable via a **persisted in-app language toggle**, with English as the default and fallback. This aligns with AGENTS.md, which treats localized names as a first-class data dimension and mandates UTF-8 / mojibake discipline. No new dependencies (in-house resolver), per AGENTS.md.

## Current-state facts (verified)

- **Unit names**: `names.zhHans` present for all 48 gen-1 + 21 gen-2 units. But components render `identity.displayName` (English), not `names.zhHans`.
- **Personal skills**: `names.zhHans` present (69). `effect` prose is English only.
- **Class skills** (`class-skills.json`): `names` = en only (106 name blocks / 215 skill entries); `description` English only.
- **Class stats** (`class-stats.json`): `displayName` English only (no `names`).
- **Class trees** (`class-trees.json`): `label` English only.
- **Weapon types** (`weapon-types.json`): `names` = en only (9).
- **Freeform prose, English only**: unit `notes`/`supportNotes`, `paralogueTitle`, offspring recruitment `description`/`recruitmentNotes`, skill `notes`.
- **Hardest area**: `src/games/fe14/baseConfiguration.ts` builds English sentences inline via template literals interpolating names (e.g. lines ~411, 494, 505–507, 915–924). These must become parameterized message templates.
- **Pipeline**: normalized JSON → `scripts/data/fe14/generate-runtime.ts` (+ `validate.ts`, `schemas.ts`) → `data/runtime/fe14/units.json` → consumed via `src/games/fe14/data.ts`.

## Steps

### 1. i18n core (new, in-house, no deps)
- `src/i18n/locale.ts`: `type Locale = "en" | "zhHans"`; default `"en"`.
- `src/i18n/LocaleContext.tsx`: React context + `useLocale()` + provider wrapping the app in `src/main.tsx` / `src/App.tsx`.
- Persist preference in existing storage layer (`src/storage.ts`, IndexedDB) with a `localStorage` mirror for first-paint; reuse patterns already in `useNotesWorkspace.ts`.
- Language switcher control in `src/components/AppHeader.tsx`.
- Resolver helpers: `resolveName(names, locale)` and `t(key, locale, params?)` with **English fallback** when a zhHans value is missing (critical during incremental data fill).

### 2. Data model expansion (JSON + schema + TS types)
- Extend `names`/label fields to `{ en: string; zhHans?: string }` and add localized prose fields (e.g. `description`/`descriptionZhHans` or nested `{ en, zhHans }`) across:
  - `data/normalized/fe14/class-skills.json`, `class-stats.json`, `class-trees.json`, `weapon-types.json`, `personal-skills.json` (effect), unit rosters (notes/supportNotes/paralogueTitle), `child-recruitment.json` (descriptions).
- Update validators/types in lockstep — otherwise `generate-runtime.ts` fails validation:
  - `scripts/data/fe14/schemas.ts` (allow/require new fields; keep zhHans optional so partial fills pass).
  - `src/games/fe14/data.ts` interfaces (`names: { en: string }` → `{ en: string; zhHans?: string }` on `ClassSkill`, `WeaponType`, `ClassStatProfile`, `UnitIdentity.names`, personal skill, etc.).
- Re-run `generate-runtime.ts` to rebuild `data/runtime/fe14/units.json`.
- **Translation content sourcing**: pull zh-Hans from `火纹if.xlsx` / `fe14-workbook-cn` where it has coverage, plus the primary web sources below.
  - **Primary web sources** (confirmed reachable, carry zh names + zh descriptions + Japanese names):
    - Class skills → `http://fcfantasy.cn/fe2015/database/class_skills.html` (167 rows; cols: class / icon / zh name / Japanese name / zh description). Fills class-skill `names.zhHans` + localized `description`; backfills Japanese names.
    - Personal skills → `http://fcfantasy.cn/fe2015/database/personal_skills.html` (69 rows; cols: portrait / character name [zh+katakana+romaji] / icon / zh name+Japanese / zh effect). Fills personal-skill localized `effect` (names already have zhHans); match by unit via the character-name column.
  - Treat these as a starting point (modify later); add new provenance source ids (e.g. `fcfantasy-fe14-class-skills`, `fcfantasy-fe14-personal-skills`) to `data/sources/fe14/sources.json`.
  - **Scraping caveats**: site HTTPS cert is expired — fetch over HTTP (WebFetch forces HTTPS and fails; write a curl/node extractor under `scripts/data/fe14/`). Pages are UTF-8 with a BOM — decode as UTF-8 explicitly and run the mojibake check per AGENTS.md.
  - Flag untranslated fields in a gap report under `data/reports/fe14/` (mirror existing validation-report pattern). Keep records in canonical order per AGENTS.md; do not rely on runtime sort.

### 3. Component refactor (read through resolver)
- Replace every `names.en` / `identity.displayName` / class `.label` / `.displayName` render with `resolveName(..., locale)`. Representative files: `baseConfiguration.ts`, `components/skills/*`, `components/units/detail/*` (esp. `OffspringOverview.tsx`, `UnitHeader.tsx`), `pages/*`, `components/units/directory/UnitDirectory.tsx`.
- Search filters that match on names (e.g. `ClassSkillBrowser.tsx:78` `matchesNameSearch(skill.names.en, …)`) must match the active-locale string (and ideally both).

### 4. UI chrome string catalog
- `src/i18n/messages/en.ts` and `src/i18n/messages/zhHans.ts`: keyed catalog for hardcoded JSX labels, buttons, headings, aria-labels across `src/components/`, `src/pages/`, `src/games/fe14/components/`.
- **Prose templates** (baseConfiguration.ts sentences, OffspringOverview stance/inheritance sentences): convert to catalog entries with `{name}`-style placeholders resolved by `t()`; localize both language versions. This is the bulk of the effort.

### 5. Persistence / backup
- Add locale to persisted settings; ensure it round-trips and does not break `BACKUP_FORMAT_VERSION` (`src/types.ts`) — locale is a UI setting, likely stored separately from workspace backups; confirm no schema bump needed.

### 6. Attribution / credits (required)
- The Chinese FE community made this possible — add a visible shout-out crediting **the fcfantasy.cn (FC Fantasy) community** and **3DM** for their longstanding localization of Fire Emblem content, which the skill/name translations draw on.
- Exact placement is TBD (unplanned) — candidates: an About/credits area, a footer, or the language-switcher's info tooltip. Decide during build.
- Also record the specific data sources in provenance (`data/sources/fe14/sources.json`) as noted in step 2, and mention them in `README.md`.

### 7. Navbar restructure + Personal Skills page (ad-hoc, added mid-build)
Not part of the original Chinese-patch scope, but scheduled to be built next.
- **Navbar**: collapse the FE14 links into a single **FE14** dropdown containing **Units**, **Class Skills**, **Personal Skills**. `Notes` and the language switcher stay as their own items. Rename the existing **FE14 Skills** entry to **Class Skills**.
- **Rename** the current skills page heading `FE14 Class Skills` stays; nav label becomes `Class Skills`. Existing route `/FE14/Skills` unchanged.
- **New Personal Skills page** at `/FE14/PersonalSkills` (add `personal-skill-index` route in `src/router.tsx`):
  - Layout mirrors the class-skills page (toolbar of filter bars + searches, then a results list) but lists **only personal skills**.
  - Data already exists — iterate `fe14Data.units[].personalSkill` joined with each unit's `identity` (name, `availableRoutes`, `generation`, `availabilityCategory`). No data-model changes.
  - **Filter bar 1 — route**: All routes / Birthright / Conquest / Revelation (+ DLC), reusing the FE14 Units page (`UnitDirectory`) route logic (`availableRoutes` / `availabilityCategory === "dlc_exclusive"`).
  - **Filter bar 2 — generation**: All / First generation / Second generation.
  - **Two substring search inputs**: one matches **skill name**, one matches **character name** (reuse the `matchesNameSearch` substring helper from `ClassSkillBrowser.tsx`).
  - Each result card: character portrait/name + personal-skill name + effect + icon (reuse `PersonalSkill`/`skillAssets` patterns). All names go through the i18n resolver so zh-Hans continues to work.
- New files: `src/games/fe14/pages/PersonalSkillIndexPage.tsx`, `src/games/fe14/components/skills/PersonalSkillBrowser.tsx`. Edit: `src/router.tsx`, `src/App.tsx`, `src/components/AppHeader.tsx`, i18n catalogs.

## Critical files
- New: `src/i18n/locale.ts`, `src/i18n/LocaleContext.tsx`, `src/i18n/resolve.ts`, `src/i18n/messages/{en,zhHans}.ts`.
- Edit: `src/App.tsx`, `src/main.tsx`, `src/components/AppHeader.tsx`, `src/storage.ts`, `src/games/fe14/data.ts`, `src/games/fe14/baseConfiguration.ts`, all `src/games/fe14/components/**`, `src/pages/**`.
- Data: `data/normalized/fe14/*.json` (+ unit rosters), `scripts/data/fe14/schemas.ts`, `scripts/data/fe14/validate.ts`, `scripts/data/fe14/generate-runtime.ts`.

## Suggested sequencing (incremental, reviewable per AGENTS.md)
1. i18n core + toggle + resolver, English catalog only (behavior unchanged).
2. Wire game **names** through resolver (zhHans already exists for units/personal-skill names).
3. Expand schema/types + fill zhHans for class/weapon/skill **names**; regen runtime.
4. Translate **descriptions/effects**; regen.
5. Extract + translate **UI chrome**.
6. Translate **freeform prose + baseConfiguration templates** (largest step).

## Verification
- `npm run` data pipeline (validate + `generate-runtime.ts`) passes with zhHans optional; check `data/reports/fe14/` gap report for untranslated fields.
- Run the mojibake check per `docs/codex-prompts/templates/unicode-mojibake-check.md`; confirm all files UTF-8, no garbled CJK.
- Unit tests (`*.test.tsx`, `baseConfiguration.test.ts`, `ClassSkillBrowser.test.tsx`) updated/passing.
- Manual: launch the app, toggle EN⇄中文, verify names, skills, class trees, offspring sentences, and UI chrome switch; reload to confirm persistence; confirm English fallback renders for any still-missing zhHans field.

## Open items / notes
- Effort is dominated by translation content volume (215 skill descriptions, 205 skill effects, prose) and the baseConfiguration sentence templating — not by the plumbing.
- Confirm whether `火纹if.xlsx` adds coverage beyond the two fcfantasy pages (which already supply class-skill and personal-skill zh names + descriptions). Class/weapon-type names, class-tree labels, and freeform unit prose (notes, paralogue titles, recruitment text) are NOT on those pages and still need a source or hand translation (respecting AGENTS.md provenance/validation rules).
- This plan will also be archived under `docs/claude-prompts/` (new dir, parallel to `docs/codex-prompts/`) once approved.

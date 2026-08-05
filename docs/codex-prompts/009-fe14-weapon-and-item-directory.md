# Milestone 9 - FE14 Weapon and Item Data Directory

We are working on FireEmblemBuildHelper, a Fire Emblem planning project. Fire Emblem Fates / Fire Emblem if / FE14 is the first supported game.

## Important Working Style

Complete only this milestone. After finishing, stop and report the results.

Read these files before editing:

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/PRODUCT.md`
- `docs/ROADMAP.md`
- `docs/DATA_FOUNDATION.md`
- `docs/codex-prompts/007-fe14-skill-data-and-directory.md`
- `docs/codex-prompts/008-fe14-route-driven-unit-base-configuration.md`
- the applicable FE14 canonical-ordering document created or selected during the inventory step

Treat the accepted FE14 unit, class, skill, route-driven configuration, and weapon-type data as the starting contract. Do not regress unit profiles, class-skill pages, weapon-level displays, localization, source provenance, or local asset resolution while adding the directory.

This is a curated static-data and frontend milestone. The public application must remain a static React + TypeScript site. Do not add a backend API, SQLite runtime dependency, hosted account system, or runtime network dependency.

## Branch Workflow

The milestone document is written on `main` by explicit user instruction. Before implementation, ask whether the work should be done on a new branch. The suggested branch name is:

```text
feature/fe14-weapon-item-directory
```

After the user approves a branch:

1. Show `git branch --show-current`.
2. Show `git status --short`.
3. Preserve all existing user changes.
4. Create and switch to the approved branch.
5. Do not reset, stash, revert, commit, push, merge, or prune unless explicitly requested.

## Goal

Create a trustworthy bilingual FE14 weapon and item data foundation and render it in a dedicated directory page.

The milestone has two required stages:

1. collect, reconcile, normalize, validate, and document weapon and item facts plus local icons;
2. build a responsive `/FE14/Weapons` page that presents paired Hoshidan and Nohrian weapon families as two sections within each weapon tab, plus an Items tab.

The milestone succeeds when:

- every included weapon has a stable ID, localized names, mechanical classification, rank, Mt, Hit, Crit, Avo, Ddg, Rng, Worth, description, icon, review status, and field-level provenance;
- English weapon facts are cross-checked between Fire Emblem Wiki and Serenes Forest;
- the six supplied Chinese weapon tables are reconciled against the English records rather than imported as an independent, unjoined list;
- staves, rods, dragonstones, and beaststones use specifically identified Japanese references to fill the gap left by the supplied Chinese tables;
- Crit Avoid from any source is normalized into the single `ddg` field and displayed as `Ddg`;
- missing, not applicable, unobtainable, and genuinely unknown values remain distinct;
- item data excludes unused entries but includes Ebon Wing and every later legitimate DLC or in-game entry;
- weapon and item icons are stored locally and resolved by stable asset IDs, with no runtime hotlinks;
- the page follows the paired-family tab layout defined below and works in English and Simplified Chinese;
- validation, runtime generation, typecheck, tests, production build, and responsive visual checks pass.

## Current Baseline

Milestone 8 leaves the project with:

- `data/normalized/fe14/weapon-types.json` containing nine mechanical weapon-type records;
- stable mechanical IDs for sword, lance, axe, dagger, bow, tome, staff, dragonstone, and beaststone;
- local weapon-type icons used by unit weapon-level displays;
- class weapon-rank caps and unit starting weapon ranks keyed by those IDs;
- a static FE14 runtime payload and typed Vite asset resolvers;
- existing unit, class-skill, and personal-skill directory patterns;
- English and Simplified Chinese application localization.

Do not replace the weapon-type registry or reinterpret its IDs. A Katana uses sword proficiency; a Naginata uses lance proficiency; a Club uses axe proficiency; a Shuriken uses dagger proficiency; a Yumi uses bow proficiency; a Scroll uses tome proficiency; and a Rod uses staff proficiency. These are display and content families within the existing mechanical types, not new weapon-rank domains.

The existing type icons are not item-level weapon icons. Reuse them only where a verified source intentionally uses the same image. Do not silently substitute a generic type icon when a required weapon or item icon is missing.

## Hard Scope Boundary

This milestone includes:

- source inventory and gap reporting before normalized data entry;
- normalized weapon and item JSON in canonical order;
- source-catalog and field-level provenance updates;
- deterministic acquisition or transcription tooling where useful;
- local weapon and item icon manifests and assets;
- validation and human-readable coverage/conflict reports;
- runtime generation and TypeScript types for weapons and items;
- one FE14 Weapons and Items directory route, navigation entry, and responsive page;
- focused data, routing, rendering, localization, accessibility, and regression tests.

This milestone excludes:

- forging calculations, forge naming, or player-created forged weapon records;
- inventory quantities or equipping weapons in a saved run plan;
- shop schedules, route economy, limited-stock planning, or gold budgeting;
- damage, doubling, proc, triangle, effective-damage, or combat simulation;
- weapon experience progression calculations;
- random My Castle, Museum Melee, lottery, or drop-rate modelling;
- enemy-only attacks that are not inventory weapons;
- unused, dummy, debug, placeholder, or inaccessible item records;
- a generic cross-game weapon schema presented as universal Fire Emblem mechanics;
- runtime scraping, hotlinked images, a second UI toolkit, or new dependencies.

If an entry's player availability is uncertain, retain it in the research gap report and stop for review before silently including or excluding it.

## Approved Sources and Provenance

### English weapon sources

Cross-check every English weapon record between:

- Fire Emblem Wiki: `https://fireemblemwiki.org/wiki/List_of_weapons_in_Fire_Emblem_Fates`
- Serenes Forest FE14 inventory index: `https://serenesforest.net/fire-emblem-fates/`

Use the inventory subpages linked from the Serenes Forest FE14 index—not the old pre-release examples page—as the English cross-check. Capture the relevant Swords, Katanas, Lances, Naginatas, Axes, Clubs, Daggers, Shurikens, Bows, Yumi, Tomes, Scrolls, Staves, Rods, Miscellaneous, and Items pages locally with their source URLs and date checked.

Neither table is permission to overwrite a disagreement silently. Record differences by stable weapon ID and field. Resolve them with a specifically cited third source, documented game-data evidence, or user review. A matching name alone is not enough to establish identity when localized names differ; use family, Japanese name when available, rank, stats, effect text, and source position as corroborating keys.

### Simplified Chinese weapon sources

Use the supplied Chinese tables for their applicable families:

- Sword and Katana: `http://fcfantasy.cn/fe2015/database/sword.html`
- Lance and Naginata: `http://fcfantasy.cn/fe2015/database/lance.html`
- Axe and Club: `http://fcfantasy.cn/fe2015/database/axe.html`
- Bow and Yumi: `http://fcfantasy.cn/fe2015/database/bow.html`
- Dagger and Shuriken: `http://fcfantasy.cn/fe2015/database/knife.html`
- Tome and Scroll: `http://fcfantasy.cn/fe2015/database/magic.html`

Preserve UTF-8 text exactly. Join Chinese rows to canonical weapon IDs explicitly. Do not rely on row number alone, and do not transliterate a Chinese display name into a new canonical ID.

The supplied Chinese source set does not cover staves/rods or stones. Before authoring those records:

1. identify specific applicable Japanese source pages or responsibly extracted Japanese game data;
2. add each source with URL or repository locator, scope, region/version, and date checked;
3. record which fields it supports;
4. distinguish source facts from project-authored Simplified Chinese translations;
5. mark translations for review and stop if a mechanically meaningful phrase cannot be translated confidently.

Do not cite a generic Japanese site homepage as if it supports every staff or stone fact.

### Item source and inclusion rule

Use:

- Fire Emblem Wiki: `https://fireemblemwiki.org/wiki/List_of_items_in_Fire_Emblem_Fates`

Exclude entries explicitly identified as unused, dummy, debug, placeholder, or inaccessible. Treat Ebon Wing and every subsequent entry as legitimate DLC or in-game content eligible for inclusion; do not discard those entries merely because of their position in the source table. Do not label all of them `dlc` if the evidence supports a more specific in-game acquisition category.

Record the user's inclusion instruction as a provenance/review note so a later source-table change does not accidentally reintroduce unused entries or remove valid late-table entries.

### Icon source

Use the per-record weapon and item icons exposed by the applicable Fire Emblem Wiki list or file pages. Record:

- source page;
- direct image/file-page locator;
- original filename;
- destination asset ID and path;
- file type and dimensions;
- checksum;
- which canonical records use the asset;
- date checked and review status.

Download assets during development and ship local files. Do not hotlink at runtime. Do not scrape unrelated site branding, layout images, or decorative assets. If an icon's source or reuse basis is unclear, stop for user review rather than generating replacement game artwork or silently using a Lucide icon.

## Canonical Ordering and Classification

Before bulk data entry, create or update a concise FE14 weapon/item canonical-ordering document. It must define:

- tab order;
- section order within each tab;
- record order within each section;
- where DLC and other special entries appear;
- item category order;
- how source-only, disputed, and excluded-unused entries are reported.

Keep normalized JSON physically in that order. Do not use runtime sorting to hide disordered source data.

Use this tab and section structure:

1. `Swords & Katana`: Swords, then Katana;
2. `Lances & Naginata`: Lances, then Naginata;
3. `Axes & Clubs`: Axes, then Clubs;
4. `Daggers & Shuriken`: Daggers, then Shuriken;
5. `Bows & Yumi`: Bows, then Yumi;
6. `Tomes & Scrolls`: Tomes, then Scrolls;
7. `Staves & Rods`: Staves, then Rods;
8. `Stones`: Dragonstones, then Beaststones;
9. `Items`: verified item categories in canonical order.

Use stable ASCII family IDs such as `sword`, `katana`, `lance`, `naginata`, `axe`, `club`, `dagger`, `shuriken`, `bow`, `yumi`, `tome`, `scroll`, `staff`, `rod`, `dragonstone`, and `beaststone`. Each weapon record also retains its existing mechanical `weaponTypeId`.

Do not add Ballista, Fire Orb, or other emplacement mechanics to the weapon directory unless a supplied source proves they are player inventory weapons in scope. Do not add enemy-only breaths, fists, monster attacks, or similar actions merely because another source calls them weapons.

## Normalized Weapon Data

Create one normalized weapon domain, for example:

```text
data/normalized/fe14/weapons.json
```

A candidate record shape is shown below. Its example values illustrate structure only and are not approved FE14 facts; replace every value with reviewed source data during implementation.

```json
{
  "id": "iron_sword",
  "names": {
    "en": "Iron Sword",
    "zhHans": "铁剑",
    "ja": "鉄の剣"
  },
  "weaponTypeId": "sword",
  "familyId": "sword",
  "rank": "D",
  "might": 6,
  "hit": 90,
  "crit": 0,
  "avoid": 0,
  "ddg": 0,
  "range": {
    "min": 1,
    "max": 1,
    "sourceText": "1"
  },
  "worth": {
    "amount": 1000,
    "status": "priced"
  },
  "uses": null,
  "descriptions": {
    "en": "...",
    "zhHans": "..."
  },
  "iconAssetId": "iron_sword",
  "contentAvailability": ["base_game"],
  "reviewStatus": "corroborated",
  "provenance": []
}
```

The exact property names may follow established repository conventions, but the semantic requirements are fixed:

- stable ASCII IDs never depend on the current display language;
- names and descriptions are localized fields, not copied parallel records;
- `weaponTypeId` is the mechanical proficiency/type join;
- `familyId` controls the directory section;
- Rank uses the validated FE14 vocabulary and distinguishes not applicable from unknown;
- Mt, Hit, Crit, Avo, and Ddg are numeric when applicable and preserve negative values;
- any source column named Crit Avoid, Critical Avoid, Dodge, or an established equivalent maps into `ddg`; do not store duplicated Crit Avoid and Ddg facts;
- Rng is structurally usable while retaining the exact source text needed to audit unusual ranges;
- Worth distinguishes a numeric price from not sold, not applicable, and unknown; do not coerce `--` to zero;
- descriptions preserve mechanical qualifiers and do not absorb independently modelled numeric fields as an unparseable substitute;
- limited uses are represented where applicable to staves, rods, or another verified record; infinite weapon durability is not encoded as a fabricated use count;
- DLC, route, path-bonus, amiibo, enemy-only, or other availability tags are added only when verified and must not be inferred from a weapon's name;
- field-level provenance may cite different sources for English text, Chinese text, mechanics, availability, and icon.

Do not store display-ready strings such as `1–2 Rng` or `1,000 G` as the only canonical value. Generate formatted values from typed data while keeping source text for audit.

## Normalized Item Data

Create a separate item domain, for example:

```text
data/normalized/fe14/items.json
```

Items must not be forced into weapon stat fields. A candidate record stores:

```text
id
names
categoryId
uses, when applicable
worth with explicit status
descriptions
iconAssetId
contentAvailability
reviewStatus
provenance
```

Requirements:

- retain only entries that exist as legitimate obtainable or usable game content under the approved inclusion rule;
- include Ebon Wing and all later legitimate DLC or in-game entries;
- keep promotion seals, stat boosters, skill-learning items, class-change items, consumables, and other verified categories distinct;
- do not copy unused entries into normalized or runtime JSON merely to preserve source-table completeness;
- list excluded source rows with reason and locator in the generated report so omission is auditable;
- do not invent uses, prices, effects, acquisition routes, or DLC classifications when the source does not establish them;
- if a weapon-like item appears on both supplied lists, choose one canonical ownership domain and document the join or exclusion rather than shipping duplicates.

## Source Acquisition and Reconciliation

Prefer a reproducible extractor for stable HTML tables, followed by explicit reviewed normalization. Do not make the normalized dataset depend on a live network request.

Before editing accepted JSON, generate a gap report containing:

- every source table and section found;
- source row counts by family/category;
- tentative canonical matches across English and Chinese sources;
- English field disagreements;
- Chinese rows without an English match and English rows without a Chinese match;
- staff, rod, dragonstone, and beaststone fields still lacking a Japanese source;
- missing English or Simplified Chinese names/descriptions;
- icon URLs/file pages and duplicate icon candidates;
- items proposed for inclusion;
- items proposed for exclusion with exact reason;
- any entry whose player availability is uncertain.

Normalize only after reviewing that report. Keep raw extraction results, normalized records, generated reports, and runtime JSON separate. Generated files must be deterministic and UTF-8.

Do not treat source order as identity. Normalize punctuation, apostrophes, full-width characters, and harmless whitespace only in the matching layer; preserve reviewed display text in the canonical record.

## Conflict and Review Rules

- Agreement between Fire Emblem Wiki and Serenes Forest may set mechanical English fields to `corroborated` after row identity is verified.
- A disagreement remains `disputed` until resolved; do not pick the value that is easier to parse.
- Chinese data supported only by one supplied Chinese table remains traceable to that table even when its mechanics agree with English sources.
- Project-authored Chinese translations for staff/rod/stone content must identify their Japanese source and translation status.
- Images require their own provenance; a page supporting stats does not automatically support the icon file.
- Preserve region/version distinctions when a source describes Japanese and localized releases differently.
- Do not copy long explanatory prose from a source when a concise, faithful project description can represent the mechanic. Preserve the fact and citation, not unnecessary copyrighted prose.

## Runtime Data and Type Integration

Extend the existing FE14 schema, validator, runtime generator, and frontend types so the runtime payload exposes canonical `weapons` and `items` arrays.

Requirements:

- normalized JSON remains the curated source of truth;
- the runtime generator does not re-scrape, translate, or repair data;
- runtime order matches canonical normalized order;
- every `weaponTypeId` resolves to the existing weapon-type registry;
- every `familyId` resolves to one directory section;
- every local icon asset ID resolves through a typed Vite asset resolver;
- weapon/item asset resolvers remain separate from the existing generic weapon-type icon resolver unless a small shared primitive is genuinely useful;
- unit inventories continue to use stable IDs and gain readable labels from the canonical weapon/item domains where applicable;
- unresolved existing inventory IDs are reported rather than silently title-cased forever;
- do not copy full weapon/item records into unit availability JSON.

If existing unit inventory IDs use aliases that do not match the new canonical IDs, add an explicit reviewed alias/migration mapping and tests. Do not rewrite unrelated unit facts.

## Weapons and Items Page

Add one route:

```text
/FE14/Weapons
```

The page heading should clearly identify the combined directory, for example `FE14 Weapons & Items`, while retaining the concise route and navigation label `Weapons` if that fits the existing header.

Use the locked tab/section order above. Each paired weapon tab contains two visibly labelled sections. Do not merge Katana into Swords, for example, merely because both use sword rank. The Stones tab contains Dragonstones and Beaststones as its two sections.

Each weapon presentation must expose:

```text
Icon, Name, Rank, Mt, Hit, Crit, Avo, Ddg, Rng, Worth, Description
```

Show Uses when a record legitimately has limited uses, especially in Staves & Rods. Use concise column help or accessible labels for abbreviations. Ddg is the display label for the normalized `ddg` fact.

The Items tab shows only fields appropriate to items, including icon, name, category, uses when applicable, worth, and description. Do not render empty weapon-stat columns for items.

Use the current locale for the primary name and description. Preserve the other reviewed locale in data; do not show both languages in every cell unless the existing locale pattern calls for it. A missing translation must use an explicit, tested fallback and remain visible in validation reports.

Do not add search, sorting, comparison, favorites, inventory editing, or URL-persisted tab state in this milestone unless the user separately requests it.

## Responsive and Accessible Presentation

The number of weapon columns makes a desktop table reasonable, but the implementation must remain usable on narrow screens.

- Tabs use accessible React-Bootstrap or native controls with keyboard behavior and visible focus.
- Each tab and section has a programmatic label and logical heading order.
- Header abbreviations expose full meanings to assistive technology.
- Icons have stable dimensions and are decorative when adjacent text names the record.
- Numeric values remain text, not color-only signals.
- Missing, not sold, not applicable, and unknown states use distinct readable labels.
- On narrow screens, use a deliberate responsive table container or compact record layout; do not clip columns or cause page-level horizontal overflow.
- Long descriptions and localized names wrap without covering icons or controls.
- The active tab is apparent without relying on color alone.
- Preserve reasonable tab focus/selection behavior when the locale changes.

## Validation and Reporting

Extend FE14 validation so it reports:

- duplicate weapon or item IDs;
- duplicate or invalid canonical display order;
- unknown weapon types, families, item categories, availability tags, or rank values;
- family-to-mechanical-type contradictions;
- missing required English names or descriptions;
- missing Simplified Chinese content and whether the gap is expected, translated, or unresolved;
- invalid numeric values, including accidental strings, NaN, and impossible ranges;
- loss of negative Avo or Ddg modifiers;
- simultaneous duplicated Crit Avoid and Ddg fields;
- invalid range bounds or unparseable retained range text;
- ambiguous zero/null/not-applicable Worth values;
- missing field-level provenance or review status;
- unresolved English source conflicts;
- unmatched Chinese and English records;
- staff/rod/stone records without a specific Japanese source where required;
- missing, empty, duplicate-destination, non-image, or unresolvable icon assets;
- normalized/runtime count or order mismatches;
- included unused item rows;
- excluded Ebon Wing or later legitimate item rows;
- canonical inventory IDs that resolve to neither a weapon nor an item;
- mojibake or corrupted Japanese and Chinese text.

Generate a concise human review report with:

- weapon counts by tab, section, rank, and availability category;
- item counts by category and availability category;
- English corroborated, disputed, and single-source field counts;
- Chinese coverage and project-authored translation counts;
- icon coverage and intentional asset reuse;
- included and excluded item rows;
- unresolved inventory aliases;
- validation errors and warnings.

## Tests

Add focused tests for:

- canonical tab and section order;
- every family mapping to the correct existing mechanical weapon type;
- normalized/runtime weapon and item counts and order;
- English cross-source conflict reporting;
- Chinese-to-canonical record matching;
- Japanese-source requirements for staves, rods, dragonstones, and beaststones;
- Crit Avoid normalization into Ddg;
- negative Avo and Ddg preservation;
- rank, range, Worth, and not-applicable semantics;
- unused item exclusion;
- Ebon Wing and representative later legitimate items remaining included;
- per-record icon manifest coverage and local asset resolution failures;
- unit inventory IDs resolving through weapons/items without duplicated data;
- `/FE14/Weapons` routing, navigation active state, and not-found regressions;
- every tab rendering its expected two weapon sections, except the purpose-built Items tab;
- correct weapon and item columns;
- English and Simplified Chinese labels, names, descriptions, and fallbacks;
- keyboard-operable tabs and accessible abbreviated headers;
- mobile rendering without page-level horizontal overflow;
- deterministic runtime generation;
- existing unit weapon-level icons and class/personal skill directories continuing to work.

Run:

```text
npm run data:validate
npm run data:build
npm run typecheck
npm test
npm run build
```

Start the local frontend after implementation and visually inspect in English and Simplified Chinese at representative phone, tablet, and desktop widths:

- Swords & Katana;
- Daggers & Shuriken;
- Staves & Rods;
- Stones;
- Items, including Ebon Wing and at least one later entry;
- a unit profile with weapon levels and inventory, to catch shared-data regressions.

## Implementation Sequence

1. Confirm the implementation branch and preserve the current worktree.
2. Inventory current weapon types, unit inventory IDs, source catalog conventions, runtime generation, routing, navigation, localization, and asset resolvers.
3. Inspect all supplied source pages and produce the pre-normalization gap/conflict report.
4. Identify and document specific Japanese references for staves, rods, dragonstones, and beaststones.
5. Create or update the canonical weapon/item ordering document.
6. Add source IDs and reproducible raw extraction/transcription tooling where appropriate.
7. Define schemas for weapon families, weapons, item categories, items, localized text, Worth, range, availability, review status, and field-level provenance.
8. Normalize English weapon facts and resolve or report every Fire Emblem Wiki/Serenes disagreement.
9. Join and normalize the six Chinese weapon tables without relying on row order alone.
10. Curate staff, rod, and stone records from the approved English/Japanese chain, with reviewed project translations where necessary.
11. Normalize items, explicitly excluding unused rows and including Ebon Wing plus all later legitimate entries.
12. Build the icon manifest, download reviewed local assets, and add typed asset resolution.
13. Extend validation and generate the final coverage/conflict report.
14. Extend deterministic runtime generation, frontend types, and inventory label joins.
15. Add `/FE14/Weapons`, navigation, localized UI messages, tabs, paired sections, and item presentation.
16. Add focused data, component, routing, accessibility, localization, and regression tests.
17. Run the complete verification suite and perform responsive bilingual visual inspection.
18. Update the release log only when the user requests patch notes or release preparation.

## Acceptance Criteria

- Weapons and items live in separate normalized domains with stable canonical IDs.
- Every weapon exposes Rank, Mt, Hit, Crit, Avo, Ddg, Rng, Worth, and Description with truthful null/not-applicable semantics.
- Fire Emblem Wiki and Serenes Forest English weapon facts are cross-checked and disagreements are resolved or explicitly disputed.
- All six supplied Chinese weapon tables are reconciled to canonical records with preserved UTF-8 text.
- Staves, rods, dragonstones, and beaststones cite specific Japanese sources for the gaps not covered by the Chinese tables.
- Crit Avoid is represented only as Ddg in normalized/runtime data and the UI.
- Unused items are absent from normalized and runtime data.
- Ebon Wing and every later legitimate DLC or in-game item remain included.
- Every included record has a locally resolved, provenance-tracked icon or an explicitly approved exception.
- Paired Hoshidan/Nohrian families render as two sections in the requested tab structure without splitting existing weapon-rank mechanics.
- The Items tab uses item-appropriate fields rather than empty weapon columns.
- The page is keyboard accessible, bilingual, responsive, and free of page-level horizontal overflow.
- Existing unit inventory and weapon-level displays continue to resolve correctly.
- The public application remains static and has no runtime dependency on the source websites.
- Validation, runtime generation, typecheck, tests, production build, and visual inspection pass.

## Stop Conditions

Stop and ask the user before continuing if:

- Fire Emblem Wiki and Serenes Forest disagree on a mechanical value and no reviewed source resolves it;
- no specific credible Japanese source can be established for staff, rod, dragonstone, or beaststone gaps;
- a Chinese row cannot be matched to one canonical weapon confidently;
- a project-authored Chinese translation changes or obscures a mechanical effect;
- the inclusion status of a weapon or item is uncertain;
- the item page contradicts the instruction that Ebon Wing and later legitimate entries are in scope;
- a source mixes unused and legitimate entries in a way that cannot be separated reliably;
- one source row appears to describe multiple regional/version variants that need a new data dimension;
- an icon source, direct locator, or acceptable local-use basis cannot be established;
- implementing the page would require hotlinking, runtime scraping, a new dependency, or generated replacement game artwork;
- existing unit inventory IDs cannot be reconciled without changing accepted unit facts;
- the existing weapon-type abstraction cannot preserve both mechanical proficiency and the requested paired display families;
- unrelated worktree changes make safe implementation impossible.

# Milestone 8 - FE14 Route-Driven Unit Base Configuration

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
- `docs/codex-prompts/005-fe14-first-generation-unit-json.md`
- `docs/codex-prompts/006-fe14-second-generation-unit-json.md`
- `docs/codex-prompts/007-fe14-skill-data-and-directory.md`

Treat the accepted first-generation, second-generation, and standard class-skill data as the starting contract. Do not regress recruitment conditions, Corrin configuration, offspring parentage, class inheritance, supports, seal grants, personal-skill wording, class-skill acquisition, class hierarchy, class statistics, or source provenance while changing the unit-profile presentation.

This is a curated static-data and frontend milestone. The public application must remain a static React + TypeScript site. Do not add a backend API, SQLite runtime dependency, hosted account system, or runtime network dependency.

## Branch Workflow

The planning document is written on `main` by explicit user instruction. Implementation is approved for a new branch named:

```text
feature/fe14-route-driven-base-configuration
```

Before implementation:

1. Show `git branch --show-current`.
2. Show `git status --short`.
3. Preserve all existing user changes.
4. Create and switch to `feature/fe14-route-driven-base-configuration`.
5. Do not reset, stash, revert, commit, push, merge, or prune unless explicitly requested.

## Goal

Replace the unit page's disconnected recruitment cards and long reference tables with one compact, route-driven starting configuration. Selecting an available route must update the complete displayed starting state from one resolved scenario: recruitment context, class and level, joining stats, growths, inventory, already learned skills, weapon levels, cap modifiers, and stance bonuses.

The milestone succeeds when:

- each unit profile has one route control containing only routes available to that resolved unit;
- changing the route updates every route-dependent value through one shared resolver rather than separate component filters;
- joining stats render as one horizontal stat array;
- growth rates render as one horizontal stat array with `Effective` selected by default and an `Individual` alternative;
- effective growths are derived as the resolved personal growth vector plus the selected starting class's growth vector;
- Inventory and Skills render as adjacent compact columns;
- Skills show the personal skill first and every class skill known at the selected recruitment state after it;
- weapon levels render as a chart covering each weapon type usable by the selected class, with local weapon-type icons and current ranks;
- cap modifiers, Attack Stance bonuses, and Guard Stance bonuses render as separate compact summaries;
- Accessible class skills remain the primary class-access presentation and redundant Identity/class-access markup is removed;
- independent class-access facts, including Female Corrin Talent-only access, remain visible;
- offspring profiles show their minimum recruitment stats before parental inheritance and do not present those values as final inherited bases;
- route, difficulty, recruitment timing, Avatar gender, parentage, and other existing scenario conditions remain typed in data even when the only newly introduced general scenario control is route;
- validation, tests, typecheck, build, and responsive visual checks pass.

## Locked Data Architecture Decision

Do not author a second per-unit or per-route configuration dataset.

The route-driven configuration is a derived runtime view assembled from the existing normalized ownership domains:

- `unit-availability.json` owns route joins, class, level, inventory, difficulty variants, and recruitment conditions;
- `unit-base-stats.json` owns the joining-stat and weapon-rank snapshots linked to availability scenarios;
- `unit-growths.json` owns individual first-generation growths;
- `child-parentage.json` owns child-base and resolved offspring growth inputs;
- `child-recruitment.json` owns minimum child recruitment stats, weapon ranks, inventory, story scaling, and Offspring Seal outcomes;
- `unit-cap-modifiers.json` and the child resolver own personal cap modifiers;
- `unit-pairup-bonuses.json`, `avatar-configurations.json`, and the child resolver own stance bonuses;
- `personal-skills.json` owns personal skills;
- `class-skills.json` owns canonical class skills and acquisition edges;
- `class-stats.json` owns canonical class numbers, including maximum stats, weapon-rank caps, and the class growth vectors added by this milestone;
- a small weapon-type registry owns stable weapon-type IDs, labels, order, and icon asset IDs.

Add one tested resolver that accepts a unit plus the current configuration and returns a coherent display model. A candidate shape is:

```ts
type UnitBaseConfigurationSelection = {
  routeId: "birthright" | "conquest" | "revelation";
  avatarGender?: "male" | "female";
  boonId?: string;
  baneId?: string;
  talentId?: string;
  variableParentUnitId?: string;
  nestedVariableParentUnitId?: string;
};

type ResolvedUnitBaseConfiguration = {
  routeId: RouteId;
  availabilityId: string;
  scenarioConditions: ScenarioConditions;
  classId: string;
  level: number;
  join: RouteJoin;
  joiningStats: StatBlock | null;
  joiningStatsKind: "fixed" | "minimum_before_parent_inheritance" | "conditional";
  individualGrowths: StatBlock;
  effectiveGrowths: StatBlock;
  inventory: ResolvedInventory;
  learnedSkills: ResolvedStartingSkill[];
  weaponLevels: ResolvedWeaponLevel[];
  capModifiers: CapModifierBlock;
  attackStance: ResolvedStanceBonuses;
  guardStance: ResolvedStanceBonuses;
  notes: ResolvedScenarioNote[];
};
```

The exact names may follow local conventions, but the ownership and derivation rules are fixed. Components consume the resolved object; they must not each select their own availability record, base-stat record, route join, or child scenario.

Do not copy display names, calculated effective growths, route-specific totals, or resolved skill lists into normalized unit files.

## Current Baseline

Milestone 7 leaves the project with:

- all 69 accepted playable unit profiles;
- typed first-generation availability scenarios and base-stat snapshots;
- typed offspring parentage, recruitment minimums, story scaling, and Offspring Seal rules;
- 55 standard class-stat records with maximum stats and weapon-rank caps;
- 106 canonical standard class skills and generated `skillsByClass` / `classDirectory` joins;
- local class-skill and personal-skill icons;
- `UnitClassSkills` as the primary accessible-class-skill surface;
- route-specific unit data currently rendered as multiple recruitment cards;
- individual growths and cap modifiers currently combined in vertical tables;
- weapon ranks and inventory currently rendered as text;
- class growth data present only in limited offspring-generation inputs rather than one normalized class-stat domain.

Preserve this accepted data. Consolidate only the duplicated class-growth inputs required to calculate effective growths consistently.

## Hard Scope Boundary

This milestone includes:

- the shared route-driven base-configuration resolver and view model;
- one route selector on first- and second-generation profiles;
- route-aware legal parent filtering for offspring;
- route-aware recruitment context, class, level, bases, inventory, learned skills, and weapon ranks;
- normalized standard-class growth vectors;
- validation of the existing class maximum stats and weapon-rank caps;
- a minimal normalized weapon-type registry and deterministic local weapon-type icon assets;
- compact stat, growth, inventory, skill, weapon-level, cap, and stance components;
- removal of redundant profile markup made obsolete by Accessible class skills;
- focused data, resolver, component, routing-regression, and responsive tests.

This milestone excludes:

- IndexedDB persistence for route or unit choices;
- the shared run-plan ownership/migration work described in the separate Unit State and JSON Inspection mini-refactor;
- configurable section ordering or visibility;
- a complete weapon or item directory;
- weapon effects, might, hit, price, forging, inventory quantities, or economy planning;
- item icons beyond the requested weapon-type icons;
- editable skill loadouts, inherited equipped skills, or skill purchasing;
- arbitrary reclass growth projections;
- final inherited offspring joining stats without both parents' actual gained-stat snapshots;
- a difficulty selector, recruitment-chapter simulator, or general scenario editor;
- DLC, Amiibo, Cipher, or enemy-only class-data expansion;
- combat simulation, build optimization, or run-plan persistence;
- a new component toolkit, state-management dependency, or image-generation workflow.

## Approved Sources and Provenance

Preserve and reuse the accepted source records for unit availability, bases, growths, offspring, skills, supports, and stance bonuses.

The class-stat foundation must retain explicit provenance from:

- Hoshidan maximum stats: `https://serenesforest.net/fire-emblem-fates/hoshidan-classes/maximum-stats/`
- Nohrian maximum stats: `https://serenesforest.net/fire-emblem-fates/nohrian-classes/maximum-stats/`
- Hoshidan class growth rates: `https://serenesforest.net/fire-emblem-fates/hoshidan-classes/growth-rates/`
- Nohrian class growth rates: `https://serenesforest.net/fire-emblem-fates/nohrian-classes/growth-rates/`

Maximum-stat tables also provide the accepted weapon-rank caps. Record field-level provenance for maximum stats, weapon-rank caps, and growth rates rather than implying that one table owns all three.

Use only reviewed, redistributable source images for weapon-type icons. Record the source page, direct image URL or local source locator, and destination path in an auditable manifest. Do not hotlink images at runtime. Stop for user review if no acceptable source or redistribution basis can be established.

## Class-Stat Foundation

Extend `data/normalized/fe14/class-stats.json` conservatively. Each supported standard playable class record must contain:

```text
classId
displayName
tier
growthRates
maximumStats
weaponRankCaps
```

Requirements:

- `growthRates` contains all eight stats in canonical order and uses explicit stat keys;
- `maximumStats` continues to contain all eight stats;
- `weaponRankCaps` contains exactly the weapon types usable by that class;
- rank values use one validated FE14 rank vocabulary and order;
- every class referenced by a unit's selected starting state resolves to one class-stat record;
- every class in the standard class directory resolves to one class-stat record;
- scenario display variants such as `maid` and `butler` resolve explicitly to the canonical mechanical `attendant` profile;
- shared gender display abstractions such as `attendant` continue to own one mechanical stat profile unless verified data differs;
- no unit record stores a copied class growth vector;
- offspring generation consumes the same normalized class growths instead of retaining a second hard-coded canonical table.

Calculate:

```text
effective growth = resolved individual growth + selected starting-class growth
```

Apply Corrin boon and bane deltas and offspring parent resolution to the individual vector before adding class growth. Preserve half-point offspring growth values exactly. Do not clamp totals merely because they exceed 100%.

## Weapon-Type Registry and Icons

Create a minimal canonical weapon-type registry, for example:

```text
data/normalized/fe14/weapon-types.json
```

Each record stores:

```json
{
  "id": "sword",
  "names": { "en": "Sword" },
  "iconAssetId": "sword",
  "displayOrder": 1,
  "provenance": []
}
```

Cover every weapon type referenced by accepted starting weapon ranks and standard class weapon-rank caps, including swords, lances, axes, daggers/shuriken, bows/yumi, tomes/scrolls, staves/rods, dragonstones, and beaststones. Keep the existing canonical mechanical IDs; localized Hoshidan and Nohrian labels are display aliases, not separate weapon-type IDs.

Store deterministic local images under:

```text
src/games/fe14/assets/weapon_type_icons/
```

Resolve icons through a typed Vite asset resolver. JSON stores the stable asset ID, never a source URL or build-hashed URL. Missing icons must fail validation or tests instead of silently falling back to a Lucide glyph.

Do not build a full weapon model in this milestone.

## Route Selection and Scenario Resolution

Use canonical route order:

```text
Birthright
Conquest
Revelation
```

The route control must:

- include only routes legal for the current resolved unit and parent scenario;
- use stable route IDs as values and localized route names as labels;
- default to the first available route in canonical order;
- render a compact non-interactive route label when only one route is available;
- preserve the selected route while changing unrelated local controls when it remains legal;
- move to the first legal route when a parent or gender change makes the current route illegal;
- reset only route-dependent preview state that has become invalid;
- remain accessible by keyboard and expose the selected state to assistive technology.

An availability scenario may cover several routes. Do not duplicate it merely to make the selector easy to implement. The resolver selects the route join inside that scenario and links the corresponding base-stat snapshot through the existing availability ID relationship.

Resolve display-specific scenario class IDs through an explicit canonical mapping before joining class stats, class skills, or weapon-rank caps. In particular, `maid` and `butler` both join the existing `attendant` mechanical record while retaining the correct gendered label. Do not split the accepted `attendant` class domain merely to make this resolver work.

Route selection is not permission to erase other dimensions:

- inventory difficulty variants remain visible as conditional values when difficulty is not selected;
- Corrin gender, boon, bane, and Talent continue to affect the resolved scenario where applicable;
- Felicia and Jakob retain their Avatar-gender recruitment branches;
- retained-training, temporary departure, My Castle scaling, and DLC recruitment notes remain attached to the selected route state;
- offspring parent choices are intersected with the selected route;
- offspring story-position and Offspring Seal data remain typed even though this milestone does not add a recruitment-chapter selector.

If route plus the existing unit-specific controls cannot select one truthful starting state, return an explicit conditional result. Render the condition compactly; never pick an arbitrary scenario or merge incompatible values.

## Base-Configuration Layout

Build one reusable base-configuration surface for ordinary, Corrin, and offspring profiles. Reuse small stat and bonus primitives where that improves consistency, but do not force every exceptional unit into one giant component.

The profile order is:

1. existing unit header and applicable warnings;
2. unit-specific configuration controls, including Corrin or offspring parent controls;
3. route control and compact recruitment context;
4. horizontal joining-stat array;
5. horizontal growth-rate array with the effective/individual toggle;
6. adjacent Inventory and Skills columns;
7. weapon-level chart;
8. compact cap-modifier, Attack Stance, and Guard Stance sections;
9. Accessible class skills;
10. any genuinely independent class-access fact;
11. supports, seal grants, notes, and references.

The compact recruitment context must identify at least route, chapter/timing or recruitment trigger, starting class, and level. Preserve important scenario warnings near the value they qualify.

Do not remove supports, seal previews, alerts, recruitment caveats, source references, or JSON inspection behavior as a side effect of this layout work.

## Joining-Stat Array

Render stats in the shared order:

```text
HP, Str, Mag, Skl, Spd, Lck, Def, Res
```

Use one horizontal one-dimensional array with a stat label and value for each stat. It may wrap into two balanced rows on narrow screens, but it must not become a clipped desktop table.

For fixed first-generation snapshots, display the route-resolved joining values. Continue to apply Corrin boon and bane base deltas at runtime.

For scaled castle recruits, display the selected route's accepted minimum or resolved baseline and retain the scaling explanation. Do not invent unresolved weapon-rank milestones.

For offspring, display `level10MinimumStatsBeforeInheritance` as the baseline and label it clearly:

```text
Minimum recruitment stats before parent inheritance
```

Do not present `level10PersonalBases` as final joining stats. Do not calculate a final inherited line unless both parents' actual gained-stat snapshots are explicitly supplied by a future configuration surface.

## Growth-Rate Array

Render growths in the same stat order as joining stats.

Provide a two-state control:

```text
Effective
Individual
```

`Effective` is selected by default. The control is local presentation state in this milestone and is not persisted.

- Individual first-generation growths come from `unit-growths.json`, with Corrin deltas applied where selected.
- Individual offspring growths come from the resolved parent scenario.
- Effective growths add the selected starting class's canonical growth vector.
- Changing route, Corrin configuration, child gender, parent, or nested parent updates both arrays from the same resolved configuration.

Use percentage labels that remain readable without relying on color alone. Preserve half-point values.

## Inventory and Starting Skills

Render Inventory and Skills as adjacent columns at desktop widths and a single-column stack on narrow screens.

Inventory:

- comes from the selected availability or child recruitment record;
- keeps difficulty-specific variants explicit;
- uses existing stable item IDs and readable display labels;
- shows a deliberate empty state such as `None` rather than an empty list;
- does not add item icons or weapon-detail metadata.

Skills:

1. show the personal skill first with its local icon, name, and description;
2. follow with every class skill known at the selected recruitment state;
3. use canonical class-skill IDs and the existing local class-skill assets;
4. label conditional story-scaling or Offspring Seal skills rather than presenting them as guaranteed minimum skills;
5. deduplicate a skill if more than one acquisition path explains it;
6. preserve source or condition details in the resolved model even when the compact row shows only a short badge.

Derive a class skill from verified class, level, promotion, and automatic-learning rules only when those inputs prove it is known. A promoted class level does not by itself authorize inventing an earlier skill history. Add a small scenario-level learned-skill override only when verified recruitment data requires it; keep canonical skill metadata in `class-skills.json`.

For castle recruits whose automatic learned skills scale but exact thresholds are unresolved, show only the verified minimum set plus an explicit unresolved scaling note.

For offspring, distinguish minimum pre-Offspring-Seal skills from later automatically learned Offspring Seal skills already represented by recruitment timing.

## Weapon-Level Chart

The selected starting class's `weaponRankCaps` defines the usable weapon types. The resolved starting snapshot defines the current rank and any accepted progress toward the next rank.

For each usable type, show:

- local weapon-type icon;
- display label;
- current rank;
- class rank cap;
- accepted progress when available;
- an explicit unknown state when the current rank is unresolved.

Do not omit a usable type merely because the unit currently has no recorded rank. Do not display weapon types the selected class cannot use. Do not treat a rank cap as the current rank.

Use a compact accessible chart or aligned list, not a graphical canvas. Rank and text must convey the result without icon color. Preserve FE14 rank ordering in validation and display.

## Cap and Stance Summaries

Separate these into three compact sections:

- Cap modifiers;
- Attack Stance bonuses;
- Guard Stance bonuses.

Cap modifiers remain the unit's personal modifier vector, including resolved Corrin or offspring changes. They are not class maximum stats and must not be mislabeled as final caps.

Preserve the accepted no-support and C/B/A/S stance semantics. The compact presentation may use aligned rank rows or arrays, but it must retain every rank and every non-zero stat contribution. Do not collapse cumulative versus delta semantics into an ambiguous final number.

## Accessible Class Skills and Identity Cleanup

Keep `UnitClassSkills` as the primary class-access presentation. It must continue to react to Corrin Talent, selected offspring parentage, and support seal previews.

Remove redundant `Native class access` / `Resolved class access` markup when the same information is already explained by Accessible class skills and its source labels.

Retain genuinely independent facts that the class-skill cards do not communicate. At minimum, preserve:

- Female Corrin Talent-only access where it is mechanically distinct;
- class inheritance fallback or failure notes;
- route-specific Noble promotion information;
- selected-parent inheritance explanations;
- exceptional restrictions and warnings.

Do not move the personal skill back into a generic Identity section; it belongs in the starting Skills column.

## Offspring Behavior

The route control and parent selector describe one shared resolved offspring scenario.

- Parent options must be legal on the selected route.
- If a parent change removes the selected route, move to the first legal route and explain the resulting selection through normal control state.
- Child gender, Corrin boon/bane/Talent, nested offspring parentage, inherited classes, supports, tags, cap modifiers, growths, stance bonuses, and Accessible class skills continue to resolve together.
- Joining stats use the minimum-before-inheritance row.
- Parent inheritance formulas and walkthroughs may remain available as explanatory material, but they must not dominate the compact starting-state surface.
- Story-position levels and Offspring Seal results remain visible as conditional recruitment information, not as a falsely selected final state.

Kana's existing high-risk warning and exceptional inheritance handling must remain intact.

## Accessibility and Responsive Behavior

- Use native buttons, radio controls, or Bootstrap controls with visible labels and focus states.
- Do not use color alone to distinguish selected routes, growth modes, ranks, or warnings.
- Give all local icons stable dimensions; icons are decorative when an adjacent text label names the same concept.
- Keep route and growth controls usable by keyboard.
- Preserve logical heading order after removing old sections.
- Avoid nested responsive tables for the compact stat arrays.
- Verify no horizontal page overflow at representative phone, tablet, and desktop widths.
- Ensure long skill names, inventory variants, route notes, and stance values wrap without overlapping controls.

## Validation and Reporting

Extend the FE14 validator so it reports:

- class records missing growth rates, maximum stats, or weapon-rank caps;
- invalid stat keys or class-growth values;
- class IDs referenced by selected starting states but missing from class stats;
- unknown weapon-type IDs in class caps or unit weapon ranks;
- invalid FE14 ranks or rank-cap regressions;
- weapon-type records with missing labels, duplicate IDs, duplicate display order, or missing icon asset IDs;
- missing, empty, or non-image weapon-type icon files;
- weapon-icon manifest entries with duplicate destinations;
- availability scenarios that cannot resolve a linked base-stat snapshot when one is required;
- route joins that produce no base configuration;
- scenarios where route resolution remains ambiguous without an explicit condition;
- learned starting skill IDs that do not resolve;
- learned class skills inconsistent with the selected class, level, or documented override;
- offspring minimum-base records missing any stat;
- normalized/runtime class-stat count mismatches;
- effective-growth calculations that use copied or missing class-growth data.

Add a concise summary with:

- units with route-driven configurations;
- resolved route states;
- conditional route states;
- classes with complete growth/cap/rank data;
- weapon types and resolved icons;
- starting skill sets;
- unresolved starting skill or weapon-rank conditions;
- validation errors and warnings.

## Tests

Add focused tests for:

- canonical route order and available-route filtering;
- one-route units rendering a non-interactive route label;
- a shared availability scenario resolving distinct route joins without duplicated data;
- Silas switching among distinct Birthright, Conquest, and Revelation starting states;
- Flora switching route-specific level/scaling context without inventing weapon-rank milestones;
- Felicia and Jakob retaining Avatar-gender scenario conditions;
- Corrin route, gender, boon, bane, and Talent changes updating one shared configuration;
- offspring parent options intersecting with route availability;
- route fallback when a parent selection makes the current route illegal;
- Kana and nested offspring-parent scenarios;
- individual versus effective growth calculations;
- effective growth default selection;
- half-point offspring growth preservation;
- all standard classes having canonical growths, maximum stats, and weapon-rank caps;
- Maid and Butler scenarios resolving the canonical Attendant mechanics while retaining gendered labels;
- child generation consuming normalized class growths rather than a duplicate hard-coded table;
- personal skill rendering first in the Skills column;
- verified learned class skills rendering once and in acquisition order;
- conditional Offspring Seal and castle-recruit skill messaging;
- weapon chart coverage for every usable type in a selected class;
- local weapon-icon resolution failures;
- current weapon rank remaining distinct from class rank cap;
- offspring minimum-before-inheritance stat labeling;
- cap modifier and stance semantic preservation;
- Accessible class skills still reacting to Corrin, offspring, and seal-preview changes;
- redundant Identity/class-access markup being absent while independent exception notes remain;
- unit JSON inspection, unit routing, navigation, supports, seal previews, and reference regressions;
- deterministic runtime generation;
- keyboard-operable route and growth controls;
- responsive layouts without horizontal page overflow.

Run:

```text
npm run data:validate
npm run data:build
npm run typecheck
npm test
npm run build
```

Start the local frontend after implementation and visually inspect representative profiles on desktop and mobile viewports:

- one all-route first-generation unit with different route states, such as Silas;
- Corrin;
- Felicia or Jakob;
- one route-limited unit;
- one scaled castle recruit, such as Flora;
- one ordinary offspring;
- Kana.

## Implementation Sequence

1. Inventory the current unit-profile sections, route selection paths, class-growth inputs, weapon types, and learned starting-skill coverage.
2. Produce a gap report before changing normalized data.
3. Add accepted Hoshidan and Nohrian class growths to `class-stats.json` and field-level source provenance.
4. Remove duplicate canonical class-growth ownership from offspring generation and consume the normalized class-stat domain.
5. Add the minimal weapon-type registry, icon-source manifest, local assets, and asset resolver.
6. Extend schemas and validation for complete class stats, weapon types, icons, ranks, and route-state joins.
7. Implement and test the shared route-driven base-configuration resolver.
8. Add explicit starting-skill derivation and only the minimum verified scenario overrides required by source data.
9. Build the route selector and compact recruitment context.
10. Build the horizontal joining-stat and toggled growth arrays.
11. Build the Inventory / Skills columns and the weapon-level chart.
12. Split cap modifiers, Attack Stance, and Guard Stance into compact sections.
13. Integrate ordinary first-generation profiles, then Corrin, then offspring profiles through the shared resolver.
14. Add an offspring recruitment-level/story-position slider beside the parent and level context. Derive its earliest selectable chapter from the later available parent on the selected route, with Jakob explicitly defaulting to the earliest supported child-paralogue timing. Use it to update level-only pre-inheritance stats, weapon ranks, and automatically learned skills; show the child's unchanged pre-parent growth before parent-resolved Individual and Effective growths; and relocate the parent-growth breakdown beside the level control.
15. Remove redundant Identity/class-access markup while preserving independent exception notes.
16. Add tests, run the complete verification suite, and inspect responsive rendering.
17. Update the release log only when the user requests patch notes or release preparation.

## Acceptance Criteria

- Every accepted playable unit exposes a truthful route-driven base configuration.
- Route changes update the complete configuration through one shared resolver.
- No duplicated per-route configuration dataset is introduced.
- All standard playable class records contain accepted growths, maximum stats, and weapon-rank caps.
- Effective growths derive from resolved individual growths plus one canonical class-growth vector and display by default.
- Joining stats and growths use compact, consistently ordered arrays.
- Inventory and Skills render as adjacent columns on desktop and stack cleanly on mobile.
- Personal skills appear first and verified learned class skills follow without duplication.
- Every usable starting weapon type appears in the weapon chart with a local icon, current rank or explicit unknown state, and class cap.
- Cap modifiers remain distinct from class maximum stats.
- Attack and Guard Stance retain their accepted rank semantics.
- Accessible class skills remain the primary class-access presentation.
- Redundant Identity/class-access markup is removed without losing Female Corrin Talent-only access or other independent exceptions.
- Offspring profiles label and display minimum recruitment stats before parental inheritance.
- Difficulty, timing, gender, parentage, and other scenario conditions remain typed and are never silently discarded.
- Existing supports, seal previews, alerts, references, routing, and unit JSON inspection continue to work.
- The static application adds no backend or runtime network dependency.
- Data validation, runtime generation, typecheck, tests, production build, and visual inspection pass.

## Stop Conditions

Stop and ask the user before continuing if:

- route plus the existing unit-specific controls cannot resolve a truthful starting state without adding a new general scenario selector;
- a class growth vector cannot be corroborated or conflicts materially with accepted offspring calculations;
- an existing class maximum stat or weapon-rank cap conflicts with the approved source tables;
- the current class ID abstraction cannot represent a verified gender-specific mechanical difference;
- exact starting learned skills cannot be established without inventing promotion history;
- weapon-type icons have no acceptable source or unresolved redistribution constraints;
- a requested icon requires adding a new dependency or generating replacement game artwork;
- implementing effective growths would require storing duplicated totals in normalized unit data;
- offspring minimum recruitment stats cannot be separated cleanly from parent inheritance inputs;
- preserving route, difficulty, timing, or parent conditions would require silently selecting an arbitrary scenario;
- removing the old Identity section would discard an independent mechanic not represented by Accessible class skills;
- the route-driven resolver requires the deferred IndexedDB/run-plan persistence milestone to function;
- unrelated worktree changes make safe implementation impossible.

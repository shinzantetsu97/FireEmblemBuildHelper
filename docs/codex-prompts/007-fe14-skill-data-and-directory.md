# Milestone 7 - FE14 Skill Data, Icons, and Directory

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

Treat the accepted first- and second-generation unit data as the starting contract. Do not regress accepted personal-skill wording, class access, child inheritance, class stats, or class-tree behavior while adding skill data.

This is a curated static-data and frontend milestone. The public application must remain a static React + TypeScript site. Do not add a backend API, SQLite runtime dependency, hosted account system, or network dependency for viewing skill data.

## Branch Workflow

The planning document is written on `main` by explicit user instruction. Implementation is approved for a new branch named:

```text
feature/fe14-skill-data
```

Before implementation:

1. Show `git branch --show-current`.
2. Show `git status --short`.
3. Preserve all existing user changes, including the pending roadmap backlog note.
4. Create and switch to `feature/fe14-skill-data`.
5. Do not reset, stash, revert, commit, push, merge, or prune unless explicitly requested.

## Goal

Create the FE14 standard class-skill foundation, import local class-skill and personal-skill icons, connect class skills to the existing class hierarchy, replace generic personal-skill glyphs on unit profiles, and add a usable class-skill directory.

The milestone succeeds when:

- every standard non-DLC Hoshidan and Nohrian class skill has a stable canonical record;
- every class-skill record includes its localized English name, source-backed description, local icon asset ID, and class/level acquisition rules;
- shared skills are represented once and can have multiple acquisition edges;
- every playable unit's personal skill has one locally stored source icon;
- accepted personal-skill effects remain intact unless a separately reviewed correction is required;
- class-tree, class-stat, and class-skill files cross-reference one another through stable class IDs;
- generated runtime data exposes a convenient class-to-skills join without duplicating canonical authoring data;
- first- and second-generation unit profiles render the actual personal-skill icon instead of a generic Lucide glyph;
- `/FE14/Skills` presents the complete standard class-skill directory with faction and class-tree controls;
- the same class-skill browser is reusable inside unit profiles and shows only classes currently available to that resolved unit;
- validation, tests, typecheck, build, and responsive visual checks pass.

## Locked Data Architecture Decision

Do not create one giant hand-authored class JSON file.

Keep normalized domains separate:

- `class-trees.json` owns class hierarchy and class affiliation;
- `class-stats.json` owns class tiers, maximum stats, and weapon-rank caps;
- new `class-skills.json` owns canonical class-skill metadata and acquisition edges;
- `personal-skills.json` owns unit personal-skill metadata and icon asset IDs;
- a source manifest owns remote icon URLs and local asset destinations.

Join these domains during runtime generation. The frontend may consume an enriched class directory with stats, promotions, and skills already attached, but that object is generated output rather than a second canonical source.

This separation is required because skill acquisition is many-to-many. Examples include:

- Locktouch from Ninja and Outlaw;
- Beastbane from Kitsune and Wolfskin;
- Grisly Wound from Nine-Tails and Wolfssegner;
- shared Monk and Shrine Maiden skills;
- skills shared by Maid and Butler;
- gender-specific Troubadour level-10 skills.

Never duplicate a canonical skill record merely because two classes teach it.

## Approved Source Pages

Use these Serenes Forest pages as the milestone's primary extraction source:

### Standard class skills

- Hoshidan class skills: `https://serenesforest.net/fire-emblem-fates/hoshidan-classes/class-skills/`
- Nohrian class skills: `https://serenesforest.net/fire-emblem-fates/nohrian-classes/class-skills/`

The source inventory currently contains 58 Hoshidan table rows and 51 Nohrian table rows. Duplicate skill names across the pages should collapse to approximately 106 unique standard class skills after acquisition edges are normalized. Treat those counts as extraction expectations, not as substitutes for validation.

### Personal-skill icons

- Hoshidan characters: `https://serenesforest.net/fire-emblem-fates/hoshidan-characters/personal-skills/`
- Nohrian characters: `https://serenesforest.net/fire-emblem-fates/nohrian-characters/personal-skills/`
- Other and DLC characters: `https://serenesforest.net/fire-emblem-fates/other-characters/personal-skills/`

Together, these pages cover the 69 playable roster slots, including Fuga and Anna. Shared rows repeated across route pages must reuse one icon asset rather than creating route-specific copies.

Record Serenes Forest page and image URLs in source provenance. Do not hotlink runtime images from Serenes Forest; the static application must use checked local assets.

## Hard Scope Boundary

This milestone includes:

- standard Hoshidan and Nohrian class skills;
- stable skill IDs, English names, descriptions, icon asset IDs, class IDs, and acquisition levels;
- gender conditions where a class skill differs by unit gender;
- class affiliation needed by the requested directory filters;
- local PNG icon assets for standard class skills;
- local PNG icon assets for all accepted playable-unit personal skills;
- auditable icon-source metadata;
- normalized schema updates and cross-domain validation;
- generated runtime class-skill data and class-to-skills joins;
- reusable personal-skill presentation shared by first- and second-generation profiles;
- one reusable class-skill browser used by both the global directory and unit profiles;
- a class-skill directory, route, navigation entry, responsive styling, and focused tests.

This milestone excludes:

- DLC, Amiibo, Cipher, enemy-only, and downloadable-item skills;
- Other/DLC class-skill records from Serenes Forest's Other Classes page;
- executable combat simulation for skill effects;
- automatic build optimization;
- skill purchasing costs and My Castle pricing rules;
- skill inheritance legality beyond preserving the existing offspring restrictions;
- saved skill loadouts or IndexedDB planner state;
- translation infrastructure or a new locale;
- rewriting accepted personal-skill descriptions merely to match shorter source prose;
- class portraits, class sprites, or newly generated skill artwork.

Anna and Fuga's personal skills remain in scope because they are accepted playable units. DLC class skills remain out of scope.

## Class-Skill Normalized Model

Create:

```text
data/normalized/fe14/class-skills.json
```

Use one canonical record per unique skill. A candidate shape is:

```json
{
  "gameId": "fe14",
  "scope": "standard_non_dlc",
  "skills": [
    {
      "id": "locktouch",
      "names": {
        "en": "Locktouch"
      },
      "description": "User can open doors and chests without requiring keys.",
      "iconAssetId": "locktouch",
      "acquisition": [
        {
          "classId": "ninja",
          "level": 1
        },
        {
          "classId": "outlaw",
          "level": 1
        }
      ],
      "provenance": []
    }
  ]
}
```

Final schema decisions:

- `id` is a stable snake-case canonical skill ID.
- `names.en` stores the localized English skill name.
- `description` stores a source-backed human-readable effect, not executable rule code.
- `iconAssetId` matches the local icon filename without its extension.
- `acquisition` is an array because one skill may be learned by multiple classes.
- each acquisition edge stores `classId` and `level`;
- an acquisition edge may include `gender` only when required by the game, such as gendered Troubadour skills;
- source cost is not stored in this milestone;
- source footnotes that materially change the description must be incorporated into prose or an explicit skill note.

Do not put `skillIds` into normalized class trees as a second source of truth. Generate class-to-skill indexes from acquisition edges and validate every referenced class ID.

## Class Hierarchy and Affiliation

Extend `class-trees.json` conservatively so every displayed class node has:

- stable class ID;
- display label;
- affiliation: `hoshidan`, `nohrian`, or `special`;
- base-to-promotion hierarchy where applicable.

Affiliation belongs to the individual class node, not only to the tree. The Nohr Prince tree contains both Nohr Noble and Hoshido Noble, so a tree-level faction flag would be incorrect.

Preserve the existing 22 standard non-DLC base trees. Add only the minimum representation needed for standard special classes that teach skills but do not follow an ordinary two-promotion tree, such as Songstress. A class with no children may appear as a leaf parent in the directory.

Keep existing canonical abstractions such as `attendant` for Maid / Butler unless a verified skill condition requires a more precise acquisition edge. Do not split class IDs merely for display convenience.

Runtime generation should derive:

```ts
skillsByClass: Record<ClassId, ClassSkillAcquisition[]>
```

and may emit enriched class-tree nodes for direct frontend use. Validation must prove that the generated join is complete and deterministic.

## Icon Assets and Extraction Manifest

Create these directories:

```text
src/games/fe14/assets/class_skill_icons/
src/games/fe14/assets/personal_skill_icons/
```

Store one icon per canonical skill ID:

```text
src/games/fe14/assets/class_skill_icons/locktouch.png
src/games/fe14/assets/personal_skill_icons/supportive.png
```

Use the original source PNG when available. Preserve transparency and native pixel content. Do not upscale, redraw, sharpen, or convert icons merely for visual uniformity.

Create an auditable source manifest outside normalized runtime data. It must record at least:

- skill ID;
- skill type: `class` or `personal`;
- source page URL;
- direct source image URL;
- local destination path.

The import workflow must be repeatable and must not introduce a new application dependency. If structured HTML extraction is unavailable in the existing toolchain, maintain a checked explicit manifest rather than relying on fragile runtime scraping.

The app must never fetch these assets from Serenes Forest at runtime.

Use a Vite asset resolver, such as a typed `import.meta.glob`, so JSON stores stable asset IDs rather than build-hashed URLs. Missing asset IDs must fail tests or validation instead of silently falling back to the generic icon.

## Personal-Skill Integration

Extend each accepted `personal-skills.json` record with `iconAssetId`.

Serenes Forest is approved for icon extraction, English names, and effect corroboration. Existing reviewed effect wording remains canonical where this project already records a more precise or corrected interpretation. This explicitly protects reviewed cases such as:

- Oboro's Nohr-related class/origin condition;
- Kagero's reflected damage and debuff wording;
- Caeldori's Prodigy comparison;
- Odin's localized personal-skill note;
- other unit-specific corrections accepted during milestones 5 and 6.

Create one reusable personal-skill component and use it in both ordinary and offspring profile layouts. Replace the current generic `ShieldCheck` glyph with the resolved local personal-skill icon.

The icon is decorative when the skill name is visible, so use empty alternative text and retain the skill name as accessible text. Give the image stable dimensions so loading and hover states cannot move the layout.

Do not add icon paths directly to unit identity records. Units continue to reference personal skills through `personalSkillId`.

## Skill Directory

Add:

```text
/FE14/Skills
```

Add a clear `FE14 Skills` navigation entry using the existing icon library. Preserve `/FE14/Units`, unit detail routes, Notes, the homepage, and GitHub Pages deep-link behavior.

The directory in this milestone displays all standard class skills. Personal skills remain unit-specific and are enhanced on unit profiles; they are not mixed into the class-filtered directory. In this page, `All` means all standard non-DLC class skills.

## Reusable Class-Skill Browser

Build the directory controls and results as one reusable FE14 class-skill browser rather than page-specific markup.

The component accepts resolved data and scope inputs such as:

```ts
type ClassSkillBrowserProps = {
  availableClassIds: ReadonlySet<string>;
  classTrees: ClassTree[];
  skillsByClass: SkillsByClass;
  scope: "directory" | "unit-profile";
};
```

The exact prop names may follow local conventions, but the ownership rule is fixed:

- the global `/FE14/Skills` page passes every standard non-DLC class ID;
- a unit profile passes only class IDs available to that currently resolved unit;
- the browser filters, folds, selects, and displays those inputs;
- the browser does not independently calculate class inheritance, Corrin Talent outcomes, seal fallbacks, or offspring parentage.

Unit-profile availability must come from the same accepted class-access and scenario-resolution logic already used by the profile. It may include, where applicable:

- starting and native class trees;
- Heart Seal class trees;
- resolved inherited classes;
- the currently selected Corrin Talent;
- legal Friendship Seal and Partner Seal outcomes represented by the profile;
- gender-specific and route-specific class substitutions;
- the selected offspring parent and nested-parent configuration.

Do not show unrelated global classes inside a unit profile. For Corrin and offspring, changing a relevant profile control must update the available class list and skill browser without requiring navigation or a page reload.

Keep skill-browser UI state local to each rendered instance during this milestone. Durable layout, visibility, build, and selection persistence remain part of the later shared IndexedDB configuration boundary unless explicitly expanded by the user.

### Faction filter

Provide a segmented control with:

```text
All
Hoshidan Class
Nohrian Class
Special Class
```

Use `Nohrian`, not `Norhian`.

Filtering operates on acquisition class affiliation. A shared skill remains visible whenever at least one currently included class teaches it.

`Special Class` is an overlapping class-tree category rather than a replacement affiliation. It contains the complete Nohr Prince / Princess, Songstress, Villager, Kitsune, and Wolfskin trees. Villager and Kitsune remain Hoshidan; Wolfskin remains Nohrian; the mixed Noble promotion affiliations remain unchanged.

### Foldable class tree

Provide an accessible foldable class selector:

- base classes are parent rows;
- promoted classes are indented child rows;
- parent rows have a disclosure control that expands or collapses their children;
- every class row has a checkbox on the left;
- checking a class shows skills learned specifically by that class;
- unchecking it hides those skills;
- collapsing a parent hides child controls but does not erase their checked state;
- faction filtering preserves each class's checked state;
- all classes begin checked so the initial page displays the complete selected faction;
- standalone classes render as leaf parent rows.

In unit-profile scope, prune the tree before rendering so only available classes and their available descendants appear. Do not render disabled rows for classes the unit cannot access. Preserve the same parent/child visual hierarchy for the remaining nodes.

The disclosure and checkbox are separate controls. Clicking the disclosure must not accidentally change skill visibility.

### Skill results

Each visible skill entry shows:

- local skill icon;
- skill name;
- description;
- learning class;
- learning level;
- gender condition when applicable.

When one skill is taught by multiple selected classes, display one skill entry with all applicable acquisition badges rather than duplicate cards.

Use an unframed, scan-friendly directory rather than nested cards. Keep controls compact, labels readable, and icon dimensions stable. Verify desktop and mobile layouts for overflow and incoherent overlap.

## Source Reconciliation Rules

Before accepting extracted data:

- normalize typographic apostrophes and punctuation without changing meaning;
- preserve localized skill names used by the English release;
- map source class labels to existing canonical class IDs;
- reconcile `Nohr Prince(ss)`, Maid / Butler, Monk / Shrine Maiden, and gendered Troubadour labels explicitly;
- collapse repeated canonical skills only when names, icons, and descriptions represent the same game skill;
- preserve separate records for similarly named skills with different effects;
- record material source footnotes, including debuff recovery and battle-skill definitions, where they affect interpretation;
- do not infer DLC or enemy skill coverage from icon numbering.

If Serenes Forest conflicts with an already accepted unit-specific interpretation, preserve the accepted wording and record the source disagreement rather than silently reverting it.

## Validation and Reporting

Extend the FE14 schema and validator so it reports:

- duplicate class-skill IDs;
- duplicate personal-skill IDs;
- missing or malformed names and descriptions;
- acquisition edges that reference unknown class IDs;
- invalid levels or gender conditions;
- classes with no skill mapping when the source says they teach skills;
- orphan skill records;
- duplicate acquisition edges;
- missing icon asset IDs;
- missing, empty, or non-PNG icon files;
- icon manifest entries with duplicate destination paths;
- personal skills without exactly one playable unit owner;
- playable units whose personal-skill icon cannot be resolved;
- normalized/runtime join count mismatches;
- accidental DLC, Amiibo, or Cipher skill inclusion.

Add a compact extraction summary with:

- Hoshidan source rows;
- Nohrian source rows;
- unique class skills;
- class acquisition edges;
- personal-skill icons;
- missing icons;
- duplicate source images;
- validation errors and warnings.

## Tests

Add focused tests for:

- shared canonical skills with multiple acquisition edges;
- Hoshidan and Nohrian affiliation filtering;
- the mixed Nohr Prince promotion tree;
- gendered Troubadour acquisition;
- complete personal-skill icon coverage for all 69 roster slots;
- first-generation and offspring personal-skill icon rendering;
- global browser scope containing every standard class;
- unit-profile browser scope excluding unavailable classes;
- live class-skill updates when Corrin Talent or offspring parent selections change;
- reuse of the same browser implementation in global and unit contexts;
- class-tree disclosure behavior;
- independent class checkbox behavior;
- selected-state preservation while folding and changing faction filters;
- deduplicated skill results with multiple acquisition badges;
- `/FE14/Skills` direct routing and navigation;
- asset-resolution failures;
- deterministic runtime generation.

Run:

```text
npm run data:validate
npm run data:build
npm run typecheck
npm test
npm run build
```

Start the local frontend after implementation and visually inspect `/FE14/Skills` and representative first- and second-generation unit profiles on desktop and mobile viewports.

## Implementation Sequence

1. Inventory all source rows and image links from the two standard class-skill pages and three personal-skill pages.
2. Produce and review the extraction summary before normalizing data.
3. Create the icon-source manifest and local asset folders.
4. Download class-skill and personal-skill icons with deterministic filenames.
5. Add the class-skill schema and normalized records.
6. Extend class-tree nodes with labels and per-node affiliation without duplicating skill ownership.
7. Add personal-skill icon asset IDs while preserving accepted effects.
8. Add cross-domain validation and icon coverage checks.
9. Generate runtime `classSkills`, `skillsByClass`, and enriched class directory data.
10. Create the shared personal-skill presentation component and replace generic glyphs.
11. Build the reusable class-skill browser with a caller-supplied available-class scope.
12. Add `/FE14/Skills`, navigation, faction filtering, foldable class hierarchy, and deduplicated results using the complete standard class scope.
13. Embed the same browser in unit profiles using each profile's resolved available classes.
14. Add tests, run the complete verification suite, and inspect responsive rendering.
15. Update the release log only when the user requests patch notes or release preparation.

## Acceptance Criteria

- The normalized class-skill domain contains every standard non-DLC Hoshidan and Nohrian class skill from the approved pages.
- Shared skills exist once with all verified acquisition edges.
- All acquisition class IDs resolve to the class hierarchy.
- All 69 playable personal skills resolve to local icons.
- No unit profile uses the generic personal-skill glyph.
- Accepted personal-skill effect corrections are preserved.
- Class skills and personal skills use deterministic local PNG assets.
- `/FE14/Skills` supports all four requested faction/category modes.
- Unit profiles reuse the same class-skill browser and never show classes outside the unit's resolved access set.
- Corrin and offspring class-skill options react to their current profile selections.
- Base classes and promoted classes are presented as an accessible foldable hierarchy.
- Class checkboxes independently show and hide their skills.
- Multi-class skills are deduplicated and show all applicable acquisitions.
- No DLC, Amiibo, Cipher, or enemy-only class skills enter the standard directory.
- Normalized data remains separated by ownership domain and runtime data is generated from validated joins.
- Data validation, runtime generation, typecheck, tests, production build, and visual inspection pass.

## Stop Conditions

Stop and ask the user before continuing if:

- a source row cannot be mapped to an existing or minimally extended canonical class ID;
- two source pages use the same skill name or icon for materially different effects;
- an expected personal-skill icon is missing from all approved pages;
- icon extraction would require adding a new dependency;
- implementing the requested class hierarchy would require a broad rewrite of accepted class-access data;
- the user intends `All` to include personal skills in the directory rather than all standard class skills;
- source usage or asset redistribution presents an unresolved licensing constraint;
- unrelated worktree changes make safe implementation impossible.

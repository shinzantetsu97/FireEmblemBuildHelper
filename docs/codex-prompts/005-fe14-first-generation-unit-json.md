# Milestone 4 - FE14 First-Generation Unit JSON Foundation

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
- `docs/PARENT_UNIT_JSON_PLAN.md`

Treat the approved data-foundation and parent-unit plans as the design contract. If implementation reveals that the proposed shape cannot represent a verified Fates rule, document the conflict and ask before making a materially different architecture decision.

Do not proceed to child units, child inheritance, frontend unit views, build planning, combat calculation, or bulk workbook ingestion.

## Branch Workflow

Before making code, data, dependency, or generated-file changes:

1. Show `git branch --show-current`.
2. Show `git status --short`.
3. Ask the user whether this milestone should use a new branch unless a branch has already been explicitly approved for this milestone in the current conversation.
4. Preserve `火纹if.xlsx` and all existing uncommitted docs or user changes.
5. Do not reset, stash, revert, commit, push, merge, or delete branches unless explicitly requested.

## Goal

Create validated normalized JSON for the complete first-generation playable roster represented by the workbook's 48 parent-generation character sheets.

Enter and validate units one at a time. Felicia is the first golden unit. Corrin is the final unit because Corrin adds gender, boon, bane, talent, route, support, and inheritance-adjacent variability that should not define the initial schema prematurely.

The milestone succeeds when every approved first-generation unit has reviewable normalized records, source provenance, validation coverage, and a generated runtime representation, while no child unit data has entered the normalized dataset.

## Terminology

"Parent unit" in this milestone means a first-generation playable unit. It does not assert that the unit can produce a child in every route or pairing.

Use:

```json
{
  "generation": "first"
}
```

Actual parent capability is derived from validated support and child rules in a later milestone.

## Hard Scope Boundary

This milestone includes:

- the first-generation roster manifest;
- source catalog records needed by this slice;
- canonical unit IDs and aliases;
- core unit identity and flags;
- conditional recruitment scenarios;
- starting class, level, stats, inventory, and weapon ranks when sourced;
- personal skills as referenced descriptive records;
- personal growths;
- personal maximum-stat modifiers;
- innate and Heart Seal class-family access;
- support relationships;
- Friendship Seal and Partner Seal class grants;
- Attack Stance and Guard Stance support bonuses;
- provenance and review status;
- schemas, validation, reports, tests, and generated runtime JSON.

This milestone excludes:

- every child unit;
- child parent assignment beyond references needed to avoid accidental inclusion;
- child growth and cap calculations;
- class or skill inheritance by children;
- executable personal-skill effects;
- class-growth ingestion beyond references required to avoid duplication;
- combined personal-plus-class growth records;
- subjective workbook ratings, recommended roles, jokes, and builds;
- Amiibo units and experimental or mislabeled workbook tabs;
- frontend changes;
- correcting the raw workbook in place.

## Approved Sources

Use the source policy in `docs/DATA_FOUNDATION.md`.

Primary independent references:

- Serenes Forest;
- Fire Emblem Wiki at `fireemblemwiki.org`.

Specialized relationship references:

- [Fire Emblem Fates - Partner Seal Chart](https://drive.google.com/file/d/0B1EoYvI1FUNqZ3dpcjZwdU9CX0E/view?resourcekey=0-zq0JMUw2kAIcBfIeCmCR-A)
- [Fire Emblem Fates - Friendship Seal Chart version 1.2](https://drive.google.com/file/d/0B1EoYvI1FUNqaHhSd1pzUFJNSmc/view?resourcekey=0-kX2rTu6-3jF-6EDm8T7YXQ)

Raw project source:

- `火纹if.xlsx`

Do not use the Fandom-hosted wiki as verification evidence. Do not promote search-result snippets, forum posts, or unsourced build guides to canonical sources.

## Existing Tooling

No new dependency is expected.

Prefer the installed tools:

- Zod for runtime schemas and clear validation failures;
- TypeScript and `tsx` for data scripts;
- Vitest for focused data and generator tests.

Before adding any dependency, state the exact package, why the existing stack is insufficient, and wait for approval.

## Required Data Boundaries

Follow the proposed layout in `docs/PARENT_UNIT_JSON_PLAN.md`:

```text
data/
  raw/
    fe14/
      火纹if.xlsx
  sources/
    fe14/
      sources.json
  normalized/
    fe14/
      avatar-configurations.json
      class-trees.json
      units/
        first-generation.json
      unit-availability.json
      unit-base-stats.json
      unit-growths.json
      unit-cap-modifiers.json
      unit-pairup-bonuses.json
      support-relationships.json
      unit-class-access.json
      personal-skills.json
  reports/
    fe14/
      first-generation-progress.json
      first-generation-validation.json
      first-generation-validation.txt
  runtime/
    fe14/
      units.json
```

Small path adjustments are acceptable if the repository tooling requires them. Do not collapse raw sources, normalized inputs, reports, and runtime output into one directory.

The workbook may remain at the repository root until its move into `data/raw/fe14/` is explicitly reviewed. Do not create two independently edited copies.

## Schema and Script Structure

Create the smallest data-tooling structure that supports this milestone. A reasonable shape is:

```text
scripts/
  data/
    fe14/
      schemas.ts
      validate.ts
      generate-runtime.ts
      source-locators.ts
```

Add package scripts only when their exact implementation exists:

```text
data:validate
data:build
```

`data:validate` validates normalized source data and writes reports. `data:build` must validate first, then generate runtime data deterministically.

Do not make the React application import normalized or raw data directly. The frontend will eventually consume only generated runtime data.

## Bootstrap Before Unit Entry

Before entering Felicia, create only the shared foundation:

1. Source catalog schema and initial source records.
2. Shared ID, locale, route, stat, review-status, and source-reference schemas.
3. Domain schemas from `docs/PARENT_UNIT_JSON_PLAN.md`.
4. An explicit first-generation roster manifest containing 48 canonical IDs, English names, workbook sheet names, and processing order.
5. Empty normalized domain arrays that pass draft-mode schema validation.
6. Validation commands and focused schema tests.
7. A progress report initialized with every unit as `not_started`.

The roster manifest is an index, not pre-populated unit data. Do not bulk-fill growths, supports, recruitment, classes, or other facts during bootstrap.

References to later units are allowed only when their canonical IDs already exist in the roster manifest. This permits Felicia's support edges to reference Jakob, Flora, and others before those units receive their detailed records.

## One-Unit-at-a-Time Rule

Do not bulk-convert all workbook sheets. Do not paste a complete external table into normalized JSON and review it afterward.

Process exactly one current unit through the full gate below before starting the next unit.

Before entering a unit, read the FE14 canonical ordering reference. Keep every normalized JSON file ordered first by the record's available-route count (descending), then by canonical unit number (ascending). For unit-keyed records, use the roster unit's `availableRoutes.length`; for support relationships and seal grants, use the record's own `routes.length`, then the relevant partner's unit number. This includes records introduced for later units through relationships. Do not use processing order or a frontend sort as a substitute for maintaining readable source data.

For this milestone, [the Fire Emblem Wiki's first-generation character list](https://fireemblem.fandom.com/wiki/List_of_characters_in_Fire_Emblem_Fates) is the canonical directory-order reference. Store its stable directory number as `unitNo`. The review workflow's sequence is separately stored as `processingOrder`; it is not a license to reorder source JSON.

For each unit:

1. Mark only that unit `in_progress` in the progress report.
2. Inspect that unit's workbook sheet and record exact cell locators.
3. Resolve names and aliases to the approved canonical ID.
4. Enter core identity and unit flags.
5. Normalize each distinct recruitment scenario.
6. Enter starting stats, inventory, and weapon ranks tied to those scenarios.
7. Enter or reference the personal skill without inventing executable effects.
8. Enter personal growths and cap modifiers from applicable sources.
9. Enter unique support relationships.
10. Enter innate, Heart Seal, Friendship Seal, and Partner Seal class access with explicit origins.
11. Enter Attack Stance and Guard Stance support-rank bonuses when verified.
12. Classify workbook-only role, rating, joke, and build fields as editorial and exclude them from normalized facts.
13. Compare each applicable field against Serenes Forest and Fire Emblem Wiki.
14. Compare A+ and S class grants against the specialized charts.
15. Run validation focused on the current unit.
16. Run the current unit's focused tests.
17. Review the diff for only the current unit and shared records it legitimately introduced.
18. Mark the unit `accepted`, `disputed`, or `blocked` with a concise note and source coverage.

Do not mark a unit accepted merely because its JSON parses.

If sources materially disagree, mark the exact field disputed and stop before moving to the next unit unless the conflict can be resolved from a higher-confidence source under `DATA_FOUNDATION.md`. Do not silently choose a convenient value.

## Relationship Ownership While Processing Sequentially

Support relationships are unique undirected edges. Store each pair once with lexically sorted unit IDs.

When the current unit introduces a relationship to a later unit:

- create the edge once;
- source and validate the current unit's claim;
- allow the later roster ID to resolve through the manifest;
- when the later unit is processed, cross-check the existing edge instead of adding a reversed duplicate;
- update provenance or dispute status if the later source slice disagrees.

Class grants are separate directed records. A Felicia-to-Hana Friendship Seal grant and a Hana-to-Felicia grant may differ and must not be inferred as identical merely because the support edge is shared.

## Unit Completion Gate

A unit may be marked `accepted` only when:

- its canonical ID and aliases are resolved;
- its generation is `first`;
- applicable recruitment scenarios are explicit and non-overlapping;
- starting snapshots resolve to valid scenarios;
- personal growths have independent source coverage;
- cap modifiers have applicable source coverage;
- personal skill identity and prose are sourced;
- all known A+ and S relationships have unique edges;
- Heart, Friendship, and Partner Seal access are distinguished;
- class substitutions are explicit;
- pair-up bonus semantics and values are verified or explicitly reported as unresolved;
- every reference resolves;
- focused schema and domain tests pass;
- no child or editorial data leaked into normalized records;
- the progress report records sources, findings, and remaining limitations.

If a descriptive field such as native voice-actor spelling lacks sufficient coverage, it may remain `candidate` without invalidating independently accepted mechanical records. The progress report must make partial review status visible instead of flattening the entire unit to one misleading status.

## Ordered Unit Sequence

Process units in this exact order unless the user explicitly changes it. Corrin must remain last.

| Order | Canonical ID | English name | Workbook sheet | Group |
| ---: | --- | --- | --- | --- |
| 1 | `felicia` | Felicia | `菲利希亚` | [x] Golden unit |
| 2 | `jakob` | Jakob | `乔卡` | [x] Shared |
| 3 | `kaze` | Kaze | `凉风` | [x] Shared |
| 4 | `silas` | Silas | `塞拉斯` | [x] Shared |
| 5 | `azura` | Azura | `阿库娅` | [x] Shared |
| 6 | `mozu` | Mozu | `物集` | [x] Shared |
| 7 | `shura` | Shura | `阿修罗` | [x] Shared/special |
| 8 | `izana` | Izana | `伊邪那` | [x] Shared/special |
| 9 | `gunter` | Gunter | `玖塔` | [x] Nohr/special |
| 10 | `flora` | Flora | `芙洛拉` | [x] Nohr/special |
| 11 | `elise` | Elise | `艾丽泽` | [x] Nohr |
| 12 | `arthur` | Arthur | `哈罗德` | [x] Nohr |
| 13 | `effie` | Effie | `艾尔菲` | [x] Nohr |
| 14 | `odin` | Odin | `奥丁` | [x] Nohr |
| 15 | `niles` | Niles | `零` | [x] Nohr |
| 16 | `nyx` | Nyx | `纽克斯` | [x] Nohr |
| 17 | `camilla` | Camilla | `卡米拉` | [x] Nohr |
| 18 | `selena` | Selena | `露娜` | [x] Nohr |
| 19 | `beruka` | Beruka | `贝璐卡` | [x] Nohr |
| 20 | `laslow` | Laslow | `拉兹沃德` | [x] Nohr |
| 21 | `peri` | Peri | `皮埃利` | [x] Nohr |
| 22 | `benny` | Benny | `贝诺瓦` | [x] Nohr |
| 23 | `charlotte` | Charlotte | `夏洛特` | [x] Nohr |
| 24 | `leo` | Leo | `里昂` | [x] Nohr |
| 25 | `keaton` | Keaton | `弗拉内尔` | [x] Nohr |
| 26 | `xander` | Xander | `马库斯` | [x] Nohr |
| 27 | `rinkah` | Rinkah | `磷火` | [x] Hoshido |
| 28 | `sakura` | Sakura | `樱` | [x] Hoshido |
| 29 | `hana` | Hana | `风花` | [x] Hoshido |
| 30 | `subaki` | Subaki | `椿` | [x] Hoshido |
| 31 | `saizo` | Saizo | `才藏` | [x] Hoshido |
| 32 | `orochi` | Orochi | `大蛇` | [x] Hoshido |
| 33 | `hinoka` | Hinoka | `日乃香` | [x] Hoshido |
| 34 | `azama` | Azama | `浅间` | [x] Hoshido |
| 35 | `setsuna` | Setsuna | `刹那` | [x] Hoshido |
| 36 | `hayato` | Hayato | `月读` | [x] Hoshido |
| 37 | `oboro` | Oboro | `胧` | [x] Hoshido |
| 38 | `hinata` | Hinata | `日向` | [x] Hoshido |
| 39 | `takumi` | Takumi | `拓海` | [x] Hoshido |
| 40 | `kagero` | Kagero | `阳炎` | [x] Hoshido |
| 41 | `reina` | Reina | `夕雾` | [x] Hoshido/special |
| 42 | `kaden` | Kaden | `锦` | [x] Hoshido |
| 43 | `scarlet` | Scarlet | `克里姆森` | [x] Hoshido/special |
| 44 | `ryoma` | Ryoma | `龙马` | [x] Hoshido |
| 45 | `yukimura` | Yukimura | `幸村` | [x] Hoshido/special |
| 46 | `fuga` | Fuga | `风雅` | [x] Revelation/special |
| 47 | `anna` | Anna | `安娜` | [x] DLC |
| 48 | `corrin` | Corrin | `神威` | [x] Avatar; always last |

The English names and canonical IDs in this table are proposed roster identifiers. Validate aliases and workbook-sheet mappings during bootstrap, but do not reorder the unit sequence casually.

## Felicia as the Golden Unit

Felicia must prove every domain boundary before unit 2 begins.

Her normalized data must demonstrate:

- multilingual names and candidate voice-actor metadata;
- Dragon Vein false;
- a personal skill reference to `devoted_partner`;
- two recruitment scenarios conditioned on Avatar gender;
- scenario-specific level, inventory, and base stats;
- personal growths independent from Maid and Strategist class growths;
- personal cap modifiers with explicit sources;
- Troubadour-family base access and Mercenary-family Heart Seal access;
- unique A+ and S support edges;
- specific Friendship and Partner Seal class grants;
- Attack and Guard Stance rank bonuses;
- exclusion of workbook role and joke fields;
- source locators for each logical record group.

Do not begin Jakob until Felicia's focused validation and tests pass and her unresolved fields are visible in the progress report.

## Corrin as the Final Unit

Do not enter Corrin data, create Corrin-specific shortcuts, or weaken shared schemas for Corrin before unit 48.

When Corrin is reached, extend the existing model only as required to represent verified facts:

- player-selected gender;
- player-selected display name without changing the canonical unit ID;
- boon and bane effects on bases, growths, caps, and applicable pair-up behavior;
- selected talent and resulting class access;
- route-specific promoted class access;
- broad support eligibility and known exceptions;
- recruitment and starting-state changes across the opening chapters;
- source-backed variability relevant to first-generation unit data.

Corrin's future effect on Kana and other children remains out of scope. Store the parent-generation inputs needed later, but do not implement child outcomes.

Corrin-specific values should be represented as explicit configuration rules or modifiers, not as an explosion of precomputed Corrin variants.

## Personal Growth Rules

For every unit:

- store exactly one personal growth vector;
- use explicit stat keys;
- compare the workbook value against applicable Serenes Forest and Fire Emblem Wiki records;
- preserve each source reference;
- record disagreements by stat;
- never store class growth in the unit growth record;
- never copy workbook combined-growth rows into normalized data.

The known Kiragi discrepancy belongs to the later child milestone and must not be introduced into this dataset as a test fixture that accidentally imports a child.

## Personal Cap Modifier Rules

The workbook lacks a complete canonical cap-modifier source. For every first-generation unit:

- source the seven-stat modifier vector independently;
- compare Serenes Forest and Fire Emblem Wiki where both cover it;
- use specialized charts only as supplemental evidence unless their exact table is independently corroborated;
- require complete source references before accepting the modifier vector;
- do not calculate child modifiers in this milestone.

Corrin's modifier representation is deferred until unit 48 and must use boon/bane rules rather than one hardcoded neutral vector when the game behavior is variable.

## Recruitment Rules

Recruitment must use typed scenarios rather than prose such as `2 or 16`.

Each scenario may condition on:

- route;
- Avatar gender;
- chapter;
- difficulty;
- version or region;
- another verified unlock condition.

Starting class, level, stats, inventory, and weapon ranks must resolve through the same scenario ID. If two sources use different assumptions, do not merge their values until the conditions are understood.

## Class Access Rules

Store class access as directed records with explicit origins:

```text
base_class
heart_seal
friendship_seal
partner_seal
avatar_talent
dlc_item
amiibo
```

`parent_inheritance` is forbidden in this milestone.

Store base-class family IDs and derive promotions from class data. Do not store a workbook string containing several promoted classes as if it were one canonical class.

For each A+ and S grant:

- point to the specific granting unit;
- point to the corresponding support edge;
- state the required rank;
- state route and gender conditions;
- record duplicate-class or special-class substitution explicitly;
- cite the specialized chart and an applicable independent reference.

Do not import the workbook's `支援职业组` paragraph directly.

## Pair-Up Bonus Rules

The workbook presents C, B, A, and S values for Attack and Guard Stance. Before accepting the schema's `rankDeltas` interpretation:

1. Verify whether each cell is an incremental bonus granted at that rank or a cumulative total at that rank.
2. Verify the applicable support and stance rules from independent references.
3. Add a test that calculates cumulative bonuses for at least Felicia and one later unit.

If the semantics remain unclear, preserve the source values as disputed candidate data and stop rather than encoding a false rule.

## Personal Skills

This milestone stores:

- canonical personal-skill ID;
- localized names and aliases;
- source prose descriptions;
- source references and review status.

Do not turn prose into executable conditions and effects yet. Avoid confusing personal skills with class skills; Felicia's `Devoted Partner` and the Maid skill `Live to Serve` are a required regression case.

## Progress Report

Maintain `first-generation-progress.json` as the machine-readable checklist.

Each unit entry should contain at least:

```json
{
  "unitId": "felicia",
  "order": 1,
  "status": "accepted",
  "completedDomains": [
    "identity",
    "recruitment",
    "base_stats",
    "growths",
    "cap_modifiers",
    "personal_skill",
    "supports",
    "class_access",
    "pairup_bonuses"
  ],
  "sourceIds": [],
  "findings": [],
  "unresolved": []
}
```

Allowed processing statuses:

```text
not_started
in_progress
accepted
disputed
blocked
```

Only one unit may be `in_progress` at a time. Corrin cannot leave `not_started` until units 1 through 47 are no longer `not_started` or `in_progress`.

## Validation Reports

Generate:

- `first-generation-validation.json` for CI and tooling;
- `first-generation-validation.txt` for human review.

The reports must include:

- roster completion by ordered unit;
- domain completion by unit;
- record counts by review status;
- source coverage by unit and domain;
- source disagreements by exact field or relationship;
- mapped and excluded workbook sheets;
- unresolved aliases;
- broken references;
- duplicate supports or class grants;
- missing recruitment scenarios;
- missing growths or cap modifiers;
- editorial fields excluded from normalization;
- child-generation records detected anywhere in the milestone files;
- deterministic runtime-generation status.

Reports are generated artifacts. Do not hand-edit them to make validation appear clean.

## Tests

Add focused tests proportionate to the data risk.

### Shared Schema Tests

- Valid fixtures pass each domain schema.
- Unknown keys, malformed IDs, invalid enums, and incomplete stat vectors fail clearly.
- Accepted records without applicable source references fail.
- Child-generation records fail the milestone boundary validator.

### Roster Tests

- Exactly 48 approved first-generation IDs exist in the manifest.
- IDs and workbook sheet mappings are unique.
- Processing order is unique and continuous from 1 through 48.
- Felicia is first.
- Corrin is last.
- No child, Amiibo, or experimental sheet appears in the approved roster.

### Relationship Tests

- Reversed duplicate support pairs fail.
- A+ and S class grants require matching support edges.
- Directed class grants may differ while sharing one support edge.
- Route and gender conditions use known values.
- All roster references resolve even when the referenced unit is not yet fully processed.

### Stat Tests

- Personal growth vectors contain all eight stats.
- Cap modifier vectors contain exactly seven non-HP stats.
- Combined growths are absent from normalized inputs.
- Workbook totals are recomputed only in diagnostics.
- Known source disagreements appear in reports instead of being silently normalized.

### Golden Unit Tests

- Felicia has the two verified Avatar-gender recruitment scenarios.
- Each Felicia base-stat snapshot references the correct scenario.
- Felicia's personal growths remain independent from class growths.
- Felicia's support edges are unique.
- Felicia's seal grants have explicit origins and granting units.
- Felicia's pair-up bonuses produce the verified cumulative result.
- Felicia references `devoted_partner`, not `live_to_serve`.

### Runtime Generation Tests

- Generation fails when normalized validation fails.
- Repeated generation from identical inputs produces byte-identical runtime JSON.
- Runtime unit keys match the accepted roster records.
- Runtime records retain compact source IDs where required for explanation.
- No raw workbook prose or editorial recommendation leaks into runtime data.

## Per-Unit Verification Commands

Provide a focused validation mode before scaling beyond Felicia. A reasonable interface is:

```text
npm run data:validate -- --unit felicia
npm test -- <focused data-test path>
```

Use the actual supported command syntax once implemented. Do not claim a unit passed based on an unimplemented or ignored filter.

After each unit:

1. Run focused validation for that unit and shared relationships it changed.
2. Run the narrowest relevant tests.
3. Inspect the current unit's normalized diff and progress entry.
4. Confirm the generated report reflects any candidate or disputed fields.

Do not run a production frontend build after every unit. Run full project validation at meaningful checkpoints and at milestone completion.

## Checkpoints

Run broader validation after:

- bootstrap and schema completion;
- Felicia;
- the shared group through Izana;
- the Nohr group through Xander;
- the Hoshido group through Yukimura;
- Fuga and Anna;
- Corrin;
- final runtime generation.

At each checkpoint, report progress briefly and continue unless a source conflict, schema limitation, or user decision blocks the next unit.

## Final Verification

Run:

- the complete data validator;
- the complete data generator;
- the full Vitest suite;
- `npm run typecheck`;
- `npm run build`;
- `git diff --check`.

Inspect the final human-readable validation report and a sample of generated runtime records, including:

- Felicia;
- one shared unit;
- one Nohr unit;
- one Hoshido unit;
- one route-special unit;
- Corrin.

Confirm explicitly that no child unit appears in normalized or runtime files.

## Acceptance Criteria

- Shared schemas and validation tooling exist and are tested.
- The source catalog records every source used by the milestone.
- The roster manifest contains exactly the approved 48 first-generation units.
- Units were processed in the documented order, one at a time.
- Felicia is the first completed golden unit.
- Corrin is the final completed unit.
- Every approved unit has normalized identity, recruitment, personal growth, cap modifier, personal skill, support, class-access, and pair-up records or an explicit applicable/not-applicable determination.
- Source provenance and review status remain visible by logical record group.
- Supports are unique edges and seal grants are explicit directed relationships.
- Heart, Friendship, and Partner Seal access are not conflated.
- Class growths and combined growths are absent from unit personal-growth records.
- Editorial workbook material is excluded from canonical and runtime data.
- No child, child outcome, or parent-inheritance record is included.
- Validation reports contain no hidden or silently discarded errors.
- Runtime JSON is deterministic and generated only from validated normalized data.
- Data validation, tests, typecheck, build, and diff checks pass.

## Final Decisions and Delivered Extras

This section records the final, user-approved implementation decisions made while the roster was reviewed. The earlier scope language remains above as the historical starting contract; where this section differs, this section describes what was actually delivered for the completed milestone.

### Completed Data Scope

- All 48 first-generation units are present and marked `accepted`. Felicia remained the first golden unit, Anna remained the DLC unit immediately before Corrin, and Corrin remained the final processed unit.
- `unitNo` is the stable canonical directory number. `processingOrder` records the review sequence. These are intentionally separate.
- Human-readable normalized files are ordered first by applicable route count, descending, and then by canonical unit number. Runtime sorting is not used as a substitute for readable source data.
- The normalized boundary expanded by two files: `class-trees.json` stores the non-DLC base-class promotion map used by class-access explanations, and `avatar-configurations.json` stores Corrin's variable gender, boon, bane, Talent, route-promotion, Friendship Seal, and pair-up rules.
- Recruitment is represented by 103 typed scenarios and 80 linked base-stat snapshots rather than compound chapter prose. The model supports route joins, Avatar-gender branches, difficulty variants, temporary departures and returns, retained Chapter 4/5 training, weapon-rank progress, castle recruitment, autoleveling, and DLC recruitment.
- Route-identical starting snapshots share one normalized scenario or stat block when their values are the same. Route-specific records exist only when class, level, inventory, stats, weapon rank, timing, or another verified condition differs.
- Generic `levelCap` data was rejected. Exceptional behavior, such as Felicia and Jakob's built-in Eternal Seal effect, is stored as an explicit unit note instead of implying that every profile needs a level-cap field.
- Castle recruits Izana, Yukimura, Flora, and Fuga retain explicit uncertainty notes around their scaling. Their current records use the most defensible castle-recruit autolevel interpretation, described as Offspring Seal-esque level scaling rather than claiming that the child Offspring Seal table applies directly.
- Anna is modeled as `dlc_exclusive`. Her map NPC's story-progress scaling is separate from the fixed recruited level 10 unit and does not leak into the recruited base-stat record.
- Scarlet's Revelation departure is modeled as a route-specific permanent departure and receives a prominent frontend warning. Birthright remains unaffected.

### Stats, Classes, Supports, and Pair-Up Decisions

- Every unit has exactly one personal growth vector and one seven-stat personal cap-modifier vector. Growth totals shown in the frontend are derived display values, not duplicated canonical inputs.
- Corrin begins from a neutral base, growth, and cap template. Boon and bane deltas are applied at runtime from `avatar-configurations.json`; precomputed Corrin permutations are intentionally not stored.
- Forty-seven units use fixed Attack and Guard Stance records. Corrin's variable stance rules live in the Avatar configuration because boon and bane choices change the result.
- Support relationships are stored once as 433 directed-view records with route, rank, direction, and partner-gender context. Friendship and Partner Seal outcomes remain separate directed grants because reciprocal support does not guarantee reciprocal class access.
- A support with Corrin does not automatically grant the non-Corrin unit a Friendship Seal class. Corrin may borrow eligible same-gender first-generation classes; the reverse direction is not inferred without a valid seal relationship.
- Class access distinguishes starting/base classes, Heart Seal classes, Corrin Talent-only access, Friendship Seal grants, Partner Seal grants, substitutions, fallbacks, and classes already owned through another route.
- `alreadyOwned` outcomes remain visible in relationship data. The frontend marks them with a compact caution indicator and explains whether the granted tree already exists through the base or Heart Seal set.
- Duplicate-class and special-class substitutions are explicit. Examples reviewed during the milestone include parallel-class fallbacks, secondary-class grants, gendered Troubadour promotions, and class trees that expose a promoted class without exposing every sibling base class.
- Class-tree hover labels show the two standard promotions for each non-DLC base tree. DLC classes remain deferred.
- Personal skills remain sourced descriptive records rather than executable rules. Niche wording corrections, including Oboro's Nohr-class/origin condition and Kagero's reflected damage/debuff distinction, are preserved as prose without pretending the app can execute the skill.

### Approved Frontend Expansion

- The original prompt excluded frontend work. During review, that boundary was explicitly expanded to build the FE14 unit visualizer alongside the data so every unit could be inspected in context.
- `/FE14/Units` now provides a portrait roster with canonical numbers, route filtering, `ALL` / `BR` / `CQ` / `RV` availability labels, and a separate DLC-exclusive filter. Completed review-state labels are no longer shown to users.
- Roster cards show the full square portrait with the unit number on the image. Unit name, route labels, DLC status, and navigation affordance sit in a separate metadata row below the portrait.
- `/FE14/Units/:unit` provides one route-addressable profile per unit. Profiles expose availability, recruitment and starting snapshots, personal growths and cap modifiers, class access, supports and seal results, Attack and Guard Stance bonuses, notes, warnings, and compact paper-style references.
- Every profile includes an Overview / JSON segmented control. The JSON view is an expandable visualizer of the same generated runtime object used by the overview.
- Profile headers show available routes, Dragon Vein access, and applicable Dragon/Beast tags. Personal-skill prose remains in the body rather than crowding the header.
- Corrin received a dedicated interactive profile. Gender, boon, bane, and Talent controls are synchronized across starting bases, personal growths, cap modifiers, class coverage, portrait, supports, and stance bonuses. Talent trees highlight the current selection and dim alternatives.
- Corrin's profile documents the male-Corrin paralogue bottleneck and reports route/gender class trees still missable after the selected Talent and eligible first-generation Friendship access.
- Route and unit exceptions are surfaced where they matter: castle-recruit reliability banners, Scarlet's Revelation warning, temporary-playability notes, retained-training notes, Felicia/Jakob Eternal Seal behavior, and other unit-specific recruitment caveats.
- The browser-local Notes workspace was moved to `/Notes`. The application root is now the project home page, with a Game Library entry for Fire Emblem If / Fates and a concise version log based on user-visible product milestones rather than test-only or merge commits.
- GitHub Pages deep-link restoration remains supported through `public/404.html` and the redirect handoff in `index.html`.

### Validation Outcome and Accepted Limitations

- The generated runtime bundle contains 48 roster entries, 48 joined unit objects, 22 non-DLC class trees, and 126 compact source records.
- The final normalized counts are 48 identities, 48 personal skills, 48 growth vectors, 48 cap-modifier vectors, 48 class-access records, 103 availability scenarios, 80 base-stat snapshots, 433 support records, 47 fixed pair-up records, and one Corrin Avatar configuration.
- Validation currently reports zero errors and 75 explicit warnings. Forty warnings are `variable_corrin_class_grant`, identifying Partner Seal outcomes that depend on the selected Talent. Thirty-five are `workbook_source_pending`, identifying units whose local workbook sheet was not directly inspected even though their accepted records use independent web, chart, or observed-game sources.
- `workbook_source_pending` is an audit reminder, not a claim that the corresponding data is unsourced. It remains visible so later workbook reconciliation can improve provenance without blocking otherwise corroborated records.
- User-observed game data, including explicitly identified 3DS observations, is retained with scoped wording rather than generalized beyond the observed route, chapter, difficulty, or version.
- Known unresolved mechanics remain prose-level limitations instead of invented precision. These include exact late castle-recruit milestones for some special units and whether Gunter's early EXP, level, and weapon proficiency carry into later appearances.
- Child portraits may exist in the imported asset folder, but no child identity, stat, support, inheritance, or runtime record is included in this milestone.
- No new dependency was required. Zod, TypeScript, `tsx`, Vitest, React, React Bootstrap, and the existing icon library were sufficient.
- Projected growth-by-selected-class charts remain a later planner feature. Child units, child inheritance, DLC class trees, executable skill effects, combat calculations, and build optimization remain out of scope after this milestone.

## Stop Conditions

Stop and ask the user before continuing if:

- two applicable primary sources materially disagree and higher-confidence evidence does not resolve the conflict;
- a unit cannot be represented without changing the approved domain boundaries;
- a specialized seal chart conflicts with Fire Emblem Wiki or observed game behavior;
- a workbook sheet cannot be mapped confidently to one canonical unit;
- the first-generation roster count or membership appears wrong;
- child data is required to complete what was assumed to be a first-generation fact;
- a new dependency appears necessary;
- unrelated user changes overlap the data files being edited.

Do not weaken validation or mark disputed data accepted merely to finish the roster.

## Completion Report

After completing the milestone, stop and report:

- branch and final working-tree status;
- files created or modified;
- dependencies added, if any, and why;
- final roster count and processing order;
- accepted, candidate, disputed, and blocked counts;
- source coverage and material disagreements;
- known workbook corrections represented in normalized data;
- validation and generation commands run;
- tests, typecheck, and build results;
- runtime output produced;
- confirmation that no child data was included;
- remaining limitations before the child-unit milestone.

Do not commit, push, merge, or delete branches unless explicitly requested.

# FE6 Curated Data Pipeline Plan

**Status:** Implemented

## Purpose

Build a small, reviewable pipeline for a curated Fire Emblem: The Binding Blade / Fire Emblem: Fuuin no Tsurugi / FE6 dataset.

The pipeline will retrieve source pages from [Serenes Forest's Binding Blade section](https://serenesforest.net/binding-blade/), preserve those pages as raw evidence, extract candidates, normalize reviewed facts into versioned JSON, validate all cross-record relationships, and generate static runtime payloads for the browser application.

This document covers data work only. It does not authorize the Unit, Class, or Weapon/Item page implementation.

## Scope

The first FE6 dataset contains three public data domains:

- units;
- classes and their single promotion relationships;
- weapons, staves, and items.

The unit runtime view must support:

- Character Profile
  - recruitment time;
  - starting class;
  - starting level;
  - stat profile:
    - base stats;
    - growth rates;
    - base-class caps;
    - promoted-class caps;
  - starting weapon levels;
  - affinity;
  - affinity bonus;
- Supports
  - one flat list of support partners.

FE6 has no class-skill system. Do not create skill records, class-skill relationships, skill-learning rules, or empty skill sections for this dataset.

The initial dataset should cover the normal story-recruitable roster. Trial Map bonus characters may be extracted into the candidate report because they appear in Serenes data, but they must remain classified as `trial_map_bonus` and outside the normal roster until separately approved for publication. Enemy-only and NPC-only records are outside this slice.

## Game and Naming Policy

FE6 was released only in Japan. The dataset must not describe any English name as an official FE6 localization.

Use the following identity rules:

1. Give every unit, class, weapon, item, affinity, and chapter a stable lowercase ASCII `snake_case` ID.
2. Preserve the original Japanese name when Serenes provides it.
3. Use the Fire Emblem Heroes/NOA-adjusted English name as the preferred display name when one exists.
4. Otherwise use the project's approved fan-translation name.
5. Preserve Serenes, legacy fan-patch, romanized, and alternate spellings as typed aliases rather than creating duplicate records.
6. Record the authority of each display name, such as `heroes`, `fan_translation`, `serenes`, `romanized`, or `original_japanese`.

The [Serenes name chart](https://serenesforest.net/binding-blade/general/name-chart/) supplies Japanese, romanized, fan, and later NOA/Heroes names. A checked-in name override file should make the chosen display spelling explicit whenever the automatic priority would be ambiguous.

The same policy applies to names in source tables that predate later Heroes spellings. For example, extraction may encounter one spelling while the preferred display name uses another; both must resolve to one canonical ID.

## Source Policy

Serenes Forest is the gameplay source of truth for this slice. Other sites must not silently fill gaps or override Serenes values. If a Serenes page is incomplete or ambiguous, record the field as unresolved in a report and resolve it through an explicit, reviewed override with a note.

### Source Catalog

Register each page separately in `data/sources/fe6/sources.json` with a stable source ID, URL, retrieval timestamp, content hash, scope, and known parsing notes.

| Domain | Source page | Intended facts |
| --- | --- | --- |
| Identity | [Name Chart](https://serenesforest.net/binding-blade/general/name-chart/) | Japanese names, romanization, fan names, later NOA/Heroes names |
| Recruitment | [Recruitment](https://serenesforest.net/binding-blade/characters/recruitment/) | chapter, route, timing, and recruitment condition |
| Unit profile | [Character Base Stats](https://serenesforest.net/binding-blade/characters/base-stats/) | starting class, level, bases, constitution, movement, affinity, and weapon ranks |
| Unit growths | [Character Growth Rates](https://serenesforest.net/binding-blade/characters/growth-rates/) | personal growth vector |
| Supports | [Supports](https://serenesforest.net/binding-blade/characters/supports/) | eligible support partners |
| Affinities | [Support Calculation](https://serenesforest.net/binding-blade/characters/supports/calculation/) | seven affinity bonus vectors and calculation rules |
| Class identity | [Class Introduction](https://serenesforest.net/binding-blade/classes/introduction/) | weapons, promotion target, and class notes |
| Class bases | [Class Base Stats](https://serenesforest.net/binding-blade/classes/base-stats/) | base stats, constitution, movement, and base weapon ranks |
| Class caps | [Class Maximum Stats](https://serenesforest.net/binding-blade/classes/maximum-stats/) | class cap vectors and shared HP/Luck/Movement caps |
| Promotions | [Promotion Gains](https://serenesforest.net/binding-blade/classes/promotion-gains/) | promotion stat, constitution, movement, and weapon-rank gains |
| Inventory | [Swords](https://serenesforest.net/binding-blade/inventory/swords/), [Lances](https://serenesforest.net/binding-blade/inventory/lances/), [Axes](https://serenesforest.net/binding-blade/inventory/axes/), [Bows](https://serenesforest.net/binding-blade/inventory/bows/), [Staves](https://serenesforest.net/binding-blade/inventory/staves/), [Anima Tomes](https://serenesforest.net/binding-blade/inventory/anima-tomes/), [Light Tomes](https://serenesforest.net/binding-blade/inventory/light-tomes/), [Dark Tomes](https://serenesforest.net/binding-blade/inventory/dark-tomes/), and [Items](https://serenesforest.net/binding-blade/inventory/items/) | weapon, staff, and item facts |

The Serenes class-growth table is not part of player unit growth calculation. Do not combine it with character growth rates. It may be added later if enemy autoleveling is brought into scope.

## Data Ownership

Keep four layers distinct:

```text
Serenes pages
  -> immutable raw HTML snapshots
  -> generated candidate JSON
  -> manually reviewed normalized JSON
  -> validated static runtime payloads
```

- Raw snapshots preserve what was retrieved and are never hand-edited.
- Candidate JSON preserves extracted values, source wording, and parse warnings. It may be regenerated.
- Normalized JSON is the reviewable project truth. Automated extraction must not overwrite manual decisions.
- Runtime JSON is generated, compact, and never hand-edited.

Every normalized fact must retain a source reference. A source reference should identify the source ID and a durable locator such as the table heading plus row label, not a fragile DOM index alone.

## Proposed File Layout

```text
data/
  raw/
    fe6/
      serenes/
        manifest.json
        characters/
        classes/
        inventory/
  candidates/
    fe6/
      names.json
      units.json
      classes.json
      inventory.json
  sources/
    fe6/
      sources.json
      name-overrides.json
      curation-overrides.json
  normalized/
    fe6/
      units.json
      recruitment.json
      unit-base-stats.json
      unit-growths.json
      unit-weapon-levels.json
      support-relationships.json
      affinities.json
      classes.json
      class-promotions.json
      weapons.json
      items.json
  reports/
    fe6/
      extraction.json
      validation.json
      validation.txt
  runtime/
    fe6/
      units.json
      classes.json
      weapons-items.json
scripts/
  data/
    fe6/
      fetch-serenes.ts
      extract-serenes.ts
      schemas.ts
      validate.ts
      generate-runtime.ts
```

The exact filenames may be refined during implementation, but raw, candidate, normalized, report, and runtime ownership must remain separate.

## Retrieval Plan

### 1. Define an Allow-Listed Manifest

Create a manifest containing only the Serenes URLs required by this plan. Each entry should declare:

- source ID;
- URL;
- domain and expected table heading;
- expected column labels;
- minimum plausible row count;
- local snapshot path.

The fetcher must not crawl arbitrary links from the site.

### 2. Fetch Reproducible Snapshots

The fetch script should:

- download only manifest URLs;
- use conservative sequential or low-concurrency requests;
- identify the project with a stable user agent;
- retry transient failures with a small bound;
- write UTF-8 HTML snapshots and a manifest containing the retrieval time, HTTP status, final URL, byte count, and SHA-256 hash;
- leave the last good snapshot untouched when a request fails;
- require an explicit refresh flag before replacing checked-in snapshots.

If Serenes presents a verification page or otherwise blocks an automated request, the pipeline must fail visibly. A manually saved snapshot may be added only after confirming it is the intended Serenes page and recording that acquisition method in the raw manifest. The pipeline must not attempt to bypass access controls.

Normal validation and runtime generation must be offline and deterministic. They must never fetch from Serenes.

### 3. Detect Source Drift Before Parsing

For each snapshot, verify:

- the page title and expected heading;
- the expected table header;
- the minimum row count;
- that the response is not a challenge, error, or empty page;
- that known sentinel rows are present.

A structural mismatch stops extraction for that page and produces a report. It must not generate a partially empty accepted dataset.

## Extraction and Curation Plan

### 1. Extract Candidate Rows

Parse tables by their semantic heading and normalized header labels. Preserve, for every cell:

- raw text;
- normalized candidate value;
- source row label;
- warnings caused by images, footnotes, merged cells, dashes, or compound values.

Affinity cells may be represented by images on the source page. Extract the image `alt`, title, or filename and map it through an explicit seven-affinity lookup. Missing image metadata must become an unresolved candidate instead of an inferred affinity.

### 2. Resolve Canonical Identity

Apply the checked-in alias and name overrides before joining tables. Unresolved or colliding names stop normalization for the affected record.

Canonical IDs must not change merely because the preferred fan/Heroes display spelling changes later.

### 3. Curate Conditional Values

Some starting data depends on route, difficulty, chapter, or recruitment choice. Represent these as separate typed recruitment scenarios rather than compound strings. At minimum the schema must handle:

- the Ilia and Sacae route split;
- Normal and Hard mode starting-stat variants;
- alternate recruitment chapters or levels;
- recruitment prices or other conditions, such as Hugh's offer;
- later appearances that change starting values, such as Cath;
- source footnotes affecting a unit's level, stats, or weapon rank.

Do not treat Serenes' rounded expected Hard mode values as ordinary fixed bases. Mark their value kind explicitly, for example `fixed` or `expected_hard_mode_bonus`.

### 4. Review Candidates Into Normalized JSON

Candidate extraction is mechanical; acceptance is manual. Reviewers should approve:

- canonical IDs and names;
- roster classification;
- scenario splits;
- footnote interpretation;
- class gender variants;
- promotion relationships;
- prose effects and special restrictions.

The curation override file should contain only documented exceptions and interpretation decisions. It must not become an unstructured second dataset.

## Normalized Domain Contracts

### Units

The core unit record owns identity, display names, aliases, and roster classification. Recruitment, stats, weapon levels, affinity, and supports remain separate records joined by unit ID.

Use this stat order everywhere:

```text
HP, strength/magic, skill, speed, luck, defense, resistance
```

FE6 uses one Strength/Magic field for a unit. Normalize it under one explicit key, such as `power`, and label it as Strength or Magic in the UI according to the unit's class/weapon context. Do not manufacture separate Strength and Magic values.

Each recruitment scenario owns:

- chapter or unlock timing;
- route and difficulty conditions when applicable;
- recruitment condition text;
- starting class and level;
- base-stat snapshot reference;
- starting weapon-level reference.

Affinity is a canonical affinity ID. The unit's displayed affinity bonus is resolved from `affinities.json`; do not duplicate the same bonus vector into every unit record.

### Supports

Store one canonical undirected relationship per eligible pair:

```text
unit_a__unit_b
```

Sort the two unit IDs lexically so reversed duplicates cannot exist. The runtime generator expands these edges into one flat support-partner list per unit.

Do not include support conversations, conversation text, starting support points, per-turn support growth, or build recommendations in this first set. The source table may contain those values, but the requested Unit page needs only partner eligibility.

### Affinities

Create one record for each of Fire, Thunder, Wind, Ice, Dark, Light, and Anima. Store the one-level contribution vector from Serenes using exact half-step units rather than floating-point values. For example, store `0.5` as `1` half-unit and `2.5` as `5` half-units.

The runtime may expose readable values, but calculation code should remain exact. Pair bonuses and C/B/A totals are derived results; this slice needs only the unit's affinity and the affinity's individual bonus profile.

### Classes

Each class record should contain:

- canonical identity and names;
- tier: `base`, `promoted`, `special`, `enemy_only`, or `npc_only`;
- gender variant where Serenes distinguishes one;
- usable weapon types;
- class base stats;
- maximum stats;
- constitution and movement;
- base weapon ranks;
- class notes as reviewed source text or typed flags where unambiguous;
- nullable promotion class ID.

Each promotion relationship should contain exactly one source class and one target class plus stat, constitution, movement, and weapon-rank gains. FE6 has no branching class promotions, but `promotionClassId` must be nullable because Thief, Bard, Dancer, Transporter, Manakete, and other special classes do not have a normal promotion.

The maximum-stat source gives shared caps of 60 HP, 30 Luck, and 15 Movement. Expand these shared values into complete normalized cap vectors while preserving a source reference to the shared note. Do not mistake class base stats for a unit's personal base stats.

For a Unit page:

- `baseClassCap` is resolved from the unit's canonical unpromoted class in its class line;
- `promotedClassCap` is resolved from that class's promotion target;
- a prepromoted unit resolves both through the same class line;
- a class with no promotion returns `null` for promoted caps and displays “Not applicable.”

These are generated joins, not duplicated unit facts.

### Weapons, Staves, and Items

Use one weapon record shape with type-specific nullable fields:

- identity, display names, and aliases;
- weapon type;
- required rank;
- range;
- weight;
- might;
- hit;
- critical;
- uses;
- worth;
- staff experience where applicable;
- effect text;
- explicit availability note when Serenes marks an entry unobtainable or Trial Map-only.

Items contain identity, names, uses, worth, effect text, and explicit availability notes. Preserve `unobtainable`, `trial_map_only`, and similar source statements as typed flags only when the source states them clearly.

Ranges such as `1`, `1-2`, and formula-based staff ranges must use a typed representation. Do not flatten formula-based ranges into an incorrect fixed maximum.

## Runtime Page Contracts

Runtime generation should produce the exact data each future page needs:

### Unit Runtime Record

```text
identity
recruitment scenarios
starting class and level
base stats
personal growths
base-class caps
promoted-class caps or not-applicable state
starting weapon levels
affinity and affinity bonus
flat support-partner list
source references
```

### Class Runtime Record

```text
identity and tier
weapons
base stats
maximum stats
constitution and movement
base weapon ranks
promotion target or not-applicable state
promotion gains
notes
source references
```

No skills field should exist.

### Weapon/Item Runtime Record

```text
identity and category
applicable combat or staff stats
uses and worth
effects and restrictions
source references
```

## Validation

The validator must emit machine-readable JSON and a concise text report.

### Source and Schema Validation

- Every normalized record has `formatVersion`, `gameId: "fe6"`, review status, and at least one Serenes source reference.
- Every source reference resolves to the source catalog and a known raw snapshot.
- Required keys are present and unknown keys fail validation.
- All text is valid UTF-8 and contains no mojibake.
- Candidate and runtime generation are deterministic from their checked-in inputs.

### Unit Validation

- Every approved story-roster unit appears exactly once.
- Every name used by a source table resolves to one canonical unit ID or is listed as excluded.
- Each published unit has recruitment, starting class, starting level, bases, growths, weapon levels, and affinity.
- Scenario conditions do not overlap incoherently.
- Stat vectors contain exactly the FE6 stat keys and legal integer values.
- Hard mode expected stats cannot overwrite fixed normal-mode bases.
- Each unit's base and promoted cap joins resolve, or the class is explicitly non-promoting.

### Class Validation

- Class IDs and gender variants are unique.
- Every unit starting class resolves.
- Every promotion target resolves and no base class has more than one target.
- Promotion relationships are acyclic and agree with the class introduction and promotion-gain tables.
- Full cap vectors include the shared HP, Luck, and Movement caps.
- Weapon types and ranks resolve to known enums.
- No class skill data exists.

### Support and Affinity Validation

- Support pairs are unique regardless of order.
- Both ends of every support edge resolve to published units.
- Generated partner lists are reciprocal and contain no self-supports.
- Every published unit has exactly one of the seven affinities.
- Every affinity has one complete exact bonus vector.

### Weapon and Item Validation

- IDs are unique across weapons and items.
- Every weapon belongs to exactly one inventory category.
- Required fields vary correctly by weapon, staff, or item kind.
- Ranks, ranges, uses, and numeric combat values are legal.
- Source dashes become `null` or an explicit not-applicable state, never zero unless the source says zero.
- Effect restrictions referring to classes or weapon types resolve where they have been modeled as typed relationships.

### Completeness and Drift Reports

Reports should show:

- source page and snapshot hashes;
- extracted, accepted, excluded, and unresolved row counts by page;
- unresolved aliases and image-only affinity cells;
- story, Trial Map bonus, enemy-only, and NPC-only classifications;
- source footnotes requiring manual interpretation;
- missing or broken joins;
- normalized values changed since the previous accepted snapshot.

## Implementation Sequence

1. Register the Serenes source catalog and the approved story roster.
2. Add the display-name priority rules, canonical IDs, and reviewed alias overrides.
3. Implement manifest-driven retrieval and raw snapshot metadata.
4. Implement structural drift checks and candidate extraction.
5. Normalize classes and promotions first so unit class and cap joins have stable targets.
6. Normalize affinities and their exact bonus vectors.
7. Normalize units, recruitment scenarios, base stats, growths, and weapon levels.
8. Normalize unique support edges and generate flat partner lists.
9. Normalize weapons, staves, and items from all nine inventory tables.
10. Add schema, relationship, completeness, and drift validation.
11. Generate the three static runtime payloads.
12. Manually review the text and JSON reports before marking records accepted.

## Acceptance Criteria

- Serenes Forest is the sole gameplay source of truth for the first FE6 slice.
- Every source page is cataloged and every accepted fact is traceable to a raw snapshot and locator.
- Preferred English display names follow the Heroes/NOA-adjusted-then-fan-translation policy while original Japanese and source spellings remain available.
- The normal story roster is complete, and non-story rows are explicitly classified or excluded.
- Every Unit runtime record provides exactly the requested Character Profile data and one flat support list.
- Base and promoted class caps are resolved from class records rather than copied into unit inputs.
- Each class has zero or one promotion target and no skill data.
- Every weapon, staff, and item row in the approved Serenes inventory tables is accepted or appears in the unresolved/excluded report.
- Network retrieval is separate from offline validation and runtime generation.
- Validation fails on source drift, unresolved required fields, duplicate IDs, broken references, invalid scenarios, or incomplete runtime page contracts.
- Re-running extraction, validation, and runtime generation from unchanged snapshots produces no diff.

## Explicit Non-Goals

- Class skills or personal skills.
- Support conversation text or support-point progression.
- Average-stat tables, combat forecasts, or build recommendations.
- Enemy autoleveling or class-growth calculations.
- Boss, generic enemy, or NPC datasets.
- Chapter maps, shops, item locations, or availability inventories.
- Artwork or icon acquisition.
- A backend API, database, account system, or live client requests to Serenes.
- Frontend page implementation.

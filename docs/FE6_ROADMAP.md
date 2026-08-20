# FE6 Roadmap

## Purpose

This roadmap describes the intended sequence for Fire Emblem: The Binding Blade / Fire Emblem: Fuuin no Tsurugi / FE6 support in FireEmblemBuildHelper.

It is outcome-oriented, not a release contract. A phase may be split, reordered, or reduced when implementation or source review reveals a better path.

FE6 must remain a game-specific implementation. Shared application code may provide navigation, storage, layout, and common presentation primitives, but FE14 skills, reclassing, children, inheritance, seals, and route assumptions do not apply to FE6.

## Current Direction

FE6 is the second supported game and the first test of the project's multi-game boundaries.

Its initial value is a compact, trustworthy reference viewer built from curated Serenes Forest data. Its later planning value comes from recruitment timing, route branches, promotion timing and item competition, weapon-rank goals, supports, affinities, durability, and limited campaign resources.

Because FE6 has no class skills or reclassing, the implementation should remain materially simpler than FE14 rather than reproducing FE14 screens with empty sections.

## Immediate TODO

- [x] **Build the FE6 curated-data pipeline.** Preserve Serenes snapshots, extract candidates, normalize reviewed JSON, validate provenance and relationships, and generate static runtime payloads for units, classes, weapons, staves, and items.
- [ ] **Add FE6 to the public game library and routing.** Give FE6 a stable game entry and direct routes to its Unit, Class, and Weapon/Item directories without changing FE14 URLs.
- [ ] **Build the FE6 reference viewer.** Deliver the three requested page families from the generated runtime JSON before adding planning interactions.
- [ ] **Confirm the shared cross-game UI boundary after the FE6 vertical slice.** Reuse genuinely common directory, stat-table, provenance, and JSON-inspection components, while keeping FE6-specific joins and terminology under the FE6 game module.

## Phase 1: FE6 Data Foundation

**Status:** Complete on the FE6 data-pipeline branch.

**Outcome:** Serenes Forest source pages can be converted into trusted, inspectable, static FE6 application data.

- Catalog and snapshot the required [Serenes Forest Binding Blade](https://serenesforest.net/binding-blade/) pages.
- Keep raw HTML, extracted candidates, curation overrides, normalized JSON, validation reports, and runtime JSON separate.
- Normalize stable IDs and preserve Japanese names, romanizations, fan-translation spellings, and Heroes-adjusted display names.
- Represent route- and chapter-dependent recruitment without flattening compound source values.
- Preserve fixed Normal-mode bases separately from rounded expected Hard-mode values.
- Normalize the story roster, classes, promotions, affinities, supports, weapons, staves, and items.
- Resolve unit-facing base and promoted caps from class data rather than duplicating cap vectors in unit records.
- Validate raw-source hashes, schemas, completeness, aliases, relationships, promotions, and deterministic generation.
- Keep the public runtime static and free of source-site requests.

The implemented foundation contains:

- 54 story units;
- 67 concrete class records;
- 26 promotion relationships;
- 143 support relationships;
- 7 affinity bonus profiles;
- 93 weapons and staves;
- 34 items.

**Not the goal:** Trial Map bonus units, bosses, NPCs, class-growth calculations, support conversations, item locations, shops, or frontend pages.

## Phase 2: FE6 Reference Viewer

**Outcome:** A player can browse the curated FE6 roster, class system, and inventory without creating a run plan.

### Game Entry and Navigation

- Add FE6 to the game library with a stable base route such as `/FE6`.
- Add Unit, Class, and Weapon/Item directory routes.
- Keep FE6 navigation independent from FE14 route, offspring, skill, and pairing controls.
- Load only checked-in FE6 runtime JSON; do not request data from Serenes in the browser.

### Unit Directory and Unit Page

- Provide a searchable, canonically ordered story-roster directory.
- Use Heroes-adjusted English display names while making Japanese and source aliases available for search and inspection.
- Render a Character Profile containing:
  - recruitment time and condition;
  - starting class;
  - starting level;
  - Normal-mode base stats;
  - rounded expected Hard-mode stats where Serenes provides them, with an explicit expected-value label;
  - personal growth rates;
  - base-class caps;
  - promoted-class caps or a clear not-applicable state;
  - starting weapon levels;
  - affinity;
  - the affinity's individual support-bonus profile.
- Render Supports as one flat partner list. Do not add support-conversation tabs or pairing-style controls.
- Handle recruitment variants such as route chapters, Cath's repeated appearances, Percival's alternate chapters, Hugh's payment condition, and Gonzalez's Chapter 10B starting override.
- Provide compact View JSON and Export JSON actions for the read-only curated unit record.
- Show source provenance without letting citations overwhelm the main profile.

### Class Directory and Class Page

- List base, promoted, special, enemy-only, and NPC-only classes with clear filters or grouping.
- Display class bases, maximum stats, constitution, movement, weapons, base weapon ranks, notes, and promotion gains.
- Model each base class as having zero or one promotion target.
- Correctly represent multiple base classes leading to Berserker without describing that as a branching promotion for the source class.
- Show non-promoting classes with a not-applicable promotion state.
- Do not render an empty Skills section.

### Weapon and Item Directory

- Provide categories for Swords, Lances, Axes, Bows, Staves, Anima, Light, Dark, and Items.
- Display the fields applicable to each category rather than forcing one oversized table.
- Preserve formula-based staff ranges, uses, worth, effect text, and source availability notes.
- Clearly distinguish the Torch staff from the Torch item.
- Expose unobtainable and Trial Map-only flags where the source states them.

**Not the goal:** Build editing, growth simulation, combat forecasts, shop inventories, or a comprehensive FE6 wiki.

## Phase 3: FE6 Local Run Foundation

**Outcome:** A player can create, revisit, back up, and annotate a browser-local FE6 run.

- Extend the existing local project/run boundary to support `gameId: "fe6"` without weakening FE14 schemas.
- Create and switch between multiple FE6 run plans.
- Record run difficulty and a draft route intention.
- Add roster intentions such as planned, recruit, field, bench, or skip.
- Attach notes to the run and individual units.
- Preserve FE6 plan state in IndexedDB using stable FE6 IDs.
- Include FE6 plans in versioned JSON export/import and human-readable text export.
- Add migration and round-trip tests before FE6 plans are treated as durable player data.

**Not the goal:** Treating a read-only curated unit JSON export as a run-plan backup or sharing one mutable configuration model between games without game-specific validation.

## Phase 4: FE6 Unit Growth and Promotion Planner

**Outcome:** A player can explore a legal FE6 unit progression from recruitment through promotion and a target level.

- Start from the selected recruitment and difficulty snapshot.
- Let the player choose target base-class level, promotion timing, and target promoted level where the unit can promote.
- Apply the unit's personal growth rates and the class promotion gains from curated data.
- Show projected stat changes and final caps with the calculation inputs visible.
- Distinguish expected-value projections from guaranteed stats.
- Support prepromoted units without inventing an in-run demotion.
- Support non-promoting units without presenting fake promotion choices.
- Allow stat-booster assignments as explicit plan inputs once item effects are represented as typed rules.
- Let the player record weapon-rank goals without claiming a completion time until weapon experience rules and actions are modeled.

FE6 unit growths are personal growths. The separate Serenes class-growth table must not be added to playable-unit level-up calculations.

**MVP boundary:** One unit's legal level and promotion path. It does not yet coordinate promotion items, route access, supports, or campaign inventory.

## Phase 5: Recruitment and Route Coordination

**Outcome:** A player can understand which units and chapters their FE6 route choices make available and what must happen to recruit them.

- Model chapter identifiers and the A/B route variants explicitly.
- Represent mutually exclusive route units and chapters without treating them as missing data.
- Track recruitment timing, appearance turn, starting faction, required talk unit, village visit, payment, and other sourced conditions.
- Let a run plan record whether a unit was recruited, missed, defeated, or intentionally skipped.
- Warn when a planned recruitment contradicts the selected route or an earlier run decision.
- Add the Ilia/Sacae split and its determining conditions only after those rules and thresholds are curated and tested.
- Keep Western Isles and later route labels explicit rather than assuming every `A` or `B` chapter suffix means the same decision.
- Explain route-dependent starting-data limitations, including source rows that provide only approximate Hard-mode values.

**Not the goal:** Automatically choosing the best route or asserting exact conditional stats where the source does not provide them.

## Phase 6: Support and Affinity Planner

**Outcome:** A player can select FE6 support goals and understand their bonuses and chapter-time requirements.

- Expand normalized support data with the Serenes starting-point and per-turn growth values.
- Encode the C, B, and A thresholds and the five-level support limit.
- Encode the per-chapter support-point limit separately from pair growth.
- Let players select desired support ranks from the legal partner list.
- Derive combined affinity bonuses from both units and the selected support rank using exact half-point units.
- Apply FE6's final fractional handling exactly and cover it with golden tests.
- Estimate the adjacent turns required for each selected rank.
- Warn when selected support goals exceed a unit's support-level capacity or create unrealistic same-chapter expectations.
- Keep support goals separate from romantic pairings, marriage, children, class access, or inheritance; FE6 has none of those support consequences.

**Not the goal:** Importing or reproducing support-conversation scripts.

## Phase 7: Promotion Items, Weapons, and Campaign Resources

**Outcome:** A player can see whether planned unit progressions fit the campaign's limited promotion items, weapons, durability, ranks, and gold.

- Model which promotion item each eligible class requires.
- Assign limited promotion items to planned units and flag competing allocations.
- Add chapter-timed item availability from curated Serenes item-location and shop sources before making availability claims.
- Track weapon and staff durability in a run plan.
- Model weapon experience and rank thresholds before estimating when a unit reaches a target rank.
- Validate whether a planned unit can use a weapon at the selected point in the run.
- Track unique, limited, unobtainable, and Trial Map-only inventory separately.
- Add shop price and campaign-gold planning only after shop inventories and availability are source-backed.
- Keep resource warnings explainable and allow drafts to remain incomplete.

**Not the goal:** Full combat simulation, forging, randomized drop prediction, or an optimizer that assigns resources automatically.

## Phase 8: Gaiden Chapters and Ending Requirements

**Outcome:** A player can coordinate the chapter and resource conditions required for FE6's optional chapters and intended ending.

- Curate sidequest chapter requirements and their deadlines from Serenes.
- Track required unit survival, chapter completion conditions, and other access constraints.
- Represent Divine Weapon acquisition and preservation where it affects later access.
- Validate a draft route against the requirements for reaching the final chapters and intended ending.
- Explain which earlier decision caused a chapter or ending requirement to become unavailable.
- Keep warnings conditional when the player has not yet supplied enough run state.

**Not the goal:** A turn-by-turn chapter walkthrough or tactical map solver.

## Phase 9: FE6 Data Maintenance and Optional Expansion

**Outcome:** FE6 data remains auditable as sources, naming conventions, and product scope evolve.

- Continue hash and structural-drift checks for Serenes snapshots.
- Report changed source rows before regenerating accepted runtime data.
- Keep Heroes-adjusted naming overrides explicit and preserve superseded aliases.
- Add targeted regression fixtures for every source footnote or manual curation override.
- Decide separately whether Trial Map bonus characters should join the public unit directory.
- If approved, add Trial Map unlock conditions and keep those units visibly distinct from the story roster.
- Add bosses, NPCs, maps, shops, or item locations only for an approved player-facing feature.
- Retain deterministic offline validation and runtime generation as scope expands.

## Working Principles

- Deliver the FE6 reference viewer before adding planning complexity.
- Keep FE6 simpler than FE14 where the game is simpler.
- Reuse platform components only when their meaning is genuinely shared.
- Keep FE6 rules, data, and validation under an FE6-specific boundary.
- Treat route, difficulty, chapter variant, source, and translation authority as explicit dimensions.
- Preserve the distinction between fixed facts, rounded expected values, derived results, and player-authored plans.
- Keep player-created data browser-local with versioned export/import.
- Keep the public application static; do not add a backend for FE6.
- Prefer visible assumptions and source-backed warnings to false precision.
- Update this roadmap when implementation or curation reveals a material constraint.

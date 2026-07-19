# FE14 Route-Driven Base Configuration Gap Report

Date: 2026-07-18

## Scope

This report completes Milestone 8 implementation-sequence steps 1 and 2:

1. inventory the current unit-profile sections, route selection paths, class-growth inputs, weapon types, and learned starting-skill coverage;
2. record the gaps before changing normalized data.

No normalized data or frontend behavior was changed while producing this report.

## Baseline Summary

| Area | Current coverage |
| --- | ---: |
| Playable units | 69 (48 first generation, 21 second generation) |
| First-generation availability scenarios | 103 across 127 route-join edges |
| Availability scenarios covering multiple routes | 12 |
| First-generation base-stat records | 80; all 103 availability IDs are linked |
| Standard class-stat records | 55 |
| Standard class-skill records | 106 across 113 acquisition edges |
| Child parentage/recruitment records | 21 / 21 |
| Child variable-parent options | 363 |
| Canonical weapon types currently implied by class caps | 9 |
| Local weapon-type icon assets | 0 |
| Explicit first-generation starting-skill fields | 0 |

The existing data domains are sufficient to identify every first-generation availability record and its linked base-stat record. The principal gaps are choosing the intended lifecycle state, normalizing class growths, defining weapon-type presentation data, and proving learned-at-recruitment skills.

## Current Unit-Profile Composition

### Ordinary and Corrin profiles

`UnitOverview.tsx` currently composes the profile in this order:

1. review and unit-specific alerts;
2. `RecruitmentSection`;
3. Corrin configuration tables, when applicable;
4. `UnitClassSkills`;
5. the combined personal-growth and cap-modifier table;
6. a two-column Identity / Native class access section;
7. one combined Attack and Guard Stance table;
8. supports and seal previews;
9. references.

`RecruitmentSection.tsx` maps every availability scenario to a separate card. Each card independently calls `baseStatsForAvailability`, `formatJoinLevel`, `formatInventory`, and `formatWeaponRanks`. Every route join for that scenario is shown at once. There is no single resolved base-configuration object shared by the other profile sections.

### Offspring profiles

`OffspringOverview.tsx` has a separate composition path:

1. offspring warnings and parent controls;
2. recruitment summary, story scaling, minimum bases, and inheritance walkthrough;
3. `UnitClassSkills`;
4. resolved growth and cap tables;
5. a two-column Identity / Resolved class access section;
6. one combined Attack and Guard Stance table;
7. resolved supports and seal previews;
8. references.

Offspring already use `resolveOffspringScenario` for parent-derived growths, caps, classes, tags, supports, and stance bonuses. Recruitment presentation still reads directly from `child-recruitment.json`, and no selected route is part of the resolved scenario.

### State ownership

Profile state is split across components:

- `UnitDetail` owns Avatar/child gender and the Overview/JSON view;
- `UnitOverview` owns Corrin boon, bane, Talent, and seal-preview state;
- `OffspringOverview` separately owns variable parent, Corrin inputs, nested parent, and seal-preview state;
- `UnitClassSkills` owns its local expansion state;
- no unit-detail component owns a selected route.

This is adequate for the current reference viewer but does not provide one selection object for a route-driven resolver.

## Route Selection and Availability Inventory

The unit directory has a route roster filter. Unit detail pages do not have a route selector. Other route UI is informational: the header lists all available routes, Corrin configuration lists all route promotions, supports show route badges, and recruitment cards show all matching route joins.

The first-generation domain contains:

- 103 availability scenarios for all 48 first-generation units;
- 127 route-join edges;
- 42 units with more than one availability scenario;
- 12 scenarios shared by more than one route;
- complete base-stat links for all 103 availability IDs;
- 4 Avatar-gender-conditioned scenarios;
- 1 difficulty-specific inventory scenario;
- 6 My Castle autolevel scenarios;
- 1 DLC recruitment scenario;
- 8 scenarios with temporary or permanent departure state;
- 1 Chapter 5 carryover scenario.

### Route alone is ambiguous in 21 cases

Twenty-one unit/route combinations contain more than one truthful availability state.

| Reason | Unit/route combinations |
| --- | --- |
| Avatar-gender recruitment branch (6) | Felicia: BR, CQ, RV; Jakob: BR, CQ, RV |
| Early appearance followed by rejoin or permanent recruitment (15) | Azura: CQ, RV; Kaze: BR, CQ, RV; Gunter: CQ, RV; Ryoma: BR; Hinoka: BR; Takumi: BR; Sakura: RV; Xander: CQ; Camilla: CQ; Leo: CQ; Elise: CQ |

BR = Birthright, CQ = Conquest, RV = Revelation.

The current data correctly preserves these states. A route resolver cannot choose one silently.

- Felicia and Jakob require Avatar gender in addition to route.
- The other fifteen require a lifecycle policy: early guest/temporary appearance versus permanent recruitment or return.
- Kaze, Gunter, Azura, and Sakura also carry departure, return, or retained-training meaning that must not be flattened into a single invented record.

Before resolver implementation, the milestone needs an explicit definition of which lifecycle state the compact surface calls the unit's starting configuration. A plausible default is the permanent controllable recruitment/return state, with early guest states retained as conditional context, but that is a product decision rather than a fact established by route alone.

### Offspring route inputs

Second-generation units do not use `unit-availability.json` for recruitment. Route legality is distributed across roster availability, support relationships, and each variable-parent option:

- 21 child parentage records;
- 363 variable-parent options;
- 28 options legal on all three routes;
- 300 options legal on two routes;
- 35 options legal on one route;
- every child has parent options with more than one route set.

The current parent dropdown shows route badges but does not filter from a selected route. The route-driven resolver must intersect route and parent legality in both directions and define deterministic fallback behavior when one control invalidates the other.

## Class-Growth Inventory

`class-stats.json` contains 55 complete maximum-stat and weapon-rank-cap records. None contains `growthRates`.

Class growths currently have fragmented ownership:

- `generate-offspring-data.ts` hard-codes 46 class profiles containing bases, growths, weapons, and some learned skills;
- 9 standard class-stat records are absent from that hard-coded subset: Oni Savage, Oni Chieftain, Blacksmith, Monk, Great Master, Songstress, Villager, Fighter, and Berserker;
- `child-recruitment.json` contains 40 copied promoted-class growth vectors across 28 unique promotion classes;
- all 40 promotion options repeat class growths rather than reference a canonical class-stat record;
- the source catalog currently registers the accepted Nohrian class-growth page but not the Hoshidan class-growth page.

Consequences:

- effective growths cannot be calculated for all 55 standard classes from the runtime class domain;
- offspring generation and the future profile resolver could disagree if they keep separate growth tables;
- the current runtime type exposes class maximum stats and rank caps, but no class growth vector;
- Hoshidan class-growth provenance must be added before those values become normalized accepted data.

Later sequence steps 3 and 4 should make `class-stats.json` the single class-growth owner and have offspring generation consume it. Class bases and promotion gains used by the child recruitment formula remain separate concerns unless the implementation can move them without expanding this milestone.

## Weapon-Type and Rank Inventory

Nine canonical mechanical weapon IDs are already used by standard class caps:

```text
sword, lance, axe, dagger, bow, tome, staff, dragonstone, beaststone
```

Starting base-stat records use eight of them; no accepted fixed starting snapshot currently records a Dragonstone rank. Corrin's source notes preserve the separate Chapter 5 Dragonstone-access condition.

Current rank values are:

- starting ranks: E, D, C, B, A;
- class caps: C, B, A, S;
- six base-stat progress entries add an exact or approximate fraction toward the next rank.

Current gaps:

- no normalized weapon-type registry;
- no stable weapon-type icon asset IDs;
- no `weapon_type_icons` directory or resolver;
- no source manifest for weapon-type images;
- rank enums are repeated in several schemas rather than declared once;
- `RecruitmentSection` and offspring recruitment render weapon ranks as text;
- current display lists only recorded ranks, so it cannot show every type usable by the selected class;
- `maid` and `butler` scenario class IDs do not directly join `class-stats.json`; both require an explicit mapping to the canonical `attendant` mechanical record before class weapon caps can be read.

The existing weapon IDs are already consistent between base-stat ranks and class caps. The milestone does not need to rename them or introduce Hoshidan/Nohrian duplicate weapon-type IDs.

## Learned Starting-Skill Inventory

Canonical metadata is strong but recruitment loadout coverage is incomplete:

- all 69 units have a personal skill through the runtime join;
- `class-skills.json` contains 106 skills and 113 class acquisition edges;
- every class used by a first-generation availability scenario resolves class-skill acquisition edges after mapping Maid/Butler to Attendant;
- none of the 103 first-generation availability scenarios stores an explicit learned starting-skill list or override;
- 68 scenarios start in a base class, 32 in an advanced class, and 3 in a special class;
- all 6 castle-autolevel scenarios say skills are learned automatically, but exact story-progress thresholds remain unresolved;
- 40 offspring promotion options store 80 learned promoted-skill entries;
- those 80 entries duplicate skill display names and levels already owned by the canonical class-skill domain.

`UnitClassSkills` currently displays every skill learnable from every accessible class tree. It does not represent the smaller set already known at recruitment.

The missing join is not simply `class skill level <= unit level`:

- advanced-class recruits may arrive with earlier base-class or promoted skills whose history is not proven by current class and level alone;
- temporary guest states and later permanent joins can have different learned skill state;
- castle recruits gain skills through autoleveling, while exact thresholds are not yet accepted;
- offspring promoted by an Offspring Seal have timing-dependent skills;
- personal skills must be ordered before learned class skills but remain a separate canonical domain.

Before adding starting-skill overrides, implementation should first derive every loadout that is provable from accepted class/acquisition/recruitment rules and report only the unresolved scenarios. Any override must store skill IDs and scenario conditions, not duplicated skill names or descriptions.

## Test Inventory

Existing coverage is concentrated in:

- `src/App.test.tsx`, which checks many current unit pages, recruitment cards, profile controls, supports, JSON inspection, and skill rendering;
- `src/games/fe14/offspring.test.ts`, which checks offspring formulas and route-conditioned relationships;
- `src/games/fe14/components/skills/ClassSkillBrowser.test.tsx`, which checks the global class-skill browser.

There is no dedicated route-driven resolver, route selector, effective-growth toggle, starting-skill loadout, weapon-type registry, or weapon-level chart test yet. Many `App.test.tsx` assertions intentionally describe the old multi-card layout and will need focused migration rather than broad deletion.

## Gap Classification

### Foundations ready for reuse

- all first-generation availability IDs link to base-stat records;
- route joins and exceptional scenario conditions are already typed;
- all child records expose route-aware parent options;
- class maximum stats and weapon-rank caps cover the 55 standard classes;
- class skills and personal skills already use canonical IDs and local assets;
- offspring minimum-before-inheritance stats already exist;
- Corrin and offspring already have tested configuration resolvers that can be inputs to the new base resolver;
- supports, seal previews, warnings, and references have broad regression coverage.

### Data work required after this report

- normalize and source all 55 class growth vectors;
- remove duplicate class-growth ownership from offspring generation;
- add a nine-record weapon-type registry and icon-source manifest;
- add local weapon-type assets and a deterministic resolver;
- centralize rank vocabulary/ordering;
- derive or explicitly source starting learned-skill loadouts;
- map Maid and Butler scenario labels to Attendant mechanics for class-domain joins.

### Resolver and UI work required later

- define one selection type including route and existing unit-specific controls;
- define the permanent/guest lifecycle policy for the 15 ambiguous non-Avatar cases;
- resolve one availability/base-stat/route-join tuple or an explicit conditional result;
- intersect offspring route and parent selections;
- replace per-scenario recruitment cards with one compact surface;
- calculate effective growths from normalized class growths;
- separate personal skill, learned skills, inventory, weapon levels, caps, and stance summaries;
- retain the independent class-access exceptions currently carried by the Identity section.

## Blocking Decision Before Resolver Work

Implementation sequence steps 3-6 can proceed without changing availability semantics. Before step 7, resolver work must stop for a confirmed lifecycle rule for the 15 early-appearance/rejoin combinations.

Recommended decision for review:

> The route-driven base configuration selects the unit's permanent controllable recruitment or return state. Earlier guest or temporary appearances remain attached as route-specific context and are not discarded. Felicia and Jakob additionally resolve by Avatar gender. If no permanent state exists, use the earliest controllable state and label it explicitly.

This recommendation preserves every accepted scenario while giving the route surface one deterministic starting state. It has not been implemented by steps 1-2.

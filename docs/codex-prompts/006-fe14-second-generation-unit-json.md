# Milestone 6 - FE14 Second-Generation Unit JSON Foundation

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
- `docs/codex-prompts/005-fe14-first-generation-unit-json.md`

Treat the completed first-generation dataset and the child-inheritance requirements in `DATA_FOUNDATION.md` as the starting contract. Preserve the final decisions recorded in `005`; do not regress first-generation data or rebuild its accepted records in a new shape merely for symmetry.

This is a curated static-data milestone. "Database" means validated normalized JSON plus the generated FE14 runtime payload consumed by the static frontend. Do not add SQLite, Express, a hosted API, accounts, or another public runtime dependency.

## Branch Workflow

Before making code, data, dependency, or generated-file changes:

1. Show `git branch --show-current`.
2. Show `git status --short`.
3. Ask whether this milestone should use a new branch unless a branch has already been explicitly approved in the current conversation.
4. Preserve `火纹if.xlsx` and all existing user changes.
5. Do not reset, stash, revert, commit, push, merge, or delete branches unless explicitly requested.

Planning-only edits do not require a feature branch when the user explicitly waives that requirement. Implementation still requires the branch decision.

## Goal

Add every playable FE14 second-generation unit to the curated normalized dataset and generated runtime payload.

The expected roster is 21 canonical children numbered `49` through `69`, with Kana represented as one canonical unit whose gender is variable rather than as two unrelated units. Canonical order follows child-paralogue order from Paralogue 2 through Paralogue 22. Confirm aliases, portrait mapping, and workbook sheets during bootstrap before entering detailed records.

The milestone succeeds when all approved children have:

- canonical identity and route availability;
- fixed-parent and variable-parent rules;
- paralogue recruitment and story-progress scaling inputs;
- child-base personal growths and cap-modifier inputs;
- fixed and inherited class-access inputs;
- personal skills;
- fixed supports, conditional parent/sibling supports, and seal outcomes;
- Attack Stance and Guard Stance bonuses;
- Offspring Seal behavior where applicable;
- source provenance, validation coverage, review status, and generated runtime records;
- a reviewable profile in the existing FE14 reference viewer.

Do not precompute and store every possible pairing outcome. Store canonical inputs and explicit rules, then derive scenario-dependent outcomes deterministically.

## Terminology

Use:

```json
{
  "generation": "second"
}
```

Definitions:

- **Fixed parent:** the parent whose relationship identifies the child and unlocks that child's paralogue under ordinary rules.
- **Variable parent:** the eligible S-support partner whose data changes the child's outcome.
- **Resolved child:** a child evaluated for one explicit legal parent pairing and, when applicable, one Corrin configuration.
- **Child-base growth:** the child's canonical personal growth input before the applicable parent formula.
- **Resolved personal growth:** the derived personal growth vector after the verified parent formula, before class growths.
- **Parent stat snapshot:** the parents' actual gained stat points at the time the child bases are evaluated. It is scenario input, not a fixed fact about the child.
- **Offspring Seal:** the child-only recruitment item and its story-progress-dependent promotion, level, weapon-rank, and skill behavior.

Do not use "mother" as a schema role when the rule is really "variable parent." Ordinary children, Shigure, and Kana do not all select the participating parent in the same way.

## Hard Scope Boundary

This milestone includes:

- a second-generation roster manifest;
- source catalog additions needed by this slice;
- child identities, aliases, portraits, and unit flags;
- fixed-parent and variable-parent eligibility rules;
- pairings that produce no child;
- sibling relationships created by a selected pairing;
- paralogue unlock conditions and route availability;
- child recruitment level, class, inventory, weapon ranks, and story-progress scaling inputs;
- Offspring Seal thresholds and effects;
- child-base personal growth vectors;
- child cap-modifier inputs and verified formulas;
- fixed class access and parent-inherited class rules;
- skill inheritance rules and non-inheritable restrictions;
- Dragon Vein and Dragon/Beast tag inheritance where applicable;
- fixed child supports and conditional parent/sibling support rules;
- Friendship Seal and Partner Seal outcomes for child-to-child relationships;
- Attack Stance and Guard Stance bonuses;
- normalized schemas, validation, reports, focused tests, runtime generation, and viewer support.

This milestone excludes:

- saved pairings, run plans, or build-planner workflows;
- automatically choosing an optimal parent;
- campaign-wide pairing conflict resolution;
- enemy rosters or strategy data for child paralogues;
- full paralogue enemy scaling;
- combat calculations;
- projected level-up simulations beyond the verified recruitment formula;
- class-growth charts unrelated to resolving a child formula;
- DLC classes, Amiibo classes, and DLC skills except as explicit inheritance restrictions;
- subjective workbook ratings, builds, jokes, and recommendations;
- correcting the raw workbook in place;
- bulk-importing all child sheets without per-child review.

## Approved Sources

Follow the source policy in `docs/DATA_FOUNDATION.md`.

Primary independent references:

- Serenes Forest;
- Fire Emblem Wiki at `fireemblemwiki.org`;
- directly inspected game data or controlled in-game observations when published references are incomplete.

Specialized references may be used for:

- Partner Seal and Friendship Seal outcomes;
- child class inheritance and fallback tables;
- Offspring Seal thresholds;
- skill inheritance restrictions.

Raw project sources:

- `火纹if.xlsx`;
- the user's existing Chinese child-mechanics notes, treated as a candidate rules summary to be independently checked rather than as automatic proof.

The Fandom-hosted character list may be used only as the already-approved directory-order reference. Do not use Fandom prose as mechanical verification evidence. Search snippets, unsourced guides, and isolated forum claims are discovery aids, not canonical sources.

Paragon deserves acknowledgment as the community-maintained editor and reverse-engineering shell that makes much of FE13-FE15's structured game data accessible. It is not an approved data source for this milestone: do not add ROM extraction, Paragon exports, decompiled event scripts, or executable analysis to the second-generation workflow. A later, explicitly scoped audit may reconsider those tools using a legally dumped copy of the game. Until then, continue using corroborated published sources and reproducible in-game evidence.

## Pre-Implementation Mechanics Verification

The user's Chinese child-mechanics note is substantially correct, with these source-backed clarifications fixed as milestone decisions:

- **Growth parent:** resolved personal growth is `(child-base personal growth + variable parent's personal growth) / 2`. Class growth is added only when displaying full in-class growth. The schema role is `variable_parent`, not universally `mother`; ordinary fixed-father children select a mother, Shigure selects a father, and Kana selects Corrin's spouse.
- **Maximum-stat modifiers:** each non-HP modifier is `fixed parent + variable parent + 1`. Kana does not receive the usual `+1` when Corrin's spouse is a second-generation unit.
- **Recruitment bases:** use the verified level-10 absolute child bases, combined child growth, class bases, and both parents' personal-stat snapshots. Negative parent contributions become zero, the combined contribution is divided by four, and each stat's contribution is capped at `floor(C / 10) + 2` before the final floor. Preserve intermediate values in tests and the viewer.
- **Class inheritance:** a child normally has their own class set plus one class from each parent. Duplicate, Songstress, special-primary, and already-owned cases use the verified secondary or parallel-class fallback rules; do not reduce these to the abbreviated prose table alone.
- **Attack Stance / Tag Team:** no support starts with Hit +10; rank contributions are Mother C, Father B, Mother A, Father S.
- **Guard Stance / Pair Up:** rank contributions are Father C, Mother B, Father A, Mother S. These contributions are cumulative and are added to class Pair Up stats when displaying the full result.
- **No-child pairings:** same-sex Corrin S supports with Niles or Rhajat do not produce Kana or unlock a child paralogue.
- **Male Corrin pairing constraint:** if male Corrin marries an ordinary first-generation bachelorette who could instead marry a fixed father, the campaign lacks enough such women to pair every fixed father and at least one child paralogue becomes missable. A second-generation spouse or a Corrin-exclusive first-generation spouse avoids that shortage; Anna is DLC and remains outside this milestone's standard roster logic.
- **Offspring Seal:** children whose paralogues are entered after Chapter 18 is completed, meaning the Chapter 19 story position onward, receive the seal. Verify the chapter-by-chapter promoted level, rank, inventory, and automatic-skill table before entering those thresholds because the broad behavior is sourced more strongly than every detailed threshold in the supplied note.
- **Skill inheritance:** the last equipped eligible skill from each parent is scenario input. Inspiring Song and DLC skills are not inheritable; verify any additional restricted categories before encoding the allow/deny rules.
- **Dragon Vein and unit tags:** a child inherits Dragon Vein eligibility when at least one parent has it at the relevant recruitment snapshot. Kana retains the Dragon tag; every non-Kana offspring whose selected parent is Corrin also inherits the Dragon tag. Kana can additionally inherit Beast from an applicable spouse of Corrin, and Shigure can inherit Beast from an applicable father. Keep Dragon Vein capability, Dragon effectiveness, Beast effectiveness, and inherited class access as separate fields.

Primary reference pages for these decisions:

- Serenes Forest FE14 growth-rate tables;
- Serenes Forest FE14 base-stat tables;
- Serenes Forest FE14 maximum-stat tables;
- Serenes Forest FE14 class-set, parallel-class, and class-changing pages;
- Serenes Forest FE14 Support Bonus and Pair Up Stats pages;
- Fire Emblem Wiki's numbered Fates paralogue index and per-paralogue recruitment pages.

## Existing Baseline

Build on the delivered first-generation foundation:

- 48 accepted first-generation units;
- 22 standard non-DLC class trees;
- normalized recruitment, base-stat, growth, cap, skill, support, class-access, and pair-up files;
- Corrin's gender, boon, bane, Talent, route promotion, support, and stance configuration;
- deterministic validation and runtime generation;
- `/FE14/Units` and `/FE14/Units/:unit` reference views;
- FE14 frontend code and portraits under `src/games/fe14/`.

Extend existing schemas with discriminated child records where practical. Add a child-specific file when forcing variable child rules into a fixed first-generation record would make either side misleading.

No new dependency is expected. Prefer Zod, TypeScript, `tsx`, Vitest, React, and the existing UI libraries.

## Required Data Boundaries

Preserve raw, normalized, report, and runtime separation. The expected additions are:

```text
data/
  normalized/
    fe14/
      units/
        first-generation.json
        second-generation.json
      child-parentage.json
      child-inheritance-rules.json
      offspring-seal-scaling.json
      unit-availability.json
      unit-base-stats.json
      unit-growths.json
      unit-cap-modifiers.json
      unit-class-access.json
      support-relationships.json
      personal-skills.json
      unit-pairup-bonuses.json
  reports/
    fe14/
      second-generation-progress.json
      second-generation-validation.json
      second-generation-validation.txt
  runtime/
    fe14/
      units.json
```

Small path adjustments are acceptable when the implementation demonstrates a clearer validated boundary. Do not create one giant child JSON object containing identity, every pairing permutation, formulas, sources, and generated outcomes.

## Roster and Ordering

Bootstrap the explicit 21-unit second-generation manifest below. `unitNo` follows canonical paralogue order, not route grouping or review order:

| Unit No. | Canonical ID | English name | Paralogue | Paralogue title | Fixed parent |
| ---: | --- | --- | ---: | --- | --- |
| 49 | `kana` | Kana | 2 | Dragon Blood | Corrin |
| 50 | `shigure` | Shigure | 3 | Surprise Duet | Azura |
| 51 | `dwyer` | Dwyer | 4 | Fight or Flight | Jakob |
| 52 | `sophie` | Sophie | 5 | Bold Approach | Silas |
| 53 | `midori` | Midori | 6 | Herbal Remedy | Kaze |
| 54 | `shiro` | Shiro | 7 | Father & Liege | Ryoma |
| 55 | `kiragi` | Kiragi | 8 | A Great Hunt | Takumi |
| 56 | `asugi` | Asugi | 9 | Saizo vs. Saizo | Saizo |
| 57 | `selkie` | Selkie | 10 | Hunter & Prey | Kaden |
| 58 | `hisame` | Hisame | 11 | A Long Grudge | Hinata |
| 59 | `mitama` | Mitama | 12 | Sweet Dreams | Azama |
| 60 | `caeldori` | Caeldori | 13 | Truly Talented | Subaki |
| 61 | `rhajat` | Rhajat | 14 | After the End | Hayato |
| 62 | `siegbert` | Siegbert | 15 | Hidden Bravery | Xander |
| 63 | `forrest` | Forrest | 16 | Abducted | Leo |
| 64 | `ignatius` | Ignatius | 17 | Two Defenders | Benny |
| 65 | `velouria` | Velouria | 18 | Nutty Family | Keaton |
| 66 | `percy` | Percy | 19 | Great Heroism | Arthur |
| 67 | `ophelia` | Ophelia | 20 | Ultimate Power | Odin |
| 68 | `soleil` | Soleil | 21 | Bright Smile | Laslow |
| 69 | `nina` | Nina | 22 | Abrupt Clash | Niles |

Validate English names, canonical IDs, Japanese and Chinese aliases, workbook sheet names, portraits, and fixed parents before detailed entry. Kana remains one unit and one presentation slot with male and female profile variants.

Keep `processingOrder` separate from `unitNo`. Review may begin with Dwyer while source JSON, generated runtime data, and roster presentation retain the canonical order above.

Keep normalized child unit records in canonical `unitNo` order from `49` through `69`. Within each child's route-conditional support and class sections, order records first by applicable route count, descending, then the relevant partner's canonical unit number, ascending. Do not rely on frontend sorting to repair source JSON order.

## Processing Sequence

Process one child at a time in this review order unless the user explicitly changes it:

| Order | Canonical ID | English name | Fixed parent | Review role |
| ---: | --- | --- | --- | --- |
| 1 | `dwyer` | Dwyer | Jakob | [x] Golden ordinary child; first implementation slice |
| 2 | `sophie` | Sophie | Silas | [x] Shared |
| 3 | `midori` | Midori | Kaze | [x] Shared |
| 4 | `shiro` | Shiro | Ryoma | [x] Hoshido |
| 5 | `kiragi` | Kiragi | Takumi | [x] Hoshido; growth regression |
| 6 | `asugi` | Asugi | Saizo | [x] Hoshido |
| 7 | `selkie` | Selkie | Kaden | [x] Hoshido; Beast |
| 8 | `hisame` | Hisame | Hinata | [x] Hoshido |
| 9 | `mitama` | Mitama | Azama | [x] Hoshido |
| 10 | `caeldori` | Caeldori | Subaki | [x] Hoshido |
| 11 | `rhajat` | Rhajat | Hayato | [x] Hoshido; Corrin support exception |
| 12 | `siegbert` | Siegbert | Xander | [x] Nohr; Dragon Vein |
| 13 | `forrest` | Forrest | Leo | [x] Nohr; Dragon Vein |
| 14 | `ignatius` | Ignatius | Benny | [x] Nohr |
| 15 | `velouria` | Velouria | Keaton | [x] Nohr; Beast |
| 16 | `percy` | Percy | Arthur | [x] Nohr |
| 17 | `ophelia` | Ophelia | Odin | [x] Nohr |
| 18 | `soleil` | Soleil | Laslow | [x] Nohr |
| 19 | `nina` | Nina | Niles | [x] Nohr; Corrin support exception |
| 20 | `shigure` | Shigure | Azura | [x] Special variable-father child |
| 21 | `kana` | Kana | Corrin | [ ] Avatar child; always last |

Dwyer is the golden unit because he exercises the ordinary fixed-father/variable-mother path and is the explicitly approved first implementation slice. Shigure remains near the end because his fixed mother reverses the ordinary parent role. Kana remains final because gender, Corrin configuration, Corrinsexual pairings, child-unit spouses, sibling outcomes, and cap exceptions must extend a proven model rather than define it prematurely.

## One-Child-at-a-Time Review Gate

Do not bulk-convert the child block. For each child:

1. Mark only that child `in_progress`.
2. Inspect the workbook sheet and record exact locators.
3. Confirm identity, aliases, fixed parent, routes, portrait, and unit number.
4. Enter the paralogue unlock and recruitment rules.
5. Enter child-base growths, cap inputs, fixed class access, personal skill, and pair-up bonuses.
6. Enter fixed supports and conditional parent/sibling support rules.
7. Resolve Heart, Friendship, Partner, and parent-inherited class origins separately.
8. Apply the shared child formulas to representative legal parent scenarios.
9. Compare applicable facts against independent sources.
10. Run focused validation and tests.
11. Review the normalized and generated diff for that child only.
12. Mark the child `in_review` and pause.
13. Wait for explicit user approval before marking the child `accepted` and starting the next child.

Never auto-accept a child on the user's behalf. Parsing, generation, or passing tests is not user approval.

If a shared formula changes while reviewing a later child, rerun the golden scenarios and report every previously accepted child whose generated outcome changes.

## Parentage and Paralogue Rules

Each child-parentage record must identify:

- the fixed parent;
- how the variable parent is selected from legal S supports;
- route restrictions inherited from recruitment and pairing availability;
- the support event that unlocks the paralogue;
- explicit same-sex or otherwise non-producing pairings;
- conditional sibling roles;
- Corrin and Azura exceptions;
- whether the child can be Corrin's first or second child in the selected family.

Derive eligible variable parents from accepted supports when possible, but preserve explicit exclusions and exceptions in child rules. Do not copy a long parent list into every child record if it can be validated from one canonical relationship source.

Sibling relationships are scenario-dependent. Store a sibling role or rule, not a false unconditional edge between every potential sibling pair.

## Growth Rules

For each child, store one canonical child-base personal growth vector with all eight stats. Do not store class growths inside that vector.

Before implementing resolved growths, verify:

- which parent participates for an ordinary child;
- Shigure's participating-parent rule;
- Kana's participating-parent rule for both Corrin genders and for child-unit spouses;
- exact averaging and rounding behavior;
- whether Corrin boon and bane growth deltas participate when Corrin is the applicable parent.

Represent the formula as a typed rule with named inputs. Do not infer it from fixed-parent gender in application code, and do not precompute one vector per legal spouse.

The verified resolved-personal-growth formula is:

```text
resolved personal growth = (child-base personal growth + variable-parent personal growth) / 2
full in-class growth = resolved personal growth + current-class growth
```

Preserve half-point results exactly in normalized and derived data. Do not silently round the personal-growth average unless direct game-data evidence establishes a display-specific rounding rule.

The known Kiragi workbook discrepancy is a required regression case: the workbook candidate Defense growth of `30` must be checked against the corroborated value of `40`. Preserve the source disagreement in the report and do not silently normalize it.

## Maximum-Stat Modifier Rules

Store each child's canonical modifier input separately from the resolved result.

Verify and encode:

- the ordinary parent-sum formula;
- the usual child bonus;
- Kana's exception;
- Corrin boon and bane cap deltas when applicable;
- negative and mixed-sign vectors;
- whether a child-unit parent changes Kana's bonus.

Cap vectors contain the seven non-HP stats. Tests must assert intermediate parent vectors, the child bonus decision, and the final result.

The ordinary resolved cap-modifier formula is `fixed parent + variable parent + 1` per stat. For Kana with a second-generation variable parent, omit the usual `+1`. Corrin's resolved boon/bane modifier vector participates whenever Corrin is one of the two parents.

## Recruitment Bases and Story Scaling

Do not store one false fixed joining-stat block for a child whose bases depend on recruitment timing and parent performance.

Separate:

- canonical level-10 child base inputs;
- child combined growth inputs used by the verified base formula;
- each parent's actual gained stat points at recruitment;
- story-progress or displayed-chapter scaling;
- class bases;
- final derived joining stats;
- inventory and weapon ranks;
- Offspring Seal state.

The user's existing base-stat formula is a candidate specification. Cross-check its definition of `N`, intermediate `C`, parent contribution, caps, flooring, and exact rounding before encoding it. Add tests that expose every intermediate term.

Do not model child-paralogue enemy scaling merely because it uses related story-progress inputs.

## Offspring Seal Rules

Create one shared, source-backed table rather than duplicating chapter thresholds on every child.

The verified map-level table describes displayed Chapters 19-27 with map levels progressing from 22 through 38. Children have internal level 10. Before promotion, their scaled level is the greater of level 10 and the current map level; an Offspring Seal converts that effective level to promoted displayed level by subtracting 20. Verify any still-unresolved presentation details, including:

- main and secondary weapon ranks at every threshold;
- automatic promotion-class selection;
- which class skills are automatically learned;
- inventory timing and whether the seal must be used manually;
- route, difficulty, version, and region differences.

Children and the special castle recruits share the chapter map-level input, as identified and explained by FE14 modder ltranc@, but they do not share one complete formula. Children use internal level 10 and Offspring Seal promotion conversion. Flora and Izana use internal level 28 from promoted level 5; Yukimura and Fuga use internal level 33 from promoted level 10. Keep child stat inheritance, parent contributions, promotion gains, and actual Offspring Seal effects separate from castle-recruit stat calculation.

## Class Inheritance Rules

Class access must distinguish:

```text
base_class
heart_seal
friendship_seal
partner_seal
avatar_talent
parent_inheritance
dlc_item
amiibo
```

`parent_inheritance` becomes legal only for second-generation records.

Verify and encode:

- the child's fixed class family;
- the class inherited from the fixed parent;
- the class inherited from the variable parent;
- what happens when a child's fixed class duplicates a parent's primary class;
- secondary-class and parallel-class fallbacks;
- Songstress restrictions;
- gendered Troubadour, Shrine Maiden/Monk, and promotion handling;
- classes with no valid parallel fallback;
- Corrin Talent inheritance;
- Beast and Dragon class/tag behavior;
- classes already owned through another origin.

Use one explicit fallback table with provenance. The existing Chinese notes provide candidate mappings, including Cavalier/Ninja, Knight/Spear Fighter, Fighter/Oni Savage, Mercenary/Samurai, Outlaw/Archer, Dark Mage/Diviner, and Wyvern Rider/Sky Knight. Verify every mapping and all no-fallback families before accepting the table.

Inherited class access is present at recruitment. Friendship and Partner Seal access gained later remains separate and must reference the relevant child support.

## Skill, Dragon Vein, and Unit-Tag Inheritance

Verify and encode:

- which equipped skill slot each parent passes;
- when skill inheritance is evaluated;
- non-inheritable personal, Songstress, DLC, enemy-only, and special skills;
- skills automatically learned through an Offspring Seal;
- the difference between an inherited skill and a skill merely learnable from an inherited class;
- Dragon Vein eligibility inherited from royal parents;
- Dragon and Beast tags inherited by Kana, Shigure, or another applicable child.

Do not store an arbitrary parent's current equipped skill as canonical child data. Runtime or planner input must supply the selected skill IDs, and validation must reject an illegal inheritance choice with an explanation.

## Supports, Seal Grants, and Pair-Up Bonuses

Preserve the existing support ownership rules:

- fixed child-to-child supports are unique canonical relationships;
- parent and sibling supports are conditional roles, not duplicated unconditional edges;
- Friendship and Partner Seal grants are directed outcomes;
- same relationship does not imply symmetric class access;
- duplicate and already-owned class outcomes remain explicit;
- route and parent conditions remain visible.

Child stance bonuses are parent-derived and must update with the selected legal variable parent:

| System | No support | C | B | A | S |
| --- | --- | --- | --- | --- | --- |
| Attack Stance / Tag Team | Hit +10 | Mother's C | Father's B | Mother's A | Father's S |
| Guard Stance / Pair Up | - | Father's C | Mother's B | Father's A | Mother's S |

For ordinary children, the selected mother supplies the mother-ranked columns while the fixed father supplies the father-ranked columns. For Shigure and Kana, resolve the actual father and mother first, then apply the same rank ownership table. Do not assign all four ranks to the selected variable parent. Preserve cumulative-rank behavior, and distinguish personal support-rank contributions from class Pair Up stats.

## Runtime Representation

Generate one combined FE14 runtime payload that can expose both generations without breaking existing first-generation URLs or records.

Runtime child records should retain:

- fixed data needed for the profile;
- compact source IDs;
- typed parentage and inheritance rules;
- references to shared Offspring Seal thresholds;
- enough information to derive a selected legal pairing;
- no explosion of precomputed spouse permutations.

Generation must remain deterministic. First-generation runtime records should be byte-stable except for intentional shared-envelope or indexing changes that are reviewed explicitly.

## Frontend Inspection Surface

Extend the existing FE14 reference viewer only as needed to inspect the new data:

- place two dropdowns together as one roster filter set on `/FE14/Units`;
- keep the existing route dropdown and add a generation dropdown with exactly `All`, `First Generation`, and `Second Generation`;
- apply route and generation filters together as an intersection, while preserving canonical unit-number order inside the result;
- retain canonical unit numbers on every roster card;
- show child portraits, generation, fixed parent, paralogue, and route availability;
- show fixed personal skill, base growth input, pair-up bonuses, and fixed supports;
- show parent-dependent fields as formulas or clearly labeled unresolved selections rather than false fixed values;
- expose the generated runtime object through the existing JSON visualizer;
- keep references compact.

Add a parent selector to each child profile after the resolver rules are validated. The visible label is contextual:

- `Mother` for ordinary fixed-father children;
- `Father` for Shigure;
- `Parent` for Kana, whose fixed parent is Corrin and whose available spouse set depends on Corrin's gender and route.

The dropdown must contain only legal, route-compatible options. Selecting a parent updates the same shared resolved-child scenario across the page, including:

- resolved personal growth rates;
- resolved maximum-stat modifiers;
- Attack Stance / Tag Team bonuses;
- Guard Stance / Pair Up bonuses;
- inherited class access, conditional family supports, Dragon Vein, and Dragon/Beast tags where applicable.

All dependent sections read one shared selector state; changing the parent in one place must not allow stale values elsewhere. This remains a reference preview, not a saved build, pairing optimizer, or campaign planner.

Do not hide uncertainty behind a polished final number. If recruitment bases require parent stat snapshots not supplied by the viewer, show the formula and required inputs.

## Progress and Validation Reports

Maintain `second-generation-progress.json` with one entry per child and only one `in_progress` child at a time.

Each entry should report:

- identity and fixed-parent coverage;
- recruitment and Offspring Seal coverage;
- growth, cap, class, skill, support, and pair-up coverage;
- workbook locators;
- independent sources;
- tested parent scenarios;
- findings, disputes, and unresolved rules;
- `not_started`, `in_progress`, `in_review`, `accepted`, or `blocked` processing status.

Generate machine-readable and text validation reports covering:

- roster count, ordering, and workbook mapping;
- duplicate or missing child IDs;
- fixed parents and legal variable-parent resolution;
- non-producing pairings;
- child and sibling support conditions;
- missing child-base vectors;
- disputed workbook values, including Kiragi;
- unresolved formulas or rounding;
- class fallback coverage;
- illegal inherited skills;
- Offspring Seal threshold completeness;
- broken first-generation references;
- deterministic combined runtime generation;
- accidental precomputed pairing explosions;
- editorial workbook fields excluded from normalization.

Reports are generated artifacts. Do not hand-edit them.

## Required Scenario Tests

At minimum, golden tests must cover:

- Dwyer with an ordinary legal variable mother;
- an ordinary child whose fixed class duplicates a parent's primary class;
- Shigure with a variable father;
- male Kana and female Kana;
- Corrin as an applicable parent with boon, bane, and Talent effects;
- Kana with a second-generation spouse where the cap-bonus exception is applicable;
- a duplicate inherited class that triggers a fallback;
- a gender-specific class substitution;
- a Songstress inheritance restriction;
- a legal inherited skill and each prohibited skill category;
- a royal child with Dragon Vein;
- a Beast child and a mixed Dragon/Beast tag outcome;
- siblings created by one selected pairing;
- a pairing that produces no child;
- a route-ineligible pairing;
- recruitment before Chapter 19 without an Offspring Seal;
- recruitment at multiple Chapter 19-27 Offspring Seal thresholds;
- parent stat snapshots producing positive, zero, and capped base-stat contributions;
- Kiragi's corrected Defense growth and visible source disagreement.

Each scenario test must assert intermediate rule decisions and explanations, not only final vectors.

## Per-Child Verification Commands

Extend the existing commands with an actual child-focused filter. A reasonable interface is:

```text
npm run data:validate -- --unit dwyer
npm test -- <focused child data-test path>
```

Use only implemented syntax. After each child:

1. Run focused validation for that child and shared rules it changed.
2. Run the narrowest relevant tests.
3. Inspect normalized, report, and runtime diffs.
4. Confirm previously accepted golden scenarios did not change unexpectedly.
5. Present the child for user review and pause.

## Checkpoints

Run broader validation after:

- second-generation schema and roster bootstrap;
- Dwyer;
- shared and Hoshido children through Rhajat;
- Nohr children through Nina;
- Shigure;
- Kana;
- final combined runtime and frontend integration.

At a checkpoint, report accepted, in-review, disputed, blocked, and remaining counts. Do not use a checkpoint to auto-accept units.

## Final Verification

Run:

- the complete data validator;
- deterministic runtime generation twice and compare output;
- the full Vitest suite;
- `npm run typecheck`;
- `npm run build`;
- `git diff --check`;
- a Unicode/mojibake scan of touched JSON, reports, and frontend files.

Inspect generated records for:

- Dwyer;
- one Hoshido child;
- one Nohr child;
- one royal child;
- one Beast child;
- Shigure;
- male and female Kana scenarios.

Confirm the original 48 first-generation records remain present and accepted, all 21 children are present, and no Amiibo or unrelated bonus unit entered the playable roster.

## Acceptance Criteria

- Exactly 21 approved canonical second-generation units are represented.
- Their canonical `unitNo` values are contiguous from `49` through `69` and follow Paralogue 2 through Paralogue 22.
- Kana is one variable-gender unit, not two unrelated canonical IDs.
- Every child has a verified fixed parent and legal variable-parent rule.
- Pairings that produce no child are explicit and tested.
- Paralogue availability and route restrictions are typed.
- Child-base growths are distinct from resolved personal growths and class growths.
- Cap inheritance, child bonus, Kana exception, and Corrin modifiers are explicit.
- Fixed, parent-inherited, Heart, Friendship, Partner, and Avatar Talent class origins are not conflated.
- Skill inheritance and non-inheritable restrictions are encoded and tested.
- Parent/sibling supports are conditional rather than false unconditional edges.
- Offspring Seal thresholds, levels, ranks, and skills are independently sourced.
- Recruitment bases do not pretend parent performance is fixed.
- Kiragi's known discrepancy is visible and resolved from approved evidence.
- Every child has a sourced personal skill, parent-derived stance inputs, and applicable fixed supports.
- `/FE14/Units` combines route and generation dropdowns without changing canonical order.
- Each child profile's legal-parent selector updates growths, cap modifiers, Attack Stance, Guard Stance, and other inherited outcomes from one shared scenario.
- Every accepted logical record has applicable provenance.
- One child at a time was presented for explicit user acceptance.
- Runtime generation is deterministic and does not precompute every pairing.
- The FE14 viewer can inspect all children and their JSON records.
- Existing first-generation validation and profile behavior remain green.
- No backend or new dependency was introduced without approval.

## Stop Conditions

Stop and ask the user before continuing if:

- the expected 21-unit roster, workbook mapping, or canonical ordering appears wrong;
- two applicable primary sources materially disagree and higher-confidence evidence does not resolve the conflict;
- the parent participating in a growth or cap formula cannot be verified;
- rounding, flooring, or parent-stat contribution behavior remains ambiguous;
- an Offspring Seal threshold conflicts across reliable sources;
- a child cannot be represented without materially changing first-generation semantics;
- a class fallback or skill restriction cannot be encoded explainably;
- a newly resolved shared rule changes an already accepted child;
- a new dependency appears necessary;
- unrelated user changes overlap the milestone files.

Do not weaken validation, silently choose one disputed formula, or mark a child accepted merely to continue the sequence.

## Completion Report

After completing the milestone, stop and report:

- branch and final working-tree status;
- files created, modified, and generated;
- dependencies added, if any, and why;
- final first-generation and second-generation roster counts;
- processing order and fixed-parent mapping;
- accepted, in-review, disputed, and blocked counts;
- source coverage and material disagreements;
- verified growth, cap, class, skill, recruitment, and Offspring Seal rules;
- workbook corrections represented in normalized data;
- validation, generation, test, typecheck, build, diff, and Unicode results;
- runtime output produced;
- frontend inspection changes;
- remaining limitations before pairing and build-planner work.

Do not commit, push, merge, publish, or prune branches unless explicitly requested.

# Data Foundation

## Purpose

FireEmblemBuildHelper must produce explainable planning results from curated Fire Emblem data. This document defines how source material becomes trusted application data for Fire Emblem Fates / Fire Emblem if / FE14.

The first implementation slice focuses on units and personal growths. It must leave room for personal cap modifiers, class access, supports, child outcomes, recruitment constraints, weapon ranks, and other planner rules without treating any one spreadsheet or guide as automatically authoritative.

## Data Principles

- Keep source facts, derived results, and editorial recommendations separate.
- Preserve the provenance of every imported or manually curated fact.
- Prefer stable canonical IDs over display names or source-specific names.
- Treat route, region, version, gender, generation, and source as explicit dimensions when they affect a rule.
- Do not silently resolve source disagreements. Record and review them.
- Calculate derived values from canonical inputs instead of storing duplicated totals.
- Make planner results explainable: the application should be able to identify which facts and rules produced an outcome.
- Treat Fates mechanics as Fates-specific until another game proves that an abstraction is genuinely shared.

## Source Policy

### Primary References

Serenes Forest and Fire Emblem Wiki (`fireemblemwiki.org`) are the primary independent community references for Fates facts.

Serenes Forest is especially useful for compact mechanical tables, including:

- [Hoshidan character growth rates](https://serenesforest.net/fire-emblem-fates/hoshidan-characters/growth-rates/)
- [Nohrian character growth rates](https://serenesforest.net/fire-emblem-fates/nohrian-characters/growth-rates/)
- [Other and DLC character growth rates](https://serenesforest.net/fire-emblem-fates/other-characters/growth-rates/)

Fire Emblem Wiki is especially useful for unit-specific mechanics, aliases, support and class relationships, and explanations of exceptional rules. Relevant pages should be recorded individually rather than citing only the site homepage. For example:

- [Corrin stat mechanics](https://fireemblemwiki.org/wiki/Corrin/Stats)

A fact supported by both primary references may be accepted when their terminology and scope describe the same mechanic. Agreement does not remove the need to preserve both source references.

### Specialized Reclass References

The following community charts are specialized sources for relationship-based class access:

- [Fire Emblem Fates - Partner Seal Chart](https://drive.google.com/file/d/0B1EoYvI1FUNqZ3dpcjZwdU9CX0E/view?resourcekey=0-zq0JMUw2kAIcBfIeCmCR-A)
- [Fire Emblem Fates - Friendship Seal Chart version 1.2](https://drive.google.com/file/d/0B1EoYvI1FUNqaHhSd1pzUFJNSmc/view?resourcekey=0-kX2rTu6-3jF-6EDm8T7YXQ)

These charts provide concrete relationship-by-relationship class mappings and document many substitutions. They are still community-authored references. Special cases, substitutions, and apparent inconsistencies must be cross-checked against Fire Emblem Wiki and, where practical, Serenes Forest or observed game behavior.

The charts cover different mechanics and must not be conflated:

- a Heart Seal exposes a unit's innate alternate class set;
- a Friendship Seal exposes the class granted by an eligible A+ relationship;
- a Partner Seal exposes the class granted by an eligible S relationship.

### Project Workbook

`火纹if.xlsx` is a raw project source. It contains substantial useful data, including personal growths, class growths, character details, weapons, supports, child information, and planning notes.

The workbook is not a canonical runtime source because it mixes:

- source facts;
- manually duplicated calculations;
- implied class-access guesses;
- subjective ratings and recommended builds;
- inconsistent names and sheet structures.

Workbook facts may seed normalized records, but each imported fact must retain a workbook locator and pass the same corroboration and validation process as any other source.

### Sources Not Accepted by Default

The Fandom-hosted Fire Emblem wiki is not part of the normal verification chain. It may help locate terminology or a question to investigate, but it must not be the sole evidence for an accepted fact.

Search-result summaries, unsourced forum statements, build guides, and personal recommendations are also not canonical evidence. They may be retained as research notes when they identify a mechanic that requires verification.

### Higher-Confidence Evidence

Directly observed game behavior, reproducible tests, or responsibly extracted game data may supersede community references when the method, game version, region, and result are documented. Such evidence must not be presented as universal if it was tested only in one route, region, difficulty, or release.

## Review Status

Normalized facts should carry one of these review states:

- `candidate`: imported or transcribed but not independently checked;
- `corroborated`: supported by at least two applicable references;
- `accepted`: reviewed, validated, and approved for runtime data;
- `disputed`: applicable sources disagree or observed behavior conflicts with a reference;
- `deprecated`: retained for audit history but no longer used.

An absent value is not equivalent to a disputed value. Unknown, unavailable, not applicable, and route-restricted states must remain distinguishable.

## Provenance

Every source should have a stable source ID and enough metadata to audit it:

```text
source ID
title
URL or repository path
source type
author or maintainer, when known
version or revision, when available
date last checked
scope and known limitations
```

Each normalized record should identify its supporting source IDs. When only part of a record comes from a source, provenance should be attachable at the field or relationship level rather than implying that one source supports the entire object.

Source URLs and workbook locations belong in curated seed data and validation reports. The public runtime bundle may use compact source IDs and ship a separate source catalog.

## Canonical, Derived, and Editorial Data

### Canonical Inputs

Canonical inputs include facts such as:

- personal growth rates;
- personal maximum-stat modifiers;
- class growth rates and class caps;
- innate class sets and promotions;
- support relationships;
- fixed and variable parent relationships;
- route and recruitment availability;
- Friendship Seal and Partner Seal grants;
- weapon types, ranks, and rank requirements.

### Derived Results

Derived results include:

- personal growth plus class growth;
- a child's resulting personal growths;
- a child's resulting maximum-stat modifiers;
- all classes available to a unit in a selected pairing scenario;
- whether a planned skill or class path is legal;
- expected experience, weapon experience, or resource requirements.

Derived results must be calculated by tested rules. They must not be copied from workbook total rows into canonical seed data.

### Editorial Material

Ratings, recommended pairings, build labels, suggested skill sets, and commentary are editorial material. They may later become optional guides or user notes, but they must not influence legality checks or rules-engine calculations.

## Canonical IDs and Names

Internal IDs must be stable ASCII identifiers. A source name is an alias, not an ID.

Unit records should support multiple names where applicable:

- canonical English localization;
- Japanese name and romanization;
- Chinese community translations;
- source-specific spellings;
- known alternate or legacy spellings.

Aliases must identify their language or source. Name inconsistencies should be reported rather than producing duplicate units. For example, the workbook currently uses two Chinese spellings for Laslow in different locations.

The same rule applies to classes, skills, weapons, routes, chapters, and seals.

## Unit Data Slice

The initial unit slice should normalize at least:

```text
unit ID
names and aliases
unit kind: first generation, child, bonus, DLC, Amiibo, or other
gender behavior where mechanically relevant
route and version availability
fixed parent, when applicable
variable-parent rule, when applicable
personal growth vector
personal maximum-stat modifier vector
base class set
innate alternate class set
personal skill
source references and review status
```

Stat vectors must use one shared ordered schema. Personal growths use:

```text
HP, strength, magic, skill, speed, luck, defense, resistance
```

Maximum-stat modifier vectors normally omit HP and use:

```text
strength, magic, skill, speed, luck, defense, resistance
```

Code and data should use explicit stat keys rather than relying only on array position at runtime.

## Class Access

Class access must be represented as relationships with an origin and conditions, not as one unexplained list attached to a unit.

Expected origins include:

- `base_class`;
- `promotion`;
- `heart_seal`;
- `parent_inheritance`;
- `friendship_seal`;
- `partner_seal`;
- `avatar_talent`;
- `dlc_item`;
- `amiibo` or another game-specific unlock.

A relationship may also require route, gender, support rank, partner, parent, or version conditions. The normalized record must preserve substitutions caused by duplicate class sets, special classes, or gender-specific class variants.

The planner must distinguish three questions:

1. Which classes does the unit possess inherently or inherit when recruited?
2. Which classes can the unit access later through a specific support relationship and seal?
3. Which of those classes are legal in the selected route, version, and pairing scenario?

## Child Inheritance Rules

Child outcomes are a high-risk rules area. No child calculator should ship until the following mechanics are independently sourced, encoded, and covered by scenario tests.

### Parent Relationships

- Identify each child's fixed parent.
- Identify how the variable parent is selected.
- Record the Corrin and Azura exceptions explicitly.
- Record pairings that do not produce a child.
- Model sibling relationships without assuming that every shared parent creates the same class or support behavior.

### Growth Rates

- Verify the child's base personal growth vector.
- Verify which parent's personal growth vector participates in the calculation.
- Verify the exact averaging and rounding behavior for every stat.
- Apply class growth only after the resulting personal growth has been determined.
- Treat Corrin's boon and bane modifiers as inputs when Corrin is the applicable variable parent.

### Maximum-Stat Modifiers

- Verify each parent's personal modifier vector.
- Verify the child formula and the usual child bonus.
- Encode Kana's exception explicitly rather than as an accidental special-case total.
- Verify how Corrin's boon and bane affect inherited modifiers.
- Test negative modifiers, mixed-sign parents, and every exceptional child.

### Class Inheritance

- Distinguish the child's fixed class set from the class inherited from the variable parent.
- Verify duplicate-class fallback rules.
- Verify special-class substitutions.
- Verify gender-specific class substitutions and promotions.
- Verify Corrin talent inheritance and any case where it replaces or supplements a normal inherited class.
- Keep inherited class access separate from later Friendship Seal and Partner Seal access.

### Skill Inheritance and Recruitment

- Verify which equipped skill position is inherited from each parent.
- Verify when inheritance is evaluated for children who join during a map versus after a map.
- Verify restrictions on non-inheritable skills.
- Keep inherited skills separate from skills merely learnable through an accessible class.
- Record chapter scaling, Offspring Seal behavior, starting level, and weapon-rank rules separately from genetic inheritance.

### Required Scenario Tests

At minimum, golden tests should cover:

- an ordinary fixed-father child with an ordinary variable mother;
- Shigure and his variable father;
- male and female Kana;
- Corrin as a variable parent with boon, bane, and talent effects;
- a duplicate inherited class that triggers a fallback;
- a gender-specific class substitution;
- a child with a sibling through the chosen pairing;
- a pairing that grants no child;
- route-restricted and support-restricted class access.

Each test should assert intermediate values and rule explanations, not only the final growths or class list.

## Validation

The data pipeline should produce machine-readable failures and a concise human review report.

Validation should include:

- duplicate canonical IDs;
- unresolved or colliding aliases;
- missing required names or source references;
- invalid stat keys or values;
- broken unit, class, skill, support, parent, route, or source references;
- impossible support or seal relationships;
- route and version contradictions;
- canonical records supported by only one non-primary source;
- derived totals stored as if they were source facts;
- source disagreements and changed upstream values;
- Unicode corruption and mojibake.

For growth data, validation should recalculate any displayed totals, compare independently imported source tables, and report differences by unit and stat. Total growth sums are useful diagnostics but are not proof that individual stat values are correct.

## Known Workbook Findings

The initial workbook inspection found:

- 69 character sheets with personal or child-base growth vectors;
- broad agreement between those vectors and the Serenes Forest tables;
- Kiragi's Defense growth entered as `30` instead of the corroborated `40`;
- a Corrin note claiming Defense and Resistance boon/bane base-stat changes of `+2/-2` instead of `+1/-1`;
- inconsistent spellings for at least one unit name;
- unnamed, empty, experimental, and mislabeled sheets;
- combined growth rows that mix formulas with manually entered cells;
- no complete canonical personal maximum-stat modifier dataset in the character block.

These findings should become validation fixtures. Corrections belong in normalized seed data with provenance and review notes; the raw workbook should remain unchanged as source evidence.

## Initial Delivery Sequence

1. Register the source catalog and preserve the workbook as a raw source.
2. Normalize canonical unit IDs and aliases for the 69 character records.
3. Import personal and child-base growth vectors as candidates.
4. Independently compare every vector against Serenes Forest and Fire Emblem Wiki.
5. Correct and document reviewed discrepancies in normalized data.
6. Add personal maximum-stat modifiers from independently verified sources.
7. Normalize innate, Friendship Seal, and Partner Seal class access with explicit origins.
8. Specify and test child inheritance rules before exposing child outcomes in the planner.
9. Generate a compact runtime bundle only from accepted normalized records.

This sequence intentionally delivers a narrow, trustworthy unit foundation before attempting to import every workbook sheet or implement the complete Fates rules engine.

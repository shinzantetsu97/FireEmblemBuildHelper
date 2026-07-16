# Parent Unit JSON Plan

**Status:** Proposed

## Purpose

Build the first normalized Fire Emblem Fates data slice: all first-generation playable units represented as validated JSON, with no child units or child-outcome calculations.

This slice should capture the factual information represented by the Felicia worksheet in `火纹if.xlsx` while separating canonical inputs from derived calculations and editorial commentary.

This document proposes the JSON boundaries and record shapes. It does not authorize implementation beyond this planning step.

## Terminology

The working phrase "parent units" means the first-generation playable roster, not only units that can literally become a parent in every route or pairing.

The normalized field should be:

```json
{
  "generation": "first"
}
```

Whether a unit can produce Kana or another child is determined from validated support and parent rules. It should not be encoded by calling every first-generation unit a parent.

The initial workbook inventory contains 48 character sheets before the child-unit block. The implementation must identify units by canonical ID and an approved roster, not by relying permanently on worksheet order.

## Scope

Include factual first-generation data represented by the workbook's character sheets:

- canonical identity and aliases;
- gender where mechanically relevant;
- route and version availability;
- recruitment conditions and starting snapshots;
- initial class, level, stats, inventory, and weapon ranks when sourced;
- Dragon Vein access;
- personal skill;
- personal growths;
- personal maximum-stat modifiers once independently sourced;
- innate class families and Heart Seal access;
- support relationships and maximum support ranks;
- Friendship Seal and Partner Seal class grants;
- Attack Stance and Guard Stance support bonuses;
- source provenance and review status.

Exclude from this slice:

- all child-unit records;
- child growth or cap calculations;
- inherited child classes or skills;
- class growths embedded in unit records;
- combined personal-plus-class growths;
- subjective ratings, jokes, recommended roles, and recommended builds;
- Amiibo and experimental sheets unless explicitly added to the approved first-generation roster;
- frontend work.

## Source Requirements

Follow [DATA_FOUNDATION.md](DATA_FOUNDATION.md).

The initial applicable sources are:

- `火纹if.xlsx` as a raw candidate source;
- Serenes Forest as a primary table reference;
- Fire Emblem Wiki at `fireemblemwiki.org` as an independent primary reference;
- the Partner Seal Chart for S-support class grants;
- the Friendship Seal Chart version 1.2 for A+ class grants.

The Fandom-hosted wiki is not an accepted verification source.

No workbook value becomes accepted merely because it is present or formula-backed. Each normalized record must carry provenance and review status.

## Proposed Data Flow

```text
raw sources
  -> candidate extraction
  -> canonical ID and alias resolution
  -> normalized domain JSON
  -> schema and relationship validation
  -> cross-source comparison report
  -> accepted normalized JSON
  -> generated runtime unit bundle
```

The normalized files are the reviewable source of truth. The runtime bundle is generated and must not be edited manually.

## Proposed File Layout

Exact directories may be adjusted to match the implementation tooling, but the ownership boundaries should remain:

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
      first-generation-validation.json
      first-generation-validation.txt
  runtime/
    fe14/
      units.json
```

`data/raw/` preserves source evidence. `data/normalized/` contains curated inputs. `data/reports/` explains validation and source disagreements. `data/runtime/` contains compact generated payloads for the static frontend.

## Why Domain Files

One giant nested object per unit would duplicate support edges, class relationships, skills, and source metadata. It would also make reciprocal relationships easy to contradict.

The normalized format should therefore use domain files joined by stable IDs:

- one core unit record per unit;
- one recruitment record per distinct starting scenario;
- one canonical support edge per pair;
- one class-access relationship per origin and condition;
- one skill definition referenced by units;
- one stat record per unit and stat-record type.

The generated runtime bundle may join these records into frontend-friendly unit objects.

## Shared Types

### Canonical IDs

IDs are lowercase ASCII `snake_case` strings and remain stable when a display name changes.

Examples:

```text
felicia
corrin
birthright
maid
troubadour
mercenary
devoted_partner
```

IDs should not encode source-specific Chinese, Japanese, or localized spellings.

### Review Status

Use the statuses defined by `DATA_FOUNDATION.md`:

```text
candidate
corroborated
accepted
disputed
deprecated
```

Candidate records may omit facts not yet sourced. Accepted records must satisfy the complete schema for their record type.

### Source Reference

```json
{
  "sourceId": "workbook.fe_if",
  "locator": "菲利希亚!D2:K21",
  "note": "Candidate extraction from the Felicia worksheet"
}
```

`note` is optional. A URL belongs in the source catalog rather than being repeated in every data record.

### Routes

```text
birthright
conquest
revelation
```

Do not use labels such as `all` inside canonical relationships. Store explicit route IDs so future route additions or exclusions remain inspectable.

### Stats

Growth and base-stat objects use explicit keys:

```json
{
  "hp": 40,
  "strength": 10,
  "magic": 35,
  "skill": 30,
  "speed": 40,
  "luck": 55,
  "defense": 15,
  "resistance": 35
}
```

Maximum-stat modifiers omit HP:

```json
{
  "strength": -2,
  "magic": 2,
  "skill": 0,
  "speed": 1,
  "luck": 0,
  "defense": -1,
  "resistance": 1
}
```

The modifier values above are illustrative until independently corroborated during implementation.

## Source Catalog Format

`sources.json` contains one record per source artifact or source page:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "sources": [
    {
      "id": "workbook.fe_if",
      "title": "火纹if.xlsx",
      "type": "workbook",
      "path": "data/raw/fe14/火纹if.xlsx",
      "lastChecked": "2026-07-15",
      "scope": ["units", "growths", "classes", "supports", "weapons"],
      "limitations": [
        "Mixes facts, derived values, and editorial notes",
        "Contains known errors and inconsistent names"
      ]
    }
  ]
}
```

Remote sources use `url` instead of `path`. A specialized table or wiki page should receive its own source record rather than one site-wide record.

## Core Unit Format

`units/first-generation.json` owns identity and unit-level flags. It does not own supports, class grants, or duplicated skill descriptions.

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "units": [
    {
      "id": "felicia",
      "generation": "first",
      "unitKind": "standard",
      "gender": "female",
      "names": [
        {
          "locale": "en",
          "value": "Felicia",
          "kind": "localized"
        },
        {
          "locale": "zh-Hans",
          "value": "菲利希亚",
          "kind": "community"
        }
      ],
      "voiceActors": [
        {
          "locale": "ja",
          "name": "佐佐木希",
          "reviewStatus": "candidate",
          "sourceRefs": [
            {
              "sourceId": "workbook.fe_if",
              "locator": "菲利希亚!D3:E3"
            }
          ]
        }
      ],
      "dragonVein": false,
      "personalSkillId": "devoted_partner",
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!D2:I9"
        }
      ]
    }
  ]
}
```

`unitKind` should use a small explicit enum such as `standard`, `route_exclusive`, `bonus`, `dlc`, or `amiibo`. The approved roster will determine which kinds belong in this milestone.

Japanese voice-actor names must eventually use an appropriate Japanese locale and verified native spelling. The Chinese workbook transcription remains candidate data until checked.

## Personal Skill Format

Skill definitions are stored once and referenced by ID:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "skills": [
    {
      "id": "devoted_partner",
      "names": [
        {
          "locale": "en",
          "value": "Devoted Partner",
          "kind": "localized"
        },
        {
          "locale": "zh-Hans",
          "value": "绝对援护",
          "kind": "community"
        }
      ],
      "skillKind": "personal",
      "description": {
        "locale": "zh-Hans",
        "text": "充当后卫时，如果前卫是神威，则前卫伤害+2，受伤-2"
      },
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!D6:F6"
        }
      ]
    }
  ]
}
```

The English name in this example must be verified. Display descriptions are localized text; machine-readable skill effects belong to a later rules slice and should not be inferred from prose during this milestone.

## Recruitment Availability Format

Felicia demonstrates why recruitment is a list of conditional scenarios rather than one chapter and level on the unit record.

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "recruitment": [
    {
      "id": "felicia.avatar_male",
      "unitId": "felicia",
      "routes": ["birthright", "conquest", "revelation"],
      "condition": {
        "avatarGender": "male"
      },
      "chapter": 2,
      "level": 1,
      "classId": "maid",
      "inventoryItemIds": ["iron_dagger", "heal"],
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!D4:K5"
        }
      ]
    },
    {
      "id": "felicia.avatar_female",
      "unitId": "felicia",
      "routes": ["birthright", "conquest", "revelation"],
      "condition": {
        "avatarGender": "female"
      },
      "chapter": 16,
      "level": 13,
      "classId": "maid",
      "inventoryItemIds": [],
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!D4:K10"
        }
      ]
    }
  ]
}
```

Difficulty-specific or route-specific base changes should produce additional scenarios or explicit conditions. Do not encode compound values such as `2 or 16` in a numeric field.

Starting movement is normally derived from `classId`. Store a unit-specific movement override only when a verified exception exists.

## Base-Stat Snapshot Format

Base stats reference a recruitment scenario so level, class, inventory, and conditions cannot drift apart:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "baseStats": [
    {
      "recruitmentId": "felicia.avatar_male",
      "stats": {
        "hp": 19,
        "strength": 5,
        "magic": 9,
        "skill": 10,
        "speed": 10,
        "luck": 12,
        "defense": 5,
        "resistance": 9
      },
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B14:K15"
        }
      ]
    },
    {
      "recruitmentId": "felicia.avatar_female",
      "stats": {
        "hp": 24,
        "strength": 7,
        "magic": 14,
        "skill": 15,
        "speed": 17,
        "luck": 20,
        "defense": 7,
        "resistance": 14
      },
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B14:K16"
        }
      ]
    }
  ]
}
```

Weapon ranks should use the same recruitment ID when they vary by scenario. They require their own typed weapon-rank record rather than a string such as `剑E，石E`.

## Personal Growth Format

`unit-growths.json` stores personal growths only:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "personalGrowths": [
    {
      "unitId": "felicia",
      "rates": {
        "hp": 40,
        "strength": 10,
        "magic": 35,
        "skill": 30,
        "speed": 40,
        "luck": 55,
        "defense": 15,
        "resistance": 35
      },
      "reviewStatus": "corroborated",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B17:J17"
        },
        {
          "sourceId": "serenes.shared_growths",
          "locator": "Felicia"
        }
      ]
    }
  ]
}
```

Do not store workbook rows for Maid growth, Strategist growth, or combined growth here. Class growths belong to class records. Combined growths are calculated as:

```text
personal growths + current class growths
```

The implementation must test this calculation separately and must not trust workbook combined rows.

## Personal Cap Modifier Format

`unit-cap-modifiers.json` uses a separate seven-stat vector:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "personalCapModifiers": [
    {
      "unitId": "felicia",
      "modifiers": {
        "strength": -2,
        "magic": 2,
        "skill": 0,
        "speed": 1,
        "luck": 0,
        "defense": -1,
        "resistance": 1
      },
      "reviewStatus": "candidate",
      "sourceRefs": []
    }
  ]
}
```

The workbook does not provide a complete canonical cap-modifier table. The values must be populated from independently verified sources before this record can become accepted. Empty `sourceRefs` are allowed only during drafting and must fail accepted-data validation.

## Support Relationship Format

Store one relationship edge per unit pair. Sort `unitIds` lexically to prevent duplicate reversed edges.

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "relationships": [
    {
      "id": "felicia__flora",
      "unitIds": ["felicia", "flora"],
      "maximumRank": "a_plus",
      "routes": ["birthright", "conquest", "revelation"],
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B12:C12"
        },
        {
          "sourceId": "friendship_seal_chart.v1_2",
          "locator": "Felicia"
        }
      ]
    },
    {
      "id": "felicia__jakob",
      "unitIds": ["felicia", "jakob"],
      "maximumRank": "s",
      "routes": ["birthright", "conquest", "revelation"],
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B13:C13"
        },
        {
          "sourceId": "partner_seal_chart",
          "locator": "Felicia / Jakob"
        }
      ]
    }
  ]
}
```

The relationship record answers whether a support exists and its maximum rank. It does not itself imply the class grant. Class grants are explicit records so substitutions and exceptions remain inspectable.

The implementation must verify complete support availability rather than assuming the workbook's A+ and S lists contain every C-to-A relationship needed by the reference viewer.

## Class Access Format

Store class-family access with its origin and conditions. Use base-class family IDs; promotions are resolved from class data.

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "classAccess": [
    {
      "unitId": "felicia",
      "classId": "troubadour",
      "origin": "base_class",
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B10:C10"
        }
      ]
    },
    {
      "unitId": "felicia",
      "classId": "mercenary",
      "origin": "heart_seal",
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!D10:E10"
        }
      ]
    },
    {
      "unitId": "felicia",
      "classId": "samurai",
      "origin": "friendship_seal",
      "grantedByUnitId": "hana",
      "requiredSupportRank": "a_plus",
      "routes": ["birthright", "revelation"],
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "friendship_seal_chart.v1_2",
          "locator": "Felicia / Hana"
        }
      ]
    }
  ]
}
```

Do not import the workbook's long `支援职业组` text as one class list. Reconstruct each class grant from a specific support relationship, seal type, route, and substitution rule.

The class-access schema must support at least:

```text
base_class
heart_seal
friendship_seal
partner_seal
avatar_talent
dlc_item
amiibo
```

`parent_inheritance` is reserved for the child-unit milestone and must not appear in this slice.

## Pair-Up Bonus Format

Felicia's worksheet records bonuses gained at C, B, A, and S support for Attack Stance and Guard Stance. Store the rank deltas explicitly:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "pairUpBonuses": [
    {
      "unitId": "felicia",
      "stance": "attack",
      "rankDeltas": {
        "c": { "avoid": 5 },
        "b": { "criticalAvoid": 5 },
        "a": { "avoid": 5 },
        "s": { "avoid": 5, "criticalAvoid": 5 }
      },
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B7:G8"
        }
      ]
    },
    {
      "unitId": "felicia",
      "stance": "guard",
      "rankDeltas": {
        "c": { "speed": 1 },
        "b": { "resistance": 1 },
        "a": { "magic": 1 },
        "s": { "speed": 1, "resistance": 1 }
      },
      "reviewStatus": "candidate",
      "sourceRefs": [
        {
          "sourceId": "workbook.fe_if",
          "locator": "菲利希亚!B7:G9"
        }
      ]
    }
  ]
}
```

The implementation must verify that the workbook values are incremental rank deltas rather than already-cumulative totals before accepting this representation.

## Felicia Worksheet Mapping

| Workbook content | Normalized destination | Handling |
| --- | --- | --- |
| Name, romanization, localized name | Core unit | Preserve as typed names or aliases with locale and kind |
| Voice actor | Core unit metadata | Include as candidate descriptive metadata and verify native spelling |
| Initial class | Recruitment scenario | Reference canonical class ID |
| Initial movement | Derived from class | Store only a verified unit-specific override |
| Route chapter and level | Recruitment scenarios | Split compound values by Avatar gender and route |
| Initial weapons | Recruitment scenario | Reference canonical item IDs |
| Personal skill name and prose | Personal skill plus unit reference | Do not infer executable effects yet |
| Dragon Vein unit | Core unit flag | Typed boolean |
| Attack/Guard Stance bonuses | Pair-up bonus records | Verify whether worksheet values are incremental |
| Main role and rating joke | Editorial material | Exclude from canonical data |
| Class group | Base class-family access | Store canonical base family, derive promotions |
| Reclass group | Heart Seal class-family access | Store origin explicitly |
| Support class group prose | Generated relationship result | Rebuild from concrete support and seal relationships |
| A+ support list | Support edges plus Friendship Seal grants | Validate against chart and wiki |
| S support list | Support edges plus Partner Seal grants | Validate against chart and wiki |
| Level 1 and level 13 stats | Base-stat snapshots | Link to recruitment scenario IDs |
| Personal growths | Personal growth record | Canonical input after corroboration |
| Maid and Strategist growths | Class data | Do not duplicate in unit JSON |
| Combined growths | Derived result | Recalculate; never import as canonical data |

## Candidate Extraction Rules

The workbook importer may automate candidate extraction, but it must not make acceptance decisions.

For every first-generation sheet it should:

1. Resolve the sheet to a canonical unit ID through an explicit alias map.
2. Extract identity, recruitment, stats, growths, class text, supports, pair-up bonuses, and source cell locations.
3. Split compound route, gender, chapter, level, and inventory values into typed candidate scenarios.
4. Emit unresolved text when a value cannot be normalized safely.
5. Never infer missing relationships from the workbook's prose-only class summary.
6. Never import class growth or combined growth rows into unit growth data.
7. Preserve editorial cells only in the raw source or an optional research report.

Manual curation is expected for aliases, special recruitment conditions, and relationship-based class substitutions.

## Validation Requirements

### Schema Validation

- All JSON files have `formatVersion` and `gameId`.
- IDs use the canonical ASCII format.
- Required enums contain known values.
- Stat objects contain exactly the expected keys.
- Numeric values are integers in legal ranges.
- Accepted records have at least one applicable source reference.
- Every referenced unit, class, skill, item, route, relationship, and source exists.

### Unit Validation

- Every approved first-generation unit appears exactly once in the core unit file.
- No child unit appears in any file in this milestone.
- Every workbook character sheet is either mapped or listed in the validation report with an exclusion reason.
- Names and aliases do not create duplicate units.
- Conditional recruitment scenarios do not overlap incoherently or leave known cases uncovered.
- Starting levels, classes, stats, inventory, and weapon ranks agree within each scenario.

### Relationship Validation

- Support pairs are unique regardless of unit ordering.
- Each A+ or S class grant points to a corresponding support relationship.
- Friendship Seal grants require an eligible A+ relationship.
- Partner Seal grants require an eligible S relationship.
- Route restrictions are compatible with both units' availability.
- Reciprocal relationship views produce the same edge.
- Duplicate-class and gender-specific substitutions are explicit and source-backed.

### Stat Validation

- Each unit has one personal growth vector.
- Personal growths are compared independently against Serenes Forest and Fire Emblem Wiki.
- Workbook totals are recalculated for diagnostics only.
- Class growths do not appear in unit growth records.
- Combined growths do not appear in normalized inputs.
- Accepted cap modifiers have complete source coverage.

## Validation Reports

Generate both:

- JSON for automated checks and future CI;
- plain text for human review.

The report should list:

- mapped, excluded, and unresolved workbook sheets;
- candidate, corroborated, accepted, and disputed record counts;
- source disagreements by unit and field;
- unresolved aliases;
- missing cap modifiers or support details;
- broken references;
- class-access substitutions requiring manual review;
- known workbook corrections applied only in normalized data.

## Test Plan

Add focused tests with the implementation:

1. Every normalized file passes its schema.
2. Canonical IDs and relationship IDs are unique.
3. All source references resolve.
4. No child-generation record is present.
5. The approved first-generation roster is complete.
6. Personal growth vectors match accepted cross-source values.
7. Felicia has two non-overlapping Avatar-gender recruitment scenarios.
8. Felicia's base-stat snapshots resolve to the correct scenarios.
9. Felicia's personal growths remain separate from Maid and Strategist growths.
10. Felicia's A+ and S relationships resolve to explicit seal grants.
11. Pair-up rank deltas produce verified cumulative bonuses.
12. Generated runtime data is deterministic from normalized inputs.

Tests should assert explanatory intermediate records, not only final joined objects.

## Runtime Bundle

The generated `runtime/fe14/units.json` may join normalized records into a frontend-friendly shape:

```json
{
  "formatVersion": 1,
  "gameId": "fe14",
  "units": {
    "felicia": {
      "identity": {},
      "recruitment": [],
      "baseStats": [],
      "personalGrowths": {},
      "personalCapModifiers": {},
      "personalSkill": {},
      "supports": [],
      "classAccess": [],
      "pairUpBonuses": []
    }
  }
}
```

This is generated output. Its internal shape may be optimized for static loading after the normalized contract is implemented and tested.

## Acceptance Criteria

- The approved first-generation roster is documented and complete.
- All roster units have canonical IDs and reviewed aliases.
- Every factual Felicia worksheet field is represented in a normalized domain or explicitly classified as derived or editorial.
- Personal growths are independently corroborated.
- Personal cap modifiers have a documented source and review state.
- Recruitment variants are typed rather than stored as compound prose.
- Supports are unique relationship edges.
- Heart, Friendship, and Partner Seal access have distinct origins.
- Special class substitutions remain explainable and source-backed.
- No child data or child inheritance calculation is included.
- Validation JSON and readable reports identify every unresolved issue.
- Schema, relationship, provenance, and generation-boundary tests pass.
- Runtime data is generated deterministically from normalized data.

## Explicit Non-Goals

- Child-unit JSON.
- Child growth or maximum-stat inheritance.
- Parent-to-child class or skill inheritance.
- Full executable personal-skill effects.
- Combat calculations.
- Weapon-use or experience calculations.
- Importing every non-unit workbook sheet.
- Displaying this data in the frontend.
- Correcting the raw workbook in place.

After this plan is reviewed, implementation should begin with the source catalog, canonical first-generation roster, alias map, schemas, and Felicia as the first golden unit before scaling extraction to the remaining units.

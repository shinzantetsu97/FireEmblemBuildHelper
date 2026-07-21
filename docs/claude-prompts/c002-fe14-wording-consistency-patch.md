# FE14 Build Helper — Tooltip Wording Consistency Patch

## Context

Skill tooltips (personal-skill effects and class-skill descriptions) were authored
over time and drifted into inconsistent vocabulary for the same concepts: the same
stat is written as "Crit" / "Critical" / "Critical rate"; "Dodge" / "Crit Avoid" /
"Critical Avoid"; "Hit" / "Hit rate"; "Avo" / "Avoid". Buffs use a mix of verbs
("gains" / "obtains" / "gives" / "receives"), debuffs a mix of "foe suffers" /
"enemy's X -N" / "enemy loses X". The two UI stat-label maps also disagree with each
other. This patch standardizes the vocabulary so tooltips read consistently in both
English and Simplified Chinese, without changing any game mechanics.

## Canonical phrase order

Every effect follows a single left-to-right order in **both** languages — the reader
sees the condition first, then the conditional effect:

> **(Condition) , (effect radius/range) + (effect)**

The condition is **omitted entirely when the effect is unconditional** (e.g. a flat
self buff). Do **not** use the "effect + condition" ordering (condition trailing) — it
reads poorly in Chinese. The effect portion itself is:

- **English:** `Grants` + `(affected unit — omitted if self)` + `<stat tokens>`
  (debuffs: `Inflicts` + affected enemy + tokens)
- **Chinese:** same structure — owner omitted / ally-range description / `敌方`
  + `<stat tokens>`

Examples:
- Self, no condition: "Grants Crit +10, Damage Dealt +2." / `必杀+10，造成的伤害+2`
- Condition + ally range: "When below half HP, allies within 2 tiles are granted Damage Taken -2."
  / `HP低于一半时，周围二格内的友军受到的伤害-2`
- Condition + enemy debuff: "After battle, inflicts Strength -6 on the enemy."
  / `战斗后，受影响的敌方 力量-6`

## Canonical vocabulary

**English**

| Concept | Canonical | Replaces |
|---|---|---|
| Grant a bonus | **Grants** (omit subject if self; keep target for allies) | gains, obtains, gives, receives (a buff) |
| Apply a debuff | **Inflicts** `<Stat> -N` | foe suffers, enemy's X -N, enemy loses X, X -N (after battle) |
| Critical rate | **Crit** | Critical, Critical rate, Crit |
| Critical avoid | **Ddg** | Dodge, Crit Avoid, Critical Avoid |
| Hit | **Hit** | Hit, Hit rate, accuracy |
| Avoid | **Avoid** | Avo, avoidance |
| Damage dealt | **Damage Dealt +N** | deals N more/extra damage, damage +N |
| Damage taken | **Damage Taken -N** | receives/takes N less damage, damage received/taken ±N |

**Simplified Chinese** (general rule: omit 率)

| Concept | Canonical |
|---|---|
| Self gain | tokens only; owner is implicit, e.g. `必杀+10，造成的伤害+2，受到的伤害-2` |
| Buff to allies | target description + tokens, e.g. `周围二格内的友军 受到的伤害-2` |
| Debuff | `受影响的敌方` + stat, e.g. `受影响的敌方防御 -x` |
| Crit | **必杀** (replaces 暴击, 必杀率, 暴击率) |
| Avoid | **回避** (replaces 躲避 etc.) |
| Ddg | **必杀回避** (replaces 暴击回避) |
| Hit | **命中** (replaces 命中率) |
| Damage Dealt | **造成的伤害** |
| Damage Taken | **受到的伤害** |

## Scope

In scope: only the vocabulary above. Standardize the grant/debuff verbs and the six
stat terms wherever they express a flat combat-stat modifier. Core stats
(Str/Mag/Skl/Spd/Lck/Def/Res/HP) keep their names but adopt Grants/Inflicts phrasing.

Out of scope — leave the surrounding prose intact: conditional lead-ins ("When X
initiates combat…"), and non-stat mechanics such as HP% reductions, half-damage
reflection/"half the damage dealt", follow-up prevention, capture/Prison, effective
damage, healing, and activation-chance skills. "obtained" in
`unit.corrinTalentOnly.*` (class *availability*, not a stat grant) is left unchanged.

## Files to change

Source of truth (edit these):
- `data/normalized/fe14/personal-skills.json` — `effect`, `effectZhHans` (~69 entries)
- `data/normalized/fe14/class-skills.json` — `description`, `descriptionZhHans` (~127 entries)

UI stat labels:
- `src/games/fe14/components/units/detail/utils.ts` (`formatBonuses`):
  `hit: "Hit rate"→"Hit"`, `critical: "Critical"→"Crit"`, `criticalAvoid: "Dodge"→"Ddg"`, `avoid` stays `"Avoid"`.
- `src/i18n/messages/en.ts`: `config.crit.avo "Avo"→"Avoid"`,
  `config.crit.avoid "Crit Avo"→"Ddg"`; `config.crit.critical "Crit"` and
  `config.crit.hit "Hit"` already canonical.
- `src/i18n/messages/zhHans.ts`: already canonical (必杀回避 / 必杀 / 回避 / 命中) —
  verify only.

Generated (do NOT hand-edit): `data/runtime/fe14/units.json` is regenerated from the
normalized files by `npm run data:build`.

## Verification

1. `npm run data:build` — regenerate `data/runtime/fe14/units.json` from normalized.
2. `npm run data:validate` — schema/provenance validation still passes.
3. `npm run typecheck` — label-map edits compile.
4. `npm run test` — existing suite passes; check for tests asserting old label strings.
5. `npm run dev` — spot-check personal/class-skill tooltips, the pairup table
   (`formatBonuses`), and the resolved-config crit preview in both EN and ZH.

## Pass three decisions

- Silas keeps the explicit deployment check: `If Corrin is deployed and below half HP`.
- Conditions use `When` rather than `While` or `Whenever`, and the skill owner is omitted wherever the tooltip context already identifies them.
- Azama says `reflects half the damage received`.
- Oboro retains both reclassing examples: Odin as a Samurai and Kaze as a Cavalier.
- Orochi and Niles use the same Capture wording and explicitly name the `Capture command`.
- Charlotte uses `When the enemy is female`.
- `During battle` is omitted because combat context is implicit. The same phrase in explanatory notes is replaced with `in combat`.
- English `self` is omitted. For mixed self/area effects such as Arthur and Percy, the owner's effect is listed first and the ranged effect names its target.
- English and Simplified Chinese skill descriptions emphasize their localized key stat/effect terms, commands, numbers, thresholds, and ranges. This is presentation logic shared by every personal- and class-skill description view; normalized JSON remains plain text.
- English written-number matching uses word boundaries so substrings such as `one` in `Dragonstone` are not emphasized.
- Simplified Chinese skill text contains no ASCII spaces.
- Simplified Chinese uses `HP未满` instead of `HP不满` and `HP为满` instead of `HP满`; the full condition is emphasized as one threshold.
- Orochi and Niles also share identical Simplified Chinese Capture wording, including `捕获指令` and `可捕获的敌方`.
- Simplified Chinese omits `自己` and `自身`; the skill owner is implicit unless another target is named.
- Simplified Chinese accessible-class skill tooltips omit the leading `以` from the acquisition line (`{class}在 {level} 级习得`).

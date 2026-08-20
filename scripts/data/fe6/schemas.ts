import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/);
const reviewStatus = z.literal("accepted");
const weaponRank = z.enum(["E", "D", "C", "B", "A", "S"]);

const sourceRef = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  reviewStatus,
}).strict();

const provenance = z.array(sourceRef).min(1);

const statVector = z.object({
  hp: z.number().int().nonnegative(),
  power: z.number().int().nonnegative(),
  skill: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
  luck: z.number().int().nonnegative(),
  defense: z.number().int().nonnegative(),
  resistance: z.number().int().nonnegative(),
}).strict();

const classStatVector = statVector.omit({ luck: true });
const weaponRanks = z.record(z.enum(["sword", "lance", "axe", "bow", "staff", "anima", "light", "dark"]), weaponRank);

const header = {
  formatVersion: z.literal(1),
  gameId: z.literal("fe6"),
};

export const sourceCatalogSchema = z.object({
  ...header,
  updatedAt: z.string().datetime(),
  sources: z.array(z.object({
    id: z.string().min(1),
    kind: z.literal("web"),
    title: z.string().min(1),
    location: z.string().url(),
    language: z.literal("en"),
    reviewStatus,
    snapshot: z.object({
      path: z.string().min(1),
      retrievedAt: z.string().datetime(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      acquisition: z.string().min(1),
    }).strict(),
  }).strict()).min(1),
}).strict();

export const unitsSchema = z.object({
  ...header,
  units: z.array(z.object({
    id,
    displayOrder: z.number().int().positive(),
    unitKind: z.literal("story"),
    gender: z.enum(["female", "male"]),
    names: z.object({
      en: z.string().min(1),
      ja: z.string().min(1),
      jaLatn: z.string().min(1),
      fan: z.string().min(1),
      officialJpn: z.string().min(1),
    }).strict(),
    aliases: z.array(z.string().min(1)),
    affinityId: z.enum(["fire", "thunder", "wind", "ice", "dark", "light", "anima"]),
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

const chapterJoin = z.object({
  chapterId: id,
  label: z.string().min(1),
  chapterNumber: z.number().int().positive().optional(),
  routeVariant: z.enum(["A", "B"]).nullable().optional(),
  sideChapter: z.boolean().optional(),
  startingLevelOverride: z.number().int().positive().optional(),
  weaponLevelOverrides: weaponRanks.optional(),
  note: z.string().min(1).optional(),
}).strict();

export const recruitmentSchema = z.object({
  ...header,
  recruitment: z.array(z.object({
    id,
    unitId: id,
    joins: z.array(chapterJoin).min(1),
    condition: z.string().min(1),
    startingClassId: id,
    startingLevel: z.number().int().positive(),
    baseStatSnapshotId: id,
    weaponLevelSnapshotId: id,
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const baseStatsSchema = z.object({
  ...header,
  snapshots: z.array(z.object({
    id,
    unitId: id,
    difficulty: z.enum(["normal", "hard"]),
    valueKind: z.enum(["fixed", "expected_hard_mode"]),
    startingClassId: id,
    startingLevel: z.number().int().positive(),
    stats: statVector,
    constitution: z.number().int().nonnegative(),
    movement: z.number().int().nonnegative(),
    note: z.string().min(1).optional(),
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const growthsSchema = z.object({
  ...header,
  growths: z.array(z.object({
    unitId: id,
    rates: statVector,
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const weaponLevelsSchema = z.object({
  ...header,
  weaponLevels: z.array(z.object({
    id,
    unitId: id,
    difficulty: z.literal("normal"),
    levels: weaponRanks,
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const supportsSchema = z.object({
  ...header,
  relationships: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*__[a-z][a-z0-9_]*$/),
    unitIds: z.tuple([id, id]),
    reviewStatus,
    provenance,
  }).strict()),
}).strict();

export const affinitiesSchema = z.object({
  ...header,
  affinities: z.array(z.object({
    id: z.enum(["fire", "thunder", "wind", "ice", "dark", "light", "anima"]),
    displayOrder: z.number().int().positive(),
    names: z.object({ en: z.string().min(1) }).strict(),
    unit: z.literal("half_point"),
    bonusHalfUnits: z.object({
      attack: z.number().int().nonnegative(),
      defense: z.number().int().nonnegative(),
      accuracy: z.number().int().nonnegative(),
      avoid: z.number().int().nonnegative(),
      critical: z.number().int().nonnegative(),
      criticalEvade: z.number().int().nonnegative(),
    }).strict(),
    reviewStatus,
    provenance,
  }).strict()).length(7),
}).strict();

const maximumStats = statVector.extend({
  constitution: z.number().int().nonnegative(),
  movement: z.number().int().nonnegative(),
}).strict();

export const classesSchema = z.object({
  ...header,
  classes: z.array(z.object({
    id,
    displayOrder: z.number().int().positive(),
    names: z.object({ en: z.string().min(1) }).strict(),
    aliases: z.array(z.string().min(1)),
    sourceName: z.string().min(1),
    gender: z.enum(["female", "male"]).nullable(),
    tier: z.enum(["base", "promoted", "special", "enemy_only", "npc_only"]),
    usableWeaponTypeIds: z.array(z.enum(["sword", "lance", "axe", "bow", "staff", "anima", "light", "dark"])),
    baseStats: classStatVector,
    constitution: z.number().int().nonnegative(),
    movement: z.number().int().nonnegative(),
    baseWeaponRanks: weaponRanks,
    maximumStats,
    promotionClassId: id.nullable(),
    notes: z.string().min(1).nullable(),
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const promotionsSchema = z.object({
  ...header,
  promotions: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*__[a-z][a-z0-9_]*$/),
    sourceClassId: id,
    targetClassId: id,
    statGains: classStatVector,
    constitutionGain: z.number().int().nonnegative(),
    movementGain: z.number().int().nonnegative(),
    weaponRankGains: z.record(z.string(), z.string().min(1)),
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

const rangeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fixed"), display: z.string().min(1), minimum: z.number().int().nonnegative(), maximum: z.number().int().nonnegative() }).strict(),
  z.object({ kind: z.literal("formula"), display: z.string().min(1), formula: z.string().min(1) }).strict(),
  z.object({ kind: z.literal("all"), display: z.literal("All") }).strict(),
]);

export const weaponsSchema = z.object({
  ...header,
  weapons: z.array(z.object({
    id,
    names: z.object({ en: z.string().min(1) }).strict(),
    weaponTypeId: z.enum(["sword", "lance", "axe", "bow", "staff", "anima", "light", "dark"]),
    rank: weaponRank.nullable(),
    range: rangeSchema.nullable(),
    weight: z.number().int().nonnegative().nullable(),
    might: z.number().int().nonnegative().nullable(),
    hit: z.number().int().nonnegative().nullable(),
    critical: z.number().int().nonnegative().nullable(),
    uses: z.number().int().nonnegative().nullable(),
    worth: z.number().int().nonnegative().nullable(),
    staffExperience: z.number().int().nonnegative().nullable(),
    effect: z.string().min(1).nullable(),
    availabilityFlags: z.array(z.enum(["unobtainable", "trial_map_only"])),
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const itemsSchema = z.object({
  ...header,
  items: z.array(z.object({
    id,
    names: z.object({ en: z.string().min(1) }).strict(),
    uses: z.number().int().nonnegative().nullable(),
    worth: z.number().int().nonnegative().nullable(),
    effect: z.string().min(1).nullable(),
    availabilityFlags: z.array(z.enum(["unobtainable", "trial_map_only"])),
    reviewStatus,
    provenance,
  }).strict()).min(1),
}).strict();

export const domainSchemas = {
  "data/sources/fe6/sources.json": sourceCatalogSchema,
  "data/normalized/fe6/units.json": unitsSchema,
  "data/normalized/fe6/recruitment.json": recruitmentSchema,
  "data/normalized/fe6/unit-base-stats.json": baseStatsSchema,
  "data/normalized/fe6/unit-growths.json": growthsSchema,
  "data/normalized/fe6/unit-weapon-levels.json": weaponLevelsSchema,
  "data/normalized/fe6/support-relationships.json": supportsSchema,
  "data/normalized/fe6/affinities.json": affinitiesSchema,
  "data/normalized/fe6/classes.json": classesSchema,
  "data/normalized/fe6/class-promotions.json": promotionsSchema,
  "data/normalized/fe6/weapons.json": weaponsSchema,
  "data/normalized/fe6/items.json": itemsSchema,
} as const;

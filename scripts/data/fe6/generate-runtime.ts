import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateFe6Data } from "./validate";
import { json } from "./shared";

type JsonObject = Record<string, any>;

const result = await validateFe6Data();
if (!result.valid) {
  for (const error of result.errors) console.error(`ERROR ${error.code}: ${error.message}`);
  throw new Error("FE6 normalized data did not pass validation; runtime output was not generated.");
}

const parsed = result.parsed;
const units = parsed["data/normalized/fe6/units.json"].units as JsonObject[];
const recruitment = parsed["data/normalized/fe6/recruitment.json"].recruitment as JsonObject[];
const snapshots = parsed["data/normalized/fe6/unit-base-stats.json"].snapshots as JsonObject[];
const growths = parsed["data/normalized/fe6/unit-growths.json"].growths as JsonObject[];
const weaponLevels = parsed["data/normalized/fe6/unit-weapon-levels.json"].weaponLevels as JsonObject[];
const relationships = parsed["data/normalized/fe6/support-relationships.json"].relationships as JsonObject[];
const affinities = parsed["data/normalized/fe6/affinities.json"].affinities as JsonObject[];
const classes = parsed["data/normalized/fe6/classes.json"].classes as JsonObject[];
const promotions = parsed["data/normalized/fe6/class-promotions.json"].promotions as JsonObject[];
const weapons = parsed["data/normalized/fe6/weapons.json"].weapons as JsonObject[];
const items = parsed["data/normalized/fe6/items.json"].items as JsonObject[];
const sources = parsed["data/sources/fe6/sources.json"];

const classById = new Map(classes.map((entry) => [entry.id, entry]));
const affinityById = new Map(affinities.map((entry) => [entry.id, entry]));

function classCaps(startingClassId: string): JsonObject {
  const startingClass = classById.get(startingClassId);
  if (!startingClass) throw new Error(`Unknown runtime class ${startingClassId}.`);

  if (startingClass.promotionClassId) {
    const promoted = classById.get(startingClass.promotionClassId);
    if (!promoted) throw new Error(`Unknown promoted class ${startingClass.promotionClassId}.`);
    return {
      baseClassIds: [startingClass.id],
      baseClassCap: startingClass.maximumStats,
      promotedClassId: promoted.id,
      promotedClassCap: promoted.maximumStats,
    };
  }

  const precursors = promotions
    .filter((promotion) => promotion.targetClassId === startingClassId)
    .map((promotion) => classById.get(promotion.sourceClassId))
    .filter(Boolean) as JsonObject[];
  if (precursors.length > 0) {
    const serializedCaps = new Set(precursors.map((entry) => JSON.stringify(entry.maximumStats)));
    if (serializedCaps.size !== 1) throw new Error(`${startingClassId} has precursors with different base-class caps.`);
    return {
      baseClassIds: precursors.map((entry) => entry.id),
      baseClassCap: precursors[0].maximumStats,
      promotedClassId: startingClass.id,
      promotedClassCap: startingClass.maximumStats,
    };
  }

  return {
    baseClassIds: [startingClass.id],
    baseClassCap: startingClass.maximumStats,
    promotedClassId: null,
    promotedClassCap: null,
  };
}

const runtimeUnits = units.map((unit) => {
  const recruitmentRecord = recruitment.find((entry) => entry.unitId === unit.id);
  const normalBase = snapshots.find((entry) => entry.unitId === unit.id && entry.difficulty === "normal");
  const hardBases = snapshots.filter((entry) => entry.unitId === unit.id && entry.difficulty === "hard");
  const growth = growths.find((entry) => entry.unitId === unit.id);
  const ranks = weaponLevels.find((entry) => entry.unitId === unit.id);
  const affinity = affinityById.get(unit.affinityId);
  if (!recruitmentRecord || !normalBase || !growth || !ranks || !affinity) throw new Error(`Incomplete runtime join for ${unit.id}.`);
  const supportUnitIds = relationships
    .filter((relationship) => relationship.unitIds.includes(unit.id))
    .map((relationship) => relationship.unitIds.find((id: string) => id !== unit.id))
    .sort((left: string, right: string) => left.localeCompare(right));
  return {
    id: unit.id,
    displayOrder: unit.displayOrder,
    names: unit.names,
    aliases: unit.aliases,
    characterProfile: {
      recruitment: recruitmentRecord,
      startingClassId: normalBase.startingClassId,
      startingLevel: normalBase.startingLevel,
      baseStats: normalBase,
      hardModeExpectedStats: hardBases,
      growths: growth.rates,
      ...classCaps(normalBase.startingClassId),
      weaponLevels: ranks.levels,
      affinity: {
        id: affinity.id,
        name: affinity.names.en,
        unit: affinity.unit,
        bonusHalfUnits: affinity.bonusHalfUnits,
      },
    },
    supports: supportUnitIds,
    provenance: unit.provenance,
  };
});

const runtimeClasses = classes.map((entry) => ({
  ...entry,
  promotion: promotions.find((promotion) => promotion.sourceClassId === entry.id) ?? null,
}));

const runtimeRoot = path.join(process.cwd(), "data/runtime/fe6");
await mkdir(runtimeRoot, { recursive: true });
await Promise.all([
  writeFile(path.join(runtimeRoot, "units.json"), json({ formatVersion: 1, gameId: "fe6", units: runtimeUnits, sources: sources.sources }), "utf8"),
  writeFile(path.join(runtimeRoot, "classes.json"), json({ formatVersion: 1, gameId: "fe6", classes: runtimeClasses, sources: sources.sources }), "utf8"),
  writeFile(path.join(runtimeRoot, "weapons-items.json"), json({ formatVersion: 1, gameId: "fe6", weapons, items, sources: sources.sources }), "utf8"),
]);

console.log(`Generated FE6 runtime data for ${runtimeUnits.length} units, ${runtimeClasses.length} classes, and ${weapons.length + items.length} inventory records.`);

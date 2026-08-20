import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FE6_SOURCES, sourceById } from "./source-manifest";
import {
  asciiId,
  dataRows,
  imageAlts,
  integer,
  json,
  lookupKey,
  nullableInteger,
  readJson,
  rowCells,
  sourceDocument,
  sourceRef,
  sourceTable,
  textOf,
} from "./shared";

type JsonObject = Record<string, unknown>;
type Gender = "female" | "male";

type NameOverrides = {
  unitDisplayNames: Record<string, string>;
  unitSourceAliases: Record<string, string>;
  classDisplayNames: Record<string, string>;
};

type CurationOverrides = {
  unitGenders: Record<string, Gender>;
  recruitmentOverrides: Record<string, Record<string, {
    startingLevel?: number;
    weaponLevels?: Record<string, string>;
    note: string;
  }>>;
};

type RawManifest = {
  gameId: "fe6";
  entries: Array<{
    sourceId: string;
    relativePath: string;
    retrievedAt: string;
    status: number;
    bytes: number;
    sha256: string;
    acquisition: string;
  }>;
};

const [nameOverrides, curationOverrides, rawManifest] = await Promise.all([
  readJson<NameOverrides>("data/sources/fe6/name-overrides.json"),
  readJson<CurationOverrides>("data/sources/fe6/curation-overrides.json"),
  readJson<RawManifest>("data/raw/fe6/serenes/manifest.json"),
]);

const candidateRoot = path.join(process.cwd(), "data/candidates/fe6");
const normalizedRoot = path.join(process.cwd(), "data/normalized/fe6");
const reportRoot = path.join(process.cwd(), "data/reports/fe6");
const sourceRoot = path.join(process.cwd(), "data/sources/fe6");

await Promise.all([
  mkdir(candidateRoot, { recursive: true }),
  mkdir(normalizedRoot, { recursive: true }),
  mkdir(reportRoot, { recursive: true }),
  mkdir(sourceRoot, { recursive: true }),
]);

function rawRows(table: HTMLTableElement): Array<{ cells: string[]; imageAlts: string[][] }> {
  return [...table.rows].map((row) => ({
    cells: rowCells(row),
    imageAlts: [...row.cells].map((cell) => imageAlts(cell)),
  }));
}

async function verifySourceShape(): Promise<Array<{ sourceId: string; rows: number }>> {
  const counts: Array<{ sourceId: string; rows: number }> = [];
  for (const source of FE6_SOURCES) {
    const document = await sourceDocument(source.id);
    const heading = [...document.querySelectorAll("h1, h2")].some((item) => textOf(item) === source.expectedHeading);
    if (!heading) throw new Error(`${source.id} is missing heading ${source.expectedHeading}.`);

    const tables = [...document.querySelectorAll("table")] as HTMLTableElement[];
    const headers = tables.flatMap((table) => [...table.rows].slice(0, 1).flatMap(rowCells));
    for (const expected of source.expectedHeaders) {
      if (!headers.includes(expected)) throw new Error(`${source.id} is missing expected header ${expected}.`);
    }
    const rows = tables.reduce((sum, table) => sum + Math.max(0, table.rows.length - 1), 0);
    if (rows < source.minimumRows) {
      throw new Error(`${source.id} has ${rows} rows; expected at least ${source.minimumRows}.`);
    }
    counts.push({ sourceId: source.id, rows });
  }
  return counts;
}

const sourceCounts = await verifySourceShape();

const sourceCatalog = {
  formatVersion: 1,
  gameId: "fe6",
  updatedAt: rawManifest.entries.map((entry) => entry.retrievedAt).sort().at(-1),
  sources: FE6_SOURCES.map((source) => {
    const snapshot = rawManifest.entries.find((entry) => entry.sourceId === source.id);
    if (!snapshot) throw new Error(`Raw manifest is missing ${source.id}.`);
    return {
      id: source.id,
      kind: "web",
      title: source.title,
      location: source.url,
      language: "en",
      reviewStatus: "accepted",
      snapshot: {
        path: `data/raw/fe6/serenes/${snapshot.relativePath}`,
        retrievedAt: snapshot.retrievedAt,
        sha256: snapshot.sha256,
        acquisition: snapshot.acquisition,
      },
    };
  }),
};
await writeFile(path.join(sourceRoot, "sources.json"), json(sourceCatalog), "utf8");

function stripFootnote(value: string): string {
  return value.replace(/\s*\*\d+\s*$/, "").trim();
}

function distinct(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

const nameTable = await sourceTable("serenes-fe6-name-chart");
const nameCandidates = dataRows(nameTable, "Japanese name").map((row, index) => {
  const [ja, romaji, officialJpn, fan, noa] = rowCells(row);
  const preferred = nameOverrides.unitDisplayNames[ja] ?? stripFootnote(noa === "–" ? fan : noa);
  return {
    sourceOrder: index + 1,
    preferred,
    japanese: ja,
    romanized: romaji,
    officialJpn,
    fan,
    noa: stripFootnote(noa),
    rawNoa: noa,
  };
});

const canonicalNames = nameCandidates.map((candidate) => ({
  id: asciiId(candidate.preferred),
  ...candidate,
  aliases: distinct([
    candidate.preferred,
    candidate.romanized,
    candidate.officialJpn,
    candidate.fan,
    candidate.noa,
    candidate.japanese,
  ]),
}));
const canonicalNameById = new Map(canonicalNames.map((entry) => [entry.id, entry]));
const unitIdByAlias = new Map<string, string>();
for (const entry of canonicalNames) {
  for (const alias of entry.aliases) unitIdByAlias.set(lookupKey(alias), entry.id);
}
for (const [alias, unitId] of Object.entries(nameOverrides.unitSourceAliases)) {
  if (!canonicalNameById.has(unitId)) throw new Error(`Unit alias ${alias} targets unknown ID ${unitId}.`);
  unitIdByAlias.set(lookupKey(alias), unitId);
}
const overrideAliasesByUnit = new Map<string, string[]>();
for (const [alias, unitId] of Object.entries(nameOverrides.unitSourceAliases)) {
  overrideAliasesByUnit.set(unitId, [...(overrideAliasesByUnit.get(unitId) ?? []), alias]);
}

function unitIdFor(sourceName: string): string {
  const clean = sourceName.replace(/\s*\(HM\)$/, "").trim();
  const unitId = unitIdByAlias.get(lookupKey(clean));
  if (!unitId) throw new Error(`Unresolved FE6 unit name: ${sourceName}`);
  return unitId;
}

const weaponTypeIds: Record<string, string> = {
  Sword: "sword",
  Lance: "lance",
  Axe: "axe",
  Bow: "bow",
  Staff: "staff",
  Anima: "anima",
  Light: "light",
  Dark: "dark",
};

function weaponTypeId(value: string): string {
  const id = weaponTypeIds[value];
  if (!id) throw new Error(`Unknown FE6 weapon type ${value}.`);
  return id;
}

function parseWeaponRanks(cell: HTMLTableCellElement): Record<string, string> {
  const rankText = textOf(cell);
  if (!rankText || rankText === "–") return {};
  const ranks = rankText.split(",").map((rank) => rank.trim());
  const types = imageAlts(cell).map((alt) => alt.replace(/^Type/, ""));
  if (types.length !== ranks.length) {
    throw new Error(`Weapon rank columns do not align: ${types.join(", ")} / ${ranks.join(", ")}`);
  }
  return Object.fromEntries(types.map((type, index) => [weaponTypeId(type), ranks[index]]));
}

function genericClassName(value: string): string {
  return value.replace(/\s*\([MF]\)$/, "").trim();
}

function classId(value: string): string {
  const gender = value.match(/\(([MF])\)$/)?.[1]?.toLowerCase();
  const generic = genericClassName(value);
  const display = nameOverrides.classDisplayNames[generic] ?? generic;
  return `${asciiId(display)}${gender ? `_${gender}` : ""}`;
}

function classDisplayName(value: string): string {
  const gender = value.match(/\(([MF])\)$/)?.[1];
  const generic = genericClassName(value);
  const display = nameOverrides.classDisplayNames[generic] ?? generic;
  return `${display}${gender ? ` (${gender})` : ""}`;
}

const classIntroductionTable = await sourceTable("serenes-fe6-class-introduction");
const classIntroduction = new Map(
  dataRows(classIntroductionTable, "Icon").map((row) => {
    const [, name, weapons, promotesTo, notes] = rowCells(row);
    return [name, {
      name,
      weapons: weapons === "–" ? [] : weapons.split(",").map((item) => weaponTypeId(item.trim())),
      promotesTo: promotesTo === "–" ? null : promotesTo,
      notes: notes === "–" ? null : notes,
    }];
  }),
);

const classIntroductionAliases: Record<string, string> = {
  Brigand: "Bandit",
};

function classMetadata(value: string) {
  const generic = genericClassName(value);
  return classIntroduction.get(classIntroductionAliases[generic] ?? generic);
}

const classBaseTable = await sourceTable("serenes-fe6-class-base-stats");
const classBaseRows = dataRows(classBaseTable, "Class").filter((row) => row.cells.length === 10);
const classBaseLabels = new Set(classBaseRows.map((row) => rowCells(row)[0]));

function concretePromotionTarget(sourceClass: string, genericTarget: string): string {
  const gender = sourceClass.match(/\(([MF])\)$/)?.[1];
  const genderedTarget = gender ? `${genericTarget} (${gender})` : genericTarget;
  return classId(classBaseLabels.has(genderedTarget) ? genderedTarget : genericTarget);
}

const classMaximumTable = await sourceTable("serenes-fe6-class-maximum-stats");
const classMaximumRows = dataRows(classMaximumTable, "Class").filter((row) => row.cells.length === 7);
const maximumByName = new Map(classMaximumRows.map((row) => {
  const [name, power, skill, speed, defense, resistance, constitution] = rowCells(row);
  return [name, {
    hp: 60,
    power: integer(power, `${name} maximum power`),
    skill: integer(skill, `${name} maximum skill`),
    speed: integer(speed, `${name} maximum speed`),
    luck: 30,
    defense: integer(defense, `${name} maximum defense`),
    resistance: integer(resistance, `${name} maximum resistance`),
    constitution: integer(constitution, `${name} maximum constitution`),
    movement: 15,
  }];
}));

const concretePromotionTargetNames = new Set<string>();
for (const sourceClass of classBaseLabels) {
  const metadata = classMetadata(sourceClass);
  if (metadata?.promotesTo) {
    const gender = sourceClass.match(/\(([MF])\)$/)?.[1];
    const candidate = gender ? `${metadata.promotesTo} (${gender})` : metadata.promotesTo;
    concretePromotionTargetNames.add(classBaseLabels.has(candidate) ? candidate : metadata.promotesTo);
  }
}

const classes = classBaseRows.map((row, index) => {
  const [sourceName, hp, power, skill, speed, defense, resistance, constitution, movement] = rowCells(row);
  const metadata = classMetadata(sourceName);
  const exactMaximum = maximumByName.get(sourceName);
  const genericMaximum = maximumByName.get("Non-promoted");
  const tier = metadata?.notes === "Enemy only" || ["Fire Dragon", "Demon Dragon", "King"].includes(sourceName)
    ? "enemy_only"
    : metadata?.notes === "NPC only" || sourceName.startsWith("Child") || sourceName.startsWith("Civilian")
      ? "npc_only"
      : concretePromotionTargetNames.has(sourceName)
        ? "promoted"
        : metadata?.promotesTo
          ? "base"
          : "special";
  const maximumStats = exactMaximum ?? genericMaximum;
  if (!maximumStats) throw new Error(`No maximum-stat rule for ${sourceName}.`);
  const weaponRanks = parseWeaponRanks(row.cells[9]);
  return {
    id: classId(sourceName),
    displayOrder: index + 1,
    names: { en: classDisplayName(sourceName) },
    aliases: distinct([sourceName, genericClassName(sourceName), metadata?.name ?? ""]).filter((name) => name !== classDisplayName(sourceName)),
    sourceName,
    gender: sourceName.endsWith("(M)") ? "male" : sourceName.endsWith("(F)") ? "female" : null,
    tier,
    usableWeaponTypeIds: metadata?.weapons ?? Object.keys(weaponRanks),
    baseStats: {
      hp: integer(hp, `${sourceName} base HP`),
      power: integer(power, `${sourceName} base power`),
      skill: integer(skill, `${sourceName} base skill`),
      speed: integer(speed, `${sourceName} base speed`),
      defense: integer(defense, `${sourceName} base defense`),
      resistance: integer(resistance, `${sourceName} base resistance`),
    },
    constitution: integer(constitution, `${sourceName} constitution`),
    movement: integer(movement, `${sourceName} movement`),
    baseWeaponRanks: weaponRanks,
    maximumStats,
    promotionClassId: metadata?.promotesTo ? concretePromotionTarget(sourceName, metadata.promotesTo) : null,
    notes: metadata?.notes ?? null,
    reviewStatus: "accepted",
    provenance: [
      sourceRef("serenes-fe6-class-introduction", `Class Introduction > ${genericClassName(sourceName)}`, ["usableWeaponTypeIds", "promotionClassId", "notes"]),
      sourceRef("serenes-fe6-class-base-stats", `Class Base Stats > ${sourceName}`, ["baseStats", "constitution", "movement", "baseWeaponRanks"]),
      sourceRef("serenes-fe6-class-maximum-stats", `Class Maximum Stats > ${exactMaximum ? sourceName : "Non-promoted"}`, ["maximumStats"]),
    ],
  };
});
const classById = new Map(classes.map((entry) => [entry.id, entry]));

function concreteStartingClassId(sourceClass: string, gender: Gender): string {
  const baseSourceClass = ({
    Bandit: "Brigand",
    "Nomadic Trooper": "Nomad Trooper",
  } as Record<string, string>)[sourceClass] ?? sourceClass;
  const gendered = `${baseSourceClass} (${gender === "female" ? "F" : "M"})`;
  const id = classId(classBaseLabels.has(gendered) ? gendered : baseSourceClass);
  if (!classById.has(id)) throw new Error(`Starting class ${sourceClass} resolved to missing class ${id}.`);
  return id;
}

const promotionTable = await sourceTable("serenes-fe6-promotion-gains");
const classPromotions = dataRows(promotionTable, "Class")
  .filter((row) => row.cells.length === 11)
  .map((row) => {
    const [sourceClass, targetClass, hp, power, skill, speed, defense, resistance, constitution, movement] = rowCells(row);
    const sourceClassId = classId(sourceClass);
    const targetClassId = classId(targetClass);
    const source = classById.get(sourceClassId);
    if (!source || !classById.has(targetClassId)) throw new Error(`Promotion ${sourceClass} -> ${targetClass} has an unknown class.`);
    return {
      id: `${sourceClassId}__${targetClassId}`,
      sourceClassId,
      targetClassId,
      statGains: {
        hp: integer(hp, `${sourceClass} promotion HP`),
        power: integer(power, `${sourceClass} promotion power`),
        skill: integer(skill, `${sourceClass} promotion skill`),
        speed: integer(speed, `${sourceClass} promotion speed`),
        defense: integer(defense, `${sourceClass} promotion defense`),
        resistance: integer(resistance, `${sourceClass} promotion resistance`),
      },
      constitutionGain: integer(constitution, `${sourceClass} promotion constitution`),
      movementGain: integer(movement, `${sourceClass} promotion movement`),
      weaponRankGains: parseWeaponRanks(row.cells[10]),
      reviewStatus: "accepted",
      provenance: [sourceRef("serenes-fe6-promotion-gains", `Promotion Gains > ${sourceClass}`, ["statGains", "constitutionGain", "movementGain", "weaponRankGains"])],
    };
  });

const recruitmentTable = await sourceTable("serenes-fe6-recruitment", 0);
const recruitmentRows = dataRows(recruitmentTable, "Name").filter((row) => row.cells.length === 4);
const storyUnitIds = recruitmentRows.map((row) => unitIdFor(rowCells(row)[0]));
if (new Set(storyUnitIds).size !== storyUnitIds.length) throw new Error("Story roster contains duplicate unit IDs.");

const baseStatsTable = await sourceTable("serenes-fe6-character-base-stats");
const primaryBaseByUnit = new Map<string, JsonObject>();
const baseStatSnapshots: JsonObject[] = [];
const unitWeaponLevels: JsonObject[] = [];
const affinityByUnit = new Map<string, string>();
const baseSourceNameByUnit = new Map<string, string>();
let lastPrimaryUnitId: string | undefined;

function affinityIdFromCell(cell: HTMLTableCellElement): string | null {
  const alt = imageAlts(cell)[0];
  if (!alt) return null;
  const normalized = alt.replace(/^Affin/, "").toLowerCase();
  return ["fire", "thunder", "wind", "ice", "dark", "light", "anima"].includes(normalized) ? normalized : null;
}

for (const row of dataRows(baseStatsTable, "Name")) {
  const cells = rowCells(row);
  if (cells.length === 14) {
    let unitId: string;
    try {
      unitId = unitIdFor(cells[0]);
    } catch {
      lastPrimaryUnitId = undefined;
      continue;
    }
    if (!storyUnitIds.includes(unitId)) {
      lastPrimaryUnitId = undefined;
      continue;
    }
    const gender = curationOverrides.unitGenders[unitId] ?? "male";
    const startingClassId = concreteStartingClassId(cells[1], gender);
    const affinityId = affinityIdFromCell(row.cells[12]);
    if (!affinityId) throw new Error(`${cells[0]} has no resolvable affinity.`);
    const stats = {
      hp: integer(cells[3], `${cells[0]} base HP`),
      power: integer(cells[4], `${cells[0]} base power`),
      skill: integer(cells[5], `${cells[0]} base skill`),
      speed: integer(cells[6], `${cells[0]} base speed`),
      luck: integer(cells[7], `${cells[0]} base luck`),
      defense: integer(cells[8], `${cells[0]} base defense`),
      resistance: integer(cells[9], `${cells[0]} base resistance`),
    };
    const record = {
      id: `${unitId}.normal`,
      unitId,
      difficulty: "normal",
      valueKind: "fixed",
      startingClassId,
      startingLevel: integer(cells[2], `${cells[0]} level`),
      stats,
      constitution: integer(cells[10], `${cells[0]} constitution`),
      movement: integer(cells[11], `${cells[0]} movement`),
      reviewStatus: "accepted",
      provenance: [sourceRef("serenes-fe6-character-base-stats", `Character Base Stats > ${cells[0]}`, ["startingClassId", "startingLevel", "stats", "constitution", "movement"])],
    };
    const weaponLevels = parseWeaponRanks(row.cells[13]);
    primaryBaseByUnit.set(unitId, record);
    baseStatSnapshots.push(record);
    unitWeaponLevels.push({
      id: `${unitId}.normal`,
      unitId,
      difficulty: "normal",
      levels: weaponLevels,
      reviewStatus: "accepted",
      provenance: [sourceRef("serenes-fe6-character-base-stats", `Character Base Stats > ${cells[0]}`, ["levels"])],
    });
    affinityByUnit.set(unitId, affinityId);
    baseSourceNameByUnit.set(unitId, cells[0]);
    lastPrimaryUnitId = unitId;
  } else if (cells.length === 8 && /\(HM\)$/.test(cells[0])) {
    const unitId = unitIdFor(cells[0]);
    if (unitId !== lastPrimaryUnitId) throw new Error(`Hard-mode row ${cells[0]} is detached from its normal row.`);
    const primary = primaryBaseByUnit.get(unitId);
    if (!primary) throw new Error(`Hard-mode row ${cells[0]} has no primary base record.`);
    baseStatSnapshots.push({
      id: `${unitId}.hard_expected`,
      unitId,
      difficulty: "hard",
      valueKind: "expected_hard_mode",
      startingClassId: primary.startingClassId,
      startingLevel: primary.startingLevel,
      stats: {
        hp: integer(cells[1], `${cells[0]} HP`),
        power: integer(cells[2], `${cells[0]} power`),
        skill: integer(cells[3], `${cells[0]} skill`),
        speed: integer(cells[4], `${cells[0]} speed`),
        luck: integer(cells[5], `${cells[0]} luck`),
        defense: integer(cells[6], `${cells[0]} defense`),
        resistance: integer(cells[7] ?? "0", `${cells[0]} resistance`),
      },
      constitution: primary.constitution,
      movement: primary.movement,
      note: "Serenes reports rounded expected Hard-mode stats rather than fixed bases.",
      reviewStatus: "accepted",
      provenance: [sourceRef("serenes-fe6-character-base-stats", `Character Base Stats > ${cells[0]}`, ["stats"])],
    });
  }
}

const startingItemsTable = await sourceTable("serenes-fe6-starting-items");
const unitStartingItems = dataRows(startingItemsTable, "Name")
  .filter((row) => row.cells.length === 5)
  .flatMap((row) => {
    const [sourceName, ...itemCells] = rowCells(row);
    let unitId: string;
    try {
      unitId = unitIdFor(sourceName);
    } catch {
      return [];
    }
    if (!storyUnitIds.includes(unitId)) return [];
    return [{
      id: `${unitId}.normal`,
      unitId,
      items: itemCells.filter((item) => item !== "â€“" && item !== "–" && item !== "-"),
      reviewStatus: "accepted",
      provenance: [sourceRef("serenes-fe6-starting-items", `Starting Items > ${sourceName}`, ["items"])],
    }];
  });

const growthTable = await sourceTable("serenes-fe6-character-growth-rates");
const unitGrowths = dataRows(growthTable, "Name")
  .filter((row) => row.cells.length === 8)
  .map((row) => {
    const [sourceName, hp, power, skill, speed, luck, defense, resistance] = rowCells(row);
    const unitId = unitIdFor(sourceName);
    return {
      unitId,
      rates: {
        hp: integer(hp, `${sourceName} HP growth`),
        power: integer(power, `${sourceName} power growth`),
        skill: integer(skill, `${sourceName} skill growth`),
        speed: integer(speed, `${sourceName} speed growth`),
        luck: integer(luck, `${sourceName} luck growth`),
        defense: integer(defense, `${sourceName} defense growth`),
        resistance: integer(resistance, `${sourceName} resistance growth`),
      },
      reviewStatus: "accepted",
      provenance: [sourceRef("serenes-fe6-character-growth-rates", `Character Growth Rates > ${sourceName}`, ["rates"])],
    };
  })
  .filter((record) => storyUnitIds.includes(record.unitId));

const units = storyUnitIds.map((unitId, index) => {
  const identity = canonicalNameById.get(unitId);
  const base = primaryBaseByUnit.get(unitId);
  const affinityId = affinityByUnit.get(unitId);
  if (!identity || !base || !affinityId) throw new Error(`Unit ${unitId} is missing identity, bases, or affinity.`);
  return {
    id: unitId,
    displayOrder: index + 1,
    unitKind: "story",
    gender: curationOverrides.unitGenders[unitId] ?? "male",
    names: {
      en: identity.preferred,
      ja: identity.japanese,
      jaLatn: identity.romanized,
      fan: identity.fan,
      officialJpn: identity.officialJpn,
    },
    aliases: distinct([...identity.aliases, ...(overrideAliasesByUnit.get(unitId) ?? [])])
      .filter((alias) => alias !== identity.preferred && alias !== identity.japanese),
    affinityId,
    reviewStatus: "accepted",
    provenance: [
      sourceRef("serenes-fe6-name-chart", `Name Chart > ${identity.japanese}`, ["names", "aliases"]),
      sourceRef("serenes-fe6-character-base-stats", `Character Base Stats > ${baseSourceNameByUnit.get(unitId)}`, ["affinityId"]),
    ],
  };
});

function chapterJoin(label: string, unitId: string): JsonObject {
  const clean = label.trim();
  const match = clean.match(/^(\d+)([AB]|x)?$/i);
  if (!match) return { chapterId: asciiId(clean), label: clean };
  const suffix = match[2]?.toLowerCase();
  const chapterId = `chapter_${match[1]}${suffix ?? ""}`;
  const override = curationOverrides.recruitmentOverrides[unitId]?.[chapterId];
  return {
    chapterId,
    label: clean,
    chapterNumber: Number(match[1]),
    routeVariant: suffix === "a" || suffix === "b" ? suffix.toUpperCase() : null,
    sideChapter: suffix === "x",
    ...(override ? {
      startingLevelOverride: override.startingLevel,
      weaponLevelOverrides: override.weaponLevels,
      note: override.note,
    } : {}),
  };
}

const recruitment = recruitmentRows.map((row) => {
  const [sourceName, sourceClass, chapter, condition] = rowCells(row);
  const unitId = unitIdFor(sourceName);
  const base = primaryBaseByUnit.get(unitId);
  if (!base) throw new Error(`Recruitment row ${sourceName} has no base data.`);
  return {
    id: `${unitId}.story`,
    unitId,
    joins: chapter.split("/").map((label) => chapterJoin(label, unitId)),
    condition,
    startingClassId: base.startingClassId,
    startingLevel: base.startingLevel,
    baseStatSnapshotId: `${unitId}.normal`,
    weaponLevelSnapshotId: `${unitId}.normal`,
    reviewStatus: "accepted",
    provenance: [
      sourceRef("serenes-fe6-recruitment", `Recruitment > ${sourceName}`, ["joins", "condition"]),
      sourceRef("serenes-fe6-character-base-stats", `Character Base Stats > ${sourceName}`, ["startingClassId", "startingLevel", "baseStatSnapshotId", "weaponLevelSnapshotId"]),
    ],
  };
});

const supportTable = await sourceTable("serenes-fe6-supports");
const supportEdges = new Map<string, JsonObject>();
for (const row of dataRows(supportTable, "Character")) {
  const ownerId = unitIdFor(textOf(row.cells[0]));
  for (const cell of [...row.cells].slice(1)) {
    const text = textOf(cell);
    if (!text) continue;
    const partnerName = text.replace(/\s+\d+\s*\+\s*\d+\s*$/, "").trim();
    const partnerId = unitIdFor(partnerName);
    const unitIds = [ownerId, partnerId].sort();
    const id = unitIds.join("__");
    if (!supportEdges.has(id)) {
      supportEdges.set(id, {
        id,
        unitIds,
        reviewStatus: "accepted",
        provenance: [sourceRef("serenes-fe6-supports", `Supports > ${textOf(row.cells[0])} > ${partnerName}`, ["unitIds"])],
      });
    }
  }
}

const affinityBonuses: Record<string, Record<string, number>> = {
  fire: { attack: 1, defense: 0, accuracy: 5, avoid: 5, critical: 5, criticalEvade: 0 },
  thunder: { attack: 0, defense: 1, accuracy: 0, avoid: 5, critical: 5, criticalEvade: 5 },
  wind: { attack: 1, defense: 0, accuracy: 5, avoid: 0, critical: 5, criticalEvade: 5 },
  ice: { attack: 0, defense: 1, accuracy: 5, avoid: 5, critical: 0, criticalEvade: 5 },
  dark: { attack: 0, defense: 0, accuracy: 5, avoid: 5, critical: 5, criticalEvade: 5 },
  light: { attack: 1, defense: 1, accuracy: 5, avoid: 0, critical: 5, criticalEvade: 0 },
  anima: { attack: 1, defense: 1, accuracy: 0, avoid: 5, critical: 0, criticalEvade: 5 },
};
const affinities = Object.entries(affinityBonuses).map(([id, bonusHalfUnits], index) => ({
  id,
  displayOrder: index + 1,
  names: { en: id[0].toUpperCase() + id.slice(1) },
  unit: "half_point",
  bonusHalfUnits,
  reviewStatus: "accepted",
  provenance: [sourceRef("serenes-fe6-support-calculation", `Support Calculation > ${id[0].toUpperCase() + id.slice(1)}`, ["bonusHalfUnits"])],
}));

type InventoryDefinition = { sourceId: string; weaponTypeId?: string; kind: "weapon" | "staff" | "item" };
const inventoryDefinitions: InventoryDefinition[] = [
  { sourceId: "serenes-fe6-inventory-swords", weaponTypeId: "sword", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-lances", weaponTypeId: "lance", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-axes", weaponTypeId: "axe", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-bows", weaponTypeId: "bow", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-staves", weaponTypeId: "staff", kind: "staff" },
  { sourceId: "serenes-fe6-inventory-anima-tomes", weaponTypeId: "anima", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-light-tomes", weaponTypeId: "light", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-dark-tomes", weaponTypeId: "dark", kind: "weapon" },
  { sourceId: "serenes-fe6-inventory-items", kind: "item" },
];

function rangeValue(display: string): JsonObject | null {
  if (!display || display === "–") return null;
  if (display === "All") return { kind: "all", display };
  if (/Mag/i.test(display)) return { kind: "formula", display, formula: display.replace("~", "-") };
  const values = display.split("~").map((value) => Number(value));
  if (values.some((value) => !Number.isInteger(value))) throw new Error(`Unknown range ${display}.`);
  return { kind: "fixed", display, minimum: values[0], maximum: values.at(-1) };
}

function availabilityFlags(effect: string): string[] {
  const flags: string[] = [];
  if (/cannot be obtained|unobtainable/i.test(effect)) flags.push("unobtainable");
  if (/Trial Maps? only|usable in Trial Maps? only/i.test(effect)) flags.push("trial_map_only");
  return flags;
}

const weapons: JsonObject[] = [];
const items: JsonObject[] = [];
const inventoryCandidates: JsonObject[] = [];

for (const definition of inventoryDefinitions) {
  const table = await sourceTable(definition.sourceId);
  inventoryCandidates.push({ sourceId: definition.sourceId, rows: rawRows(table) });
  for (const row of dataRows(table, "Icon")) {
    const cells = rowCells(row);
    if (definition.kind === "item") {
      const [, name, uses, worth, effect] = cells;
      items.push({
        id: asciiId(name),
        names: { en: name },
        uses: nullableInteger(uses, `${name} uses`),
        worth: nullableInteger(worth, `${name} worth`),
        effect: effect === "–" ? null : effect,
        availabilityFlags: availabilityFlags(effect),
        reviewStatus: "accepted",
        provenance: [sourceRef(definition.sourceId, `${sourceById.get(definition.sourceId)?.expectedHeading} > ${name}`, ["names", "uses", "worth", "effect", "availabilityFlags"])],
      });
      continue;
    }

    if (definition.kind === "staff") {
      const [, name, rank, range, uses, worth, experience, effect] = cells;
      weapons.push({
        id: name === "Torch" ? "torch_staff" : asciiId(name),
        names: { en: name },
        weaponTypeId: definition.weaponTypeId,
        rank: rank === "–" ? null : rank,
        range: rangeValue(range),
        weight: null,
        might: null,
        hit: null,
        critical: null,
        uses: nullableInteger(uses, `${name} uses`),
        worth: nullableInteger(worth, `${name} worth`),
        staffExperience: nullableInteger(experience, `${name} staff experience`),
        effect: effect === "–" ? null : effect,
        availabilityFlags: availabilityFlags(effect),
        reviewStatus: "accepted",
        provenance: [sourceRef(definition.sourceId, `${sourceById.get(definition.sourceId)?.expectedHeading} > ${name}`, ["names", "rank", "range", "uses", "worth", "staffExperience", "effect", "availabilityFlags"])],
      });
      continue;
    }

    const [, name, rank, range, weight, might, hit, critical, uses, worth, effect] = cells;
    weapons.push({
      id: asciiId(name),
      names: { en: name },
      weaponTypeId: definition.weaponTypeId,
      rank: rank === "–" ? null : rank,
      range: rangeValue(range),
      weight: nullableInteger(weight, `${name} weight`),
      might: nullableInteger(might, `${name} might`),
      hit: nullableInteger(hit, `${name} hit`),
      critical: nullableInteger(critical, `${name} critical`),
      uses: nullableInteger(uses, `${name} uses`),
      worth: nullableInteger(worth, `${name} worth`),
      staffExperience: null,
      effect: effect === "–" ? null : effect,
      availabilityFlags: availabilityFlags(effect),
      reviewStatus: "accepted",
      provenance: [sourceRef(definition.sourceId, `${sourceById.get(definition.sourceId)?.expectedHeading} > ${name}`, ["names", "rank", "range", "weight", "might", "hit", "critical", "uses", "worth", "effect", "availabilityFlags"])],
    });
  }
}

const candidateFiles: Record<string, unknown> = {
  "names.json": { gameId: "fe6", sourceId: "serenes-fe6-name-chart", rows: rawRows(nameTable) },
  "units.json": {
    gameId: "fe6",
    sources: {
      recruitment: rawRows(recruitmentTable),
      baseStats: rawRows(baseStatsTable),
      startingItems: rawRows(startingItemsTable),
      growthRates: rawRows(growthTable),
      supports: rawRows(supportTable),
    },
  },
  "classes.json": {
    gameId: "fe6",
    sources: {
      introduction: rawRows(classIntroductionTable),
      baseStats: rawRows(classBaseTable),
      maximumStats: rawRows(classMaximumTable),
      promotionGains: rawRows(promotionTable),
    },
  },
  "inventory.json": { gameId: "fe6", sources: inventoryCandidates },
};

const normalizedFiles: Record<string, unknown> = {
  "units.json": { formatVersion: 1, gameId: "fe6", units },
  "recruitment.json": { formatVersion: 1, gameId: "fe6", recruitment },
  "unit-base-stats.json": { formatVersion: 1, gameId: "fe6", snapshots: baseStatSnapshots },
  "unit-growths.json": { formatVersion: 1, gameId: "fe6", growths: unitGrowths },
  "unit-weapon-levels.json": { formatVersion: 1, gameId: "fe6", weaponLevels: unitWeaponLevels },
  "unit-starting-items.json": { formatVersion: 1, gameId: "fe6", startingItems: unitStartingItems },
  "support-relationships.json": { formatVersion: 1, gameId: "fe6", relationships: [...supportEdges.values()].sort((left, right) => String(left.id).localeCompare(String(right.id))) },
  "affinities.json": { formatVersion: 1, gameId: "fe6", affinities },
  "classes.json": { formatVersion: 1, gameId: "fe6", classes },
  "class-promotions.json": { formatVersion: 1, gameId: "fe6", promotions: classPromotions },
  "weapons.json": { formatVersion: 1, gameId: "fe6", weapons },
  "items.json": { formatVersion: 1, gameId: "fe6", items },
};

await Promise.all([
  ...Object.entries(candidateFiles).map(([fileName, value]) => writeFile(path.join(candidateRoot, fileName), json(value), "utf8")),
  ...Object.entries(normalizedFiles).map(([fileName, value]) => writeFile(path.join(normalizedRoot, fileName), json(value), "utf8")),
]);

const extractionReport = {
  gameId: "fe6",
  generatedAt: sourceCatalog.updatedAt,
  sourceCounts,
  normalizedCounts: {
    units: units.length,
    recruitment: recruitment.length,
    baseStatSnapshots: baseStatSnapshots.length,
    growths: unitGrowths.length,
    weaponLevelSnapshots: unitWeaponLevels.length,
    startingItemSnapshots: unitStartingItems.length,
    supportRelationships: supportEdges.size,
    affinities: affinities.length,
    classes: classes.length,
    promotions: classPromotions.length,
    weapons: weapons.length,
    items: items.length,
  },
  notes: [
    "The story roster comes from the primary Serenes recruitment table; Trial Map bonus units remain in raw snapshots only.",
    "Hard-mode rows are stored as rounded expected values and never replace fixed Normal-mode bases.",
    "The FE6 class-growth table is intentionally excluded because it is not added to playable character growth rates.",
  ],
};
await writeFile(path.join(reportRoot, "extraction.json"), json(extractionReport), "utf8");

console.log(`Extracted ${units.length} units, ${classes.length} classes, ${weapons.length} weapons/staves, and ${items.length} items.`);

import classesJson from "../../../data/runtime/fe6/classes.json";
import unitsJson from "../../../data/runtime/fe6/units.json";
import weaponsItemsJson from "../../../data/runtime/fe6/weapons-items.json";

export type Fe6Names = { en: string; zhHans?: string; ja?: string; jaLatn?: string; fan?: string; officialJpn?: string };
export type Fe6SourceRef = { sourceId: string; locator: string; fields: string[]; reviewStatus: string };
export type Fe6Source = { id: string; title: string; location: string; reviewStatus: string };
export type Fe6Stats = { hp: number; power: number; skill: number; speed: number; luck: number; defense: number; resistance: number };
export type Fe6Caps = Fe6Stats & { constitution: number; movement: number };
export type Fe6BaseStats = {
  id: string;
  difficulty: "normal" | "hard";
  valueKind: "fixed" | "expected";
  startingClassId: string;
  startingLevel: number;
  stats: Fe6Stats;
  constitution: number;
  movement: number;
  provenance: Fe6SourceRef[];
};
export type Fe6Recruitment = {
  id: string;
  joins: Array<{ chapterId: string; label: string; chapterNumber: number; routeVariant: string | null; sideChapter: boolean }>;
  condition: string;
  startingClassId: string;
  startingLevel: number;
  baseStatSnapshotId: string;
  weaponLevelSnapshotId: string;
  provenance: Fe6SourceRef[];
};
export type Fe6StartingItems = {
  id: string;
  unitId: string;
  items: string[];
  provenance: Fe6SourceRef[];
};
export type Fe6Unit = {
  id: string;
  displayOrder: number;
  names: Fe6Names;
  aliases: string[];
  characterProfile: {
    recruitment: Fe6Recruitment;
    startingClassId: string;
    startingLevel: number;
    baseStats: Fe6BaseStats;
    hardModeExpectedStats: Fe6BaseStats[];
    growths: Fe6Stats;
    baseClassIds: string[];
    baseClassCap: Fe6Caps | null;
    promotedClassId: string | null;
    promotedClassCap: Fe6Caps | null;
    weaponLevels: Record<string, string>;
    startingItems: Fe6StartingItems;
    affinity: { id: string; name: string; unit: "half_point"; bonusHalfUnits: Record<string, number> };
  };
  supports: string[];
  provenance: Fe6SourceRef[];
};
export type Fe6Class = {
  id: string;
  displayOrder: number;
  names: Fe6Names;
  aliases: string[];
  gender: string | null;
  tier: "base" | "promoted" | "special" | "enemy_only" | "npc_only";
  usableWeaponTypeIds: string[];
  baseStats: Omit<Fe6Stats, "luck">;
  constitution: number;
  movement: number;
  baseWeaponRanks: Record<string, string>;
  maximumStats: Fe6Caps;
  promotionClassId: string | null;
  notes: string | null;
  notesZhHans: string | null;
  provenance: Fe6SourceRef[];
  promotion: null | {
    targetClassId: string;
    statGains: Omit<Fe6Stats, "luck">;
    constitutionGain: number;
    movementGain: number;
    weaponRankGains: Record<string, string>;
    provenance: Fe6SourceRef[];
  };
};
export type Fe6Weapon = {
  id: string;
  names: Fe6Names;
  weaponTypeId: string;
  rank: string | null;
  range: { kind: string; display: string; minimum?: number | null; maximum?: number | null; formula?: string } | null;
  weight: number | null;
  might: number | null;
  hit: number | null;
  critical: number | null;
  uses: number | null;
  worth: number | null;
  staffExperience: number | null;
  effect: string | null;
  effectZhHans: string | null;
  availabilityFlags: string[];
  provenance: Fe6SourceRef[];
};
export type Fe6Item = {
  id: string;
  names: Fe6Names;
  uses: number | null;
  worth: number | null;
  effect: string | null;
  effectZhHans: string | null;
  availabilityFlags: string[];
  provenance: Fe6SourceRef[];
};
export type Fe6SupportRank = "C" | "B" | "A";
export const FE6_SUPPORT_RANK_MULTIPLIERS: Record<Fe6SupportRank, number> = { C: 1, B: 2, A: 3 };

export const fe6Units = (unitsJson as unknown as { units: Fe6Unit[]; sources: Fe6Source[] }).units;
export const fe6Classes = (classesJson as unknown as { classes: Fe6Class[]; sources: Fe6Source[] }).classes;
export const fe6Weapons = (weaponsItemsJson as unknown as { weapons: Fe6Weapon[]; sources: Fe6Source[] }).weapons;
export const fe6Items = (weaponsItemsJson as unknown as { items: Fe6Item[]; sources: Fe6Source[] }).items;
export const fe6Sources = uniqueSources([
  ...(unitsJson as unknown as { sources: Fe6Source[] }).sources,
  ...(classesJson as unknown as { sources: Fe6Source[] }).sources,
  ...(weaponsItemsJson as unknown as { sources: Fe6Source[] }).sources,
]);

export function findFe6UnitBySlug(slug: string): Fe6Unit | undefined {
  return fe6Units.find((unit) => unit.id === slug.toLocaleLowerCase());
}

export function findFe6ClassBySlug(slug: string): Fe6Class | undefined {
  return fe6Classes.find((entry) => entry.id === slug.toLocaleLowerCase());
}

export function fe6ClassName(classId: string | null | undefined, locale: "en" | "zhHans" = "en"): string {
  const names = findFe6ClassBySlug(classId ?? "")?.names;
  return names?.[locale] ?? names?.en ?? "Unknown";
}

export function findFe6Source(sourceId: string): Fe6Source | undefined {
  return fe6Sources.find((source) => source.id === sourceId);
}

export function collectFe6SourceRefs(value: unknown): Fe6SourceRef[] {
  if (Array.isArray(value)) return uniqueRefs(value.flatMap(collectFe6SourceRefs));
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const own = typeof record.sourceId === "string" ? [record as unknown as Fe6SourceRef] : [];
  return uniqueRefs(own.concat(Object.values(record).flatMap(collectFe6SourceRefs)));
}

export function matchesFe6UnitSearch(unit: Fe6Unit, rawQuery: string): boolean {
  const query = normalizeSearch(rawQuery);
  if (!query) return true;
  return [unit.id, ...Object.values(unit.names), ...unit.aliases].some((value) => normalizeSearch(value).includes(query));
}

export function matchesFe6ClassSearch(entry: Fe6Class, rawQuery: string): boolean {
  const query = normalizeSearch(rawQuery);
  if (!query) return true;
  return [entry.id, ...Object.values(entry.names), ...entry.aliases].some((value) => normalizeSearch(value).includes(query));
}

export function formatAffinityHalfUnits(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value / 2}`;
}

export function calculateFe6SupportAffinityBonuses(
  first: Fe6Unit,
  second: Fe6Unit,
  rank: Fe6SupportRank,
): Record<string, number> {
  const multiplier = FE6_SUPPORT_RANK_MULTIPLIERS[rank];
  const firstBonuses = first.characterProfile.affinity.bonusHalfUnits;
  const secondBonuses = second.characterProfile.affinity.bonusHalfUnits;
  return Object.fromEntries(Array.from(
    new Set([...Object.keys(firstBonuses), ...Object.keys(secondBonuses)]),
    (stat) => [stat, (firstBonuses[stat] ?? 0) * multiplier + (secondBonuses[stat] ?? 0) * multiplier],
  ));
}

export function formatFe6Join(recruitment: Fe6Recruitment, locale: "en" | "zhHans" = "en"): string {
  const chapters = recruitment.joins.map((join) => {
    if (locale === "zhHans") {
      return join.routeVariant
        ? `${join.routeVariant}线第${join.chapterNumber}章`
        : `第${join.label}章`;
    }
    return `Ch. ${join.label}`;
  });
  return chapters.join(" / ");
}

function normalizeSearch(value: string | undefined): string {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]/g, "");
}

function uniqueSources(sources: Fe6Source[]): Fe6Source[] {
  return [...new Map(sources.map((source) => [source.id, source])).values()];
}

function uniqueRefs(references: Fe6SourceRef[]): Fe6SourceRef[] {
  return [...new Map(references.map((reference) => [`${reference.sourceId}:${reference.locator}`, reference])).values()];
}

import { displayId, fe14Data, type StatBlock, type UnitRuntime } from "../../../data";
import { STAT_KEYS, type AvailabilityScenario } from "./types";

export function corrinBorrowedClassId(partnerUnitId: string): string | undefined {
  const partner = fe14Data.units.find((unit) => unit.identity.id === partnerUnitId);
  const startingClassId = partner?.classAccess?.startingClassId;
  if (!partner || !startingClassId) return undefined;
  const restricted = new Set(["nohr_prince", "songstress", "kitsune", "wolfskin", "villager"]);
  return restricted.has(startingClassId)
    ? partner.classAccess?.heartSealClassSet[0]
    : partner.classAccess?.baseClassSet[0];
}

export function applyAvatarDeltas(base: StatBlock, ...deltas: Array<Partial<StatBlock>>): StatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [stat, deltas.reduce((value, delta) => value + (delta[stat] ?? 0), base[stat])]),
  ) as unknown as StatBlock;
}

export function formatAvatarMatrixCell(boon?: number, bane?: number, percentage = false): string {
  if (boon === undefined && bane === undefined) return "—";
  const suffix = percentage ? "%" : "";
  return `${formatSigned(boon ?? 0)}${suffix} / ${formatSigned(bane ?? 0)}${suffix}`;
}

export function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function formatBonuses(values: Record<string, number>): string {
  const labels: Record<string, string> = {
    hit: "Hit rate",
    avoid: "Avoid",
    critical: "Critical",
    criticalAvoid: "Dodge",
  };
  return Object.entries(values).map(([stat, value]) => `${labels[stat] ?? displayId(stat)} +${value}`).join(", ");
}

export function formatRoute(route: string): string {
  return { birthright: "BR", conquest: "CQ", revelation: "RV" }[route] ?? route;
}

export function scenarioLabel(scenario?: AvailabilityScenario): string {
  if (!scenario) return "Unknown scenario";
  if (scenario.scenarioLabel) return scenario.scenarioLabel;
  if (scenario.avatarGender) return `${displayId(scenario.avatarGender)} Corrin`;
  const idParts = scenario.id.split(".");
  return displayId(idParts[idParts.length - 1] ?? scenario.id);
}

export function baseStatsForAvailability(unit: UnitRuntime, availabilityId: string) {
  return unit.baseStats.find((record) =>
    record.availabilityId === availabilityId || record.availabilityIds?.includes(availabilityId),
  );
}

export function formatJoinLevel(unit: UnitRuntime, availabilityId: string): string {
  const baseStats = baseStatsForAvailability(unit, availabilityId);
  const scenario = unit.availability.find((record) => record.id === availabilityId);
  const carryover = baseStats?.chapter5Carryover ?? scenario?.chapter5Carryover;
  const level = baseStats?.level ?? scenario?.level ?? "?";
  if (scenario?.autoLevel) {
    return scenario.autoLevel.maximumLevel
      ? `Lv. ${scenario.autoLevel.minimumLevel}-${scenario.autoLevel.maximumLevel}`
      : `Lv. ${scenario.autoLevel.minimumLevel}+ (scales)`;
  }
  if (carryover?.levelCalculation === "template_plus_chapter_5_levels_gained") {
    return `Lv. ${level} + ${carryoverTrainingLabel(carryover.sourceAvailabilityId, true)} levels`;
  }
  if (carryover?.levelCalculation === "retain_chapter_5_level") {
    return `Lv. ${level} + carried levels`;
  }
  return `Lv. ${level}`;
}

export function formatRouteJoin(
  scenario: AvailabilityScenario,
  routeJoin: AvailabilityScenario["routeJoins"][number],
): string {
  if (scenario.dlcRecruitment) return "Dragon's Gate unlocked";
  if (scenario.myCastleRecruitment) return `After Chapter ${routeJoin.chapter}`;
  if (routeJoin.chapter === 0) return "Prologue";
  if (routeJoin.turn) return `Chapter ${routeJoin.chapter} (turn ${routeJoin.turn})`;
  return `Chapter ${routeJoin.chapter}${routeJoin.timing === "start" ? "" : ` (${routeJoin.timing})`}`;
}

export function formatMyCastleTrigger(scenario: AvailabilityScenario): string {
  const recruitment = scenario.myCastleRecruitment;
  if (!recruitment) return "—";
  const facilities = recruitment.facilityIds
    ? `Any of ${formatDisjunction(recruitment.facilityIds.map(displayId))}`
    : displayId(recruitment.facilityId ?? "unknown_facility");
  return `${facilities} Lv. ${recruitment.facilityLevel}, then a My Castle refresh by waiting or completing a map`;
}

export function formatDisjunction(values: string[]): string {
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
}

export function formatInventory(unit: UnitRuntime, availabilityId: string): string {
  const scenario = unit.availability.find((record) => record.id === availabilityId);
  if (!scenario) return "—";
  if (scenario.inventoryByDifficulty) {
    return `Normal: ${formatItemList(scenario.inventoryByDifficulty.normal)}; Hard/Lunatic: ${formatItemList(scenario.inventoryByDifficulty.hard)}`;
  }
  if (scenario.inventory.length > 0) return scenario.inventory.map(displayId).join(", ");
  const baseStats = baseStatsForAvailability(unit, availabilityId);
  return baseStats?.chapter5Carryover ? "Chapter 5 carryover" : "None";
}

export function formatItemList(items: string[]): string {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].map(([item, count]) => `${displayId(item)}${count > 1 ? ` ×${count}` : ""}`).join(", ");
}

export function formatWeaponRanks(unit: UnitRuntime, availabilityId: string): string {
  const baseStats = baseStatsForAvailability(unit, availabilityId);
  if (!baseStats) return "—";
  const ranks = Object.entries(baseStats.weaponRanksByAvailability?.[availabilityId] ?? baseStats.weaponRanks)
    .map(([weapon, rank]) => {
      const progress = baseStats.weaponRankProgressByAvailability?.[availabilityId]?.[weapon]
        ?? baseStats.weaponRankProgress?.[weapon];
      if (!progress) return `${displayId(weapon)} ${rank}`;

      const fraction = Math.round(progress.barFraction * 3) === 1 ? "1/3" : `${Math.round(progress.barFraction * 100)}%`;
      const approximation = progress.precision === "approximate" ? "~" : "";
      return `${displayId(weapon)} ${rank} (${approximation}${fraction} to ${progress.towardRank})`;
    })
    .join(", ");
  const proficiencyRule = baseStats.chapter5Carryover?.weaponProficiencyCalculation;
  if (proficiencyRule === "retain_chapter_5_proficiency") {
    return `${ranks} + retained Chapter 5 proficiency`;
  }
  if (proficiencyRule === "template_plus_chapter_5_proficiency_gained") {
    return `${ranks} + ${carryoverTrainingLabel(baseStats.chapter5Carryover?.sourceAvailabilityId)} proficiency gained`;
  }
  return ranks;
}

export function formatDlcTrigger(scenario: AvailabilityScenario): string {
  const recruitment = scenario.dlcRecruitment;
  if (!recruitment) return "—";
  return `Clear ${recruitment.mapName} for the first time`;
}

export function carryoverTrainingLabel(sourceAvailabilityId?: string, abbreviated = false): string {
  if (sourceAvailabilityId === "sakura.chapter_5") return "Chapter 5";
  return abbreviated ? "Ch. 4/5" : "Chapter 4/5";
}

export function corrinTalentLabel(unit: UnitRuntime): string {
  if (unit.identity.id === "niles") return "Corrin Talent only";
  const corrinGender = unit.identity.gender === "female" ? "Male" : "Female";
  return `${corrinGender} Corrin Talent only`;
}

export function shortStatLabel(stat: keyof StatBlock): string {
  return {
    hp: "HP",
    strength: "Str",
    magic: "Mag",
    skill: "Skl",
    speed: "Spd",
    luck: "Lck",
    defense: "Def",
    resistance: "Res",
  }[stat];
}

import {
  displayId,
  fe14Data,
  type AvatarChoice,
  type Fe14Runtime,
  type StatBlock,
  type StanceBonuses,
  type UnitRuntime,
} from "./data";
import { resolveOffspringScenario, roundHalfUp } from "./offspring";

export const ROUTE_ORDER = ["birthright", "conquest", "revelation"] as const;
export type RouteId = (typeof ROUTE_ORDER)[number];
export type AvailabilityStateKind = "appearance" | "join" | "rejoin" | "conditional";

export interface UnitBaseConfigurationSelection {
  routeId: RouteId;
  availabilityId?: string;
  avatarGender?: "male" | "female";
  boon?: AvatarChoice;
  bane?: AvatarChoice;
  talentId?: string;
  variableParentUnitId?: string;
  nestedVariableParentUnitId?: string;
  offspringStoryChapter?: number;
  offspringPromotionClassId?: string;
}

export interface AvailabilityStateOption {
  availabilityId: string;
  kind: AvailabilityStateKind;
  label: string;
  joinLabel: string;
}

export interface ResolvedWeaponLevel {
  weaponTypeId: string;
  label: string;
  iconAssetId: string;
  currentRank: string | null;
  rankCap: string;
  progress: {
    towardRank: string;
    barFraction: number;
    precision: "exact" | "approximate";
  } | null;
}

export interface ResolvedStartingSkill {
  skillId: string;
  kind: "personal" | "class";
  source: "personal" | "current_class" | "scenario_override" | "offspring_seal";
  sourceClassId?: string;
  sourceClassName?: string;
  acquiredLevel?: number;
  guaranteed: boolean;
  condition?: string;
  name: string;
  description: string;
  iconAssetId: string;
}

export type ResolvedRecruitmentContext =
  | {
      kind: "story";
      chapter: number;
      timing: string;
      turn?: number;
    }
  | {
      kind: "paralogue";
      paralogueNo: number;
      title: string;
      trigger: string;
    };

type ResolvedStance = Pick<StanceBonuses, "baseBonus" | "rankDeltas">;

export interface ResolvedUnitBaseConfiguration {
  unitId: string;
  routeId: RouteId;
  availabilityId: string;
  stateKind: AvailabilityStateKind;
  stateLabel: string;
  scenarioConditions: {
    avatarGender?: "male" | "female";
    variableParentUnitId?: string;
    nestedVariableParentUnitId?: string;
    difficultyInventory: boolean;
    autoLevel: boolean;
  };
  join: ResolvedRecruitmentContext;
  displayClassId: string;
  canonicalClassId: string;
  classLabel: string;
  level: number;
  joiningStats: StatBlock | null;
  joiningStatsKind: "fixed" | "minimum_before_parent_inheritance" | "conditional";
  individualGrowths: StatBlock;
  effectiveGrowths: StatBlock;
  inventory: {
    items: string[];
    byDifficulty?: { normal: string[]; hard: string[]; lunatic: string[] };
  };
  learnedSkills: ResolvedStartingSkill[];
  unresolvedSkillIds: string[];
  weaponLevels: ResolvedWeaponLevel[];
  capModifiers: Partial<Omit<StatBlock, "hp">>;
  attackStance: ResolvedStance;
  guardStance: ResolvedStance;
  notes: string[];
  levelContext?: string;
  offspringContext?: {
    selectedChapter: number;
    earliestChapter: number;
    storyOptions: Array<{
      chapter: number;
      level: number;
      promoted: boolean;
      label: string;
    }>;
    childBaseGrowths: StatBlock;
    variableParentGrowths: StatBlock;
    variableParentName: string;
    nestedParentName?: string;
    unlockSources: Array<{
      unitId: string;
      name: string;
      availableChapter: number;
      note: string;
    }>;
    promotionOptions: Array<{ classId: string; displayName: string }>;
    selectedPromotionClassId?: string;
  };
  storyProgression?: {
    levelByStoryPosition: Array<{ chapterStart: number; chapterEnd?: number; level: number }>;
    offspringSealAvailableFromChapter: number;
    weaponRankMilestones: Array<{
      chapterStart: number;
      chapterEnd: number;
      primaryRank: string;
      secondaryRank: string;
    }>;
  };
}

export interface ResolvedParentOption {
  unitId: string;
  label: string;
  routes: RouteId[];
}

export interface UnitBaseConfigurationResolution {
  availableRoutes: RouteId[];
  routeId: RouteId;
  stateOptions: AvailabilityStateOption[];
  selectedAvailabilityId: string;
  configuration: ResolvedUnitBaseConfiguration;
  parentOptions?: ResolvedParentOption[];
  selectedParentUnitId?: string;
}

const STAT_KEYS: Array<keyof StatBlock> = [
  "hp",
  "strength",
  "magic",
  "skill",
  "speed",
  "luck",
  "defense",
  "resistance",
];

const CLASS_ALIASES: Record<string, string> = {
  maid: "attendant",
  butler: "attendant",
};

export function resolveUnitBaseConfiguration(
  unit: UnitRuntime,
  selection: UnitBaseConfigurationSelection,
  runtime: Fe14Runtime = fe14Data,
): UnitBaseConfigurationResolution {
  if (unit.offspring) return resolveOffspringBaseConfiguration(unit, selection, runtime);
  if (unit.availability.length === 0) throw new Error(`Route-driven configuration is unavailable for ${unit.identity.id}.`);

  const availableRoutes = ROUTE_ORDER.filter((routeId) =>
    unit.availability.some((scenario) => scenario.routeJoins.some((join) => join.route === routeId)),
  );
  const routeId = availableRoutes.includes(selection.routeId)
    ? selection.routeId
    : availableRoutes[0];
  if (!routeId) throw new Error(`No legal route state exists for ${unit.identity.id}.`);

  const scenarios = unit.availability.filter((scenario) =>
    scenario.routeJoins.some((join) => join.route === routeId) &&
    (!scenario.avatarGender || !selection.avatarGender || scenario.avatarGender === selection.avatarGender),
  );
  if (scenarios.length === 0) {
    throw new Error(`No ${routeId} availability state exists for ${unit.identity.id}.`);
  }

  const stateOptions = scenarios
    .map((scenario) => {
      const join = routeJoinFor(scenario, routeId);
      const kind = classifyState(scenario, routeId, scenarios);
      return {
        availabilityId: scenario.id,
        kind,
        label: availabilityLabel(scenario, kind),
        joinLabel: joinLabel(join),
      } satisfies AvailabilityStateOption;
    })
    .sort((left, right) => {
      const leftJoin = routeJoinFor(scenarios.find((entry) => entry.id === left.availabilityId)!, routeId);
      const rightJoin = routeJoinFor(scenarios.find((entry) => entry.id === right.availabilityId)!, routeId);
      return leftJoin.chapter - rightJoin.chapter || left.availabilityId.localeCompare(right.availabilityId);
    });

  const selectedAvailabilityId = stateOptions.some(
    (option) => option.availabilityId === selection.availabilityId,
  )
    ? selection.availabilityId!
    : stateOptions.find((option) => option.kind !== "appearance")?.availabilityId
      ?? stateOptions[0].availabilityId;
  const scenario = scenarios.find((entry) => entry.id === selectedAvailabilityId)!;
  const state = stateOptions.find((option) => option.availabilityId === selectedAvailabilityId)!;
  const baseStats = baseStatsForAvailability(unit, selectedAvailabilityId);
  const displayClassId = scenario.classId;
  const canonicalClassId = CLASS_ALIASES[displayClassId] ?? displayClassId;
  const classProfile = runtime.classStats.find((profile) => profile.classId === canonicalClassId);
  if (!classProfile) {
    throw new Error(`Missing class-stat profile ${canonicalClassId} for ${selectedAvailabilityId}.`);
  }

  const individualGrowths = addStats(
    unit.growths[0]?.rates ?? emptyStats(),
    unit.identity.id === "corrin" ? selection.boon?.growthDeltas : undefined,
    unit.identity.id === "corrin" ? selection.bane?.growthDeltas : undefined,
  );
  const joiningStats = baseStats
    ? addStats(
        baseStats.stats,
        unit.identity.id === "corrin" ? selection.boon?.baseDeltas : undefined,
        unit.identity.id === "corrin" ? selection.bane?.baseDeltas : undefined,
      )
    : null;
  const capModifiers = resolveCapModifiers(unit, selection);
  const stances = resolveStances(unit, selection);
  const skills = resolveStartingSkills(
    unit,
    canonicalClassId,
    baseStats?.level ?? scenario.level,
    baseStats?.startingSkillOverrideIds ?? [],
    runtime,
    unit.identity.gender === "male" || unit.identity.gender === "female" ? unit.identity.gender : undefined,
  );
  const currentRanks = baseStats?.weaponRanksByAvailability?.[selectedAvailabilityId]
    ?? baseStats?.weaponRanks
    ?? {};
  const currentProgress = baseStats?.weaponRankProgressByAvailability?.[selectedAvailabilityId]
    ?? baseStats?.weaponRankProgress
    ?? {};
  const weaponLevels = resolveWeaponLevels(classProfile.weaponRankCaps, currentRanks, currentProgress, runtime);

  return {
    availableRoutes,
    routeId,
    stateOptions,
    selectedAvailabilityId,
    configuration: {
      unitId: unit.identity.id,
      routeId,
      availabilityId: selectedAvailabilityId,
      stateKind: state.kind,
      stateLabel: state.label,
      scenarioConditions: {
        ...(scenario.avatarGender ? { avatarGender: scenario.avatarGender as "male" | "female" } : {}),
        difficultyInventory: Boolean(scenario.inventoryByDifficulty),
        autoLevel: Boolean(scenario.autoLevel),
      },
      join: { kind: "story", ...routeJoinFor(scenario, routeId) },
      displayClassId,
      canonicalClassId,
      classLabel: displayClassId === "maid" ? "Maid" : displayClassId === "butler" ? "Butler" : classProfile.displayName,
      level: baseStats?.level ?? scenario.level,
      joiningStats,
      joiningStatsKind: scenario.autoLevel || Boolean(baseStats?.chapter5Carryover ?? scenario.chapter5Carryover)
        ? "conditional"
        : "fixed",
      individualGrowths,
      effectiveGrowths: addStats(individualGrowths, classProfile.growthRates),
      inventory: {
        items: scenario.inventory,
        ...(scenario.inventoryByDifficulty ? { byDifficulty: scenario.inventoryByDifficulty } : {}),
      },
      learnedSkills: skills.resolved,
      unresolvedSkillIds: skills.unresolved,
      weaponLevels,
      capModifiers,
      attackStance: stances.attackStance,
      guardStance: stances.guardStance,
      notes: [
        ...scenarioNotes(unit, scenario, routeId),
        ...(unit.identity.id === "corrin" && unit.avatarConfiguration?.pairupRule ? [
          `Attack Stance: ${unit.avatarConfiguration.pairupRule.attackStance.semantics}`,
          `Guard Stance: ${unit.avatarConfiguration.pairupRule.guardStance.semantics}`,
        ] : []),
      ],
    },
  };
}

function resolveOffspringBaseConfiguration(
  unit: UnitRuntime,
  selection: UnitBaseConfigurationSelection,
  runtime: Fe14Runtime,
): UnitBaseConfigurationResolution {
  const offspring = unit.offspring;
  if (!offspring) throw new Error(`Missing offspring data for ${unit.identity.id}.`);
  const { parentage, recruitment } = offspring;
  const childGender = selection.avatarGender
    ?? (unit.identity.gender === "male" || unit.identity.gender === "female" ? unit.identity.gender : "female");
  const eligibleParentOptions = parentage.variableParentOptions.filter((option) => (
    parentage.scenarioKind !== "avatar_child" || option.childGender === childGender
  ));
  const availableRoutes = ROUTE_ORDER.filter((candidateRoute) => (
    eligibleParentOptions.some((option) => option.routes.includes(candidateRoute))
  ));
  const routeId = availableRoutes.includes(selection.routeId) ? selection.routeId : availableRoutes[0];
  if (!routeId) throw new Error(`No legal route exists for ${unit.identity.id}.`);
  const routeParentOptions = eligibleParentOptions.filter((option) => option.routes.includes(routeId));
  const selectedParentOption = routeParentOptions.find((option) => option.unitId === selection.variableParentUnitId)
    ?? routeParentOptions.find((option) => option.unitId === "corrin")
    ?? routeParentOptions[0];
  if (!selectedParentOption) throw new Error(`No legal ${routeId} parent scenario exists for ${unit.identity.id}.`);
  const parentOptions = routeParentOptions
    .map((option) => ({
      unitId: option.unitId,
      label: runtime.roster.find((candidate) => candidate.id === option.unitId)?.displayName ?? option.unitId,
      routes: ROUTE_ORDER.filter((candidate) => option.routes.includes(candidate)),
    }));

  const selectedParentUnit = runtime.units.find((candidate) => candidate.identity.id === selectedParentOption.unitId);
  const legalNestedOptions = selectedParentUnit?.offspring?.parentage.variableParentOptions.filter((option) => (
    option.unitId !== "corrin" && option.routes.includes(routeId)
  )) ?? [];
  const nestedVariableParentUnitId = legalNestedOptions.some((option) => option.unitId === selection.nestedVariableParentUnitId)
    ? selection.nestedVariableParentUnitId
    : legalNestedOptions[0]?.unitId;
  const scenario = resolveOffspringScenario(
    unit,
    selectedParentOption.unitId,
    selection.boon,
    selection.bane,
    {
      corrinTalentId: selection.talentId,
      nestedVariableParentId: nestedVariableParentUnitId,
    },
  );
  if (!scenario) throw new Error(`Could not resolve ${unit.identity.id} with ${selectedParentOption.unitId}.`);

  const displayClassId = recruitment.startingClassId;
  const startingCanonicalClassId = CLASS_ALIASES[displayClassId] ?? displayClassId;
  const startingClassProfile = runtime.classStats.find((profile) => profile.classId === startingCanonicalClassId);
  if (!startingClassProfile) throw new Error(`Missing class-stat profile ${startingCanonicalClassId} for ${unit.identity.id}.`);

  const unlockSources = resolveOffspringUnlockSources(
    unit,
    selectedParentOption.unitId,
    nestedVariableParentUnitId,
    routeId,
    runtime,
  );
  const earliestChapter = Math.max(8, ...unlockSources.map((source) => source.availableChapter));
  const storyOptions = offspringStoryOptions(recruitment, earliestChapter);
  const requestedChapter = selection.offspringStoryChapter ?? earliestChapter;
  const selectedStory = storyOptions.reduce((closest, option) => (
    Math.abs(option.chapter - requestedChapter) < Math.abs(closest.chapter - requestedChapter) ? option : closest
  ), storyOptions[0]);
  const legalPromotions = recruitment.offspringSeal.promotionOptions.filter(
    (promotion) => !promotion.routes || promotion.routes.includes(routeId),
  );
  const selectedPromotion = selectedStory.promoted
    ? legalPromotions.find((promotion) => promotion.classId === selection.offspringPromotionClassId) ?? legalPromotions[0]
    : undefined;
  const canonicalClassId = selectedPromotion?.classId ?? startingCanonicalClassId;
  const classProfile = runtime.classStats.find((profile) => profile.classId === canonicalClassId);
  if (!classProfile) throw new Error(`Missing class-stat profile ${canonicalClassId} for ${unit.identity.id}.`);

  const skills = resolveStartingSkills(unit, startingCanonicalClassId, 10, [], runtime, childGender);
  const promotedLevel = selectedStory.promoted
    ? recruitment.offspringSeal.promotedLevelsByChapter[String(selectedStory.chapter)]
    : undefined;
  const promotedSkills = selectedPromotion?.learnedSkills
    .filter((learned) => learned.level <= (promotedLevel ?? 0))
    .flatMap((learned) => {
      const skill = runtime.classSkills.find((candidate) => candidate.id === learned.skillId);
      if (!skill) {
        skills.unresolved.push(learned.skillId);
        return [];
      }
      return [{
        skillId: skill.id,
        kind: "class" as const,
        source: "offspring_seal" as const,
        sourceClassId: selectedPromotion.classId,
        sourceClassName: selectedPromotion.displayName,
        acquiredLevel: learned.level,
        guaranteed: true,
        condition: `${selectedPromotion.displayName} via Offspring Seal at promoted level ${learned.level}`,
        name: skill.names.en,
        description: skill.description,
        iconAssetId: skill.iconAssetId,
      }];
    }) ?? [];
  const learnedSkills = [...skills.resolved, ...promotedSkills]
    .filter((skill, index, values) => values.findIndex((candidate) => (
      candidate.skillId === skill.skillId && candidate.condition === skill.condition
    )) === index);
  const currentRanks = selectedPromotion && promotedLevel
    ? promotedWeaponRanks(recruitment, selectedPromotion, selectedStory.chapter)
    : recruitment.weaponRanks;
  const weaponLevels = resolveWeaponLevels(
    classProfile.weaponRankCaps,
    currentRanks,
    {},
    runtime,
  );
  const joiningStats = resolveOffspringLevelOnlyStats(
    recruitment,
    scenario.personalGrowth,
    startingClassProfile.growthRates,
    selectedStory.promoted ? 20 + selectedStory.level : selectedStory.level,
    selectedPromotion,
    classProfile.growthRates,
  );
  const availabilityId = `${unit.identity.id}.${selectedParentOption.unitId}.${routeId}`;

  return {
    availableRoutes,
    routeId,
    stateOptions: [{
      availabilityId,
      kind: "conditional",
      label: `Paralogue ${recruitment.paralogueNo}: ${recruitment.paralogueTitle}`,
      joinLabel: recruitment.recruitment.description,
    }],
    selectedAvailabilityId: availabilityId,
    parentOptions,
    selectedParentUnitId: selectedParentOption.unitId,
    configuration: {
      unitId: unit.identity.id,
      routeId,
      availabilityId,
      stateKind: "conditional",
      stateLabel: `Paralogue ${recruitment.paralogueNo}: ${recruitment.paralogueTitle}`,
      scenarioConditions: {
        avatarGender: childGender,
        variableParentUnitId: selectedParentOption.unitId,
        ...(scenario.nestedVariableParentId ? { nestedVariableParentUnitId: scenario.nestedVariableParentId } : {}),
        difficultyInventory: false,
        autoLevel: true,
      },
      join: {
        kind: "paralogue",
        paralogueNo: recruitment.paralogueNo,
        title: recruitment.paralogueTitle,
        trigger: recruitment.recruitment.description,
      },
      displayClassId: selectedPromotion?.classId ?? displayClassId,
      canonicalClassId,
      classLabel: selectedPromotion?.displayName ?? (unit.identity.id === "kana"
        ? childGender === "male" ? "Nohr Prince" : "Nohr Princess"
        : classProfile.displayName),
      level: promotedLevel ?? selectedStory.level,
      levelContext: selectedStory.promoted
        ? `Offspring Seal at Chapter ${selectedStory.chapter}; level-only stats exclude parent inheritance bonuses.`
        : `Chapter ${selectedStory.chapter}; level-only stats exclude parent inheritance bonuses.`,
      joiningStats,
      joiningStatsKind: "minimum_before_parent_inheritance",
      individualGrowths: scenario.personalGrowth,
      effectiveGrowths: addStats(scenario.personalGrowth, classProfile.growthRates),
      inventory: { items: recruitment.inventory },
      learnedSkills,
      unresolvedSkillIds: [...new Set(skills.unresolved)],
      weaponLevels,
      capModifiers: scenario.capModifiers,
      attackStance: scenario.bonuses.attackStance,
      guardStance: scenario.bonuses.guardStance,
      notes: [
        ...(recruitment.recruitmentNotes ?? []),
        ...(recruitment.recruitment.deathBeforeRecruitmentIsPermanent
          ? [`If ${unit.identity.displayName} falls before recruitment, they are permanently lost even in Casual or Phoenix mode.`]
          : []),
        recruitment.mapLevelScaling.note,
        `Earliest paralogue timing is Chapter ${earliestChapter}, derived from the later available parent on ${capitalize(routeId)}.`,
      ],
      offspringContext: {
        selectedChapter: selectedStory.chapter,
        earliestChapter,
        storyOptions,
        childBaseGrowths: parentage.childBaseGrowth,
        variableParentGrowths: scenario.variableParentGrowth,
        variableParentName: scenario.variableParent.identity.displayName,
        ...(scenario.nestedVariableParentScenario?.variableParent.identity.displayName
          ? { nestedParentName: scenario.nestedVariableParentScenario.variableParent.identity.displayName }
          : {}),
        unlockSources,
        promotionOptions: legalPromotions.map((promotion) => ({
          classId: promotion.classId,
          displayName: promotion.displayName,
        })),
        ...(selectedPromotion ? { selectedPromotionClassId: selectedPromotion.classId } : {}),
      },
      storyProgression: {
        levelByStoryPosition: recruitment.levelByStoryPosition,
        offspringSealAvailableFromChapter: recruitment.offspringSeal.availableFromChapter,
        weaponRankMilestones: recruitment.offspringSeal.weaponRankMilestones,
      },
    },
  };
}

type OffspringRecruitment = NonNullable<UnitRuntime["offspring"]>["recruitment"];
type OffspringPromotion = OffspringRecruitment["offspringSeal"]["promotionOptions"][number];

function offspringStoryOptions(
  recruitment: OffspringRecruitment,
  earliestChapter: number,
): NonNullable<ResolvedUnitBaseConfiguration["offspringContext"]>["storyOptions"] {
  const firstChapter = Math.min(27, Math.max(8, earliestChapter));
  return Array.from({ length: 28 - firstChapter }, (_, index) => firstChapter + index).map((chapter) => {
    const promotedLevel = recruitment.offspringSeal.promotedLevelsByChapter[String(chapter)];
    if (promotedLevel !== undefined) {
      return {
        chapter,
        level: promotedLevel,
        promoted: true,
        label: `Ch. ${chapter} · Offspring Seal Lv. ${promotedLevel}`,
      };
    }
    const milestone = recruitment.levelByStoryPosition.find((entry, index, milestones) => {
      const chapterEnd = entry.chapterEnd ?? (milestones[index + 1]?.chapterStart ?? 28) - 1;
      return chapter >= entry.chapterStart && chapter <= chapterEnd;
    }) ?? recruitment.levelByStoryPosition[0];
    return {
      chapter,
      level: milestone.level,
      promoted: false,
      label: `Ch. ${chapter} · Lv. ${milestone.level}`,
    };
  });
}

function resolveOffspringUnlockSources(
  child: UnitRuntime,
  variableParentUnitId: string,
  nestedVariableParentUnitId: string | undefined,
  routeId: RouteId,
  runtime: Fe14Runtime,
): NonNullable<ResolvedUnitBaseConfiguration["offspringContext"]>["unlockSources"] {
  const fixedParentUnitId = child.offspring!.parentage.scenarioKind === "avatar_child"
    ? "corrin"
    : child.offspring!.parentage.fixedParentUnitId;
  return [
    resolveParentAvailability(fixedParentUnitId, undefined, routeId, runtime, new Set([child.identity.id])),
    resolveParentAvailability(variableParentUnitId, nestedVariableParentUnitId, routeId, runtime, new Set([child.identity.id])),
  ];
}

function resolveParentAvailability(
  unitId: string,
  nestedVariableParentUnitId: string | undefined,
  routeId: RouteId,
  runtime: Fe14Runtime,
  visited: Set<string>,
): NonNullable<ResolvedUnitBaseConfiguration["offspringContext"]>["unlockSources"][number] {
  const parent = runtime.units.find((candidate) => candidate.identity.id === unitId);
  const name = parent?.identity.displayName
    ?? runtime.roster.find((candidate) => candidate.id === unitId)?.displayName
    ?? displayId(unitId);
  if (unitId === "jakob") {
    return {
      unitId,
      name,
      availableChapter: 8,
      note: "ASAP default: Jakob is treated as available by the first supported child-paralogue chapter.",
    };
  }
  if (unitId === "corrin") {
    return { unitId, name, availableChapter: 0, note: "Available from the prologue." };
  }
  if (!parent || visited.has(unitId)) {
    return { unitId, name, availableChapter: 8, note: "Uses the first supported child-paralogue chapter." };
  }

  if (parent.offspring) {
    const nextVisited = new Set(visited).add(unitId);
    const parentage = parent.offspring.parentage;
    const fixedParentUnitId = parentage.scenarioKind === "avatar_child" ? "corrin" : parentage.fixedParentUnitId;
    const nestedOption = parentage.variableParentOptions.find((option) => (
      option.unitId === nestedVariableParentUnitId && option.routes.includes(routeId)
    )) ?? parentage.variableParentOptions.find((option) => option.unitId === "corrin" && option.routes.includes(routeId))
      ?? parentage.variableParentOptions.find((option) => option.routes.includes(routeId));
    const fixed = resolveParentAvailability(fixedParentUnitId, undefined, routeId, runtime, nextVisited);
    const variable = nestedOption
      ? resolveParentAvailability(nestedOption.unitId, undefined, routeId, runtime, nextVisited)
      : { unitId, name, availableChapter: 8, note: "No nested parent timing was available." };
    const availableChapter = Math.max(8, fixed.availableChapter, variable.availableChapter);
    return {
      unitId,
      name,
      availableChapter,
      note: `${name}'s paralogue can unlock from Chapter ${availableChapter} with the selected nested parent.`,
    };
  }

  const routeScenarios = parent.availability.filter((scenario) => (
    scenario.routeJoins.some((entry) => entry.route === routeId)
  ));
  const permanentScenarios = routeScenarios.filter((scenario) => {
    const label = String(scenario.scenarioLabel ?? scenario.id).toLowerCase();
    return !label.includes("guest") && scenario.gainsExperience !== false;
  });
  const unlockScenarios = permanentScenarios.length ? permanentScenarios : routeScenarios;
  const candidates = unlockScenarios.flatMap((scenario) => {
    const join = scenario.routeJoins.find((entry) => entry.route === routeId);
    if (!join) return [];
    let availableChapter = join.chapter;
    const routeReturn = scenario.temporaryDeparture?.routes.includes(routeId)
      ? scenario.temporaryDeparture.returns.find((entry) => entry.route === routeId)
      : undefined;
    if (routeReturn) availableChapter = Math.max(availableChapter, routeReturn.chapter);
    if (scenario.temporarilyLeavesAfterChapter !== undefined && scenario.returnsChapter !== undefined) {
      availableChapter = Math.max(availableChapter, scenario.returnsChapter);
    }
    if (join.timing === "conditional") availableChapter += 1;
    return [{
      availableChapter,
      note: `${joinLabel(join)}${join.timing === "conditional" ? "; available after its condition is cleared" : ""}.`,
    }];
  }).sort((left, right) => left.availableChapter - right.availableChapter);
  const selected = candidates[0] ?? {
    availableChapter: 8,
    note: "No chapter-based availability record was found; uses the first supported child-paralogue chapter.",
  };
  return { unitId, name, ...selected };
}

function resolveOffspringLevelOnlyStats(
  recruitment: OffspringRecruitment,
  personalGrowths: StatBlock,
  startingClassGrowths: StatBlock,
  effectiveLevel: number,
  promotion: OffspringPromotion | undefined,
  currentClassGrowths: StatBlock,
): StatBlock {
  const automaticLevels = effectiveLevel - 10;
  const promotedLevel = promotion ? effectiveLevel - 20 : 0;
  const childAptitudes = Object.fromEntries(STAT_KEYS.map((stat) => [
    stat,
    recruitment.level10PersonalBases[stat]
      + Math.floor(automaticLevels * (personalGrowths[stat] + startingClassGrowths[stat]) / 100),
  ])) as unknown as StatBlock;
  if (!promotion) {
    return addStats(
      recruitment.level10MinimumStatsBeforeInheritance,
      Object.fromEntries(STAT_KEYS.map((stat) => [stat, childAptitudes[stat] - recruitment.level10PersonalBases[stat]])),
    );
  }
  const promotedClassAptitudes = Object.fromEntries(STAT_KEYS.map((stat) => [
    stat,
    roundHalfUp((promotedLevel - 1) * currentClassGrowths[stat] / 100),
  ])) as unknown as StatBlock;
  return addStats(promotion.classBaseStats, childAptitudes, promotedClassAptitudes);
}

function promotedWeaponRanks(
  recruitment: OffspringRecruitment,
  promotion: OffspringPromotion,
  chapter: number,
): Record<string, string> {
  const milestone = recruitment.offspringSeal.weaponRankMilestones.find(
    (entry) => chapter >= entry.chapterStart && chapter <= entry.chapterEnd,
  );
  if (!milestone) return {};
  return {
    [promotion.primaryWeaponId]: milestone.primaryRank,
    ...Object.fromEntries(promotion.secondaryWeaponIds.map((weaponTypeId) => [weaponTypeId, milestone.secondaryRank])),
  };
}

function resolveWeaponLevels(
  rankCaps: Record<string, string>,
  currentRanks: Record<string, string>,
  currentProgress: Record<string, ResolvedWeaponLevel["progress"]>,
  runtime: Fe14Runtime,
): ResolvedWeaponLevel[] {
  const weaponTypeOrder = new Map(runtime.weaponTypes.map((weaponType) => [weaponType.id, weaponType.displayOrder]));
  const weaponTypeById = new Map(runtime.weaponTypes.map((weaponType) => [weaponType.id, weaponType]));
  return Object.entries(rankCaps)
    .sort(([left], [right]) => (weaponTypeOrder.get(left) ?? 999) - (weaponTypeOrder.get(right) ?? 999))
    .map(([weaponTypeId, rankCap]) => {
      const weaponType = weaponTypeById.get(weaponTypeId);
      if (!weaponType) throw new Error(`Missing canonical weapon type ${weaponTypeId}.`);
      return {
        weaponTypeId,
        label: weaponType.names.en,
        iconAssetId: weaponType.iconAssetId,
        currentRank: currentRanks[weaponTypeId] ?? null,
        rankCap,
        progress: currentProgress[weaponTypeId] ?? null,
      };
    });
}

function routeJoinFor(
  scenario: UnitRuntime["availability"][number],
  routeId: RouteId,
) {
  const join = scenario.routeJoins.find((entry) => entry.route === routeId);
  if (!join) throw new Error(`Availability ${scenario.id} has no ${routeId} route join.`);
  return { chapter: join.chapter, timing: join.timing, ...(join.turn ? { turn: join.turn } : {}) };
}

function baseStatsForAvailability(unit: UnitRuntime, availabilityId: string) {
  return unit.baseStats.find((record) =>
    record.availabilityId === availabilityId || record.availabilityIds?.includes(availabilityId),
  );
}

function classifyState(
  scenario: UnitRuntime["availability"][number],
  routeId: RouteId,
  routeScenarios: UnitRuntime["availability"],
): AvailabilityStateKind {
  const label = String(scenario.scenarioLabel ?? scenario.id).toLowerCase();
  if (label.includes("rejoin") || label.includes("return")) return "rejoin";
  if (scenario.retentionCondition) return "conditional";
  const hasLaterState = routeScenarios.some((candidate) =>
    candidate.id !== scenario.id && routeJoinFor(candidate, routeId).chapter > routeJoinFor(scenario, routeId).chapter,
  );
  const departsOnRoute = scenario.temporaryDeparture?.routes.includes(routeId) ?? false;
  if (
    label.includes("appearance") ||
    label.includes("guest") ||
    ((label.includes("early") || label.includes("pre-route")) && (hasLaterState || departsOnRoute)) ||
    (hasLaterState && departsOnRoute)
  ) {
    return "appearance";
  }
  return "join";
}

function availabilityLabel(
  scenario: UnitRuntime["availability"][number],
  kind: AvailabilityStateKind,
): string {
  if (scenario.scenarioLabel) return scenario.scenarioLabel;
  if (scenario.avatarGender) return `${capitalize(scenario.avatarGender)} Corrin`;
  return capitalize(kind);
}

function joinLabel(join: { chapter: number; timing: string; turn?: number }): string {
  if (join.chapter === 0) return "Prologue";
  if (join.turn) return `Chapter ${join.chapter}, turn ${join.turn}`;
  return `Chapter ${join.chapter}, ${join.timing}`;
}

function resolveStartingSkills(
  unit: UnitRuntime,
  classId: string,
  level: number,
  startingSkillOverrideIds: string[],
  runtime: Fe14Runtime,
  gender?: "male" | "female",
): { resolved: ResolvedStartingSkill[]; unresolved: string[] } {
  const derivableSkills = runtime.classSkills
    .map((skill) => ({
      skill,
      acquisition: skill.acquisition.find((edge) => (
        edge.classId === classId && edge.level <= level && (!edge.gender || edge.gender === gender)
      )),
    }))
    .filter((entry): entry is { skill: Fe14Runtime["classSkills"][number]; acquisition: NonNullable<typeof entry.acquisition> } => Boolean(entry.acquisition))
    .sort((left, right) => left.acquisition.level - right.acquisition.level);
  const orderedIds: Array<{
    skillId: string;
    source: "scenario_override" | "current_class";
    acquisition?: { classId: string; level: number; gender?: "male" | "female" };
  }> = [
    ...startingSkillOverrideIds.map((skillId) => ({ skillId, source: "scenario_override" as const })),
    ...derivableSkills.map(({ skill, acquisition }) => ({ skillId: skill.id, source: "current_class" as const, acquisition })),
  ].filter((entry, index, values) => values.findIndex((candidate) => candidate.skillId === entry.skillId) === index);
  const resolved: ResolvedStartingSkill[] = [];
  const unresolved: string[] = [];
  if (unit.personalSkill) {
    resolved.push({
      skillId: unit.personalSkill.id,
      kind: "personal",
      source: "personal",
      guaranteed: true,
      name: unit.personalSkill.names.en,
      description: unit.personalSkill.effect,
      iconAssetId: unit.personalSkill.iconAssetId,
    });
  }
  for (const { skillId, source, acquisition: currentClassAcquisition } of orderedIds) {
    const classSkill = runtime.classSkills.find((skill) => skill.id === skillId);
    if (!classSkill) {
      unresolved.push(skillId);
      continue;
    }
    const acquisition = currentClassAcquisition
      ?? resolveHistoricalSkillAcquisition(classSkill.acquisition, classId, runtime, gender);
    const sourceClassName = acquisition ? classDisplayName(acquisition.classId, runtime) : undefined;
    resolved.push({
      skillId,
      kind: "class",
      source,
      ...(acquisition ? {
        sourceClassId: acquisition.classId,
        sourceClassName,
        acquiredLevel: acquisition.level,
      } : {}),
      guaranteed: true,
      name: classSkill.names.en,
      description: classSkill.description,
      iconAssetId: classSkill.iconAssetId,
    });
  }
  return { resolved, unresolved };
}

function resolveHistoricalSkillAcquisition(
  acquisitions: Array<{ classId: string; level: number; gender?: "male" | "female" }>,
  currentClassId: string,
  runtime: Fe14Runtime,
  gender?: "male" | "female",
) {
  const compatible = acquisitions.filter((edge) => !edge.gender || edge.gender === gender);
  const baseClassIds = new Set(runtime.classTrees
    .filter((tree) => tree.promotions.some((promotion) => promotion.id === currentClassId))
    .map((tree) => tree.id));
  return compatible.find((edge) => baseClassIds.has(edge.classId))
    ?? compatible.find((edge) => edge.classId === currentClassId)
    ?? compatible[0]
    ?? acquisitions[0];
}

function classDisplayName(classId: string, runtime: Fe14Runtime): string {
  return runtime.classStats.find((profile) => profile.classId === classId)?.displayName
    ?? runtime.classTrees.find((tree) => tree.id === classId)?.label
    ?? runtime.classTrees.flatMap((tree) => tree.promotions).find((promotion) => promotion.id === classId)?.label
    ?? displayId(classId);
}

function resolveCapModifiers(
  unit: UnitRuntime,
  selection: UnitBaseConfigurationSelection,
): Partial<Omit<StatBlock, "hp">> {
  const base: Partial<Omit<StatBlock, "hp">> = unit.capModifiers?.modifiers ?? {};
  if (unit.identity.id !== "corrin") return base;
  return Object.fromEntries(
    STAT_KEYS.filter((stat) => stat !== "hp").map((stat) => [
      stat,
      (base[stat] ?? 0) + (selection.boon?.capDeltas[stat] ?? 0) + (selection.bane?.capDeltas[stat] ?? 0),
    ]),
  );
}

function resolveStances(
  unit: UnitRuntime,
  selection: UnitBaseConfigurationSelection,
): { attackStance: ResolvedStance; guardStance: ResolvedStance } {
  if (unit.identity.id !== "corrin") {
    return {
      attackStance: stanceFrom(unit.pairupBonuses?.attackStance),
      guardStance: stanceFrom(unit.pairupBonuses?.guardStance),
    };
  }
  const rule = unit.avatarConfiguration?.pairupRule;
  const attack = rule?.attackStance.variants.find(
    (variant) => variant.boonIds.includes(selection.boon?.id ?? "") && variant.baneIds.includes(selection.bane?.id ?? ""),
  );
  const guard = rule?.guardStance.variants.find(
    (variant) => variant.boonId === selection.boon?.id && variant.baneId === selection.bane?.id,
  );
  return {
    attackStance: { baseBonus: rule?.attackStance.baseBonus ?? {}, rankDeltas: attack?.rankDeltas ?? emptyRankDeltas() },
    guardStance: { baseBonus: rule?.guardStance.baseBonus ?? {}, rankDeltas: guard?.rankDeltas ?? emptyRankDeltas() },
  };
}

function stanceFrom(stance?: StanceBonuses): ResolvedStance {
  return {
    baseBonus: stance?.baseBonus ?? {},
    rankDeltas: stance?.rankDeltas ?? emptyRankDeltas(),
  };
}

function emptyRankDeltas(): Record<string, Record<string, number>> {
  return { C: {}, B: {}, A: {}, S: {} };
}

function scenarioNotes(
  unit: UnitRuntime,
  scenario: UnitRuntime["availability"][number],
  routeId: RouteId,
): string[] {
  const notes: string[] = [];
  if (scenario.temporarilyLeavesAfterChapter !== undefined) {
    notes.push(
      `${unit.identity.displayName} leaves after Chapter ${scenario.temporarilyLeavesAfterChapter} and returns in Chapter ${scenario.returnsChapter}.`,
    );
  }
  if (scenario.temporaryDeparture?.routes.includes(routeId)) {
    const returning = scenario.temporaryDeparture.returns.find((entry) => entry.route === routeId);
    notes.push(returning
      ? `${unit.identity.displayName} leaves after Chapter ${scenario.temporaryDeparture.afterChapter} and returns in Chapter ${returning.chapter} (${returning.timing}).`
      : routeId === "conquest"
        ? `Warning: ${unit.identity.displayName} is not a permanent unit on Conquest and leaves after Chapter ${scenario.temporaryDeparture.afterChapter} without rejoining.`
        : `${unit.identity.displayName} leaves after Chapter ${scenario.temporaryDeparture.afterChapter} on this route.`);
  }
  if (scenario.retentionCondition?.route === routeId) notes.push(scenario.retentionCondition.note);
  if (scenario.chapter5Carryover) notes.push(scenario.chapter5Carryover.note);
  if (scenario.autoLevel) notes.push(scenario.autoLevel.note);
  if (scenario.myCastleRecruitment) notes.push(scenario.myCastleRecruitment.note);
  if (scenario.dlcRecruitment) notes.push(scenario.dlcRecruitment.npcScaling.note);
  return notes;
}

function addStats(base: StatBlock, ...deltas: Array<Partial<StatBlock> | undefined>): StatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [
      stat,
      deltas.reduce((value, delta) => value + (delta?.[stat] ?? 0), base[stat]),
    ]),
  ) as unknown as StatBlock;
}

function emptyStats(): StatBlock {
  return { hp: 0, strength: 0, magic: 0, skill: 0, speed: 0, luck: 0, defense: 0, resistance: 0 };
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

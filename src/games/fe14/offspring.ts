import { fe14Data, type AvatarChoice, type StatBlock, type StanceBonuses, type UnitRuntime, type VariableParentOption } from "./data";

const STAT_KEYS: Array<keyof StatBlock> = [
  "hp", "strength", "magic", "skill", "speed", "luck", "defense", "resistance",
];
const INHERITANCE_RESTRICTED = new Set(["songstress", "kitsune", "wolfskin"]);
const PARALLEL_CLASS: Record<string, string> = {
  cavalier: "ninja",
  knight: "spear_fighter",
  fighter: "oni_savage",
  mercenary: "samurai",
  outlaw: "archer",
  samurai: "mercenary",
  oni_savage: "fighter",
  spear_fighter: "knight",
  diviner: "dark_mage",
  sky_knight: "wyvern_rider",
  archer: "outlaw",
  wyvern_rider: "sky_knight",
  ninja: "cavalier",
  dark_mage: "diviner",
  wolfskin: "outlaw",
  kitsune: "apothecary",
  songstress: "troubadour",
  villager: "apothecary",
};

export interface OffspringScenario {
  fixedParent: UnitRuntime;
  variableParent: UnitRuntime;
  father: UnitRuntime;
  mother: UnitRuntime;
  childGender?: "female" | "male";
  unitTags: Array<"dragon" | "beast">;
  personalGrowth: StatBlock;
  variableParentGrowth: StatBlock;
  capModifiers: Omit<StatBlock, "hp">;
  inheritedClassId: string | null;
  fixedInheritedClassId: string | null;
  nestedVariableParentOptions: VariableParentOption[];
  nestedVariableParentId?: string;
  nestedVariableParentScenario?: OffspringScenario;
  siblingUnitId?: string;
  bonuses: {
    attackStance: { baseBonus: Record<string, number>; rankDeltas: Record<string, Record<string, number>> };
    guardStance: { baseBonus: Record<string, number>; rankDeltas: Record<string, Record<string, number>> };
  };
}

export interface OffspringScenarioSelection {
  corrinTalentId?: string;
  nestedVariableParentId?: string;
}

export interface OffspringRecruitmentStatCalculation {
  fatherSurplus: number;
  motherSurplus: number;
  quarteredSurplus: number;
  inheritanceCap: number;
  inheritanceBonus: number;
  finalStat: number;
}

export function calculateOffspringRecruitmentStat({
  childAptitude,
  promotedClassAptitude,
  fatherCurrentStat,
  motherCurrentStat,
  currentClassBase,
}: {
  childAptitude: number;
  promotedClassAptitude: number;
  fatherCurrentStat: number;
  motherCurrentStat: number;
  currentClassBase: number;
}): OffspringRecruitmentStatCalculation {
  const inheritanceBenchmark = childAptitude + promotedClassAptitude;
  const fatherSurplus = Math.max(0, fatherCurrentStat - inheritanceBenchmark);
  const motherSurplus = Math.max(0, motherCurrentStat - inheritanceBenchmark);
  const quarteredSurplus = Math.floor((fatherSurplus + motherSurplus) / 4);
  const inheritanceCap = Math.floor(2 + childAptitude / 10);
  const inheritanceBonus = Math.min(quarteredSurplus, inheritanceCap);
  return {
    fatherSurplus,
    motherSurplus,
    quarteredSurplus,
    inheritanceCap,
    inheritanceBonus,
    finalStat: currentClassBase + inheritanceBenchmark + inheritanceBonus,
  };
}

export function roundHalfUp(value: number) {
  return Math.floor(value + 0.5);
}

export function resolveOffspringScenario(
  child: UnitRuntime,
  variableParentId: string,
  corrinBoon?: AvatarChoice,
  corrinBane?: AvatarChoice,
  selection: OffspringScenarioSelection = {},
): OffspringScenario | null {
  const parentage = child.offspring?.parentage;
  const option = parentage?.variableParentOptions.find((candidate) => candidate.unitId === variableParentId);
  const variableParent = fe14Data.units.find((unit) => unit.identity.id === variableParentId);
  const fixedParent = fe14Data.units.find((unit) => unit.identity.id === parentage?.fixedParentUnitId);
  if (!parentage || !option || !variableParent || !fixedParent) return null;

  const childGender = option.childGender ?? (child.identity.gender === "female" || child.identity.gender === "male" ? child.identity.gender : undefined);
  const variableParentRole = parentage.variableParentRole === "parent"
    ? childGender === "male" ? "father" : "mother"
    : parentage.variableParentRole;
  const father = variableParentRole === "father" ? variableParent : fixedParent;
  const mother = variableParentRole === "mother" ? variableParent : fixedParent;

  const nestedVariableParentOptions = variableParent.offspring
    ? variableParent.offspring.parentage.variableParentOptions.filter((candidate) => (
      candidate.unitId !== "corrin" && candidate.routes.some((route) => option.routes.includes(route))
    ))
    : [];
  const nestedVariableParentId = nestedVariableParentOptions.some((candidate) => candidate.unitId === selection.nestedVariableParentId)
    ? selection.nestedVariableParentId
    : nestedVariableParentOptions[0]?.unitId;
  const nestedVariableParentScenario = nestedVariableParentId
    ? resolveOffspringScenario(variableParent, nestedVariableParentId) ?? undefined
    : undefined;

  const variableParentGrowth = nestedVariableParentScenario?.personalGrowth
    ?? avatarAdjustedGrowth(variableParent, corrinBoon, corrinBane);
  const variableParentCaps = nestedVariableParentScenario?.capModifiers
    ?? avatarAdjustedCaps(variableParent, corrinBoon, corrinBane);
  const fixedParentCaps = avatarAdjustedCaps(fixedParent, corrinBoon, corrinBane);
  const personalGrowth = Object.fromEntries(
    STAT_KEYS.map((stat) => [stat, Math.floor((parentage.childBaseGrowth[stat] + variableParentGrowth[stat]) / 2)]),
  ) as unknown as StatBlock;
  const generationBonus = parentage.scenarioKind === "avatar_child" && option.parentGeneration === "second" ? 0 : 1;
  const capModifiers = Object.fromEntries(
    STAT_KEYS.filter((stat) => stat !== "hp").map((stat) => [
      stat,
      (fixedParentCaps[stat] ?? 0) + (variableParentCaps[stat] ?? 0) + generationBonus,
    ]),
  ) as Omit<StatBlock, "hp">;

  const fixedParentStance = stanceForParent(fixedParent, corrinBoon, corrinBane);
  const variableParentStance = nestedVariableParentScenario?.bonuses
    ?? stanceForParent(variableParent, corrinBoon, corrinBane);
  const fatherStance = variableParentRole === "father" ? variableParentStance : fixedParentStance;
  const motherStance = variableParentRole === "mother" ? variableParentStance : fixedParentStance;
  const variableParentTags = nestedVariableParentScenario?.unitTags ?? variableParent.identity.unitTags ?? [];
  const unitTags = [...new Set([
    ...(child.identity.unitTags ?? []),
    ...(fixedParent.identity.unitTags ?? []),
    ...variableParentTags,
  ])];

  let inheritedClassId: string | null = option.inheritedClassId;
  let fixedInheritedClassId: string | null = option.fixedInheritedClassId ?? parentage.fixedInheritedClassId;
  if (parentage.scenarioKind === "avatar_child" && childGender && option.inheritanceClassCandidates) {
    const talent = fixedParent.avatarConfiguration?.talents.find((candidate) => candidate.id === selection.corrinTalentId)
      ?? fixedParent.avatarConfiguration?.talents[0];
    const talentClassId = talent?.classId ?? talent?.classIdByGender?.[childGender];
    const corrinCandidates = talentClassId
      ? { primaryClassId: "nohr_prince", secondaryClassId: talentClassId }
      : { primaryClassId: "nohr_prince" };
    const owned = new Set<string>([parentage.childBaseClassId]);
    if (childGender === "female") {
      fixedInheritedClassId = resolveInheritedClass(corrinCandidates, owned, childGender);
      if (fixedInheritedClassId) owned.add(fixedInheritedClassId);
      inheritedClassId = resolveInheritedClass(option.inheritanceClassCandidates, owned, childGender);
    } else {
      inheritedClassId = resolveInheritedClass(option.inheritanceClassCandidates, owned, childGender);
      if (inheritedClassId) owned.add(inheritedClassId);
      fixedInheritedClassId = resolveInheritedClass(corrinCandidates, owned, childGender);
    }
  }

  return {
    fixedParent,
    variableParent,
    father,
    mother,
    childGender,
    unitTags,
    personalGrowth,
    variableParentGrowth,
    capModifiers,
    inheritedClassId,
    fixedInheritedClassId,
    nestedVariableParentOptions,
    nestedVariableParentId,
    nestedVariableParentScenario,
    siblingUnitId: option.siblingUnitId,
    bonuses: {
      attackStance: {
        baseBonus: { hit: 10 },
        rankDeltas: {
          C: motherStance.attackStance.rankDeltas.C,
          B: fatherStance.attackStance.rankDeltas.B,
          A: motherStance.attackStance.rankDeltas.A,
          S: fatherStance.attackStance.rankDeltas.S,
        },
      },
      guardStance: {
        baseBonus: { criticalAvoid: 5 },
        rankDeltas: {
          C: fatherStance.guardStance.rankDeltas.C,
          B: motherStance.guardStance.rankDeltas.B,
          A: fatherStance.guardStance.rankDeltas.A,
          S: motherStance.guardStance.rankDeltas.S,
        },
      },
    },
  };
}

function resolveInheritedClass(
  candidates: { primaryClassId: string; secondaryClassId?: string },
  owned: Set<string>,
  gender: "female" | "male",
): string | null {
  const primary = genderParallelClass(candidates.primaryClassId, gender);
  const secondary = candidates.secondaryClassId ? genderParallelClass(candidates.secondaryClassId, gender) : undefined;
  if (!INHERITANCE_RESTRICTED.has(candidates.primaryClassId) && !owned.has(primary)) return primary;
  if (secondary && !owned.has(secondary)) return secondary;
  const parallelBasis = INHERITANCE_RESTRICTED.has(candidates.primaryClassId) ? primary : secondary ?? primary;
  const parallel = PARALLEL_CLASS[parallelBasis];
  return parallel && !owned.has(parallel) ? genderParallelClass(parallel, gender) : null;
}

function genderParallelClass(classId: string, gender: "female" | "male") {
  if (classId === "shrine_maiden" && gender === "male") return "monk";
  if (classId === "monk" && gender === "female") return "shrine_maiden";
  return classId;
}

function avatarAdjustedGrowth(unit: UnitRuntime, boon?: AvatarChoice, bane?: AvatarChoice): StatBlock {
  const base = unit.growths[0]?.rates ?? emptyStats();
  if (unit.identity.id !== "corrin") return base;
  return addStats(base, boon?.growthDeltas, bane?.growthDeltas);
}

function avatarAdjustedCaps(unit: UnitRuntime, boon?: AvatarChoice, bane?: AvatarChoice): Partial<StatBlock> {
  const base = unit.capModifiers?.modifiers ?? {};
  if (unit.identity.id !== "corrin") return base;
  return addStats({ ...emptyStats(), ...base }, boon?.capDeltas, bane?.capDeltas);
}

function stanceForParent(unit: UnitRuntime, boon?: AvatarChoice, bane?: AvatarChoice) {
  if (unit.identity.id !== "corrin") {
    return {
      attackStance: unit.pairupBonuses?.attackStance ?? emptyStance(),
      guardStance: unit.pairupBonuses?.guardStance ?? emptyStance(),
    };
  }
  const config = unit.avatarConfiguration;
  const attack = config?.pairupRule.attackStance.variants.find(
    (variant) => variant.boonIds.includes(boon?.id ?? "") && variant.baneIds.includes(bane?.id ?? ""),
  );
  const guard = config?.pairupRule.guardStance.variants.find(
    (variant) => variant.boonId === boon?.id && variant.baneId === bane?.id,
  );
  return {
    attackStance: { baseBonus: config?.pairupRule.attackStance.baseBonus ?? {}, rankDeltas: attack?.rankDeltas ?? emptyStance().rankDeltas },
    guardStance: { baseBonus: config?.pairupRule.guardStance.baseBonus ?? {}, rankDeltas: guard?.rankDeltas ?? emptyStance().rankDeltas },
  };
}

function addStats(base: StatBlock, ...deltas: Array<Partial<StatBlock> | undefined>): StatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [stat, deltas.reduce((value, delta) => value + (delta?.[stat] ?? 0), base[stat])]),
  ) as unknown as StatBlock;
}

function emptyStats(): StatBlock {
  return { hp: 0, strength: 0, magic: 0, skill: 0, speed: 0, luck: 0, defense: 0, resistance: 0 };
}

function emptyStance(): Pick<StanceBonuses, "baseBonus" | "rankDeltas"> {
  return { baseBonus: {}, rankDeltas: { C: {}, B: {}, A: {}, S: {} } };
}

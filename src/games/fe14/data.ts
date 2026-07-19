import runtimeJson from "../../../data/runtime/fe14/units.json";
import annaPortrait from "./assets/character_portraits/Anna.png";
import arthurPortrait from "./assets/character_portraits/Harold.png";
import azamaPortrait from "./assets/character_portraits/Asama.png";
import azuraPortrait from "./assets/character_portraits/Aqua.png";
import bennyPortrait from "./assets/character_portraits/Benoit.png";
import berukaPortrait from "./assets/character_portraits/Belka.png";
import camillaPortrait from "./assets/character_portraits/Camilla.png";
import charlottePortrait from "./assets/character_portraits/Charlotte.png";
import corrinPortrait from "./assets/character_portraits/Kamui.png";
import corrinFemalePortrait from "./assets/character_portraits/Kamui2.png";
import effiePortrait from "./assets/character_portraits/Elfie.png";
import elisePortrait from "./assets/character_portraits/Elise.png";
import feliciaPortrait from "./assets/character_portraits/Felicia.png";
import floraPortrait from "./assets/character_portraits/Flora.png";
import fugaPortrait from "./assets/character_portraits/Fuuga.png";
import gunterPortrait from "./assets/character_portraits/Gunter.png";
import hanaPortrait from "./assets/character_portraits/Kazahana.png";
import hayatoPortrait from "./assets/character_portraits/Tsukuyomi.png";
import hinataPortrait from "./assets/character_portraits/Hinata.png";
import hinokaPortrait from "./assets/character_portraits/Hinoka.png";
import izanaPortrait from "./assets/character_portraits/Izana.png";
import jakobPortrait from "./assets/character_portraits/Joker.png";
import kadenPortrait from "./assets/character_portraits/Nishiki.png";
import kageroPortrait from "./assets/character_portraits/Kagerou.png";
import kazePortrait from "./assets/character_portraits/Suzukaze.png";
import keatonPortrait from "./assets/character_portraits/Flannel.png";
import laslowPortrait from "./assets/character_portraits/Lazward.png";
import leoPortrait from "./assets/character_portraits/Leon.png";
import mozuPortrait from "./assets/character_portraits/Mozume.png";
import nilesPortrait from "./assets/character_portraits/Zero.png";
import nyxPortrait from "./assets/character_portraits/Nyx.png";
import oboroPortrait from "./assets/character_portraits/Oboro.png";
import odinPortrait from "./assets/character_portraits/Odin.png";
import orochiPortrait from "./assets/character_portraits/Orochi.png";
import periPortrait from "./assets/character_portraits/Pieri.png";
import reinaPortrait from "./assets/character_portraits/Yuugiri.png";
import rinkahPortrait from "./assets/character_portraits/Rinka.png";
import ryomaPortrait from "./assets/character_portraits/Ryouma.png";
import saizoPortrait from "./assets/character_portraits/Saizou.png";
import sakuraPortrait from "./assets/character_portraits/Sakura.png";
import scarletPortrait from "./assets/character_portraits/Crimson.png";
import selenaPortrait from "./assets/character_portraits/Luna.png";
import setsunaPortrait from "./assets/character_portraits/Setsuna.png";
import shuraPortrait from "./assets/character_portraits/Ashura.png";
import silasPortrait from "./assets/character_portraits/Silas.png";
import subakiPortrait from "./assets/character_portraits/Tsubaki.png";
import takumiPortrait from "./assets/character_portraits/Takumi.png";
import xanderPortrait from "./assets/character_portraits/Marx.png";
import yukimuraPortrait from "./assets/character_portraits/Yukimura.png";
import dwyerPortrait from "./assets/character_portraits/Deere.png";
import kanaPortrait from "./assets/character_portraits/Kanna.png";
import kanaMalePortrait from "./assets/character_portraits/Kanna2.webp";
import shigurePortrait from "./assets/character_portraits/Shigure.png";
import sophiePortrait from "./assets/character_portraits/Sophie.png";
import midoriPortrait from "./assets/character_portraits/Midoriko.png";
import shiroPortrait from "./assets/character_portraits/Shinonome.png";
import kiragiPortrait from "./assets/character_portraits/Kisaragi.png";
import asugiPortrait from "./assets/character_portraits/Grey.png";
import selkiePortrait from "./assets/character_portraits/Kinu.png";
import hisamePortrait from "./assets/character_portraits/Hisame.png";
import mitamaPortrait from "./assets/character_portraits/Mitama.png";
import caeldoriPortrait from "./assets/character_portraits/Matoi.png";
import rhajatPortrait from "./assets/character_portraits/Shara.png";
import siegbertPortrait from "./assets/character_portraits/Siegbert.png";
import forrestPortrait from "./assets/character_portraits/Foleo.png";
import ignatiusPortrait from "./assets/character_portraits/Ignis.png";
import velouriaPortrait from "./assets/character_portraits/Velour.png";
import percyPortrait from "./assets/character_portraits/Lutz.png";
import opheliaPortrait from "./assets/character_portraits/Ophelia.png";
import soleilPortrait from "./assets/character_portraits/Soleil.png";
import ninaPortrait from "./assets/character_portraits/Eponine.png";

export interface SourceRef {
  sourceId: string;
  locator: string;
  fields: string[];
  reviewStatus: string;
}

export interface UnitIdentity {
  id: string;
  unitNo: number;
  processingOrder: number;
  availableRoutes: string[];
  availabilityCategory?: "dlc_exclusive";
  slug: string;
  displayName: string;
  portraitFile: string;
  sourceSheet: string;
  status: string;
  names?: { en: string; ja: string; jaLatn: string; zhHans: string };
  gender?: string;
  dragonVein?: boolean;
  unitTags?: Array<"dragon" | "beast">;
  personalSkillId?: string;
  notes?: string[];
  supportNotes?: string[];
  generation: "first" | "second";
  paralogueNo?: number;
  paralogueTitle?: string;
  fixedParentUnitId?: string;
}

export interface StatBlock {
  hp: number;
  strength: number;
  magic: number;
  skill: number;
  speed: number;
  luck: number;
  defense: number;
  resistance: number;
}

export interface AvatarChoice {
  id: string;
  label: string;
  stat: keyof StatBlock;
  baseDeltas: Partial<StatBlock>;
  growthDeltas: Partial<StatBlock>;
  capDeltas: Partial<Omit<StatBlock, "hp">>;
}

export interface AvatarConfiguration {
  unitId: "corrin";
  defaultName: string;
  genderOptions: ["male", "female"];
  boons: AvatarChoice[];
  banes: AvatarChoice[];
  talents: Array<{
    id: string;
    label: string;
    classId?: string;
    classIdByGender?: { male: string; female: string };
  }>;
  routePromotions: Record<"birthright" | "conquest" | "revelation", string[]>;
  friendshipSealRule: {
    requiredRank: "A";
    requiresSameGender: true;
    commitsToSingleFriend: false;
    bottleneck: "missable_class_access";
    note: string;
  };
  pairupRule: {
    variableBy: ["boon", "bane"];
    note: string;
    attackStance: {
      reviewStatus: "accepted";
      semantics: string;
      baseBonus: Record<string, number>;
      variants: Array<{
        boonIds: string[];
        baneIds: string[];
        rankDeltas: Record<string, Record<string, number>>;
      }>;
    };
    guardStance: {
      reviewStatus: "accepted";
      semantics: string;
      baseBonus: Record<string, number>;
      variants: Array<{
        boonId: string;
        baneId: string;
        rankDeltas: Record<string, Record<string, number>>;
      }>;
    };
  };
  provenance: SourceRef[];
}

export interface UnitRuntime {
  identity: UnitIdentity;
  availability: Array<Record<string, unknown> & {
    id: string;
    scenarioLabel?: string;
    avatarGender?: string;
    routeJoins: Array<{ route: string; chapter: number; timing: string; turn?: number }>;
    level: number;
    classId: string;
    gainsExperience?: boolean;
    myCastleRecruitment?: {
      facilityId?: string;
      facilityIds?: string[];
      facilityLevel: number;
      refreshMethods: Array<"real_time" | "map_completion">;
      note: string;
    };
    dlcRecruitment?: {
      mapId: string;
      mapName: string;
      accessRequirement: "dragon_gate_unlocked";
      recruitmentTiming: "first_clear";
      recruitedUnitScaling: "fixed";
      npcScaling: {
        basis: "displayed_story_chapter";
        minimumLevel: number;
        maximumLevel: number;
        earliestChapter: number;
        latestChapter: number;
        carriesIntoRecruitedUnit: false;
        note: string;
      };
    };
    autoLevel?: {
      basis: "map_level";
      internalLevel: number;
      minimumLevel: number;
      maximumLevel?: number;
      milestones: Array<{
        displayedChapterStart: number;
        displayedChapterEnd?: number;
        mapLevel: number;
        level: number;
      }>;
      levelFormula: "stat_base_level + max(0, map_level - internal_level), capped_at_maximum_level";
      statCalculation: "average_growths_round_half_up";
      statBaseLevel: number;
      growthClassId: string;
      skillsLearnedAutomatically: boolean;
      modelBasis: "map_level_autolevel";
      weaponProficiencyScales: boolean;
      weaponProficiencyMilestonesStatus: "unresolved";
      evidenceStatus: "tested" | "partial" | "accepted";
      note: string;
    };
    inventory: string[];
    inventoryByDifficulty?: {
      normal: string[];
      hard: string[];
      lunatic: string[];
    };
    temporarilyLeavesAfterChapter?: number;
    permanentlyLeavesAfterChapter?: number;
    returnsChapter?: number;
    temporaryDeparture?: {
      afterChapter: number;
      routes: string[];
      returns: Array<{ route: string; chapter: number; timing: string }>;
    };
    retentionCondition?: {
      route: string;
      afterChapter: number;
      requirement: { kind: "support_rank"; partnerUnitId: string; minimumRank: string };
      onFailure: "permanent_departure";
      note: string;
    };
    chapter5Carryover?: {
      sourceAvailabilityId: string;
      checkpoint: "end_of_chapter_5";
      levelCalculation: string;
      statCalculation: string;
      weaponProficiencyCalculation?: string;
      note: string;
    };
  }>;
  baseStats: Array<Record<string, unknown> & {
    availabilityId?: string;
    availabilityIds?: string[];
    level: number;
    classId: string;
    stats: StatBlock;
    weaponRanks: Record<string, string>;
    weaponRanksByAvailability?: Record<string, Record<string, string>>;
    weaponRankProgress?: Record<string, { towardRank: string; barFraction: number; precision: "exact" | "approximate" }>;
    weaponRankProgressByAvailability?: Record<string, Record<string, { towardRank: string; barFraction: number; precision: "exact" | "approximate" }>>;
    startingSkillOverrideIds?: string[];
    chapter5Carryover?: {
      sourceAvailabilityId: string;
      checkpoint: "end_of_chapter_5";
      levelCalculation: string;
      statCalculation: string;
      weaponProficiencyCalculation?: string;
      fixedStatAdjustments?: Partial<StatBlock>;
      note: string;
    };
  }>;
  growths: Array<Record<string, unknown> & { rates: StatBlock }>;
  capModifiers: (Record<string, unknown> & { modifiers: Omit<StatBlock, "hp"> }) | null;
  avatarConfiguration: AvatarConfiguration | null;
  pairupBonuses: (Record<string, unknown> & { attackStance: StanceBonuses; guardStance: StanceBonuses }) | null;
  supports: Array<Record<string, unknown> & {
    id: string;
    partnerUnitId: string;
    partnerGender?: "female" | "male";
    kind: string;
    routes: string[];
  }>;
  classAccess: (Record<string, unknown> & { startingClassId: string; baseClassSet: string[]; heartSealClassSet: string[]; corrinTalentOnlyClassSet: string[]; sealGrants: SealGrant[] }) | null;
  personalSkill: (Record<string, unknown> & {
    id: string;
    names: { en: string };
    effect: string;
    iconAssetId: string;
  }) | null;
  offspring: OffspringData | null;
}

export interface VariableParentOption {
  unitId: string;
  routes: string[];
  inheritedClassId: string;
  inheritedClassReason: "direct" | "duplicate_primary_fallback" | "restricted_primary_fallback" | "parallel_class_fallback" | "gender_parallel";
  childGender?: "female" | "male";
  parentGeneration?: "first" | "second";
  inheritanceClassCandidates?: {
    primaryClassId: string;
    secondaryClassId?: string;
  };
  fixedInheritedClassId?: string;
  fixedInheritedClassReason?: "direct" | "duplicate_primary_fallback" | "restricted_primary_fallback" | "parallel_class_fallback" | "gender_parallel";
  siblingUnitId?: string;
}

export interface OffspringData {
  parentage: {
    fixedParentUnitId: string;
    variableParentRole: "mother" | "father" | "parent";
    scenarioKind?: "standard" | "avatar_child";
    variableParentOptions: VariableParentOption[];
    fixedInheritedClassId: string;
    childBaseClassId: string;
    childBaseGrowth: StatBlock;
    notes?: string[];
    formulas: Record<string, unknown>;
    supports: Array<{
      partnerUnitId: string;
      partnerGender?: "female" | "male";
      unitGender?: "female" | "male";
      kind: "romantic" | "friendship" | "platonic" | "family";
      ranks: string[];
      routes: string[];
      condition: "always" | "selected_variable_parent" | "selected_sibling";
      sealGrant?: {
        seal: "friendship" | "partner";
        borrowedClassId: string;
        grantedClassId: string;
        resolution: "direct" | "duplicate_primary_fallback" | "restricted_primary_fallback" | "parallel_class_fallback" | "gender_parallel" | "variable";
        classCandidates?: {
          primaryClassId: string;
          secondaryClassId?: string;
        };
      };
    }>;
  };
  recruitment: {
    paralogueNo: number;
    paralogueTitle: string;
    initialFaction: "player" | "npc" | "enemy" | "not_deployed";
    recruitment: {
      description: string;
      talkUnitId?: string;
      automaticAtMapEndIfSurvives: boolean;
      deathBeforeRecruitmentIsPermanent: boolean;
    };
    recruitmentNotes?: string[];
    startingClassId: string;
    level10PersonalBases: StatBlock;
    level10MinimumStatsBeforeInheritance: StatBlock;
    weaponRanks: Record<string, string>;
    inventory: string[];
    baseStatFormula: {
      childAptitude: string;
      promotedClassAptitude: string;
      parentInheritanceValue: string;
      parentStatInput: string;
      inheritanceBonus: string;
      finalStat: string;
      rounding: string;
      offspringSealNote: string;
    };
    levelByStoryPosition: Array<{ chapterStart: number; chapterEnd?: number; level: number }>;
    mapLevelScaling: {
      basis: "map_level";
      internalLevel: 10;
      unpromotedLevelFormula: "max(10, map_level)";
      promotedInternalLevelOffset: 20;
      offspringSealLevelFormula: "map_level - promoted_internal_level_offset";
      knownMapLevelsByChapter: Record<string, number>;
      note: string;
    };
    offspringSeal: {
      availableFromChapter: 19;
      promotedLevelsByChapter: Record<string, number>;
      promotionOptions: Array<{
        classId: string;
        displayName: string;
        routes?: string[];
        classBaseStats: StatBlock;
        promotionGains: StatBlock;
        primaryWeaponId: string;
        secondaryWeaponId: string;
        learnedSkills: Array<{ level: number; skillId: string }>;
        secondaryWeaponIds: string[];
      }>;
      weaponRankMilestones: Array<{ chapterStart: number; chapterEnd: number; primaryRank: string; secondaryRank: string }>;
    };
  };
}

export interface StanceBonuses {
  reviewStatus: string;
  semantics: string;
  baseBonus: Record<string, number>;
  rankDeltas: Record<string, Record<string, number>>;
}

export interface SealGrant {
  supportRelationshipId: string;
  seal: string;
  borrowedClassId: string;
  grantedClassId: string;
  resolution: string;
  resolutionSteps?: string[];
  alreadyOwnedVia?: "base" | "heart_seal";
}

export interface ClassTree {
  id: string;
  label: string;
  affiliation: ClassAffiliation;
  categories?: ClassCategory[];
  promotions: ClassTreeNode[];
}

export type ClassAffiliation = "hoshidan" | "nohrian" | "special";
export type ClassCategory = "special";

export interface ClassTreeNode {
  id: string;
  label: string;
  affiliation: ClassAffiliation;
}

export interface ClassStatProfile {
  classId: string;
  displayName: string;
  tier: "base" | "advanced" | "special";
  growthRates: StatBlock;
  maximumStats: StatBlock;
  weaponRankCaps: Record<string, string>;
}

export interface ClassSkillAcquisition {
  classId: string;
  level: number;
  gender?: "male" | "female";
}

export interface ClassSkill {
  id: string;
  names: { en: string };
  description: string;
  iconAssetId: string;
  acquisition: ClassSkillAcquisition[];
  notes?: string[];
}

export interface ClassSkillIndexEntry {
  skillId: string;
  level: number;
  gender?: "male" | "female";
}

export interface WeaponType {
  id: string;
  names: { en: string };
  iconAssetId: string;
  displayOrder: number;
}

export interface EnrichedClassNode extends ClassTreeNode {
  stats: ClassStatProfile;
  skills: ClassSkillIndexEntry[];
}

export interface EnrichedClassTree extends EnrichedClassNode {
  categories?: ClassCategory[];
  promotions: EnrichedClassNode[];
}

export interface Fe14Runtime {
  schemaVersion: number;
  gameId: string;
  lastUpdated: string;
  roster: UnitIdentity[];
  classTrees: ClassTree[];
  classStats: ClassStatProfile[];
  classSkills: ClassSkill[];
  weaponTypes: WeaponType[];
  skillsByClass: Record<string, ClassSkillIndexEntry[]>;
  classDirectory: EnrichedClassTree[];
  units: UnitRuntime[];
  sources: Array<{ id: string; title: string; location: string; reviewStatus: string }>;
}

const portraitUrls: Record<string, string> = {
  "Anna.png": annaPortrait,
  "Aqua.png": azuraPortrait,
  "Asama.png": azamaPortrait,
  "Ashura.png": shuraPortrait,
  "Belka.png": berukaPortrait,
  "Benoit.png": bennyPortrait,
  "Camilla.png": camillaPortrait,
  "Charlotte.png": charlottePortrait,
  "Crimson.png": scarletPortrait,
  "Elfie.png": effiePortrait,
  "Elise.png": elisePortrait,
  "Felicia.png": feliciaPortrait,
  "Flannel.png": keatonPortrait,
  "Flora.png": floraPortrait,
  "Fuuga.png": fugaPortrait,
  "Gunter.png": gunterPortrait,
  "Harold.png": arthurPortrait,
  "Hinata.png": hinataPortrait,
  "Hinoka.png": hinokaPortrait,
  "Izana.png": izanaPortrait,
  "Joker.png": jakobPortrait,
  "Kagerou.png": kageroPortrait,
  "Kamui.png": corrinPortrait,
  "Kazahana.png": hanaPortrait,
  "Lazward.png": laslowPortrait,
  "Leon.png": leoPortrait,
  "Luna.png": selenaPortrait,
  "Marx.png": xanderPortrait,
  "Mozume.png": mozuPortrait,
  "Nishiki.png": kadenPortrait,
  "Nyx.png": nyxPortrait,
  "Oboro.png": oboroPortrait,
  "Odin.png": odinPortrait,
  "Orochi.png": orochiPortrait,
  "Pieri.png": periPortrait,
  "Rinka.png": rinkahPortrait,
  "Ryouma.png": ryomaPortrait,
  "Saizou.png": saizoPortrait,
  "Sakura.png": sakuraPortrait,
  "Setsuna.png": setsunaPortrait,
  "Silas.png": silasPortrait,
  "Suzukaze.png": kazePortrait,
  "Takumi.png": takumiPortrait,
  "Tsubaki.png": subakiPortrait,
  "Tsukuyomi.png": hayatoPortrait,
  "Yukimura.png": yukimuraPortrait,
  "Yuugiri.png": reinaPortrait,
  "Zero.png": nilesPortrait,
  "Deere.png": dwyerPortrait,
  "Kanna.png": kanaPortrait,
  "Shigure.png": shigurePortrait,
  "Sophie.png": sophiePortrait,
  "Midoriko.png": midoriPortrait,
  "Shinonome.png": shiroPortrait,
  "Kisaragi.png": kiragiPortrait,
  "Grey.png": asugiPortrait,
  "Kinu.png": selkiePortrait,
  "Hisame.png": hisamePortrait,
  "Mitama.png": mitamaPortrait,
  "Matoi.png": caeldoriPortrait,
  "Shara.png": rhajatPortrait,
  "Siegbert.png": siegbertPortrait,
  "Foleo.png": forrestPortrait,
  "Ignis.png": ignatiusPortrait,
  "Velour.png": velouriaPortrait,
  "Lutz.png": percyPortrait,
  "Ophelia.png": opheliaPortrait,
  "Soleil.png": soleilPortrait,
  "Eponine.png": ninaPortrait,
};

export const fe14Data = runtimeJson as unknown as Fe14Runtime;

export function getPortraitUrl(unit: UnitIdentity, avatarGender?: "male" | "female"): string {
  if (unit.id === "corrin" && avatarGender === "female") return corrinFemalePortrait;
  if (unit.id === "kana" && avatarGender === "male") return kanaMalePortrait;
  return portraitUrls[unit.portraitFile] ?? "";
}

export function findUnitBySlug(slug: string): UnitRuntime | undefined {
  return fe14Data.units.find(
    (unit) => unit.identity.slug.toLocaleLowerCase() === slug.toLocaleLowerCase(),
  );
}

export function displayId(value: string): string {
  const displayNames: Record<string, string> = {
    spys_yumi: "Spy's Yumi",
  };
  if (displayNames[value]) return displayNames[value];
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

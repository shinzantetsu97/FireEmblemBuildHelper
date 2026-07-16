import runtimeJson from "../../data/runtime/fe14/units.json";
import annaPortrait from "../../assets/character_portraits/Anna.png";
import arthurPortrait from "../../assets/character_portraits/Harold.png";
import azamaPortrait from "../../assets/character_portraits/Asama.png";
import azuraPortrait from "../../assets/character_portraits/Aqua.png";
import bennyPortrait from "../../assets/character_portraits/Benoit.png";
import berukaPortrait from "../../assets/character_portraits/Belka.png";
import camillaPortrait from "../../assets/character_portraits/Camilla.png";
import charlottePortrait from "../../assets/character_portraits/Charlotte.png";
import corrinPortrait from "../../assets/character_portraits/Kamui.png";
import effiePortrait from "../../assets/character_portraits/Elfie.png";
import elisePortrait from "../../assets/character_portraits/Elise.png";
import feliciaPortrait from "../../assets/character_portraits/Felicia.png";
import floraPortrait from "../../assets/character_portraits/Flora.png";
import fugaPortrait from "../../assets/character_portraits/Fuuga.png";
import gunterPortrait from "../../assets/character_portraits/Gunter.png";
import hanaPortrait from "../../assets/character_portraits/Kazahana.png";
import hayatoPortrait from "../../assets/character_portraits/Tsukuyomi.png";
import hinataPortrait from "../../assets/character_portraits/Hinata.png";
import hinokaPortrait from "../../assets/character_portraits/Hinoka.png";
import izanaPortrait from "../../assets/character_portraits/Izana.png";
import jakobPortrait from "../../assets/character_portraits/Joker.png";
import kadenPortrait from "../../assets/character_portraits/Nishiki.png";
import kageroPortrait from "../../assets/character_portraits/Kagerou.png";
import kazePortrait from "../../assets/character_portraits/Suzukaze.png";
import keatonPortrait from "../../assets/character_portraits/Flannel.png";
import laslowPortrait from "../../assets/character_portraits/Lazward.png";
import leoPortrait from "../../assets/character_portraits/Leon.png";
import mozuPortrait from "../../assets/character_portraits/Mozume.png";
import nilesPortrait from "../../assets/character_portraits/Zero.png";
import nyxPortrait from "../../assets/character_portraits/Nyx.png";
import oboroPortrait from "../../assets/character_portraits/Oboro.png";
import odinPortrait from "../../assets/character_portraits/Odin.png";
import orochiPortrait from "../../assets/character_portraits/Orochi.png";
import periPortrait from "../../assets/character_portraits/Pieri.png";
import reinaPortrait from "../../assets/character_portraits/Yuugiri.png";
import rinkahPortrait from "../../assets/character_portraits/Rinka.png";
import ryomaPortrait from "../../assets/character_portraits/Ryouma.png";
import saizoPortrait from "../../assets/character_portraits/Saizou.png";
import sakuraPortrait from "../../assets/character_portraits/Sakura.png";
import scarletPortrait from "../../assets/character_portraits/Crimson.png";
import selenaPortrait from "../../assets/character_portraits/Luna.png";
import setsunaPortrait from "../../assets/character_portraits/Setsuna.png";
import shuraPortrait from "../../assets/character_portraits/Ashura.png";
import silasPortrait from "../../assets/character_portraits/Silas.png";
import subakiPortrait from "../../assets/character_portraits/Tsubaki.png";
import takumiPortrait from "../../assets/character_portraits/Takumi.png";
import xanderPortrait from "../../assets/character_portraits/Marx.png";
import yukimuraPortrait from "../../assets/character_portraits/Yukimura.png";

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
    autoLevel?: {
      basis: "displayed_story_chapter";
      minimumLevel: number;
      maximumLevel?: number;
      milestones: Array<{
        displayedChapterStart: number;
        displayedChapterEnd?: number;
        level: number;
      }>;
      statCalculation: "average_growths_round_half_up";
      statBaseLevel: number;
      growthClassId: string;
      skillsLearnedAutomatically: boolean;
      modelBasis: "castle_recruit_autolevel";
      comparisonModel: "offspring_seal_esque_level_scaling";
      comparisonStatus: "unverified";
      weaponProficiencyScales: boolean;
      weaponProficiencyMilestonesStatus: "unresolved";
      evidenceStatus: "tested" | "partial";
      note: string;
    };
    inventory: string[];
    inventoryByDifficulty?: {
      normal: string[];
      hard: string[];
      lunatic: string[];
    };
    temporarilyLeavesAfterChapter?: number;
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
    stats: StatBlock;
    weaponRanks: Record<string, string>;
    weaponRanksByAvailability?: Record<string, Record<string, string>>;
    weaponRankProgress?: Record<string, { towardRank: string; barFraction: number; precision: "exact" | "approximate" }>;
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
  pairupBonuses: (Record<string, unknown> & { attackStance: StanceBonuses; guardStance: StanceBonuses }) | null;
  supports: Array<Record<string, unknown> & { id: string; partnerUnitId: string; kind: string; routes: string[] }>;
  classAccess: (Record<string, unknown> & { startingClassId: string; baseClassSet: string[]; heartSealClassSet: string[]; corrinTalentOnlyClassSet: string[]; sealGrants: SealGrant[] }) | null;
  personalSkill: (Record<string, unknown> & { names: { en: string }; effect: string }) | null;
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
  promotions: Array<{ id: string; label: string }>;
}

export interface Fe14Runtime {
  schemaVersion: number;
  gameId: string;
  lastUpdated: string;
  roster: UnitIdentity[];
  classTrees: ClassTree[];
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
};

export const fe14Data = runtimeJson as unknown as Fe14Runtime;

export function getPortraitUrl(unit: UnitIdentity): string {
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

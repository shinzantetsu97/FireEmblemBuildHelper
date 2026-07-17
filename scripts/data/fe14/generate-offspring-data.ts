import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Route = "birthright" | "conquest" | "revelation";
type Gender = "female" | "male";
type StatBlock = Record<"hp" | "strength" | "magic" | "skill" | "speed" | "luck" | "defense" | "resistance", number>;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const normalized = path.join(root, "data/normalized/fe14");
const stats = (values: number[]): StatBlock => Object.fromEntries(
  ["hp", "strength", "magic", "skill", "speed", "luck", "defense", "resistance"].map((key, index) => [key, values[index]]),
) as StatBlock;
const subtract = (left: StatBlock, right: StatBlock) => stats(Object.keys(left).map((key) => left[key as keyof StatBlock] - right[key as keyof StatBlock]));
const intersect = (left: Route[], right: Route[]) => left.filter((route) => right.includes(route));

interface ClassProfile {
  displayName: string;
  base: StatBlock;
  growth: StatBlock;
  weapons: string[];
  skills: Array<[number, string, string]>;
}

const classProfiles: Record<string, ClassProfile> = {
  nohr_prince: profile("Nohr Prince / Princess", [17, 7, 3, 4, 5, 2, 5, 2], [15, 15, 10, 10, 10, 10, 10, 5], ["sword", "dragonstone"]),
  hoshido_noble: profile("Hoshido Noble", [19, 10, 4, 5, 6, 4, 7, 3], [15, 15, 10, 10, 10, 10, 15, 0], ["sword", "dragonstone", "staff"], [[5, "dragon_ward", "Dragon Ward"], [15, "hoshidan_unity", "Hoshidan Unity"]]),
  nohr_noble: profile("Nohr Noble", [18, 8, 6, 4, 7, 2, 6, 6], [15, 10, 15, 5, 15, 5, 5, 15], ["sword", "dragonstone", "tome"], [[5, "draconic_hex", "Draconic Hex"], [15, "nohrian_trust", "Nohrian Trust"]]),
  cavalier: profile("Cavalier", [17, 6, 0, 5, 5, 3, 5, 3], [10, 15, 0, 10, 10, 15, 10, 5], ["lance", "sword"]),
  paladin: profile("Paladin", [19, 8, 1, 7, 7, 4, 7, 6], [10, 15, 0, 10, 10, 15, 10, 10], ["lance", "sword"], [[5, "defender", "Defender"], [15, "aegis", "Aegis"]]),
  great_knight: profile("Great Knight", [21, 10, 0, 6, 6, 3, 10, 2], [20, 20, 0, 10, 5, 5, 20, 0], ["lance", "sword", "axe"], [[5, "luna", "Luna"], [15, "armored_blow", "Armored Blow"]]),
  apothecary: profile("Apothecary", [18, 6, 0, 4, 4, 2, 6, 2], [20, 20, 0, 10, 10, 5, 10, 5], ["bow"]),
  merchant: profile("Merchant", [20, 8, 0, 6, 5, 4, 8, 5], [20, 20, 0, 10, 5, 15, 10, 5], ["bow", "lance"], [[5, "profiteer", "Profiteer"], [15, "spendthrift", "Spendthrift"]]),
  mechanist: profile("Mechanist", [18, 7, 0, 9, 7, 2, 6, 6], [10, 10, 0, 15, 10, 5, 5, 15], ["dagger", "bow"], [[5, "golembane", "Golembane"], [15, "replicate", "Replicate"]]),
  spear_fighter: profile("Spear Fighter", [17, 6, 0, 6, 6, 2, 5, 2], [15, 15, 0, 15, 15, 5, 10, 5], ["lance"]),
  spear_master: profile("Spear Master", [18, 9, 0, 8, 8, 3, 7, 3], [15, 15, 0, 15, 15, 5, 10, 5], ["lance"], [[5, "seal_speed", "Seal Speed"], [15, "lancefaire", "Lancefaire"]]),
  basara: profile("Basara", [20, 7, 5, 7, 7, 5, 7, 6], [20, 10, 10, 10, 10, 15, 5, 10], ["lance", "tome"], [[5, "rend_heaven", "Rend Heaven"], [15, "quixotic", "Quixotic"]]),
  archer: profile("Archer", [17, 5, 0, 7, 5, 2, 4, 1], [10, 15, 0, 15, 15, 5, 10, 0], ["bow"]),
  sniper: profile("Sniper", [19, 7, 0, 10, 9, 3, 6, 2], [10, 15, 0, 20, 15, 5, 10, 0], ["bow"], [[5, "certain_blow", "Certain Blow"], [15, "bowfaire", "Bowfaire"]]),
  kinshi_knight: profile("Kinshi Knight", [17, 4, 1, 9, 8, 5, 4, 7], [0, 5, 0, 15, 15, 15, 0, 15], ["bow", "lance"], [[5, "air_superiority", "Air Superiority"], [15, "amaterasu", "Amaterasu"]]),
  ninja: profile("Ninja", [16, 3, 0, 8, 8, 1, 3, 3], [5, 5, 0, 20, 20, 0, 5, 15], ["dagger"]),
  master_ninja: profile("Master Ninja", [17, 5, 0, 10, 11, 2, 4, 8], [5, 5, 0, 20, 20, 0, 5, 20], ["dagger"], [[5, "lethality", "Lethality"], [15, "shurikenfaire", "Shurikenfaire"]]),
  kitsune: profile("Kitsune", [16, 5, 1, 6, 8, 4, 1, 4], [10, 10, 0, 15, 20, 10, 0, 20], ["beaststone"]),
  nine_tails: profile("Nine-Tails", [19, 6, 2, 9, 10, 5, 2, 8], [10, 10, 0, 15, 20, 10, 0, 20], ["beaststone"], [[5, "even_better", "Even Better"], [15, "grisly_wound", "Grisly Wound"]]),
  samurai: profile("Samurai", [17, 4, 0, 5, 8, 3, 3, 3], [10, 10, 0, 15, 20, 15, 0, 10], ["sword"]),
  swordmaster: profile("Swordmaster", [18, 6, 2, 7, 11, 4, 5, 5], [10, 10, 5, 15, 20, 15, 0, 10], ["sword"], [[5, "astra", "Astra"], [15, "swordfaire", "Swordfaire"]]),
  master_of_arms: profile("Master of Arms", [20, 8, 0, 6, 9, 3, 7, 3], [20, 15, 0, 10, 10, 10, 10, 0], ["sword", "lance", "axe"], [[5, "seal_strength", "Seal Strength"], [15, "life_and_death", "Life and Death"]]),
  shrine_maiden: profile("Shrine Maiden", [16, 0, 3, 5, 5, 4, 2, 5], [0, 5, 10, 10, 15, 15, 0, 20], ["staff"]),
  priestess: profile("Priestess", [19, 6, 7, 6, 9, 5, 5, 8], [10, 10, 10, 5, 15, 15, 0, 20], ["staff", "bow"], [[5, "renewal", "Renewal"], [15, "countermagic", "Countermagic"]]),
  onmyoji: profile("Onmyoji", [16, 0, 7, 6, 7, 2, 3, 6], [0, 0, 20, 10, 15, 0, 0, 15], ["tome", "staff"], [[5, "rally_magic", "Rally Magic"], [15, "tomefaire", "Tomefaire"]]),
  troubadour: profile("Troubadour", [15, 0, 3, 7, 5, 4, 1, 4], [0, 0, 10, 20, 10, 15, 0, 15], ["staff"]),
  strategist: profile("Strategist", [16, 0, 7, 6, 7, 5, 2, 7], [0, 0, 15, 5, 10, 20, 0, 15], ["staff", "tome"], [[5, "rally_resistance", "Rally Resistance"], [15, "inspiration", "Inspiration"]]),
  attendant: profile("Butler", [18, 4, 5, 9, 8, 4, 5, 4], [0, 10, 10, 15, 15, 10, 5, 10], ["staff", "dagger"], [[5, "live_to_serve", "Live to Serve"], [15, "tomebreaker", "Tomebreaker"]]),
  sky_knight: profile("Sky Knight", [16, 3, 0, 5, 7, 4, 2, 6], [0, 10, 0, 10, 15, 20, 0, 20], ["lance"]),
  falcon_knight: profile("Falcon Knight", [18, 5, 4, 6, 10, 5, 5, 9], [0, 10, 10, 10, 15, 20, 0, 20], ["lance", "staff"], [[5, "rally_speed", "Rally Speed"], [15, "warding_blow", "Warding Blow"]]),
  diviner: profile("Diviner", [15, 0, 4, 5, 6, 1, 1, 3], [0, 5, 15, 10, 15, 5, 0, 10], ["tome"]),
  knight: profile("Knight", [19, 8, 0, 5, 3, 3, 8, 1], [20, 20, 0, 15, 5, 10, 20, 0], ["lance"]),
  general: profile("General", [22, 11, 0, 7, 3, 4, 12, 3], [25, 20, 0, 15, 0, 10, 20, 5], ["lance", "axe"], [[5, "wary_fighter", "Wary Fighter"], [15, "pavise", "Pavise"]]),
  wolfskin: profile("Wolfskin", [19, 8, 0, 4, 6, 0, 4, 0], [20, 20, 0, 5, 15, 5, 10, 0], ["beaststone"]),
  wolfssegner: profile("Wolfssegner", [22, 11, 0, 6, 7, 1, 7, 1], [20, 20, 0, 5, 15, 5, 10, 0], ["beaststone"], [[5, "better_odds", "Better Odds"], [15, "grisly_wound", "Grisly Wound"]]),
  wyvern_rider: profile("Wyvern Rider", [17, 6, 0, 5, 4, 2, 7, 0], [10, 15, 5, 10, 10, 5, 20, 0], ["axe"]),
  wyvern_lord: profile("Wyvern Lord", [19, 8, 0, 9, 6, 3, 10, 1], [10, 15, 0, 15, 10, 5, 20, 0], ["axe", "lance"], [[5, "rally_defense", "Rally Defense"], [15, "swordbreaker", "Swordbreaker"]]),
  malig_knight: profile("Malig Knight", [18, 7, 6, 6, 5, 0, 8, 6], [0, 15, 15, 10, 5, 0, 10, 15], ["axe", "tome"], [[5, "savage_blow", "Savage Blow"], [15, "trample", "Trample"]]),
  dark_mage: profile("Dark Mage", [16, 0, 6, 3, 3, 1, 3, 5], [0, 10, 20, 0, 10, 0, 5, 10], ["tome"]),
  sorcerer: profile("Sorcerer", [17, 0, 9, 4, 6, 1, 5, 8], [0, 0, 25, 0, 10, 0, 5, 15], ["tome"], [[5, "vengeance", "Vengeance"], [15, "bowbreaker", "Bowbreaker"]]),
  dark_knight: profile("Dark Knight", [19, 8, 6, 6, 5, 3, 8, 6], [15, 20, 10, 5, 5, 5, 15, 5], ["tome", "sword"], [[5, "seal_magic", "Seal Magic"], [15, "lifetaker", "Lifetaker"]]),
  mercenary: profile("Mercenary", [17, 5, 0, 7, 6, 2, 5, 2], [10, 15, 0, 20, 15, 5, 10, 5], ["sword"]),
  hero: profile("Hero", [20, 8, 0, 10, 8, 3, 7, 2], [20, 15, 0, 20, 15, 5, 10, 0], ["sword", "axe"], [[5, "sol", "Sol"], [15, "axebreaker", "Axebreaker"]]),
  bow_knight: profile("Bow Knight", [18, 6, 0, 8, 9, 3, 5, 6], [10, 10, 0, 15, 15, 10, 0, 10], ["sword", "bow"], [[5, "rally_skill", "Rally Skill"], [15, "shurikenbreaker", "Shurikenbreaker"]]),
  outlaw: profile("Outlaw", [16, 3, 1, 4, 8, 1, 2, 4], [0, 10, 5, 10, 20, 0, 0, 20], ["bow"]),
  adventurer: profile("Adventurer", [17, 4, 6, 6, 10, 2, 3, 8], [0, 5, 15, 5, 20, 0, 0, 20], ["bow", "staff"], [[5, "lucky_seven", "Lucky Seven"], [15, "pass", "Pass"]]),
};

function profile(displayName: string, base: number[], growth: number[], weapons: string[], skills: Array<[number, string, string]> = []): ClassProfile {
  return { displayName, base: stats(base), growth: stats(growth), weapons, skills };
}

interface ChildConfig {
  id: string;
  fixedParentId: string;
  gender: Gender;
  baseClassId: string;
  fixedClassId: string;
  childGrowth: StatBlock;
  personalBases: StatBlock;
  skill: { id: string; en: string; zhHans: string; effect: string };
  aPlus: string[];
  recruitment: {
    initialFaction: "player" | "npc" | "enemy" | "not_deployed";
    description: string;
    talkUnitId?: string;
    automaticAtMapEndIfSurvives: boolean;
    deathBeforeRecruitmentIsPermanent: boolean;
    notes?: string[];
    weaponRanks: Record<string, string>;
    inventory: string[];
  };
}

const c = (
  id: string,
  fixedParentId: string,
  gender: Gender,
  baseClassId: string,
  fixedClassId: string,
  childGrowth: number[],
  personalBases: number[],
  skill: ChildConfig["skill"],
  aPlus: string[],
  recruitment: ChildConfig["recruitment"],
): ChildConfig => ({ id, fixedParentId, gender, baseClassId, fixedClassId, childGrowth: stats(childGrowth), personalBases: stats(personalBases), skill, aPlus, recruitment });

const shigure = c("shigure", "azura", "male", "sky_knight", "troubadour", [35, 45, 5, 45, 35, 25, 35, 25], [9, 6, 1, 7, 7, 5, 8, 7],
  skill("perfect_pitch", "Perfect Pitch", "完美音调", "When Shigure uses Rally, allies within 2 spaces whose current HP is lower than his recover 10% of their maximum HP."),
  ["hisame", "forrest"], recruit("not_deployed", "Shigure joins automatically after the map is completed.", { automatic: true, ranks: { lance: "D" }, inventory: ["iron_naginata"], notes: ["Shigure is not deployed during Surprise Duet; he joins after the chapter ends."] }));

const kana = c("kana", "corrin", "female", "nohr_prince", "avatar_talent", [30, 35, 30, 40, 45, 45, 25, 25], [7, 3, 6, 8, 8, 9, 5, 5],
  skill("draconic_heir", "Draconic Heir", "龙之御子", "At the start of the turn, if Kana has a Dragonstone equipped, Kana restores 15% of maximum HP."),
  [], recruit("not_deployed", "Kana joins automatically after the map is completed.", { automatic: true, ranks: { sword: "D", dragonstone: "D" }, inventory: ["dragonstone"], notes: ["Kana appears during Dragon Blood as an uncontrolled dragon NPC; the playable Nohr Prince or Princess joins after the chapter ends."] }));

const children: ChildConfig[] = [
  c("sophie", "silas", "female", "cavalier", "mercenary", [35, 35, 10, 55, 50, 35, 25, 35], [8, 6, 2, 7, 6, 7, 4, 6],
    skill("mischievous", "Mischievous", "冒失", "When Sophie initiates combat and her attack connects, the enemy loses 3 Defense after combat and has its clothing stripped."),
    ["caeldori", "velouria", "soleil"], recruit("npc", "Silas talks to Sophie, or Sophie survives until map completion.", { talkUnitId: "silas", death: true, ranks: { sword: "D", lance: "D" }, inventory: ["iron_lance", "iron_sword", "vulnerary"] })),
  c("midori", "kaze", "female", "apothecary", "ninja", [45, 35, 5, 55, 35, 50, 30, 20], [8, 6, 2, 10, 4, 10, 4, 2],
    skill("lucky_charm", "Lucky Charm", "幸运儿", "Increases the activation rate of Luck-based skills by 20 percentage points."),
    ["selkie", "kana", "ophelia"], recruit("player", "Midori joins automatically at the start of the paralogue.", { ranks: { bow: "D" }, inventory: ["iron_yumi"], notes: ["In Birthright, Herbal Remedy cannot be unlocked until Kaze passes his Chapter 15 survival check."] })),
  c("shiro", "ryoma", "male", "spear_fighter", "samurai", [50, 50, 0, 40, 35, 35, 45, 30], [8, 7, 0, 5, 3, 6, 8, 5],
    skill("noble_cause", "Noble Cause", "大义", "While Shiro is the lead unit with a support unit whose HP is not full, he deals 3 extra damage and takes 1 extra damage."),
    ["kiragi", "asugi", "kana"], recruit("npc", "Ryoma talks to Shiro during the battle.", { talkUnitId: "ryoma", death: true, ranks: { lance: "D" }, inventory: ["iron_naginata", "vulnerary"] })),
  c("kiragi", "takumi", "male", "archer", "spear_fighter", [45, 40, 0, 45, 50, 45, 40, 15], [7, 6, 0, 5, 6, 8, 4, 1],
    skill("optimist", "Optimist", "乐观", "After Kiragi uses Wait, he gains 4 Speed and 8 Luck for one turn."),
    ["shiro", "hisame", "dwyer"], recruit("player", "Kiragi joins automatically on turn 1.", { ranks: { bow: "D" }, inventory: ["iron_yumi", "vulnerary"] })),
  c("asugi", "saizo", "male", "ninja", "samurai", [40, 45, 50, 55, 45, 50, 30, 20], [6, 7, 4, 7, 6, 9, 4, 9],
    skill("sweet_tooth", "Sweet Tooth", "甜食党", "After Asugi uses Wait, he restores 4 HP."),
    ["shiro", "hisame", "dwyer"], recruit("npc", "Asugi joins automatically when the map is completed.", { automatic: true, ranks: { dagger: "D" }, inventory: ["iron_shuriken"] })),
  c("selkie", "kaden", "female", "kitsune", "diviner", [35, 30, 15, 35, 55, 60, 30, 50], [7, 4, 3, 6, 7, 10, 6, 11],
    skill("playthings", "Playthings", "好玩具", "At the start of the turn, adjacent enemies lose 5 HP."),
    ["rhajat", "midori", "kana"], recruit("npc", "Kaden talks to Selkie during the battle.", { talkUnitId: "kaden", death: true, ranks: { beaststone: "D" }, inventory: ["beaststone", "concoction"] })),
  c("hisame", "hinata", "male", "samurai", "oni_savage", [50, 40, 0, 40, 40, 25, 30, 20], [6, 6, 1, 7, 5, 4, 5, 4],
    skill("calm", "Calm", "冷静", "After Hisame uses Wait, he gains 4 Skill and 4 Resistance for one turn."),
    ["kiragi", "asugi", "shigure"], recruit("npc", "Hinata talks to Hisame during the battle.", { talkUnitId: "hinata", death: true, ranks: { sword: "D" }, inventory: ["iron_katana"] })),
  c("mitama", "azama", "female", "shrine_maiden", "apothecary", [45, 40, 35, 45, 50, 50, 30, 20], [6, 7, 6, 6, 8, 10, 3, 5],
    skill("haiku", "Haiku", "俳句", "At the start of the turn, if allies stand directly above and below Mitama, she restores 7 HP and each of those allies restores 5 HP."),
    ["caeldori", "rhajat", "kana"], recruit("npc", "Visit Mitama's village three times with Azama, or complete the map while she remains inside.", { talkUnitId: "azama", ranks: { staff: "D" }, inventory: ["wane_festal"], notes: ["The village visit count is the active-recruitment method; clearing the map also recruits Mitama."] })),
  c("caeldori", "subaki", "female", "sky_knight", "samurai", [55, 35, 15, 40, 40, 45, 35, 20], [8, 8, 3, 5, 6, 9, 5, 6],
    skill("prodigy", "Prodigy", "天才", "Compare Caeldori's higher offensive stat (Strength or Magic) with the enemy's matching stat. If the enemy's stat is higher, Caeldori deals 4 extra damage."),
    ["mitama", "rhajat", "sophie"], recruit("player", "Caeldori joins automatically on turn 1.", { ranks: { lance: "D" }, inventory: ["swordcatcher", "iron_naginata"] })),
  c("rhajat", "hayato", "female", "diviner", "oni_savage", [40, 15, 60, 10, 50, 30, 25, 35], [8, 1, 10, 0, 7, 6, 5, 12],
    skill("vendetta", "Vendetta", "執念", "When Rhajat initiates combat against an enemy she has already fought on the same map, she deals 4 extra damage."),
    ["caeldori", "mitama", "selkie"], recruit("enemy", "Hayato talks to Rhajat, or Rhajat joins automatically when the map is completed.", { talkUnitId: "hayato", automatic: true, ranks: { tome: "D" }, inventory: ["ox_spirit"] })),
  c("siegbert", "xander", "male", "cavalier", "wyvern_rider", [40, 45, 5, 45, 45, 45, 35, 20], [7, 5, 2, 7, 6, 7, 6, 3],
    skill("gallant", "Gallant", "紳士", "While Siegbert supports a female lead unit, that lead unit deals 2 extra damage."),
    ["kana", "forrest", "ignatius"], recruit("player", "Siegbert joins automatically on turn 1.", { ranks: { sword: "D", lance: "D" }, inventory: ["iron_sword", "iron_lance", "javelin", "concoction"] })),
  c("forrest", "leo", "male", "troubadour", "dark_mage", [55, 15, 65, 20, 35, 25, 25, 55], [8, 5, 9, 1, 4, 5, 6, 13],
    skill("fierce_counter", "Fierce Counter", "强烈反击", "When a male enemy initiates combat, Forrest deals 2 extra damage."),
    ["siegbert", "shigure", "ignatius"], recruit("npc", "Forrest joins automatically after the map if he survives.", { automatic: true, death: true, ranks: { staff: "D" }, inventory: [] })),
  c("ignatius", "benny", "male", "knight", "fighter", [40, 50, 0, 40, 30, 55, 45, 35], [8, 7, 0, 6, 4, 7, 6, 7],
    skill("guarded_bravery", "Guarded Bravery", "谨慎勇敢", "While Ignatius is the lead unit in Attack or Guard Stance, he takes 2 less damage; while unsupported, he takes 2 extra damage."),
    ["siegbert", "forrest", "percy"], recruit("npc", "Benny talks to Ignatius during the battle.", { talkUnitId: "benny", death: true, ranks: { lance: "D" }, inventory: ["iron_lance", "javelin", "vulnerary"] })),
  c("velouria", "keaton", "female", "wolfskin", "fighter", [50, 50, 0, 40, 40, 35, 45, 30], [7, 6, 0, 6, 6, 11, 9, 8],
    skill("goody_basket", "Goody Basket", "捡到宝", "At the start of the turn, Velouria has a Luck% chance to restore 10 HP."),
    ["sophie", "kana", "nina"], recruit("player", "Velouria appears on the next turn after the army crosses the rightmost mountain row, or joins when the map is completed first.", { automatic: true, ranks: { beaststone: "D" }, inventory: ["beaststone", "beastrune", "vulnerary"] })),
  c("percy", "arthur", "male", "wyvern_rider", "fighter", [30, 30, 5, 45, 40, 75, 55, 15], [6, 4, 0, 6, 6, 15, 8, 4],
    skill("fortunate_son", "Fortunate Son", "幸运星", "Allies within 2 tiles gain 15 Critical Avoid; Percy gains 5 Critical Avoid."),
    ["ignatius", "dwyer", "kana"], recruit("enemy", "Percy joins automatically when the map is completed.", { automatic: true, ranks: { axe: "D" }, inventory: ["hand_axe", "iron_axe"] })),
  c("ophelia", "odin", "female", "dark_mage", "samurai", [45, 15, 45, 40, 45, 65, 20, 30], [7, 3, 6, 6, 7, 12, 2, 5],
    skill("bibliophile", "Bibliophile", "魔导书狂", "While carrying at least three tomes or scrolls, Ophelia gains 10 Critical."),
    ["midori", "soleil"], recruit("player", "Ophelia joins automatically on turn 1.", { ranks: { tome: "D" }, inventory: ["thunder", "vulnerary"] })),
  c("soleil", "laslow", "female", "mercenary", "ninja", [25, 60, 0, 35, 35, 45, 35, 40], [6, 7, 1, 3, 6, 7, 5, 6],
    skill("sisterhood", "Sisterhood", "女子力", "While supported by a female ally, Soleil deals 2 extra damage and takes 2 less damage."),
    ["ophelia", "sophie", "nina"], recruit("npc", "Laslow talks to Soleil during the battle.", { talkUnitId: "laslow", death: true, ranks: { sword: "D" }, inventory: ["iron_sword", "vulnerary"] })),
  c("nina", "niles", "female", "outlaw", "dark_mage", [30, 45, 30, 35, 40, 50, 25, 45], [5, 8, 5, 5, 5, 11, 3, 10],
    skill("daydream", "Daydream", "邪念", "While adjacent to two male units paired in Guard Stance, Nina deals 2 extra damage and takes 2 less damage."),
    ["soleil", "velouria"], recruit("enemy", "Nina joins automatically when the map is completed.", { automatic: true, ranks: { bow: "D" }, inventory: ["iron_bow"], notes: ["Only female Corrin can be Nina's variable parent. Niles's S support with male Corrin does not unlock Nina's paralogue."] })),
];

function skill(id: string, en: string, zhHans: string, effect: string) {
  return { id, en, zhHans, effect };
}

function recruit(
  initialFaction: ChildConfig["recruitment"]["initialFaction"],
  description: string,
  options: { talkUnitId?: string; automatic?: boolean; death?: boolean; notes?: string[]; ranks: Record<string, string>; inventory: string[] },
): ChildConfig["recruitment"] {
  return {
    initialFaction,
    description,
    talkUnitId: options.talkUnitId,
    automaticAtMapEndIfSurvives: options.automatic ?? false,
    deathBeforeRecruitmentIsPermanent: options.death ?? false,
    notes: options.notes,
    weaponRanks: options.ranks,
    inventory: options.inventory,
  };
}

const names: Record<string, { ja: string; jaLatn: string; zhHans: string }> = {
  kana: { ja: "カンナ", jaLatn: "Kanna", zhHans: "神流" },
  shigure: { ja: "シグレ", jaLatn: "Shigure", zhHans: "时雨" },
  sophie: { ja: "ゾフィー", jaLatn: "Sophie", zhHans: "佐菲" },
  midori: { ja: "ミドリコ", jaLatn: "Midoriko", zhHans: "绿子" },
  shiro: { ja: "シノノメ", jaLatn: "Shinonome", zhHans: "东刚" },
  kiragi: { ja: "キサラギ", jaLatn: "Kisaragi", zhHans: "如月" },
  asugi: { ja: "グレイ", jaLatn: "Gurei", zhHans: "暮井" },
  selkie: { ja: "キヌ", jaLatn: "Kinu", zhHans: "绢" },
  hisame: { ja: "ヒサメ", jaLatn: "Hisame", zhHans: "冰雨" },
  mitama: { ja: "ミタマ", jaLatn: "Mitama", zhHans: "三珠" },
  caeldori: { ja: "マトイ", jaLatn: "Matoi", zhHans: "缠" },
  rhajat: { ja: "シャラ", jaLatn: "Shara", zhHans: "莎拉" },
  siegbert: { ja: "ジークベルト", jaLatn: "Siegbert", zhHans: "西格贝特" },
  forrest: { ja: "フォレオ", jaLatn: "Foleo", zhHans: "弗利欧" },
  ignatius: { ja: "イグニス", jaLatn: "Ignis", zhHans: "伊格尼斯" },
  velouria: { ja: "ベロア", jaLatn: "Velour", zhHans: "维璐亚" },
  percy: { ja: "ルッツ", jaLatn: "Lutz", zhHans: "露兹" },
  ophelia: { ja: "オフェリア", jaLatn: "Ophelia", zhHans: "奥菲利亚" },
  soleil: { ja: "ソレイユ", jaLatn: "Soleil", zhHans: "索雷尤" },
  nina: { ja: "エポニーヌ", jaLatn: "Eponine", zhHans: "艾潘妮" },
};

const parallelClass: Record<string, string> = {
  cavalier: "ninja", knight: "spear_fighter", fighter: "oni_savage", mercenary: "samurai",
  outlaw: "archer", samurai: "mercenary", oni_savage: "fighter", spear_fighter: "knight",
  diviner: "dark_mage", sky_knight: "wyvern_rider", archer: "outlaw", wyvern_rider: "sky_knight",
  ninja: "cavalier", dark_mage: "diviner", wolfskin: "outlaw", kitsune: "apothecary",
  songstress: "troubadour", villager: "apothecary",
};
const sealRestricted = new Set(["nohr_prince", "songstress", "kitsune", "wolfskin", "villager"]);
const inheritanceRestricted = new Set(["songstress", "kitsune", "wolfskin"]);
const childClassSets: Record<string, [string, string]> = {
  kana: ["nohr_prince", "avatar_talent"], shigure: ["sky_knight", "troubadour"], dwyer: ["troubadour", "cavalier"],
  ...Object.fromEntries(children.map((child) => [child.id, [child.baseClassId, child.fixedClassId]])),
};

const siblingByFather: Record<string, string> = {
  corrin: "kana",
  jakob: "dwyer",
  silas: "sophie",
  kaze: "midori",
  ryoma: "shiro",
  takumi: "kiragi",
  saizo: "asugi",
  azama: "mitama",
  hinata: "hisame",
  subaki: "caeldori",
  hayato: "rhajat",
  kaden: "selkie",
  xander: "siegbert",
  leo: "forrest",
  laslow: "soleil",
  odin: "ophelia",
  niles: "nina",
  arthur: "percy",
  benny: "ignatius",
  keaton: "velouria",
};

const revelationFriendships: Record<string, string> = {
  shiro: "siegbert", siegbert: "shiro",
  kiragi: "forrest", forrest: "kiragi",
  asugi: "ignatius", ignatius: "asugi",
  hisame: "percy", percy: "hisame",
  selkie: "velouria", velouria: "selkie",
  mitama: "soleil", soleil: "mitama",
  caeldori: "nina", nina: "caeldori",
  rhajat: "ophelia", ophelia: "rhajat",
};

const revelationRomances: Record<string, string[]> = {
  shiro: ["ophelia", "nina"],
  kiragi: ["velouria", "soleil"],
  asugi: ["soleil", "nina"],
  hisame: ["velouria", "ophelia"],
  selkie: ["forrest", "ignatius"],
  mitama: ["siegbert", "percy"],
  caeldori: ["siegbert", "ignatius"],
  rhajat: ["forrest", "percy"],
  siegbert: ["mitama", "caeldori"],
  forrest: ["selkie", "rhajat"],
  ignatius: ["selkie", "caeldori"],
  percy: ["mitama", "rhajat"],
  velouria: ["kiragi", "hisame"],
  ophelia: ["shiro", "hisame"],
  soleil: ["kiragi", "asugi"],
  nina: ["shiro", "asugi"],
};

const readJson = async <T>(file: string): Promise<T> => JSON.parse(await readFile(path.join(normalized, file), "utf8")) as T;

const childMapLevelScaling = {
  basis: "map_level",
  internalLevel: 10,
  unpromotedLevelFormula: "max(10, map_level)",
  promotedInternalLevelOffset: 20,
  offspringSealLevelFormula: "map_level - promoted_internal_level_offset",
  knownMapLevelsByChapter: {
    12: 11, 13: 12, 14: 14, 15: 15, 16: 17, 17: 18, 18: 20,
    19: 22, 20: 24, 21: 26, 22: 28, 23: 30, 24: 32, 25: 34, 26: 36, 27: 38,
  },
  note: "Children use internal level 10. Before promotion, their displayed level follows the applicable map level once it exceeds 10. From Chapter 19 onward, the Offspring Seal promotes them and converts map level 22-38 into promoted level 2-18 by subtracting the promoted internal-level offset of 20.",
} as const;

async function main() {
  const [existingParentage, existingRecruitment, firstRoster, secondRoster, supportRelationships, classAccess, classTrees] = await Promise.all([
    readJson<any[]>("child-parentage.json"),
    readJson<any[]>("child-recruitment.json"),
    readJson<any>("units/first-generation.json"),
    readJson<any>("units/second-generation.json"),
    readJson<any[]>("support-relationships.json"),
    readJson<any[]>("unit-class-access.json"),
    readJson<any>("class-trees.json"),
  ]);
  const acceptedDwyerParentage = existingParentage.find((entry) => entry.unitId === "dwyer");
  const acceptedDwyerRecruitment = existingRecruitment.find((entry) => entry.unitId === "dwyer");
  if (!acceptedDwyerParentage || !acceptedDwyerRecruitment) throw new Error("Accepted Dwyer seed is required");
  acceptedDwyerRecruitment.mapLevelScaling = childMapLevelScaling;
  if (!acceptedDwyerRecruitment.provenance.some((entry: any) => entry.sourceId === "ltranc-fe14-map-level-scaling")) {
    acceptedDwyerRecruitment.provenance.push({
      sourceId: "ltranc-fe14-map-level-scaling",
      locator: "Children: internal level 10 and map-level / Offspring Seal relationship",
      fields: ["mapLevelScaling", "levelByStoryPosition", "offspringSeal"],
      reviewStatus: "accepted",
    });
  }

  const rosterUnits = [...firstRoster.units, ...secondRoster.units];
  const rosterById = new Map(rosterUnits.map((unit: any) => [unit.id, unit]));
  const generatedChildren = [kana, shigure, ...children];
  const childById = new Map(generatedChildren.map((child) => [child.id, child]));
  const classAccessById = new Map(classAccess.map((entry: any) => [entry.unitId, entry]));
  const classTreeById = new Map(classTrees.classes.map((entry: any) => [entry.id, entry]));

  const acceptedDwyerGender = rosterById.get("dwyer").gender as Gender;
  acceptedDwyerParentage.variableParentOptions = acceptedDwyerParentage.variableParentOptions.map((option: any) => {
    const inheritedClassId = genderParallelClass(option.inheritedClassId, acceptedDwyerGender);
    return inheritedClassId === option.inheritedClassId
      ? option
      : { ...option, inheritedClassId, inheritedClassReason: "gender_parallel" };
  });

  for (const child of generatedChildren) {
    const roster = rosterById.get(child.id);
    const localized = names[child.id];
    if (roster.status !== "accepted") roster.status = "in_review";
    roster.names = { en: roster.displayName, ...localized };
    roster.personalSkillId = child.skill.id;
    if (child.id === "shiro" || child.id === "kiragi") roster.dragonVein = true;
  }

  const shigureRoster = rosterById.get("shigure");
  shigureRoster.notes = [
    "Shigure is Azura's fixed offspring unit; selecting Azura's S-support partner resolves his father-dependent growths, caps, traits, sibling, class access, and support bonuses.",
    "If Jakob is Shigure's father, Jakob supplies Troubadour first and Azura's inheritance resolves to Wyvern Rider instead.",
  ];

  const kanaRoster = rosterById.get("kana");
  kanaRoster.notes = [
    "Kana's gender is always opposite Corrin's. The selected spouse resolves Kana's growths, caps, traits, class inheritance, sibling, and support bonuses.",
    "If Corrin marries an offspring unit, that spouse's own variable parent must also be selected before Kana's inherited data is fully resolved.",
    "Male Corrin with Niles or female Corrin with Rhajat does not unlock Dragon Blood and produces no Kana.",
  ];

  const generatedParentage = children.map((child) => {
    const childRoster = rosterById.get(child.id);
    const motherRoutes = new Map<string, Route[]>([["corrin", childRoster.availableRoutes]]);
    for (const support of supportRelationships) {
      if (support.kind !== "romantic") continue;
      const otherId = support.unitId === child.fixedParentId
        ? support.partnerUnitId
        : support.partnerUnitId === child.fixedParentId ? support.unitId : undefined;
      if (!otherId || otherId === "corrin" || rosterById.get(otherId)?.gender !== "female") continue;
      motherRoutes.set(otherId, [...new Set([...(motherRoutes.get(otherId) ?? []), ...support.routes])] as Route[]);
    }
    const variableParentOptions = [...motherRoutes].map(([motherId, routes]) => {
      const resolution = resolveMotherClass(child, motherId, classAccessById);
      return {
        unitId: motherId,
        routes: intersect(childRoster.availableRoutes, routes),
        inheritedClassId: resolution.classId,
        inheritedClassReason: resolution.reason,
        ...(motherId === "corrin" ? { siblingUnitId: "kana" } : {}),
        ...(motherId === "azura" ? { siblingUnitId: "shigure" } : {}),
      };
    }).filter((option: any) => option.routes.length > 0);
    if (!variableParentOptions.length) throw new Error(`No variable parents resolved for ${child.id}`);

    return {
      unitId: child.id,
      fixedParentUnitId: child.fixedParentId,
      variableParentRole: "mother",
      variableParentOptions,
      fixedInheritedClassId: child.fixedClassId,
      childBaseClassId: child.baseClassId,
      childBaseGrowth: child.childGrowth,
      ...(child.id === "caeldori"
        ? { notes: ["If Selena is Caeldori's mother, their A-rank support uses special dialogue."] }
        : {}),
      personalSkill: { id: child.skill.id, names: { en: child.skill.en, zhHans: child.skill.zhHans }, effect: child.skill.effect },
      formulas: acceptedDwyerParentage.formulas,
      supports: buildChildSupports(child, rosterById, childById),
      provenance: [
        { sourceId: "fewiki-fe14-offspring-stats", locator: `${childRoster.displayName}/Stats > inheritance formulas and parent options`, fields: ["variableParentOptions", "childBaseGrowth", "formulas"], reviewStatus: "corroborated" },
        { sourceId: "serenes-fe14-offspring-rules", locator: `Children > ${childRoster.displayName}; supports and class-changing rules`, fields: ["fixedInheritedClassId", "childBaseClassId", "supports", "variableParentOptions"], reviewStatus: "accepted" },
        ...(child.id === "nina" || child.id === "percy"
          ? [{ sourceId: "serenes-fe14-nohrian-class-sets", locator: `Children > ${childRoster.displayName}; exhaustive class-collision fallback`, fields: ["variableParentOptions"], reviewStatus: "accepted" }]
          : []),
        ...(child.id === "nina"
          ? [{ sourceId: "rrpg-fe14-child-class-inheritance", locator: "素質の継承 > ゼロ x ニュクス", fields: ["variableParentOptions"], reviewStatus: "corroborated" }]
          : child.id === "percy"
            ? [{ sourceId: "aniwotawiki-fe14-beruka-percy-inheritance", locator: "性能 > ハロルドと結婚した場合", fields: ["variableParentOptions"], reviewStatus: "corroborated" }]
            : []),
      ],
    };
  });

  const shigureFatherOptions = supportRelationships.flatMap((support: any) => {
    if (support.kind !== "romantic") return [];
    const fatherId = support.unitId === "azura"
      ? support.partnerUnitId
      : support.partnerUnitId === "azura" ? support.unitId : undefined;
    if (!fatherId) return [];
    if (fatherId === "corrin") {
      if (support.partnerGender !== "male") return [];
    } else if (rosterById.get(fatherId)?.gender !== "male") return [];
    const inherited = resolveShigureFatherClass(fatherId, classAccessById);
    const fixedInherited = inherited.classId === "troubadour"
      ? { classId: "wyvern_rider", reason: "parallel_class_fallback" }
      : { classId: "troubadour", reason: "parallel_class_fallback" };
    return [{
      unitId: fatherId,
      routes: intersect(shigureRoster.availableRoutes, support.routes),
      inheritedClassId: inherited.classId,
      inheritedClassReason: inherited.reason,
      ...(fixedInherited.classId !== shigure.fixedClassId
        ? { fixedInheritedClassId: fixedInherited.classId, fixedInheritedClassReason: fixedInherited.reason }
        : {}),
      siblingUnitId: siblingByFather[fatherId],
    }];
  }).sort((left: any, right: any) => rosterById.get(left.unitId).unitNo - rosterById.get(right.unitId).unitNo);

  if (shigureFatherOptions.length !== 20) throw new Error(`Expected 20 Shigure fathers, found ${shigureFatherOptions.length}`);
  const shigureParentage = {
    unitId: "shigure",
    fixedParentUnitId: "azura",
    variableParentRole: "father",
    variableParentOptions: shigureFatherOptions,
    fixedInheritedClassId: "troubadour",
    childBaseClassId: "sky_knight",
    childBaseGrowth: shigure.childGrowth,
    notes: [
      "Shigure always inherits Dragon Vein access from Azura. Corrin adds the Dragon unit trait; Kaden or Keaton adds the Beast unit trait.",
      "The selected father's linked offspring becomes Shigure's sibling and replaces any friendship or romantic support between them.",
      "Jakob is the class-inheritance exception: Jakob gives Shigure Troubadour, so Azura's otherwise duplicated inheritance resolves to Wyvern Rider.",
    ],
    personalSkill: { id: shigure.skill.id, names: { en: shigure.skill.en, zhHans: shigure.skill.zhHans }, effect: shigure.skill.effect },
    formulas: {
      personalGrowth: "floor((child_base + variable_parent) / 2)",
      capModifiers: "fixed_parent + variable_parent + 1",
      attackStanceRanks: { C: "fixed_parent", B: "variable_parent", A: "fixed_parent", S: "variable_parent" },
      guardStanceRanks: { C: "variable_parent", B: "fixed_parent", A: "variable_parent", S: "fixed_parent" },
    },
    supports: buildShigureSupports(shigure, shigureFatherOptions, rosterById),
    provenance: [
      { sourceId: "fewiki-fe14-offspring-stats", locator: "Shigure/Stats > father options, level-10 personal bases, inheritance rules, and sibling substitutions", fields: ["variableParentOptions", "childBaseGrowth", "formulas"], reviewStatus: "corroborated" },
      { sourceId: "serenes-fe14-offspring-rules", locator: "Shigure class set, support matrix, support bonuses, and Jakob inheritance exception", fields: ["fixedInheritedClassId", "childBaseClassId", "supports", "variableParentOptions"], reviewStatus: "accepted" },
      { sourceId: "serenes-fe14-nohrian-class-sets", locator: "Shared Characters > Jakob and Azura; Shared Children > Shigure; child inheritance rules", fields: ["fixedInheritedClassId", "variableParentOptions"], reviewStatus: "accepted" },
      { sourceId: "aniwotawiki-fe14-shigure-inheritance", locator: "性能 > ジョーカー父", fields: ["fixedInheritedClassId", "variableParentOptions"], reviewStatus: "corroborated" },
      { sourceId: "pegasusknight-fe14-child-units", locator: "シグレ > parent-dependent traits and inheritance", fields: ["variableParentOptions", "notes"], reviewStatus: "corroborated" },
    ],
  };

  const kanaParentage = buildKanaParentage({
    rosterById,
    supportRelationships,
    classAccessById,
    secondRosterUnits: secondRoster.units,
  });

  const generatedRecruitment = generatedChildren.map((child) => {
    const roster = rosterById.get(child.id);
    const baseProfile = classProfiles[child.baseClassId];
    const tree = classTreeById.get(child.baseClassId);
    if (!baseProfile || !tree) throw new Error(`Missing class data for ${child.id}: ${child.baseClassId}`);
    const promotionOptions = tree.promotions.map((promotion: any) => {
      const promoted = classProfiles[promotion.id];
      if (!promoted) throw new Error(`Missing promotion profile: ${promotion.id}`);
      const primaryWeaponId = baseProfile.weapons[0];
      return {
        classId: promotion.id,
        displayName: child.baseClassId === "troubadour" && promotion.id === "attendant" ? "Butler" : promoted.displayName,
        ...(child.id === "kana" ? {
          routes: promotion.id === "hoshido_noble"
            ? ["birthright", "revelation"]
            : ["conquest", "revelation"],
        } : {}),
        classBaseStats: promoted.base,
        classGrowthRates: promoted.growth,
        promotionGains: subtract(promoted.base, baseProfile.base),
        primaryWeaponId,
        secondaryWeaponIds: promoted.weapons.filter((weapon) => weapon !== primaryWeaponId),
        learnedSkills: promoted.skills.map(([level, skillId, displayName]) => ({ level, skillId, displayName })),
      };
    });
    return {
      unitId: child.id,
      paralogueNo: roster.paralogueNo,
      paralogueTitle: roster.paralogueTitle,
      initialFaction: child.recruitment.initialFaction,
      recruitment: {
        description: child.recruitment.description,
        ...(child.recruitment.talkUnitId ? { talkUnitId: child.recruitment.talkUnitId } : {}),
        automaticAtMapEndIfSurvives: child.recruitment.automaticAtMapEndIfSurvives,
        deathBeforeRecruitmentIsPermanent: child.recruitment.deathBeforeRecruitmentIsPermanent,
      },
      ...(child.recruitment.notes ? { recruitmentNotes: child.recruitment.notes } : {}),
      startingClassId: child.baseClassId,
      level10PersonalBases: child.personalBases,
      level10MinimumStatsBeforeInheritance: stats(Object.keys(child.personalBases).map((key) => child.personalBases[key as keyof StatBlock] + baseProfile.base[key as keyof StatBlock])),
      weaponRanks: child.recruitment.weaponRanks,
      inventory: child.recruitment.inventory,
      startingClassGrowthRates: baseProfile.growth,
      baseStatFormula: acceptedDwyerRecruitment.baseStatFormula,
      levelByStoryPosition: acceptedDwyerRecruitment.levelByStoryPosition,
      mapLevelScaling: childMapLevelScaling,
      offspringSeal: { ...acceptedDwyerRecruitment.offspringSeal, promotionOptions },
      provenance: [
        { sourceId: "fewiki-fe14-offspring-units", locator: `${roster.displayName} > Fates recruitment, inventory, and starting ranks`, fields: ["recruitment", "inventory", "weaponRanks"], reviewStatus: "corroborated" },
        { sourceId: "fewiki-fe14-offspring-stats", locator: `${roster.displayName}/Stats > level-10 bases and scaling`, fields: ["level10PersonalBases", "level10MinimumStatsBeforeInheritance", "levelByStoryPosition", "offspringSeal"], reviewStatus: "corroborated" },
        { sourceId: "fewiki-fe14-classes", locator: `${baseProfile.displayName} and promotion rows`, fields: ["startingClassGrowthRates", "offspringSeal.promotionOptions"], reviewStatus: "accepted" },
        { sourceId: "ltranc-fe14-map-level-scaling", locator: "Children: internal level 10 and map-level / Offspring Seal relationship", fields: ["mapLevelScaling", "levelByStoryPosition", "offspringSeal"], reviewStatus: "accepted" },
      ],
    };
  });

  await Promise.all([
    writeJson("child-parentage.json", [kanaParentage, shigureParentage, acceptedDwyerParentage, ...generatedParentage]),
    writeJson("child-recruitment.json", [generatedRecruitment[0], generatedRecruitment[1], acceptedDwyerRecruitment, ...generatedRecruitment.slice(2)]),
    writeJson("units/second-generation.json", secondRoster),
  ]);
}

function buildKanaParentage({
  rosterById,
  supportRelationships,
  classAccessById,
  secondRosterUnits,
}: {
  rosterById: Map<string, any>;
  supportRelationships: any[];
  classAccessById: Map<string, any>;
  secondRosterUnits: any[];
}) {
  const options: any[] = [];
  for (const support of supportRelationships) {
    if (support.kind !== "romantic" || support.partnerUnitId !== "corrin") continue;
    const spouse = rosterById.get(support.unitId);
    if (!spouse || (spouse.gender !== "female" && spouse.gender !== "male")) continue;
    const corrinGender: Gender = spouse.gender === "male" ? "female" : "male";
    if (support.partnerGender !== corrinGender) continue;
    const candidates = parentClassCandidates(spouse.id, classAccessById);
    options.push(kanaParentOption(spouse, support.routes, "first", candidates));
  }
  for (const spouse of secondRosterUnits) {
    if (spouse.id === "kana") continue;
    const [primaryClassId, secondaryClassId] = childClassSets[spouse.id] ?? [];
    if (!primaryClassId) throw new Error(`Missing offspring class set for Kana parent ${spouse.id}`);
    const candidates = { primaryClassId, secondaryClassId };
    options.push(kanaParentOption(spouse, spouse.availableRoutes, "second", candidates));
  }
  options.sort((left, right) => rosterById.get(left.unitId).unitNo - rosterById.get(right.unitId).unitNo);

  const supports: any[] = [
    { partnerUnitId: "corrin", kind: "family", ranks: ["C", "B", "A"], routes: ["birthright", "conquest", "revelation"], condition: "always" },
    ...options.map((option) => ({
      partnerUnitId: option.unitId,
      unitGender: option.childGender,
      kind: "family",
      ranks: ["C", "B", "A"],
      routes: option.routes,
      condition: "selected_variable_parent",
    })),
  ];
  const friendships: Record<Gender, string[]> = {
    male: ["shiro", "siegbert", "percy"],
    female: ["midori", "mitama", "selkie", "velouria"],
  };
  for (const childGender of ["male", "female"] as Gender[]) {
    for (const partnerId of friendships[childGender]) {
      const routes = intersect(rosterById.get("kana").availableRoutes, rosterById.get(partnerId).availableRoutes);
      supports.push({
        partnerUnitId: partnerId,
        unitGender: childGender,
        kind: "friendship",
        ranks: ["C", "B", "A", "A+"],
        routes,
        condition: "always",
        sealGrant: kanaSealGrant(partnerId, "friendship"),
      });
    }
    for (const partner of secondRosterUnits) {
      if (partner.id === "kana" || partner.gender === childGender) continue;
      supports.push({
        partnerUnitId: partner.id,
        unitGender: childGender,
        kind: "romantic",
        ranks: ["C", "B", "A", "S"],
        routes: rosterById.get(partner.id).availableRoutes,
        condition: "always",
        sealGrant: kanaSealGrant(partner.id, "partner"),
      });
    }
  }

  return {
    unitId: "kana",
    fixedParentUnitId: "corrin",
    variableParentRole: "parent",
    scenarioKind: "avatar_child",
    variableParentOptions: options,
    fixedInheritedClassId: "avatar_talent",
    childBaseClassId: "nohr_prince",
    childBaseGrowth: kana.childGrowth,
    notes: [
      "Kana's gender is opposite Corrin's gender. Same-sex Corrin pairings with Niles or Rhajat do not unlock this paralogue.",
      "When Corrin's spouse is an offspring unit, resolve that spouse's own variable parent first. Kana then uses the spouse's resolved growths, cap modifiers, support bonuses, and Dragon or Beast traits.",
      "Kana omits the usual +1 cap-modifier inheritance bonus when Corrin's spouse is an offspring unit.",
      "Class inheritance follows child, father, then mother order. Corrin contributes the selected Avatar Talent; a duplicate Talent can therefore change the spouse fallback or leave male Kana without a third inherited tree.",
    ],
    personalSkill: { id: kana.skill.id, names: { en: kana.skill.en, zhHans: kana.skill.zhHans }, effect: kana.skill.effect },
    formulas: {
      personalGrowth: "floor((child_base + variable_parent) / 2)",
      capModifiers: "fixed_parent + variable_parent + generation_bonus",
      attackStanceRanks: { C: "actual_mother", B: "actual_father", A: "actual_mother", S: "actual_father" },
      guardStanceRanks: { C: "actual_father", B: "actual_mother", A: "actual_father", S: "actual_mother" },
    },
    supports,
    provenance: [
      { sourceId: "fewiki-fe14-offspring-stats", locator: "Kana/Stats > level-10 bases, inheritance, and parent-dependent values", fields: ["childBaseGrowth", "formulas", "variableParentOptions"], reviewStatus: "corroborated" },
      { sourceId: "serenes-fe14-offspring-rules", locator: "Kana class set, gender-specific supports, and Corrin Talent inheritance", fields: ["fixedInheritedClassId", "childBaseClassId", "supports", "variableParentOptions"], reviewStatus: "accepted" },
      { sourceId: "atwiki-fe14-child-pairings", locator: "主人公♀/カンナ♂ and 主人公♂/カンナ♀ > spouse growths, Beast inheritance, and grandchild cap exception", fields: ["variableParentOptions", "formulas", "notes"], reviewStatus: "corroborated" },
      { sourceId: "atwiki-fe14-kana-family-support", locator: "■支援会話 > Corrin marries one of Azura's offspring", fields: ["supports", "notes"], reviewStatus: "disputed" },
      { sourceId: "pegasusknight-fe14-kana-family-support", locator: "支援ランク一覧 > 親によって支援が変化するユニット", fields: ["supports", "notes"], reviewStatus: "accepted" },
      { sourceId: "reddit-fe14-kana-azura-clause", locator: "Firsthand localized-game report: Shigure!Kana and Azura!Midori", fields: ["supports", "notes"], reviewStatus: "corroborated" },
    ],
  };
}

function kanaParentOption(
  spouse: any,
  routes: Route[],
  parentGeneration: "first" | "second",
  candidates: { primaryClassId: string; secondaryClassId?: string },
) {
  const childGender = spouse.gender as Gender;
  const owned = new Set(["nohr_prince"]);
  if (childGender === "female") owned.add(genderParallelClass("cavalier", childGender));
  const resolved = resolveClassCandidates(candidates, owned, childGender);
  if (!resolved.classId) throw new Error(`Kana has no default inherited class from ${spouse.id}`);
  return {
    unitId: spouse.id,
    routes,
    childGender,
    parentGeneration,
    inheritedClassId: resolved.classId,
    inheritedClassReason: resolved.reason,
    inheritanceClassCandidates: candidates,
    ...(spouse.id === "azura" ? { siblingUnitId: "shigure" } : {}),
    ...(childGender === "male" && siblingByFather[spouse.id] ? { siblingUnitId: siblingByFather[spouse.id] } : {}),
  };
}

function parentClassCandidates(parentId: string, classAccessById: Map<string, any>) {
  const access = classAccessById.get(parentId);
  if (!access?.baseClassSet[0]) throw new Error(`Missing Kana parent class access for ${parentId}`);
  return {
    primaryClassId: access.baseClassSet[0],
    ...(access.heartSealClassSet[0] ? { secondaryClassId: access.heartSealClassSet[0] } : {}),
  };
}

function kanaSealGrant(partnerId: string, seal: "friendship" | "partner") {
  const [primaryClassId, secondaryClassId] = childClassSets[partnerId] ?? [];
  if (!primaryClassId) throw new Error(`Missing Kana support class set for ${partnerId}`);
  return {
    seal,
    borrowedClassId: primaryClassId,
    grantedClassId: primaryClassId,
    resolution: "variable",
    classCandidates: { primaryClassId, secondaryClassId },
  };
}

function resolveClassCandidates(
  candidates: { primaryClassId: string; secondaryClassId?: string },
  owned: Set<string>,
  gender: Gender,
) {
  const primary = genderParallelClass(candidates.primaryClassId, gender);
  const secondary = genderParallelClass(candidates.secondaryClassId, gender);
  if (!inheritanceRestricted.has(candidates.primaryClassId) && !owned.has(primary)) {
    return { classId: primary, reason: primary !== candidates.primaryClassId ? "gender_parallel" : "direct" };
  }
  const reason = inheritanceRestricted.has(candidates.primaryClassId) ? "restricted_primary_fallback" : "duplicate_primary_fallback";
  if (secondary && !owned.has(secondary)) {
    return { classId: secondary, reason: secondary !== candidates.secondaryClassId ? "gender_parallel" : reason };
  }
  const fallback = parallelClass[primary];
  return { classId: fallback ? genderParallelClass(fallback, gender) : undefined, reason: "parallel_class_fallback" };
}

function resolveMotherClass(child: ChildConfig, motherId: string, classAccessById: Map<string, any>) {
  if (motherId === "corrin") return { classId: "nohr_prince", reason: "direct" };
  const access = classAccessById.get(motherId);
  if (!access) throw new Error(`Missing class access for mother ${motherId}`);
  const rawPrimary = access.baseClassSet[0];
  const rawSecondary = access.heartSealClassSet[0];
  if (!rawPrimary) throw new Error(`Missing base class tree for mother ${motherId}`);
  const primary = genderParallelClass(rawPrimary, child.gender);
  const secondary = genderParallelClass(rawSecondary, child.gender);
  const owned = new Set([child.baseClassId, child.fixedClassId]);
  if (!inheritanceRestricted.has(rawPrimary) && !owned.has(primary)) {
    return { classId: primary, reason: primary !== rawPrimary ? "gender_parallel" : "direct" };
  }
  const reason = inheritanceRestricted.has(rawPrimary) ? "restricted_primary_fallback" : "duplicate_primary_fallback";
  if (!owned.has(secondary)) {
    return { classId: secondary, reason: secondary !== rawSecondary ? "gender_parallel" : reason };
  }
  const fallback = parallelClass[primary];
  if (!fallback) throw new Error(`No parallel inheritance fallback for ${child.id} from ${motherId}`);
  return { classId: genderParallelClass(fallback, child.gender), reason: "parallel_class_fallback" };
}

function resolveShigureFatherClass(fatherId: string, classAccessById: Map<string, any>) {
  if (fatherId === "corrin") return { classId: "nohr_prince", reason: "direct" };
  const access = classAccessById.get(fatherId);
  if (!access) throw new Error(`Missing class access for Shigure father ${fatherId}`);
  const rawPrimary = access.baseClassSet[0];
  const rawSecondary = access.heartSealClassSet[0];
  const primary = genderParallelClass(rawPrimary, "male");
  const secondary = genderParallelClass(rawSecondary, "male");
  if (!inheritanceRestricted.has(rawPrimary) && primary !== shigure.baseClassId) {
    return { classId: primary, reason: primary !== rawPrimary ? "gender_parallel" : "direct" };
  }
  if (secondary && secondary !== shigure.baseClassId) {
    return {
      classId: secondary,
      reason: secondary !== rawSecondary
        ? "gender_parallel"
        : inheritanceRestricted.has(rawPrimary) ? "restricted_primary_fallback" : "duplicate_primary_fallback",
    };
  }
  const fallback = parallelClass[inheritanceRestricted.has(rawPrimary) ? primary : secondary];
  if (!fallback) throw new Error(`No Shigure inheritance fallback for father ${fatherId}`);
  return { classId: genderParallelClass(fallback, "male"), reason: "parallel_class_fallback" };
}

function genderParallelClass(classId: string | undefined, gender: Gender) {
  if (classId === "shrine_maiden" && gender === "male") return "monk";
  if (classId === "monk" && gender === "female") return "shrine_maiden";
  return classId;
}

function buildChildSupports(child: ChildConfig, rosterById: Map<string, any>, childById: Map<string, ChildConfig>) {
  const childRoutes = rosterById.get(child.id).availableRoutes as Route[];
  const supports: any[] = [{ partnerUnitId: child.fixedParentId, kind: "family", ranks: ["C", "B", "A"], routes: childRoutes, condition: "always" }];
  for (const corrinGender of ["female", "male"] as Gender[]) {
    const romantic = child.id === "rhajat" || corrinGender !== child.gender;
    supports.push({
      partnerUnitId: "corrin", partnerGender: corrinGender, kind: romantic ? "romantic" : "platonic",
      ranks: romantic ? ["C", "B", "A", "S"] : ["C", "B", "A"], routes: childRoutes, condition: "always",
      ...(romantic ? { sealGrant: sealGrant(child, "corrin", "partner", corrinGender) } : {}),
    });
  }
  const friendshipPartnerIds = [...new Set([
    ...child.aPlus,
    ...(revelationFriendships[child.id] ? [revelationFriendships[child.id]] : []),
  ])];
  for (const partnerId of friendshipPartnerIds) {
    const partnerGender = partnerId === "kana" ? child.gender : undefined;
    const routes = intersect(childRoutes, rosterById.get(partnerId).availableRoutes);
    supports.push({ partnerUnitId: partnerId, ...(partnerGender ? { partnerGender } : {}), kind: "friendship", ranks: ["C", "B", "A", "A+"], routes, condition: "always", sealGrant: sealGrant(child, partnerId, "friendship", partnerGender) });
  }
  for (const partner of rosterById.values()) {
    if (partner.generation !== "second" || partner.id === child.id || partner.id === "kana") continue;
    const partnerGender = partner.gender as Gender;
    if (partnerGender === child.gender) continue;
    const routes = intersect(childRoutes, partner.availableRoutes);
    if (!routes.length) continue;
    const revelationOnly = routes.length === 1 && routes[0] === "revelation";
    if (revelationOnly && !revelationRomances[child.id]?.includes(partner.id)) continue;
    supports.push({ partnerUnitId: partner.id, kind: "romantic", ranks: ["C", "B", "A", "S"], routes, condition: "always", sealGrant: sealGrant(child, partner.id, "partner") });
  }
  const oppositeKanaGender: Gender = child.gender === "male" ? "female" : "male";
  supports.push({ partnerUnitId: "kana", partnerGender: oppositeKanaGender, kind: "romantic", ranks: ["C", "B", "A", "S"], routes: childRoutes, condition: "always", sealGrant: sealGrant(child, "kana", "partner", oppositeKanaGender) });
  return supports;
}

function buildShigureSupports(shigureConfig: ChildConfig, fatherOptions: any[], rosterById: Map<string, any>) {
  const routes = rosterById.get("shigure").availableRoutes as Route[];
  const supports: any[] = [
    { partnerUnitId: "azura", kind: "family", ranks: ["C", "B", "A"], routes, condition: "always" },
    { partnerUnitId: "corrin", partnerGender: "male", kind: "platonic", ranks: ["C", "B", "A"], routes, condition: "always" },
    { partnerUnitId: "corrin", partnerGender: "female", kind: "romantic", ranks: ["C", "B", "A", "S"], routes, condition: "always", sealGrant: sealGrant(shigureConfig, "corrin", "partner", "female") },
  ];
  for (const option of fatherOptions) {
    supports.push({ partnerUnitId: option.unitId, kind: "family", ranks: ["C", "B", "A"], routes: option.routes, condition: "selected_variable_parent" });
  }
  for (const partnerId of shigureConfig.aPlus) {
    const supportRoutes = intersect(routes, rosterById.get(partnerId).availableRoutes);
    supports.push({ partnerUnitId: partnerId, kind: "friendship", ranks: ["C", "B", "A", "A+"], routes: supportRoutes, condition: "always", sealGrant: sealGrant(shigureConfig, partnerId, "friendship") });
  }
  for (const partner of rosterById.values()) {
    if (partner.generation !== "second" || partner.id === "shigure" || partner.id === "kana" || partner.gender !== "female") continue;
    const supportRoutes = intersect(routes, partner.availableRoutes);
    supports.push({ partnerUnitId: partner.id, kind: "romantic", ranks: ["C", "B", "A", "S"], routes: supportRoutes, condition: "always", sealGrant: sealGrant(shigureConfig, partner.id, "partner") });
  }
  supports.push({ partnerUnitId: "kana", partnerGender: "female", kind: "romantic", ranks: ["C", "B", "A", "S"], routes, condition: "always", sealGrant: sealGrant(shigureConfig, "kana", "partner", "female") });
  return supports;
}

function sealGrant(receiver: ChildConfig, partnerId: string, seal: "friendship" | "partner", partnerGender?: Gender) {
  if (partnerId === "corrin" || partnerId === "kana") {
    return { seal, borrowedClassId: partnerId === "corrin" ? "avatar_talent" : "nohr_prince", grantedClassId: "avatar_talent", resolution: "variable" };
  }
  const partnerClasses = childClassSets[partnerId];
  if (!partnerClasses) throw new Error(`Missing child class set for ${partnerId}`);
  const [primary, secondary] = partnerClasses;
  let grantedClassId = primary;
  let resolution = "direct";
  if (primary === receiver.baseClassId) {
    grantedClassId = secondary;
    resolution = "duplicate_primary_fallback";
  } else if (sealRestricted.has(primary)) {
    grantedClassId = secondary;
    resolution = "restricted_primary_fallback";
    if (secondary === receiver.baseClassId) {
      grantedClassId = parallelClass[primary];
      resolution = "parallel_class_fallback";
    }
  }
  if (grantedClassId === "shrine_maiden" && receiver.gender === "male") {
    grantedClassId = "monk";
    resolution = "gender_parallel";
  } else if (grantedClassId === "monk" && receiver.gender === "female") {
    grantedClassId = "shrine_maiden";
    resolution = "gender_parallel";
  }
  return { seal, borrowedClassId: primary, grantedClassId, resolution };
}

async function writeJson(file: string, value: unknown) {
  await writeFile(path.join(normalized, file), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

await main();

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SourceRow = {
  section: string;
  cells: string[];
  sourceId: string;
  sourceFile: string;
  sourceTable: number;
  sourceRow: number;
  image?: { filePageUrl?: string; imageUrl?: string; alt?: string };
};

type SourceInventory = {
  sources: {
    fewikiWeapons: SourceRow[];
    fcfantasy: SourceRow[];
    serenes: SourceRow[];
    japanese: SourceRow[];
  };
};

const sourcePath = path.join(process.cwd(), "data/sources/fe14/weapon-item-source-inventory.json");
const normalizedPath = path.join(process.cwd(), "data/normalized/fe14/weapons.json");
const reportPath = path.join(process.cwd(), "data/reports/fe14/weapon-candidate-normalization.md");

const familyMetadata = [
  ["Sword", "sword", "sword", 1], ["Katana", "sword", "katana", 2],
  ["Lance", "lance", "lance", 3], ["Naginata", "lance", "naginata", 4],
  ["Axe", "axe", "axe", 5], ["Club", "axe", "club", 6],
  ["Dagger", "dagger", "dagger", 7], ["Shuriken", "dagger", "shuriken", 8],
  ["Bow", "bow", "bow", 9], ["Yumi", "bow", "yumi", 10],
  ["Tome", "tome", "tome", 11], ["Scroll", "tome", "scroll", 12],
  ["Staff", "staff", "staff", 13], ["Rod", "staff", "rod", 14],
  ["Dragonstone", "dragonstone", "dragonstone", 15], ["Beaststone", "beaststone", "beaststone", 16],
] as const;

const familyBySourceSection = new Map(familyMetadata.map(([section, weaponTypeId, familyId, displayOrder]) => [
  section,
  { weaponTypeId, familyId, displayOrder },
]));

const reviewedJapaneseTranslations: Record<string, { zhHans: string; descriptionZhHans: string }> = {
  Heal: { zhHans: "治疗", descriptionZhHans: "使一名友军的HP恢复[10+魔力/3]。" },
  Mend: { zhHans: "复原", descriptionZhHans: "使一名友军的HP恢复[20+魔力/3]。" },
  Physic: { zhHans: "远程治疗", descriptionZhHans: "使一名友军的HP恢复[7+魔力/3]。" },
  Recover: { zhHans: "回复", descriptionZhHans: "使一名友军的HP恢复[30+魔力/3]。" },
  Fortify: { zhHans: "全体治疗", descriptionZhHans: "使范围内所有友军的HP恢复[7+魔力/3]。" },
  Freeze: { zhHans: "冰冻", descriptionZhHans: "令一名敌人的移动力变为0、回避−20（1回合）。" },
  Enfeeble: { zhHans: "虚弱", descriptionZhHans: "令一名敌人的所有能力−4（随回合经过恢复）。" },
  Entrap: { zhHans: "拖拽", descriptionZhHans: "将一名敌人传送至自身相邻的位置。" },
  "Bifröst": { zhHans: "彩虹桥", descriptionZhHans: "复活当前地图中最后一名阵亡的友军。" },
  "Candy Cane": { zhHans: "糖果", descriptionZhHans: "使一名友军恢复10点HP，自己再恢复5点HP。" },
  "Mushroom Staff": { zhHans: "蘑菇", descriptionZhHans: "使一名友军恢复15点HP，自己魔防+2（本章期间）。" },
  "Bouquet Staff": { zhHans: "花束", descriptionZhHans: "使一名友军恢复20点HP，该友军幸运+4（本章期间）。" },
  "Elise's Staff": { zhHans: "艾丽泽的幼", descriptionZhHans: "使一名友军恢复10点HP。" },
  "Lilith's Staff": { zhHans: "莉莉丝的星", descriptionZhHans: "使范围内所有友军恢复7点HP。" },
  "Bloom Festal": { zhHans: "春祭", descriptionZhHans: "使一名友军的HP恢复[7+魔力/3]。" },
  "Sun Festal": { zhHans: "夏祭", descriptionZhHans: "使一名友军的HP恢复[14+魔力/3]。" },
  "Wane Festal": { zhHans: "秋祭", descriptionZhHans: "使一名友军的HP恢复[2+魔力/3]。" },
  "Moon Festal": { zhHans: "冬祭", descriptionZhHans: "使一名友军的HP恢复[25+魔力/3]。" },
  "Great Festal": { zhHans: "大祭", descriptionZhHans: "使范围内所有友军的HP恢复[2+魔力/3]。" },
  Rescue: { zhHans: "七难即灭", descriptionZhHans: "将一名友军传送至自身相邻的位置。" },
  Silence: { zhHans: "神风招来", descriptionZhHans: "封锁一名敌人的魔道书、咒、魔法武器及杖／祓串使用（1回合）。" },
  "Hexing Rod": { zhHans: "祸事罪秽", descriptionZhHans: "使一名敌人的最大HP减半（本章期间）。" },
  Lantern: { zhHans: "灯笼", descriptionZhHans: "使一名友军恢复7点HP。" },
  "Dumpling Rod": { zhHans: "团子串", descriptionZhHans: "使一名友军恢复10点HP；持有者自身也可使用。" },
  "Bamboo Branch": { zhHans: "竹饰", descriptionZhHans: "使一名友军恢复15点HP，周围2格内友军幸运+8（1回合）。" },
  "Sakura's Rod": { zhHans: "樱的小", descriptionZhHans: "使一名友军恢复7点HP。" },
  "Purification Rod": { zhHans: "浅间的扭曲", descriptionZhHans: "使一名友军恢复30点HP。" },
  Dragonstone: { zhHans: "龙石", descriptionZhHans: "装备时技巧−3、速度−2、防御+4、魔防+3；魔法武器，以魔力与魔防计算伤害；无法追击。" },
  "Dragonstone+": { zhHans: "真龙石", descriptionZhHans: "装备时技巧−5、速度−4、防御+9、魔防+7；魔法武器，以魔力与魔防计算伤害；无法追击；战斗后，魔法与技巧各−2（可叠加；每回合恢复1点）。" },
  Beaststone: { zhHans: "兽石", descriptionZhHans: "装备时技巧+5、速度+3、防御−2。" },
  Beastrune: { zhHans: "守兽石", descriptionZhHans: "装备时技巧−2、速度−1、防御+4、魔防+5。" },
  "Beaststone+": { zhHans: "超兽石", descriptionZhHans: "装备时技巧+8、速度+6、防御−5、魔防−3；战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。" },
  "Water Splash": { zhHans: "水之飞沫", descriptionZhHans: "魔法武器，以魔力与魔防计算伤害；无法追击；无法与他人交换（可调整行动顺序）。" },
  "Astral Blessing": { zhHans: "星辰祝福", descriptionZhHans: "使一名友军的HP恢复[7+魔力/3]；无法交换。" },
  Pebble: { zhHans: "小石", descriptionZhHans: "" },
};

const approvedChineseDescriptions: Record<string, string> = {
  "Bronze Sword": "无法发动必杀或奥义。",
  "Steel Sword": "有效速度−3。",
  "Silver Sword": "如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。",
  "Brave Sword": "装备时，防御−4、魔防−4。发动攻击时，连续攻击2次。",
  Armorslayer: "敌方为重甲单位时，威力×3。敌方为非重甲单位时，威力−4、命中−10。",
  Wyrmslayer: "敌方为龙族单位时，威力×3。敌方为非龙族单位时，威力−4、命中−10。",
  "Killing Edge": "必杀伤害为×4，而非×3。",
  "Levin Sword": "魔法武器。无法发动必杀或奥义。",
  "Ganglari (original)": "仅限神威使用。无法交换。",
  Siegfried: "仅限马库斯使用。防御+4。无法出售。",
  Umbrella: "敌方有效速度+5。无法追击。",
  "Nohrian Blade": "防御+3。",
  "Leo's Iceblade": "魔法武器。命中敌人后，战斗后，魔法与技巧各−2（可叠加；每回合恢复1点）。",
  "Selena's Blade": "有效速度−3。",
  "Laslow's Blade": "速度+3。装备时，防御−3、魔防−3。",
  "Ganglari (upgraded)": "命中敌人后，战斗后受到自身最大HP20%的伤害。",
  "Falchion (Marth)": "敌方为龙族单位时，威力×3。使用后，恢复10HP。无法交换。",
  Ragnell: "防御+3。有效速度−3。无法交换。",
  "Parallel Falchion": "敌方为龙族单位时，威力×3。使用后，恢复10HP。无法交换。有效速度+3。",
  "Ike's Backup": "防御+3。有效速度−3。",
  "Lucina's Estoc": "有效速度+3。",
  "Falchion (Chrom)": "敌方为龙族单位时，威力×3。无法交换。",
  "Brass Katana": "无法发动必杀或奥义。",
  "Steel Katana": "有效速度−3。",
  "Silver Katana": "如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。",
  "Venge Katana": "敌方发动攻击时，威力×2。",
  Kodachi: "敌方有效速度+5。无法追击。无法发动必杀或奥义。",
  Wakizashi: "敌方有效速度+5。无法追击。",
  "Axe Splitter": "敌方正使用的武器为斧时，威力×3。敌方正使用的武器不为斧时，威力−4、命中−10。",
  "Dual Katana": "反转武器三角，并将其效果×2。",
  "Practice Katana": "速度+5。装备时，防御−1、魔防−1。",
  "Spirit Katana": "速度+1。装备时，防御−4、魔防−4。敌方为魔物单位时，威力×3。回合开始时，恢复10HP。",
  "Hagakure Blade": "发动攻击后，力量减半，直至下次主动发起的战斗后。",
  Yato: "仅限神威使用。无法出售。",
  "Noble Yato": "仅限神威使用。力量+2、速度+2。无法出售。",
  "Blazing Yato": "仅限神威使用。力量+4、速度+4。无效化【龙鳞】的效果。无法出售。",
  "Grim Yato": "仅限神威使用。防御+2、魔防+2。无法出售。",
  "Shadow Yato": "仅限神威使用。防御+4、魔防+4。无效化【龙鳞】的效果。无法出售。",
  "Alpha Yato": "仅限神威使用。力量+2、速度+2、防御+2、魔防+2。无法出售。",
  "Omega Yato": "仅限神威使用。力量+4、速度+4、防御+4、魔防+4。无效化【龙鳞】的效果。无法出售。",
  Raijinto: "仅限龙马使用。力量+4。无法出售。",
  Parasol: "敌方有效速度+5。无法追击。",
  "Raider Katana": "命中时，若使用者处于武器相克优势，则令敌人脱衣。有效速度+3。",
  "Takumi's Shinai": "速度+1。装备时，防御−3、魔防−3。无法击败敌人，改为使其HP保留1点。无法追击。",
  "Hana's Katana": "敌方发动攻击时，威力×2。无法追击。",
  "Hinata's Katana": "速度+1。装备时，防御−3、魔防−3。发动攻击时，威力×2。无法追击。",
};

const completedChineseDescriptions: Record<string, string> = {
  "Iron Sword": "标准制式剑。",
  "Iron Axe": "标准制式斧。",
  Aurgelmir: "发动攻击后，力量减半，直至下次主动发起的战斗后。",
  "Berserker's Axe": "战斗后，使用者损失最大HP的30%。",
  "Arthur's Axe": "仅限男性使用。防御+2。",
  "Iron Bow": "标准制式弓。",
  "Crescent Bow": "发动攻击时，连续攻击2次。发动攻击后，力量减半，直至下次主动发起的战斗后。",
  "Blessed Bow": "敌方为魔物单位时，威力×3。每回合恢复HP。装备时，防御−3、魔防−3。",
  "Violin Bow": "使用者发动攻击后的战斗后，周围2格内友军技巧+4。",
  "Cupid's Bow": "战斗后，敌人恢复最大HP的20%。",
  "Niles's Bow": "无法击败敌人，改为使其HP保留1点。无法追击。装备时，防御−2、魔防−2。",
  "Soldier's Knife": "发动攻击时，连续攻击2次。发动攻击后，力量减半，直至下次主动发起的战斗后。命中时，对敌人施加力量−2、魔法−2、技巧−2、速度−2、幸运−2、防御−5、魔防−5的弱化（每回合恢复1点）。",
  "Fruit Knife": "使用后，恢复10HP。命中时，对敌人施加技巧−2、防御−3、魔防−3的弱化（每回合恢复1点）。",
  "Kris Knife": "敌方为魔物单位时，威力×3。每回合恢复HP。装备时，防御−3、魔防−3。命中时，对敌人施加魔法−3、防御−4、魔防−4的弱化（每回合恢复1点）。",
  "Stale Bread": "使用者发动攻击后的战斗后，恢复最大HP的20%。命中时，对敌人施加防御−3、魔防−3的弱化（每回合恢复1点）。",
  "Votive Candle": "有等同于幸运%的概率以1HP存活。命中时，对敌人施加力量−1、魔法−1、防御−3、魔防−3的弱化（每回合恢复1点）。",
  "Sacrificial Knife": "战斗后，使用者损失最大HP的30%。命中时，对敌人施加幸运−8、防御−5、魔防−5的弱化（每回合恢复1点）。",
  Pebble: "无法追击。无法发动必杀或奥义。命中时，对敌人施加力量−4、速度−4、防御−4、魔防−4的弱化（每回合恢复1点）。",
  "Iron Lance": "标准制式枪。",
  "Blessed Lance": "敌方为魔物单位时，威力×3。每回合恢复HP。装备时，防御−3、魔防−3。",
  "Xander's Lance": "无法发动必杀或奥义。技巧+2、魔防+2。如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。命中时，周围2格内所有敌人力量+4。",
  "Effie's Lance": "有效速度−5。敌方有效速度+5。",
  Waterwheel: "防御+5、魔防+5。发动攻击后，力量减半，直至下次主动发起的战斗后。",
  "Hinoka's Spear": "装备时，防御−1、魔防−1。",
  "Dragon Spirit": "敌方为龙族单位时，威力×3。技巧+1、防御+1。发动攻击后，魔法减半，直至下次主动发起的战斗后。",
  "Snake Spirit": "发动攻击时，连续攻击2次。速度+1、魔防+1。发动攻击后，魔法减半，直至下次主动发起的战斗后。",
  "Sheep Spirit": "防御+1、魔防+1。使用后，恢复10HP。",
  "Monkey Spirit": "技巧+1、速度+1。幸运−4、魔防+2。",
  Thunder: "标准制式魔道书。",
  Ginnungagap: "发动攻击后，魔法减半，直至下次主动发起的战斗后。",
  Nosferatu: "仅限暗法师使用。吸收敌人HP。无法追击。无法发动必杀或奥义。",
  Excalibur: "敌方为飞行单位时，威力×3。装备时，防御−5、魔防−5。有效速度+5；敌方有效速度+5。",
  Brynhildr: "仅限里昂使用。必杀回避+10。有等同于技巧%的概率将敌人的魔法减半。",
  Missiletainn: "仅限奥菲莉娅使用。技巧+1、魔防+1。",
  "Speed Thunder": "战斗后，周围2格内敌人速度+4。",
  Moonlight: "使用者发动攻击后的战斗后，恢复最大HP的20%。",
  "Iago's Tome": "如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。命中时，对敌人施加防御−4、魔防−4的弱化。",
  "Surefire Yumi": "装备时，防御−4、魔防−2。",
  Pursuer: "装备时，防御−5、魔防−3。有效速度+5；敌方有效速度+5。",
  "Mikoto's Yumi": "装备时，防御−2。每回合恢复HP。如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。",
  "Setsuna's Yumi": "命中时，对敌人施加技巧−4、速度−4、防御−4的弱化。",
  "Kaze's Needle": "使用者发动攻击后的战斗后，周围2格内友军速度+4。命中时，对敌人施加速度−4、防御−4、魔防−4的弱化（每回合恢复1点）。",
  "Saizo's Star": "使用者发动攻击后的战斗后，周围2格内友军力量+4。命中时，对敌人施加力量−4、防御−4、魔防−4的弱化（每回合恢复1点）。",
  "Brave Axe": "发动攻击时，连续攻击2次。装备时，防御−4、魔防−4。",
  "Brave Lance": "发动攻击时，连续攻击2次。装备时，防御−4、魔防−4。",
  "Guard Naginata": "防御+5、魔防+5。",
  "Bold Naginata": "无法追击。装备时，防御−5、魔防−5。敌方有效速度+5。",
  "Fuga's Club": "速度+3。装备时，防御−3、魔防−3。如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。",
  Chakram: "装备时，防御−5、魔防−5。命中时，对敌人施加力量−6、魔法−6、防御−6、魔防−6的弱化（每回合恢复1点）。有效速度+5；敌方有效速度+5。",
  "Bird Spirit": "速度+1、幸运+1。装备时，防御−4。",
  "Ink Painting": "敌方发动攻击时，威力×2。无法追击。技巧+1、幸运+1。如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。",
};

const fandomSerenesDescriptionOverrides: Record<string, string> = {
  "Dragonstone+": "Grants +9 Defense, +7 Resistance when equipped. −5 Skill, −4 Speed when equipped. Magic weapon. Cannot perform follow-up attacks. Suffers a stacking debuff of −2 Magic, −2 Skill after combat. Stats recover by 1 each turn.",
  "Beaststone+": "Grants +8 Skill, +6 Speed when equipped. −5 Defense, −3 Resistance when equipped. Suffers a stacking debuff of −2 Strength, −2 Skill after combat. Stats recover by 1 each turn.",
  "Silver Sword": "Suffers a stacking debuff of −2 Strength, −2 Skill after combat if the user is the lead unit in combat. Stats recover by 1 each turn.",
  "Brave Sword": "Suffers −4 Defense, −4 Resistance when equipped. Strikes twice consecutively when the user initiates combat.",
  Armorslayer: "Triples might against armor units. −4 attack, −10 hit against non-armor units.",
  Wyrmslayer: "Triples might against dragon units. −4 attack, −10 hit against non-dragon units.",
  "Killing Edge": "Critical hits deal ×4 damage rather than ×3.",
  "Levin Sword": "Magic weapon. Cannot trigger critical hits or offensive skills.",
  "Ganglari (original)": "Corrin only. Cannot be traded.",
  Siegfried: "Xander only. Grants +4 Defense when in Xander's inventory. Cannot be sold.",
  Umbrella: "Cannot perform follow-up attacks. Grants the foe +5 effective Speed.",
  "Nohrian Blade": "Grants +3 Defense when equipped.",
  "Leo's Iceblade": "Magic weapon. Suffers a stacking debuff of −2 Magic, −2 Skill after combat if the user hit a foe. Stats recover by 1 each turn.",
  "Selena's Blade": "Suffers −3 effective Speed.",
  "Laslow's Blade": "Grants +3 Speed when equipped. Suffers −3 Defense, −3 Resistance when equipped.",
  "Ganglari (upgraded)": "Suffers 20% of the user's maximum HP as damage after combat on hit.",
  "Falchion (Marth)": "Triples might against dragon units. Can be used to restore 10 HP. Cannot be traded.",
  Ragnell: "Grants +3 Defense when equipped. Cannot be traded. Suffers −3 effective Speed.",
  "Parallel Falchion": "Triples might against dragon units. Can be used to restore 10 HP. Cannot be traded. Grants +3 effective Speed.",
  "Ike's Backup": "Grants +3 Defense when equipped. Suffers −3 effective Speed.",
  "Lucina's Estoc": "Grants +3 effective Speed.",
  "Falchion (Chrom)": "Triples might against dragon units. Cannot be traded.",
  "Silver Katana": "Suffers a stacking debuff of −2 Strength, −2 Skill after combat if the user is the lead unit in combat. Stats recover by 1 each turn.",
  "Venge Katana": "Doubles might when the foe initiates combat.",
  Kodachi: "Cannot perform follow-up attacks or trigger critical hits or offensive skills. Grants the foe +5 effective Speed.",
  Wakizashi: "Cannot perform follow-up attacks. Grants the foe +5 effective Speed.",
  "Axe Splitter": "Triples might against axe-wielding units. −4 attack, −10 hit against non-axe-wielding units.",
  "Dual Katana": "Reverses the weapon triangle and doubles its effects.",
  "Practice Katana": "Grants +5 Speed when equipped. Suffers −1 Defense, −1 Resistance when equipped.",
  "Spirit Katana": "Grants +1 Speed when equipped. Suffers −4 Defense, −4 Resistance when equipped. Triples might against monster units. Restores 10 HP at the start of the user's phase when equipped.",
  "Hagakure Blade": "Suffers a debuff: Strength is halved for the next attack.",
  Yato: "Corrin only. Cannot be sold.",
  "Noble Yato": "Corrin only. +2 Strength, +2 Speed when in Corrin's inventory. Cannot be sold.",
  "Blazing Yato": "Corrin only. +4 Strength, +4 Speed when in Corrin's inventory. Negates the effects of Dragonskin. Cannot be sold.",
  "Grim Yato": "Corrin only. +2 Defense, +2 Resistance when in Corrin's inventory. Cannot be sold.",
  "Shadow Yato": "Corrin only. +4 Defense, +4 Resistance when in Corrin's inventory. Negates the effects of Dragonskin. Cannot be sold.",
  "Alpha Yato": "Corrin only. +2 Strength, +2 Speed, +2 Defense, +2 Resistance when in Corrin's inventory. Cannot be sold.",
  "Omega Yato": "Corrin only. +4 Strength, +4 Speed, +4 Defense, +4 Resistance when in Corrin's inventory. Negates the effects of Dragonskin. Cannot be sold.",
  Raijinto: "Ryoma only. +4 Strength when in Ryoma's inventory. Cannot be sold.",
  Parasol: "Cannot perform follow-up attacks. Grants the foe +5 effective Speed.",
  "Raider Katana": "If the user has weapon triangle advantage, removes the foe's clothes on hit. Grants +3 effective Speed.",
  "Takumi's Shinai": "Grants +1 Speed when equipped. Suffers −3 Defense, −3 Resistance when equipped. Cannot defeat foes, instead leaving them with 1 HP. Cannot perform follow-up attacks.",
  "Hana's Katana": "Doubles might when the foe initiates combat. Cannot perform follow-up attacks.",
  "Hinata's Katana": "Grants +1 Speed when equipped. Suffers −3 Defense, −3 Resistance when equipped. Doubles might when the user initiates combat. Cannot perform follow-up attacks.",
};

const fcfantasyNameOverrides: Record<string, string> = {
  Armorslayer: "破甲剑",
  Wyrmslayer: "屠龙剑",
  Yato: "夜刀神",
  "Noble Yato": "夜刀神·空夜",
  "Blazing Yato": "夜刀神·白夜",
  "Grim Yato": "夜刀神·长夜",
  "Shadow Yato": "夜刀神·暗夜",
  "Alpha Yato": "夜刀神·幻夜",
  "Omega Yato": "夜刀神·终夜",
  "Iron Naginata": "铁薙刀",
  "Steel Naginata": "钢薙刀",
  "Silver Naginata": "银薙刀",
  "Iron Nageyari": "铁投击薙刀",
  "Steel Nageyari": "钢投击薙刀",
  "Silver Nageyari": "银投击薙刀",
  "Kaze's Needle": "凉风之疾风针",
  "Saizo's Star": "才藏之爆炎针",
};

const knownEnemyOnlyNames = new Set(["Iron Nageyari", "Steel Nageyari", "Silver Nageyari"]);
const weaponsWithoutMightDoubling = new Set(["Kodachi", "Wakizashi", "Axe Splitter", "Dual Katana", "Practice Katana", "Spirit Katana"]);
const descriptionsToOmit = new Set(["Daikon Radish"]);
const dualWieldingKatanas = new Set(["Venge Katana", "Axe Splitter", "Spirit Katana", "Hagakure Blade", "Sunrise Katana", "Hana's Katana", "Hinata's Katana"]);
const serenesDescriptionNameOverrides: Record<string, string> = {
  "Ganglari (original)": "Ganglari",
  "Ganglari (upgraded)": "(True) Ganglari",
  "Falchion (Marth)": "Falchion",
  "Falchion (Chrom)": "(Chrom's) Falchion",
  "Fujin Yumi (Prologue)": "Fujin Yumi (Chapter 0)",
};

function normalizedValue(value: string | undefined): string {
  return (value ?? "")
    .replace(/[\u2212\u2013\u2014~\u301c\uff5e]/g, "-")
    .replace(/[\s,]/g, "");
}

function parseNumber(value: string | undefined): number | null {
  const normalized = normalizedValue(value);
  return normalized === "" || normalized === "--" || normalized === "-" ? null : Number(normalized);
}

function parseRange(value: string | undefined): { min: number | null; max: number | null; sourceText: string } {
  const sourceText = value ?? "--";
  const normalized = normalizedValue(sourceText);
  if (!normalized || normalized === "--" || normalized === "-") return { min: null, max: null, sourceText };
  const [minimum, maximum = minimum] = normalized.split("-");
  const min = Number(minimum);
  const max = Number(maximum);
  return min <= 0 || max <= 0 ? { min: null, max: null, sourceText } : { min, max, sourceText };
}

const englishStatNames: Record<string, string> = {
  strength: "Strength", magic: "Magic", skill: "Skill", speed: "Speed", luck: "Luck", defense: "Defense", resistance: "Resistance",
};

function normalizeEnglishDescription(value: string): string {
  let description = value
    .replace(/\s*\*\d+/g, "")
    .replace(/Critical Evade [+-]\d+[;,]?\s*/gi, "")
    .replace(/(?:enemy[’']s )?follow up attack speed [+-]\d+[;,]?\s*/gi, "")
    .replace(/\bDefence\b/g, "Defense")
    .replace(/\bAvatar only\b/gi, "Corrin only")
    .replace(/Cannot make follow up attacks/gi, "Cannot perform follow-up attacks")
    .replace(/cannot trigger critical hits or special skills/gi, "Cannot trigger critical hits or offensive skills")
    .replace(/Effective against ([^,;.]+)/gi, "Triples might against $1")
    .replace(/Might is doubled when enemy initiates the battle/gi, "Doubles might when the foe initiates combat")
    .replace(/Might is doubled when user initiates the battle/gi, "Doubles might when the user initiates combat")
    .replace(/\.(?=[A-Z+−])/g, ". ")
    .replace(/\b(strength|magic|skill|speed|luck|defense|resistance)\b/gi, (stat) => englishStatNames[stat.toLowerCase()])
    .replace(/Inflicts a stacking debuff of (.+?) on the user after combat if they (hit a foe|attacked)\./g, "Suffers a stacking debuff of $1 after combat if the user $2. Stats recover by 1 each turn.")
    .replace(/If the user hit the foe in combat, inflicts debuff(?:s)? of (.+?)(?: on the foe)? after combat\.?/g, "Inflicts $1 after combat on hit.")
    .replace(/If the user attacked in combat, halves the user's (Strength|Magic) until (.+?)\./g, "Suffers a debuff: $1 is halved for the next attack.")
    .replace(/After combat, if the user attacked, halves their (Strength|Magic) until (.+?)\./g, "Suffers a debuff: $1 is halved for the next attack.")
    .replace(/If the user hit the foe in combat, deals (.+?) as damage to the user after combat\./g, "Suffers $1 as damage after combat on hit.")
    .replace(/If the user attacked in combat, deals (.+?) as damage to the user after combat\./g, "Suffers $1 as damage after combat after attacking.")
    .replace(/Can be used to restores /g, "Can be used to restore ")
    .replace(/after (?:the )?battle,? stats (?:are )?reduced/gi, "Suffers a stacking debuff of −2 Strength, −2 Skill after combat if the user is the lead unit in combat. Stats recover by 1 each turn.")
    .replace(/2 consecutive attacks when user initiates battle/gi, "Strikes twice consecutively when the user initiates combat")
    .replace(/After the battle, (Strength|Magic) is halved for the next attack/gi, "Suffers a debuff: $1 is halved for the next attack")
    .replace(/not designed for battle…?/gi, "Not intended for battle")
    .replace(/Works as Magic damage\./g, "Magic weapon.")
    .replace(/Deals bonus damage to /g, "Triples might against ")
    .replace(/Inflicts debuffs? of /g, "Inflicts ")
    .replace(/(^|\. )([+−][^.]+?(?:when equipped|when in [^.]+ inventory)\.)/g, "$1Grants $2");

  return normalizeStaticStatClauses(normalizeEquippedStatClauses(description)).replace(/\s+/g, " ").trim();
}

const chineseStats: Record<string, string> = {
  Strength: "力量", Magic: "魔法", Skill: "技巧", Speed: "速度", Luck: "幸运", Defense: "防御", Resistance: "魔防",
};

function translateChineseStats(value: string): string {
  return value.replace(/Strength|Magic|Skill|Speed|Luck|Defense|Resistance/g, (stat) => chineseStats[stat]);
}

function translateEnemyDebuff(value: string): string {
  const modifiers = value.split(",").flatMap((part) => {
    const match = part.trim().match(/^([A-Za-z/]+)\s+([+−-]\d+)$/);
    if (!match) return [];
    return match[1].split("/").map((stat) => `${chineseStats[stat] ?? stat}${match[2].replace("-", "−")}`);
  });
  return modifiers.length ? `命中时，对敌人施加${modifiers.join("、")}的弱化（每回合恢复1点）。` : value;
}

function automaticChineseDescription(value: string): string | undefined {
  const subject: Record<string, string> = {
    "flying units": "飞行单位", "monster units": "魔物单位", "dragon units": "龙族单位", "armor units": "重甲单位",
    "horse/beast units": "骑马或兽系单位", "swords": "剑", "lances": "枪", "axes": "斧", "tomes": "魔道书",
  };
  let description = value
    .replace(/\[([^\]]+)\]/g, (_match, debuff) => translateEnemyDebuff(debuff))
    .replace(/Triples might against (?:armou?red units), Might and Hit rate reduced otherwise\.?/gi, "敌方为重甲单位时，威力×3。敌方为非重甲单位时，威力−4、命中−10。")
    .replace(/Triples might against horse\/beast units, Might and Hit rate reduced otherwise\.?/gi, "敌方为骑马或兽系单位时，威力×3。敌方为非骑马或兽系单位时，威力−4、命中−10。")
    .replace(/Triples might against (swords|lances|axes|tomes), Might and Hit rate reduced otherwise\.?/gi, (_match, type) => {
      const weapon = subject[type];
      return `敌方正使用的武器为${weapon}时，威力×3。敌方正使用的武器不为${weapon}时，威力−4、命中−10。`;
    })
    .replace(/Cannot trigger critical hits or offensive skills\.?/g, "无法发动必杀或奥义。")
    .replace(/Cannot perform follow-up attacks, trigger critical hits or special skills\.?/g, "无法追击。无法发动必杀或奥义。")
    .replace(/Cannot perform follow-up attacks\.?/g, "无法追击。")
    .replace(/Magic weapon\.?/g, "魔法武器。")
    .replace(/Not intended for battle\.?/g, "并非为战斗而设计。")
    .replace(/Critical hits deal (?:×|)4x? damage(?: rather than ×3)?\.?/gi, "必杀伤害为×4，而非×3。")
    .replace(/Suffers −3 effective Speed\.?/g, "有效速度−3。")
    .replace(/Suffers effective Speed ([+−-]\d+)\.?/g, (_match, value) => `有效速度${value.replace("-", "−")}。`)
    .replace(/Grants effective Speed ([+−-]\d+)\.?/g, (_match, value) => `有效速度${value.replace("-", "−")}。`)
    .replace(/\b(?:Grants|Suffers) (Strength|Magic|Skill|Speed|Luck|Defense|Resistance) ([+−-]\d+)/g, (_match, stat, value) => `${chineseStats[stat]}${value.replace("-", "−")}`)
    .replace(/Grants \+3 effective Speed\.?/g, "有效速度+3。")
    .replace(/Grants \+5 effective Speed\. Grants the foe \+5 effective Speed\.?/g, "有效速度+5；敌方有效速度+5。")
    .replace(/Grants the foe \+5 effective Speed\.?/g, "敌方有效速度+5。")
    .replace(/Suffers a stacking debuff of −2 Strength, −2 Skill after combat if the user is the lead unit in combat\. Stats recover by 1 each turn\.?/g, "如果使用者为前卫，战斗后，力量与技巧各−2（可叠加；每回合恢复1点）。")
    .replace(/Triples might against ([^.]+)\.?/g, (_match, target) => `敌方为${subject[target] ?? translateChineseStats(target)}时，威力×3。`)
    .replace(/Doubles might when the foe initiates combat\.?/g, "敌方发动攻击时，威力×2。")
    .replace(/Doubles might when the user initiates combat\.?/g, "发动攻击时，威力×2。")
    .replace(/Strikes twice consecutively when the user initiates combat\.?/g, "发动攻击时，连续攻击2次。")
    .replace(/Can be used to restore (\d+) HP\.?/g, "使用后，恢复$1HP。")
    .replace(/Restores (\d+) HP at the start of the user's phase when equipped\.?/g, "回合开始时，恢复$1HP。")
    .replace(/Stats recover by 1 each turn\.?/g, "每回合恢复1点。")
    .replace(/Standard issue (?:axe|bow|club|dagger|lance|naginata|scroll|shuriken|sword|tome)\.?/g, "")
    .replace(/Defense and Resistance -4/g, "装备时，防御−4、魔防−4。")
    .replace(/Defense and Resistance -5/g, "装备时，防御−5、魔防−5。")
    .replace(/Defense and Resistance -3/g, "装备时，防御−3、魔防−3。")
    .replace(/Defense and Resistance -2/g, "装备时，防御−2、魔防−2。")
    .replace(/Defense and Resistance \+5/g, "防御+5、魔防+5。")
    .replace(/Defense and Resistance \+1/g, "防御+1、魔防+1。")
    .replace(/Skill and Resistance \+2/g, "技巧+2、魔防+2。")
    .replace(/Skill and Defense \+1/g, "技巧+1、防御+1。")
    .replace(/Speed and Resistance \+1/g, "速度+1、魔防+1。")
    .replace(/Skill, Speed, Defense and Resistance \+3/g, "技巧+3、速度+3、防御+3、魔防+3。")
    .replace(/Skill and Luck \+1/g, "技巧+1、幸运+1。")
    .replace(/Speed and Defense \+1/g, "速度+1、防御+1。")
    .replace(/Skill\/Speed \+1/g, "技巧+1、速度+1。")
    .replace(/Speed\/Luck \+1 and Defense -4/g, "速度+1、幸运+1。装备时，防御−4。")
    .replace(/Strength -3/g, "力量−3")
    .replace(/Strength -2/g, "力量−2")
    .replace(/Strength -1/g, "力量−1")
    .replace(/Strength \+4/g, "力量+4")
    .replace(/Magic -2/g, "魔法−2")
    .replace(/Magic -1/g, "魔法−1")
    .replace(/Skill -5/g, "技巧−5")
    .replace(/Skill -4/g, "技巧−4")
    .replace(/Skill \+4/g, "技巧+4")
    .replace(/Skill \+3/g, "技巧+3")
    .replace(/Skill \+1/g, "技巧+1")
    .replace(/Speed -5/g, "速度−5")
    .replace(/Speed -4/g, "速度−4")
    .replace(/Speed \+4/g, "速度+4")
    .replace(/Speed \+3/g, "速度+3")
    .replace(/Speed \+1/g, "速度+1")
    .replace(/Luck -4/g, "幸运−4")
    .replace(/Luck \+5/g, "幸运+5")
    .replace(/Defense -5/g, "防御−5")
    .replace(/Defense -4/g, "防御−4")
    .replace(/Defense -2/g, "防御−2")
    .replace(/Defense \+4/g, "防御+4")
    .replace(/Defense \+1/g, "防御+1")
    .replace(/Resistance -3/g, "魔防−3")
    .replace(/Resistance -2/g, "魔防−2")
    .replace(/Resistance -1/g, "魔防−1")
    .replace(/Resistance \+10/g, "魔防+10")
    .replace(/Resistance \+8/g, "魔防+8")
    .replace(/Resistance \+3/g, "魔防+3")
    .replace(/Resistance \+2/g, "魔防+2")
    .replace(/Resistance \+1/g, "魔防+1")
    .replace(/Female only/g, "仅限女性使用")
    .replace(/Male only/g, "仅限男性使用")
    .replace(/Garon only/g, "仅限加隆使用")
    .replace(/Leo only/g, "仅限里昂使用")
    .replace(/Takumi only/g, "仅限拓海使用")
    .replace(/Ophelia only/g, "仅限奥菲莉娅使用")
    .replace(/Dark Mages only/g, "仅限暗法师使用")
    .replace(/Enemy only/g, "仅限敌人使用")
    .replace(/Strips enemy when user has weapon triangle advantage/g, "命中时，若使用者处于武器相克优势，则令敌人脱衣")
    .replace(/After a battle initiated by the user, (Skill|Speed|Strength|Resistance) \+(\d+) to allies within a 2 tile radius/g, (_match, stat, amount) => `使用者发动攻击后的战斗后，周围2格内友军${chineseStats[stat]}+${amount}`)
    .replace(/After a battle initiated by the user, user recovers 20% HP/g, "使用者发动攻击后的战斗后，恢复最大HP的20%")
    .replace(/After battle, enemy recovers 20% HP/g, "战斗后，敌人恢复最大HP的20%")
    .replace(/After battle, user[’']s HP is reduced by 30%/g, "战斗后，使用者损失最大HP的30%")
    .replace(/recover HP each turn/g, "每回合恢复HP")
    .replace(/Use to recover 10 HP/g, "使用后，恢复10HP")
    .replace(/Fatal hits leave the enemy with 1 HP/g, "无法击败敌人，改为使其HP保留1点")
    .replace(/Luck% chance of surviving with 1 HP/g, "有等同于幸运%的概率以1HP存活")
    .replace(/Ignores user and enemy[’']s terrain effects/g, "无视使用者与敌人的地形效果")
    .replace(/Reverses the weapon triangle and doubles weapon triangle effects/g, "反转武器三角，并将其效果×2")
    .replace(/Might is doubled when user[’']s Skill is higher than the enemy[’']s/g, "使用者技巧高于敌人时，威力×2")
    .replace(/wielder[’']s terrain costs are reduced to 1 while in possession/g, "持有时，地形移动消耗固定为1")
    .replace(/Combined effect of Brass Yumi and Fujin Yumi/g, "具备黄铜和风神弓的复合效果")
    .replace(/cannot trade/g, "无法交换")
    .replace(/\s*[,;]\s*/g, "。")
    .replace(/\s+/g, " ")
    .trim();

  return /[A-Za-z]/.test(description) ? undefined : description;
}

function normalizeEquippedStatClauses(description: string): string {
  return description.replace(/(?:(?:Grants|Suffers) )?([+−]\d+[^.]+?) when equipped\./g, (clause, stats: string) => {
    const modifiers = [...stats.matchAll(/([+−]\d+\s+(?:Strength|Magic|Skill|Speed|Luck|Defense|Resistance))/g)].map((match) => match[1]);
    if (!modifiers.length) return clause;
    const formatModifier = (modifier: string) => {
      const [, value, stat] = modifier.match(/^([+−]\d+)\s+(.+)$/) ?? [];
      return `${stat} ${value}`;
    };
    const grants = modifiers.filter((modifier) => modifier.startsWith("+"));
    const suffers = modifiers.filter((modifier) => modifier.startsWith("−"));
    return [
      grants.length ? `Grants ${grants.map(formatModifier).join(", ")} when equipped.` : "",
      suffers.length ? `Suffers ${suffers.map(formatModifier).join(", ")} when equipped.` : "",
    ].filter(Boolean).join(" ");
  });
}

function normalizeStaticStatClauses(description: string): string {
  const statPattern = "Strength|Magic|Skill|Speed|Luck|Defense|Resistance";
  const expression = new RegExp(`(?:${statPattern})(?:(?:, | and |/)(?:${statPattern}))*\\s+([+−-]\\d+)`, "g");
  return description
    .replace(new RegExp(`\\b(Grants|Suffers) ([+−-]\\d+) (${statPattern})`, "g"), (_match, action, value, stat) => `${action} ${stat} ${value.replace("-", "−")}`)
    .replace(/\b(Grants|Suffers) ([+−-]\d+) effective Speed/g, (_match, action, value) => `${action} effective Speed ${value.replace("-", "−")}`)
    .replace(expression, (match, rawValue: string, offset: number, source: string) => {
    const before = source.slice(Math.max(0, offset - 24), offset);
    const after = source.slice(offset + match.length, offset + match.length + 28);
    const previousSamePolarity = new RegExp(`(?:Grants|Suffers)\\s+(?:${statPattern})\\s+[+−-]\\d+,\\s*$`).test(before);
    const isInsideBracketedDebuff = before.lastIndexOf("[") > before.lastIndexOf("]");
    if (isInsideBracketedDebuff || /\[\s*$/.test(before) || /(?:Grants|Suffers)\s*$/.test(before) || /effective\s*$/i.test(before) || previousSamePolarity || /enemy[’']s\s*$/i.test(before) || /^(?: to allies| to enemies| for all enemies)/i.test(after)) return match;
    const value = rawValue.replace("-", "−");
    const stats = match.match(new RegExp(statPattern, "g")) ?? [];
    const prefix = value.startsWith("+") ? "Grants" : "Suffers";
    return `${prefix} ${stats.map((stat) => `${stat} ${value}`).join(", ")}`;
    });
}

const standardFamilyModifiers: Partial<Record<string, string[]>> = {
  katana: ["Grants +1 Speed when equipped. Suffers −1 Defense, −1 Resistance when equipped."],
  naginata: ["Grants +1 Defense, +1 Resistance when equipped."],
  shuriken: ["Grants +2 Speed when equipped."],
  bow: ["Triples might against flying units."],
  yumi: ["Grants +2 Resistance when equipped.", "Triples might against flying units."],
};

function normalizeEnglishWeaponDescription(familyId: string, name: string, value: string): string {
  const standardModifiers = standardFamilyModifiers[familyId] ?? [];
  let description = normalizeEnglishDescription(value);
  for (const standardModifier of standardModifiers) {
    description = description.replace(standardModifier, "").replace(/\s{2,}/g, " ").trim();
  }
  if (name.startsWith("Steel ") && !description.includes("effective Speed")) {
    description = `${description}${description ? " " : ""}Suffers −3 effective Speed.`;
  }
  if (name.startsWith("Silver ") && description.includes("Suffers a stacking debuff")) {
    description = description.replace(/after combat if the user (?:hit a foe|attacked)\./, "after combat if the user is the lead unit in combat.");
  }
  if (weaponsWithoutMightDoubling.has(name)) {
    description = description.replace(/Doubles might when the foe initiates combat\.\s*/g, "");
  }
  return description.replace(/\s{2,}/g, " ").trim();
}

function appendSentence(description: string, sentence: string): string {
  if (!description || description === "–") return sentence;
  if (/[^\x00-\x7F]/.test(sentence)) return `${description}${description.endsWith("。") ? "" : "。"}${sentence}`;
  return `${description}${description.endsWith(".") ? "" : "."} ${sentence}`;
}

function effectiveSpeedClause(value: string, target: "user" | "foe"): string | undefined {
  const expression = target === "user"
    ? /(?<!enemy[’']s )follow up attack speed ([+-]\d+)/i
    : /enemy[’']s follow up attack speed ([+-]\d+)/i;
  const match = value.match(expression);
  if (!match) return undefined;
  const amount = match[1].replace("-", "−");
  return target === "user"
    ? amount.startsWith("+") ? `Grants ${amount} effective Speed.` : `Suffers ${amount} effective Speed.`
    : `Grants the foe ${amount} effective Speed.`;
}

function mergeEffectiveSpeedDescription(description: string, serenesEffect?: string): string {
  if (!serenesEffect) return description;
  const clauses: string[] = [];
  const userClause = effectiveSpeedClause(serenesEffect, "user");
  const foeClause = effectiveSpeedClause(serenesEffect, "foe");
  if (userClause && !description.includes("effective Speed")) clauses.push(userClause);
  if (foeClause && !description.includes("the foe +5 effective Speed")) clauses.push(foeClause);
  if (/Cannot make follow up attacks/i.test(serenesEffect) && !description.includes("Cannot perform follow-up attacks")) {
    clauses.push("Cannot perform follow-up attacks.");
  }
  return `${description}${description && clauses.length ? " " : ""}${clauses.join(" ")}`;
}

function normalizeChineseDescription(value: string): string {
  return value
    .replace(/守备/g, "防御")
    .replace(/魔力/g, "魔法")
    .replace(/持有该武器/g, "")
    .replace(/力(?=、|\+|−|-|，|,|。|；|;|）|\)|%)/g, "力量")
    .replace(/技(?=、|\+|−|-|，|,|。|；|;|）|\)|%)/g, "技巧")
    .replace(/速(?=、|\+|−|-|，|,|。|；|;|）|\))/g, "速度")
    .replace(/(无法必杀|无法追击)(?=命中后)/g, "$1；")
    .replace(/(逐回合恢复)(?=命中后)/g, "$1；");
}

function stableId(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function scoreMatch(fewiki: SourceRow, fcfantasy: SourceRow): number {
  const left = [fewiki.cells[3], fewiki.cells[4], fewiki.cells[5], fewiki.cells[6], fewiki.cells[7], fewiki.cells[9], fewiki.cells[13]];
  const right = [fcfantasy.cells[2], fcfantasy.cells[3], fcfantasy.cells[4], fcfantasy.cells[5], fcfantasy.cells[6], fcfantasy.cells[7], fcfantasy.cells[8]];
  return left.reduce((total, value, index) => total + Number(normalizedValue(value) === normalizedValue(right[index])), 0);
}

function isExcluded(fewiki: SourceRow, fcfantasy?: SourceRow): boolean {
  return knownEnemyOnlyNames.has(fewiki.cells[0]) || fewiki.cells[0].includes("(enemy-only)") || Boolean(fcfantasy?.cells[9]?.includes("敌方专用"));
}

const source = JSON.parse(await readFile(sourcePath, "utf8")) as SourceInventory;
const serenesEffectsByName = new Map(source.sources.serenes.map((row) => [stableId(row.cells[0]), row.cells.at(-1)]));
function serenesDescriptionFor(name: string): string | undefined {
  return serenesEffectsByName.get(stableId(serenesDescriptionNameOverrides[name] ?? name));
}
const records: unknown[] = [];
const unresolvedChinese: string[] = [];
const ambiguousChinese: string[] = [];
const excluded: string[] = [];

for (const row of source.sources.fewikiWeapons) {
  const family = familyBySourceSection.get(row.section);
  const isWaterSplash = row.cells[0] === "Water Splash";
  if (!family && !isWaterSplash) continue;

  const candidates = family
    ? source.sources.fcfantasy.filter((candidate) => candidate.section === row.section)
    : [];
  const highestScore = Math.max(0, ...candidates.map((candidate) => scoreMatch(row, candidate)));
  const matches = candidates.filter((candidate) => scoreMatch(row, candidate) === highestScore && highestScore >= 5);
  const chineseSource = fcfantasyNameOverrides[row.cells[0]]
    ? candidates.find((candidate) => candidate.cells[0] === fcfantasyNameOverrides[row.cells[0]])
    : matches.length === 1 ? matches[0] : undefined;
  if (matches.length > 1 && !fcfantasyNameOverrides[row.cells[0]]) ambiguousChinese.push(row.cells[0]);
  if (isExcluded(row, chineseSource)) {
    excluded.push(row.cells[0]);
    continue;
  }
  if (!chineseSource && !reviewedJapaneseTranslations[row.cells[0]]) unresolvedChinese.push(row.cells[0]);

  const translation = reviewedJapaneseTranslations[row.cells[0]];
  const reviewedChineseDescription = translation?.descriptionZhHans ? normalizeChineseDescription(translation.descriptionZhHans) : undefined;
  const approvedChineseDescription = approvedChineseDescriptions[row.cells[0]];
  const completedChineseDescription = completedChineseDescriptions[row.cells[0]];
  const serenesDescription = serenesDescriptionFor(row.cells[0]);
  const mechanicalFamily = family ?? { weaponTypeId: "dragonstone", familyId: "other_stone", displayOrder: 17 };
  const rank = row.cells[3] === "--" ? null : row.cells[3];
  const baseEnglishDescription = normalizeStaticStatClauses(descriptionsToOmit.has(row.cells[0])
    ? ""
    : mergeEffectiveSpeedDescription(
      normalizeEnglishWeaponDescription(mechanicalFamily.familyId, row.cells[0], fandomSerenesDescriptionOverrides[row.cells[0]] ?? serenesDescription ?? ""),
      serenesDescription,
    ));
  const englishDescription = dualWieldingKatanas.has(row.cells[0]) ? appendSentence(baseEnglishDescription, "Dual wield as Swordmaster.") : baseEnglishDescription;
  const automaticChinese = englishDescription ? automaticChineseDescription(englishDescription) : "";
  const baseChineseDescription = reviewedChineseDescription ?? approvedChineseDescription ?? completedChineseDescription ?? automaticChinese;
  const chineseDescription = dualWieldingKatanas.has(row.cells[0]) ? appendSentence(baseChineseDescription, "装备此武器时，剑圣将以二刀流的姿态战斗。") : baseChineseDescription;
  records.push({
    id: stableId(row.cells[0]),
    names: {
      en: row.cells[0],
      ...(chineseSource ? { zhHans: chineseSource.cells[0], ja: chineseSource.cells[1] } : {}),
      ...(translation ? { zhHans: translation.zhHans } : {}),
    },
    weaponTypeId: mechanicalFamily.weaponTypeId,
    familyId: mechanicalFamily.familyId,
    displayOrder: mechanicalFamily.displayOrder,
    sourceRow: row.sourceRow,
    rank,
    might: parseNumber(row.cells[4]),
    hit: parseNumber(row.cells[5]),
    crit: parseNumber(row.cells[6]),
    avoid: parseNumber(row.cells[7]),
    ddg: parseNumber(row.cells[8]),
    range: parseRange(row.cells[9]),
    uses: parseNumber(row.cells[10]),
    worth: { amount: parseNumber(row.cells[13]), sourceText: row.cells[13] },
    descriptions: {
      en: englishDescription,
      ...(chineseDescription ? { zhHans: chineseDescription } : {}),
    },
    iconSource: row.image,
    reviewStatus: translation || approvedChineseDescription || chineseSource ? "candidate" : "in_review",
    provenance: [
      { sourceId: "fewiki-fe14-weapons", locator: `${row.section} > ${row.cells[0]}`, fields: ["names.en", "rank", "might", "hit", "crit", "avoid", "ddg", "range", "uses", "worth", "iconSource"], reviewStatus: "corroborated" },
      ...(serenesDescription ? [{ sourceId: "serenes-fe14-inventory", locator: `${row.section} > ${serenesDescriptionNameOverrides[row.cells[0]] ?? row.cells[0]}`, fields: ["descriptions.en"], reviewStatus: "corroborated" }] : []),
      ...(serenesDescription ? [{ sourceId: "fandom-fe14-weapons", locator: `${row.section} > ${row.cells[0]}`, fields: ["descriptions.en"], reviewStatus: "corroborated" }] : []),
      ...(chineseSource ? [{ sourceId: chineseSource.sourceId, locator: `${chineseSource.section} > ${chineseSource.cells[0]}`, fields: ["names.zhHans", "names.ja"], reviewStatus: "candidate" }] : []),
      ...(translation ? [{ sourceId: "pegasusknight-fe14-reviewed-translations", locator: row.cells[0], fields: ["names.zhHans", ...(reviewedChineseDescription ? ["descriptions.zhHans"] : [])], reviewStatus: "accepted" }] : []),
      ...(approvedChineseDescription ? [{ sourceId: "pegasusknight-fe14-reviewed-translations", locator: row.cells[0], fields: ["descriptions.zhHans"], reviewStatus: "accepted" }] : []),
      ...(completedChineseDescription ? [{ sourceId: "pegasusknight-fe14-reviewed-translations", locator: row.cells[0], fields: ["descriptions.zhHans"], reviewStatus: "accepted" }] : []),
    ],
  });
}

const waterSplash = source.sources.japanese.find((row) => row.cells[0] === "水の飛沫");
if (!waterSplash) throw new Error("Expected Water Splash in the Japanese stones source.");
records.push({
  id: "water_splash",
  names: { en: "Water Splash", zhHans: reviewedJapaneseTranslations["Water Splash"].zhHans, ja: waterSplash.cells[0] },
  weaponTypeId: "dragonstone",
  familyId: "other_stone",
  displayOrder: 17,
  sourceRow: waterSplash.sourceRow,
  rank: waterSplash.cells[1],
  might: parseNumber(waterSplash.cells[3]),
  hit: parseNumber(waterSplash.cells[4]),
  crit: parseNumber(waterSplash.cells[5]),
  avoid: parseNumber(waterSplash.cells[6]),
  ddg: parseNumber(waterSplash.cells[7]),
  range: parseRange(waterSplash.cells[8]),
  uses: null,
  worth: { amount: null, sourceText: waterSplash.cells[2] },
  descriptions: { en: "", zhHans: normalizeChineseDescription(reviewedJapaneseTranslations["Water Splash"].descriptionZhHans) },
  iconSource: { filePageUrl: "https://fireemblemwiki.org/wiki/File:Is_fe14_dragonstone.png", imageUrl: "https://cdn.fireemblemwiki.org/0/03/Is_fe14_dragonstone.png" },
  reviewStatus: "candidate",
  provenance: [{ sourceId: "pegasusknight-fe14-stones", locator: "ブレス > 水の飛沫", fields: ["names.ja", "rank", "might", "hit", "crit", "avoid", "ddg", "range", "worth", "descriptions.zhHans"], reviewStatus: "accepted" }],
});

const orderedRecords = (records as Array<{ displayOrder: number; sourceRow: number }>).sort((left, right) =>
  left.displayOrder - right.displayOrder || left.sourceRow - right.sourceRow,
).map(({ sourceRow: _sourceRow, ...record }, index) => ({ ...record, displayOrder: index + 1 }));
const payload = { gameId: "fe14", scope: "candidate_player_usable_weapons", weapons: orderedRecords };
const report = `# FE14 Weapon Candidate Normalization\n\nGenerated from the captured Fire Emblem Wiki, Serenes Forest, FC Fantasy, and reviewed Japanese translation sources. This output is candidate data until the final validator and conflict review accept it.\n\n- Candidate weapon records: ${orderedRecords.length}\n- Excluded enemy-only records: ${excluded.length}\n- Ambiguous FC Fantasy Chinese matches: ${ambiguousChinese.length}\n- Records without Chinese content: ${unresolvedChinese.length}\n\n## Excluded enemy-only records\n\n${excluded.map((name) => `- ${name}`).join("\n") || "- None"}\n\n## Ambiguous Chinese matches\n\n${ambiguousChinese.map((name) => `- ${name}`).join("\n") || "- None"}\n\n## Missing Chinese content\n\n${unresolvedChinese.map((name) => `- ${name}`).join("\n") || "- None"}\n`;

await mkdir(path.dirname(normalizedPath), { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(normalizedPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(reportPath, report, "utf8");
console.log(`Wrote ${orderedRecords.length} candidate weapon records.`);

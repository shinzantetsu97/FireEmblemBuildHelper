import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SourceRow = { cells: string[]; sourceId: string; sourceRow: number; image?: { filePageUrl?: string; imageUrl?: string } };
type SourceInventory = { sources: { fewikiItems: SourceRow[] } };

const sourcePath = path.join(process.cwd(), "data/sources/fe14/weapon-item-source-inventory.json");
const outputPath = path.join(process.cwd(), "data/normalized/fe14/items.json");
const reportPath = path.join(process.cwd(), "data/reports/fe14/item-candidate-normalization.md");

const names: Record<string, { zhHans: string; ja?: string }> = {
  Vulnerary: { zhHans: "伤药", ja: "傷薬" }, Concoction: { zhHans: "调和药", ja: "調合薬" }, Elixir: { zhHans: "特效药", ja: "特効薬" },
  "HP Tonic": { zhHans: "HP药", ja: "HPの薬" }, "Strength Tonic": { zhHans: "力量药", ja: "力の薬" }, "Magic Tonic": { zhHans: "魔力药", ja: "魔力の薬" }, "Skill Tonic": { zhHans: "技巧药", ja: "技の薬" }, "Speed Tonic": { zhHans: "速度药", ja: "速さの薬" }, "Luck Tonic": { zhHans: "幸运药", ja: "幸運の薬" }, "Defense Tonic": { zhHans: "防御药", ja: "守備の薬" }, "Resistance Tonic": { zhHans: "魔防药", ja: "魔防の薬" },
  "Azura's Salve": { zhHans: "阿库娅的秘药", ja: "アクアの秘薬" }, "Gunter's Potion": { zhHans: "玖塔的良药", ja: "ギュンターの良薬" }, "Asugi's Confect": { zhHans: "暮井的创作点心", ja: "グレイの創作菓子" }, "Rainbow Tonic": { zhHans: "虹之秘药", ja: "虹の秘薬" }, "Seed of Trust": { zhHans: "羁绊之种", ja: "絆の種" }, "Allegro Harp": { zhHans: "竖琴", ja: "ハープ" }, "Shell Horn": { zhHans: "海螺", ja: "ほら貝" },
  "Door Key": { zhHans: "门钥匙", ja: "扉の鍵" }, "Chest Key": { zhHans: "宝箱钥匙", ja: "宝の鍵" }, "Master Key": { zhHans: "万能钥匙" },
  "Seraph Robe": { zhHans: "天使之衣", ja: "天使の衣" }, "Energy Drop": { zhHans: "力量之滴", ja: "力のしずく" }, "Spirit Dust": { zhHans: "精灵之粉", ja: "精霊の粉" }, "Secret Book": { zhHans: "秘传之书", ja: "秘伝の書" }, "Speedwing": { zhHans: "疾风之羽", ja: "はやての羽" }, "Goddess Icon": { zhHans: "女神像", ja: "女神の像" }, "Dracoshield": { zhHans: "龙盾", ja: "竜の盾" }, Talisman: { zhHans: "魔除护符", ja: "魔よけ" }, "Dragon Herbs": { zhHans: "神龙草", ja: "神竜草" }, Boots: { zhHans: "靴子", ja: "ブーツ" }, "Arms Scroll": { zhHans: "术书", ja: "術書" },
  "Master Seal": { zhHans: "大师之证", ja: "マスタープルフ" }, "Heart Seal": { zhHans: "平行之证", ja: "パラレルプルフ" }, "Partner Seal": { zhHans: "婚姻之证", ja: "マリッジプルフ" }, "Friendship Seal": { zhHans: "友情之证", ja: "バディプルフ" }, "Offspring Seal": { zhHans: "子代之证", ja: "チャイルドプルフ" }, "Eternal Seal": { zhHans: "永恒之证", ja: "エターナルプルフ" },
  "Dread Scroll": { zhHans: "魔战士卷轴", ja: "魔戦士の巻物" }, "Ebon Wing": { zhHans: "黑天马之翼", ja: "黒天馬の翼" }, "Sighting Lens": { zhHans: "射手炮台", ja: "シューター砲台" }, "Witch's Mark": { zhHans: "魔女魔法阵", ja: "魔女の魔法陣" }, "Hero's Brand": { zhHans: "英雄王纹章", ja: "英雄王の紋章" }, "Exalt's Brand": { zhHans: "圣痕纹章", ja: "聖痕の紋章" }, "Fell Brand": { zhHans: "邪痕纹章", ja: "邪痕の紋章" }, "Vanguard Brand": { zhHans: "神将纹章", ja: "神将の紋章" },
  Paragon: { zhHans: "精英之书", ja: "エリートの書" }, "Point Blank": { zhHans: "近接射击之书", ja: "近接射撃の書" }, Strengthtaker: { zhHans: "力量吸收之书", ja: "力の吸収の書" }, Magictaker: { zhHans: "魔力吸收之书", ja: "魔力の吸収の書" }, Skilltaker: { zhHans: "技巧吸收之书", ja: "技の吸収の書" }, Speedtaker: { zhHans: "速度吸收之书", ja: "速さの吸収の書" }, Lucktaker: { zhHans: "幸运吸收之书", ja: "幸運の吸収の書" }, Defensetaker: { zhHans: "防御吸收之书", ja: "守備の吸収の書" }, Resistancetaker: { zhHans: "魔防吸收之书", ja: "魔防の吸収の書" }, "Heavy Blade": { zhHans: "刚剑之书", ja: "剛剣の書" }, "Veteran Intuition": { zhHans: "历战之勘之书", ja: "歴戦の勘の書" }, Aether: { zhHans: "天空之书", ja: "天空の書" }, Warp: { zhHans: "传送之书", ja: "ワープの書" },
  "Gold Bar": { zhHans: "小判", ja: "小判" }, "Battle Seal": { zhHans: "战斗王纹章", ja: "戦闘王の紋章" }, "Visitation Seal": { zhHans: "访问王纹章", ja: "訪問王の紋章" }, "Master Emblem": { zhHans: "羁绊王纹章", ja: "絆の王の紋章" }, Obstacle: { zhHans: "障碍物", ja: "障害物" },
};

const descriptions: Record<string, string> = {
  Vulnerary: "使自身恢复10点HP。", Concoction: "使自身恢复20点HP。", Elixir: "使自身恢复40点HP。",
  "HP Tonic": "使用后，本章期间最大HP+5。", "Strength Tonic": "使用后，本章期间力量+2。", "Magic Tonic": "使用后，本章期间魔法+2。", "Skill Tonic": "使用后，本章期间技巧+2。", "Speed Tonic": "使用后，本章期间速度+2。", "Luck Tonic": "使用后，本章期间幸运+2。", "Defense Tonic": "使用后，本章期间防御+2。", "Resistance Tonic": "使用后，本章期间魔防+2。",
  "Azura's Salve": "使相邻的所有友军恢复10点HP。", "Gunter's Potion": "使自身恢复25点HP。", "Asugi's Confect": "使自身恢复10点HP；本章期间力量、技巧、速度各+2。", "Rainbow Tonic": "使用后，本章期间力量、魔法、技巧、速度、防御、魔防各+2，幸运+4。", "Seed of Trust": "仅可在双人组队时使用，且两名单位可相互支援。略微提升使用者与搭档的支援度。", "Allegro Harp": "使自身周围2格内的所有友军在本回合获得「速度应援」效果，速度+4。", "Shell Horn": "使自身周围2格内的所有友军在本回合获得「防御应援」效果，防御+4。",
  "Door Key": "用于打开一扇门。若未使用，章节结束后消失。", "Chest Key": "用于打开一个宝箱。若未使用，章节结束后消失。", "Master Key": "可打开任意门或宝箱。",
  "Seraph Robe": "使用后，最大HP永久+5。", "Energy Drop": "使用后，力量永久+2。", "Spirit Dust": "使用后，魔法永久+2。", "Secret Book": "使用后，技巧永久+2。", Speedwing: "使用后，速度永久+2。", "Goddess Icon": "使用后，幸运永久+4。", Dracoshield: "使用后，防御永久+2。", Talisman: "使用后，魔防永久+2。", "Dragon Herbs": "使用后，所有能力永久各+1。", Boots: "使用后，移动力永久+1。同一单位最多可使用2次。", "Arms Scroll": "使当前职业可使用的所有武器类型的武器等级各提升1级。",
  "Master Seal": "基础职业达到10级或以上时使用，可转职为上级职业。", "Heart Seal": "使使用者转职为可选的其他职业。", "Partner Seal": "使使用者转职为与配偶初始职业对应的职业树。", "Friendship Seal": "使使用者转职为与挚友初始职业对应的职业树。", "Offspring Seal": "仅限子代单位使用。使使用者转职为上级职业，并调整其能力值。", "Eternal Seal": "上级职业达到等级上限时使用，使等级上限+5。",
  "Dread Scroll": "基础职业达到10级或以上，或为上级职业时使用，使使用者转职为魔战士。", "Ebon Wing": "基础职业达到10级或以上，或为上级职业时使用，使使用者转职为黑天马。", "Sighting Lens": "仅限男性单位。基础职业达到10级或以上，或为上级职业时使用，使使用者转职为炮台。", "Witch's Mark": "仅限女性单位。基础职业达到10级或以上，或为上级职业时使用，使使用者转职为魔女。", "Hero's Brand": "仅限男性单位。基础职业达到10级或以上，或为上级职业时使用，使使用者转职为星之领主。", "Exalt's Brand": "仅限女性单位。基础职业达到10级或以上，或为上级职业时使用，使使用者转职为大领主。", "Fell Brand": "仅限男性单位。基础职业达到10级或以上，或为上级职业时使用，使使用者转职为大军师。", "Vanguard Brand": "仅限男性单位。基础职业达到10级或以上，或为上级职业时使用，使使用者转职为神将。",
  Paragon: "使一名单位习得「精英」。", "Point Blank": "使一名单位习得「近接射击」。", Strengthtaker: "使一名单位习得「力量吸收」。", Magictaker: "使一名单位习得「魔力吸收」。", Skilltaker: "使一名单位习得「技巧吸收」。", Speedtaker: "使一名单位习得「速度吸收」。", Lucktaker: "使一名单位习得「幸运吸收」。", Defensetaker: "使一名单位习得「防御吸收」。", Resistancetaker: "使一名单位习得「魔防吸收」。", "Heavy Blade": "使一名单位习得「刚剑」。", "Veteran Intuition": "使一名单位习得「历战之勘」。基础职业或特殊职业须达到10级才能使用；上级职业不限等级。", Aether: "使一名单位习得「天空」。基础职业无法使用；特殊职业须达到25级、上级职业须达到5级才能使用。", Warp: "使一名单位习得「传送」。基础职业无法使用；特殊职业须达到35级、上级职业须达到15级才能使用。",
  "Gold Bar": "可消耗以发动「挥霍」特技。", "Battle Seal": "持有时，力量、魔法、技巧、速度各+2。", "Visitation Seal": "持有时，幸运、防御、魔防各+2。", "Master Emblem": "持有时，力量、魔法、技巧、速度、幸运、防御、魔防各+1。", Obstacle: "可将障碍物放置在相邻的地格。放置后，该格无法通行。可由玩家单位回收；若未使用，章节结束后消失。",
};

function id(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function number(value: string) { return value === "--" ? null : Number(value.replace(/,/g, "")); }
function category(index: number) {
  if (index <= 17) return "consumable";
  if (index <= 20) return "key";
  if (index <= 31) return "permanent_booster";
  if (index <= 45) return "promotion";
  return "special";
}

const source = JSON.parse(await readFile(sourcePath, "utf8")) as SourceInventory;
const excluded = source.sources.fewikiItems.filter((row) => row.cells[5].includes("Unused.")).map((row) => row.cells[0]);
const items = source.sources.fewikiItems
  .filter((row) => !row.cells[5].includes("Unused."))
  .map((row, displayOrder) => {
    const name = names[row.cells[0]];
    if (!name) throw new Error(`Missing Chinese item name: ${row.cells[0]}`);
    const description = descriptions[row.cells[0]];
    if (!description) throw new Error(`Missing Chinese item description: ${row.cells[0]}`);
    return {
      id: id(row.cells[0]), names: { en: row.cells[0], zhHans: name.zhHans, ...(name.ja ? { ja: name.ja } : {}) },
      categoryId: category(source.sources.fewikiItems.indexOf(row)), displayOrder: displayOrder + 1,
      uses: number(row.cells[2]), worth: { buy: number(row.cells[3]), sell: number(row.cells[4]), buySourceText: row.cells[3], sellSourceText: row.cells[4] },
      descriptions: { en: row.cells[5], zhHans: description }, iconSource: row.image,
      reviewStatus: ["Master Seal", "Heart Seal", "Partner Seal", "Friendship Seal", "Offspring Seal", "Eternal Seal", "Dread Scroll", "Ebon Wing", "Sighting Lens", "Witch's Mark", "Hero's Brand", "Exalt's Brand", "Fell Brand", "Vanguard Brand"].includes(row.cells[0]) ? "accepted" : "candidate",
      provenance: [{ sourceId: row.sourceId, locator: row.cells[0], fields: ["names.en", "uses", "worth", "descriptions.en", "iconSource"], reviewStatus: "corroborated" }, { sourceId: "pegasusknight-fe14-items", locator: name.ja ?? row.cells[0], fields: ["names.ja", "names.zhHans"], reviewStatus: "accepted" }],
    };
  });

await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ gameId: "fe14", scope: "standard_and_dlc_non_unused_items", items }, null, 2)}\n`, "utf8");
await writeFile(reportPath, `# FE14 Item Candidate Normalization\n\n- Included non-unused items: ${items.length}\n- Excluded unused items: ${excluded.length}\n\n## Excluded unused items\n\n${excluded.map((name) => `- ${name}`).join("\n")}\n`, "utf8");
console.log(`Wrote ${items.length} candidate item records.`);

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classSkillsFileSchema } from "./schemas";

const INVENTORY_PATH = path.resolve(
  "data/sources/fe14/serenes-skill-source-inventory.json",
);
const ICON_MANIFEST_PATH = path.resolve(
  "data/sources/fe14/skill-icon-sources.json",
);
const OUTPUT_PATH = path.resolve("data/normalized/fe14/class-skills.json");

type ClassSourceRow = {
  sourceOrder: number;
  iconUrl: string;
  name: string;
  description: string;
  classLabel: string;
  level: string;
};

type SourcePage = {
  id: string;
  skillType: "class" | "personal";
  rows: ClassSourceRow[];
};

type Inventory = {
  gameId: string;
  pages: SourcePage[];
};

type IconManifest = {
  entries: Array<{
    skillId: string;
    skillType: "class" | "personal";
    canonicalName: string;
    sourceNames: string[];
  }>;
};

type ClassMapping = {
  classIds: string[];
  gender?: "male" | "female";
};

const CLASS_LABEL_MAPPINGS: Record<string, ClassMapping> = {
  "Hoshido Noble": { classIds: ["hoshido_noble"] },
  Samurai: { classIds: ["samurai"] },
  Swordmaster: { classIds: ["swordmaster"] },
  "Master of Arms": { classIds: ["master_of_arms"] },
  "Oni Savage": { classIds: ["oni_savage"] },
  "Oni Chieftain": { classIds: ["oni_chieftain"] },
  Blacksmith: { classIds: ["blacksmith"] },
  "Spear Fighter": { classIds: ["spear_fighter"] },
  "Spear Master": { classIds: ["spear_master"] },
  Basara: { classIds: ["basara"] },
  Diviner: { classIds: ["diviner"] },
  Onmyoji: { classIds: ["onmyoji"] },
  "Monk, Shrine Maiden": { classIds: ["monk", "shrine_maiden"] },
  "Great Master, Priestess": { classIds: ["great_master", "priestess"] },
  "Sky Knight": { classIds: ["sky_knight"] },
  "Falcon Knight": { classIds: ["falcon_knight"] },
  "Kinshi Knight": { classIds: ["kinshi_knight"] },
  Archer: { classIds: ["archer"] },
  Sniper: { classIds: ["sniper"] },
  Ninja: { classIds: ["ninja"] },
  "Master Ninja": { classIds: ["master_ninja"] },
  Mechanist: { classIds: ["mechanist"] },
  Apothecary: { classIds: ["apothecary"] },
  Merchant: { classIds: ["merchant"] },
  Kitsune: { classIds: ["kitsune"] },
  "Nine-Tails": { classIds: ["nine_tails"] },
  Songstress: { classIds: ["songstress"] },
  Villager: { classIds: ["villager"] },
  "Nohr Prince(ss)": { classIds: ["nohr_prince"] },
  "Nohr Noble": { classIds: ["nohr_noble"] },
  Cavalier: { classIds: ["cavalier"] },
  Paladin: { classIds: ["paladin"] },
  "Great Knight": { classIds: ["great_knight"] },
  Knight: { classIds: ["knight"] },
  General: { classIds: ["general"] },
  Fighter: { classIds: ["fighter"] },
  Berserker: { classIds: ["berserker"] },
  Mercenary: { classIds: ["mercenary"] },
  Hero: { classIds: ["hero"] },
  "Bow Knight": { classIds: ["bow_knight"] },
  Outlaw: { classIds: ["outlaw"] },
  Adventurer: { classIds: ["adventurer"] },
  "Wyvern Rider": { classIds: ["wyvern_rider"] },
  "Wyvern Lord": { classIds: ["wyvern_lord"] },
  "Malig Knight": { classIds: ["malig_knight"] },
  "Dark Mage": { classIds: ["dark_mage"] },
  Sorcerer: { classIds: ["sorcerer"] },
  "Dark Knight": { classIds: ["dark_knight"] },
  Troubadour: { classIds: ["troubadour"] },
  "Troubadour(M)": { classIds: ["troubadour"], gender: "male" },
  "Troubadour (F)": { classIds: ["troubadour"], gender: "female" },
  Strategist: { classIds: ["strategist"] },
  "Maid, Butler": { classIds: ["attendant"] },
  Wolfskin: { classIds: ["wolfskin"] },
  Wolfssegner: { classIds: ["wolfssegner"] },
};

const DEBUFF_NOTE =
  "Enemy debuffs do not stack with another debuff to the same stat; the larger value takes priority, and affected stats recover by 1 each turn.";
const BATTLE_SKILL_NOTE =
  "Battle skills are activation-rate skills that can trigger during battle, such as Astra, Luna, Sol, Miracle, Pavise, and Aegis.";

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const groupKey = key(item);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
  }

  return groups;
}

function normalizeDescription(description: string): string {
  const normalized = description
    .replace(/\s+\*[12]$/, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, " - ")
    .replace(/\bDefence\b/g, "Defense")
    .replace(/Skill x\.0\.75%/g, "Skill x 0.75%")
    .replace(/\s+/g, " ")
    .trim();

  return /[.!?)]$/.test(normalized)
    ? `${normalized}${normalized.endsWith(")") ? "." : ""}`
    : `${normalized}.`;
}

const [inventory, iconManifest] = await Promise.all([
  readJson<Inventory>(INVENTORY_PATH),
  readJson<IconManifest>(ICON_MANIFEST_PATH),
]);

const classRows = inventory.pages
  .filter((page) => page.skillType === "class")
  .flatMap((page) => page.rows.map((row) => ({ ...row, pageId: page.id })));
const iconEntryBySourceName = new Map(
  iconManifest.entries
    .filter((entry) => entry.skillType === "class")
    .flatMap((entry) =>
      entry.sourceNames.map((sourceName) => [sourceName, entry] as const),
    ),
);

const skills = [...groupBy(classRows, (row) => row.name).entries()].map(
  ([sourceName, rows]) => {
    const iconEntry = iconEntryBySourceName.get(sourceName);
    if (!iconEntry) throw new Error(`Missing icon manifest entry for ${sourceName}.`);

    const descriptions = [
      ...new Set(rows.map((row) => normalizeDescription(row.description))),
    ];
    if (descriptions.length !== 1) {
      throw new Error(`${sourceName} has conflicting normalized descriptions.`);
    }

    const acquisition = rows.flatMap((row) => {
      const mapping = CLASS_LABEL_MAPPINGS[row.classLabel];
      if (!mapping) throw new Error(`Unmapped class label ${row.classLabel}.`);

      const level = Number.parseInt(row.level, 10);
      if (!Number.isInteger(level)) throw new Error(`Invalid level ${row.level}.`);

      return mapping.classIds.map((classId) => ({
        classId,
        level,
        ...(mapping.gender ? { gender: mapping.gender } : {}),
      }));
    });
    const uniqueAcquisition = [
      ...new Map(
        acquisition.map((edge) => [
          `${edge.classId}:${edge.level}:${edge.gender ?? "all"}`,
          edge,
        ]),
      ).values(),
    ];
    const sourceRowsByPage = groupBy(rows, (row) => row.pageId);
    const notes = [
      ...(rows.some((row) => row.description.endsWith("*1")) ? [DEBUFF_NOTE] : []),
      ...(rows.some((row) => row.description.endsWith("*2"))
        ? [BATTLE_SKILL_NOTE]
        : []),
      ...(iconEntry.canonicalName !== sourceName
        ? [
            `Serenes Forest uses "${sourceName}"; the canonical name uses the localized "${iconEntry.canonicalName}" spelling already established by accepted FE14 data.`,
          ]
        : []),
    ];

    return {
      id: iconEntry.skillId,
      names: { en: iconEntry.canonicalName },
      description: descriptions[0],
      iconAssetId: iconEntry.skillId,
      acquisition: uniqueAcquisition,
      ...(notes.length > 0 ? { notes } : {}),
      provenance: [...sourceRowsByPage.entries()].map(([pageId, pageRows]) => ({
        sourceId: pageId,
        locator: pageRows
          .map((row) => `${row.classLabel} > ${row.name} > Level ${row.level}`)
          .join("; "),
        fields: ["names.en", "description", "iconAssetId", "acquisition"],
        reviewStatus: "accepted" as const,
      })),
    };
  },
);

const classSkills = classSkillsFileSchema.parse({
  gameId: inventory.gameId,
  scope: "standard_non_dlc",
  skills,
});

await writeFile(OUTPUT_PATH, `${JSON.stringify(classSkills, null, 2)}\n`, "utf8");
console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Class skills: ${classSkills.skills.length}`);
console.log(
  `Acquisition edges: ${classSkills.skills.reduce((total, skill) => total + skill.acquisition.length, 0)}`,
);

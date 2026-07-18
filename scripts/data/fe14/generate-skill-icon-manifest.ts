import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INVENTORY_PATH = path.resolve(
  "data/sources/fe14/serenes-skill-source-inventory.json",
);
const PERSONAL_SKILLS_PATH = path.resolve(
  "data/normalized/fe14/personal-skills.json",
);
const OUTPUT_PATH = path.resolve(
  "data/sources/fe14/skill-icon-sources.json",
);

type ClassSourceRow = {
  sourceOrder: number;
  iconUrl: string;
  name: string;
};

type PersonalSourceRow = {
  sourceOrder: number;
  iconUrl: string;
  name: string;
  characterLabel: string;
};

type SourcePage = {
  id: string;
  skillType: "class" | "personal";
  url: string;
  rows: ClassSourceRow[] | PersonalSourceRow[];
};

type Inventory = {
  gameId: string;
  capturedAt: string;
  pages: SourcePage[];
};

type PersonalSkill = {
  id: string;
  unitId: string;
  names: { en: string };
};

const CLASS_CANONICAL_NAME_OVERRIDES: Record<string, string> = {
  "Defence +2": "Defense +2",
  "Rally Defence": "Rally Defense",
  "Seal Defence": "Seal Defense",
};

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

function toSkillId(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[‘’']/g, "")
    .replace(/\+/g, " plus ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function sourceCharacterUnitId(label: string): string {
  return label === "Avatar" ? "corrin" : label.toLowerCase();
}

function requireSingleIconUrl(
  skillLabel: string,
  rows: Array<{ iconUrl: string }>,
): string {
  const iconUrls = [...new Set(rows.map((row) => row.iconUrl))];

  if (iconUrls.length !== 1) {
    throw new Error(
      `${skillLabel} resolves to ${iconUrls.length} source icon URLs instead of one.`,
    );
  }

  return iconUrls[0];
}

const [inventory, personalSkills] = await Promise.all([
  readJson<Inventory>(INVENTORY_PATH),
  readJson<PersonalSkill[]>(PERSONAL_SKILLS_PATH),
]);

const pageById = new Map(inventory.pages.map((page) => [page.id, page]));
const classRows = inventory.pages
  .filter((page) => page.skillType === "class")
  .flatMap((page) =>
    (page.rows as ClassSourceRow[]).map((row) => ({ ...row, pageId: page.id })),
  );
const personalRows = inventory.pages
  .filter((page) => page.skillType === "personal")
  .flatMap((page) =>
    (page.rows as PersonalSourceRow[]).map((row) => ({
      ...row,
      pageId: page.id,
      unitId: sourceCharacterUnitId(row.characterLabel),
    })),
  );

const classEntries = [...groupBy(classRows, (row) => row.name).entries()].map(
  ([sourceName, rows]) => {
    const canonicalName = CLASS_CANONICAL_NAME_OVERRIDES[sourceName] ?? sourceName;
    const skillId = toSkillId(canonicalName);
    const sourcePageIds = [...new Set(rows.map((row) => row.pageId))];

    return {
      skillId,
      skillType: "class" as const,
      canonicalName,
      sourceNames: [sourceName],
      sourcePageIds,
      sourcePageUrls: sourcePageIds.map((pageId) => {
        const page = pageById.get(pageId);
        if (!page) throw new Error(`Unknown source page ${pageId}.`);
        return page.url;
      }),
      sourceImageUrl: requireSingleIconUrl(sourceName, rows),
      localDestination: `src/games/fe14/assets/class_skill_icons/${skillId}.png`,
    };
  },
);

const personalRowsByUnit = groupBy(personalRows, (row) => row.unitId);

const personalEntries = personalSkills.map((skill) => {
  const rows = personalRowsByUnit.get(skill.unitId) ?? [];

  if (rows.length === 0) {
    throw new Error(`No personal-skill source row found for ${skill.unitId}.`);
  }

  const sourcePageIds = [...new Set(rows.map((row) => row.pageId))];

  return {
    skillId: skill.id,
    skillType: "personal" as const,
    unitId: skill.unitId,
    canonicalName: skill.names.en,
    sourceNames: [...new Set(rows.map((row) => row.name))],
    sourcePageIds,
    sourcePageUrls: sourcePageIds.map((pageId) => {
      const page = pageById.get(pageId);
      if (!page) throw new Error(`Unknown source page ${pageId}.`);
      return page.url;
    }),
    sourceImageUrl: requireSingleIconUrl(skill.unitId, rows),
    localDestination: `src/games/fe14/assets/personal_skill_icons/${skill.id}.png`,
  };
});

const entries = [...classEntries, ...personalEntries];
const duplicateKeys = [...groupBy(entries, (entry) => `${entry.skillType}:${entry.skillId}`)]
  .filter(([, records]) => records.length > 1)
  .map(([key]) => key);
const duplicateDestinations = [
  ...groupBy(entries, (entry) => entry.localDestination),
]
  .filter(([, records]) => records.length > 1)
  .map(([destination]) => destination);

if (duplicateKeys.length > 0 || duplicateDestinations.length > 0) {
  throw new Error(
    `Manifest collisions: keys=${duplicateKeys.join(", ") || "none"}; destinations=${duplicateDestinations.join(", ") || "none"}`,
  );
}

const manifest = {
  gameId: inventory.gameId,
  scope: "milestone-007-standard-class-and-playable-personal-skills",
  sourceInventoryCapturedAt: inventory.capturedAt,
  counts: {
    classIcons: classEntries.length,
    personalIcons: personalEntries.length,
    totalIcons: entries.length,
  },
  entries,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${OUTPUT_PATH}`);
console.log(`Class icons: ${classEntries.length}`);
console.log(`Personal icons: ${personalEntries.length}`);
console.log(`Total icons: ${entries.length}`);

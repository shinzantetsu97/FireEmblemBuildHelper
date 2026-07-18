import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { childParentageFileSchema, personalSkillsFileSchema } from "./schemas";

const PERSONAL_SKILLS_PATH = path.resolve(
  "data/normalized/fe14/personal-skills.json",
);
const CHILD_PARENTAGE_PATH = path.resolve(
  "data/normalized/fe14/child-parentage.json",
);
const INVENTORY_PATH = path.resolve(
  "data/sources/fe14/serenes-skill-source-inventory.json",
);
const ICON_MANIFEST_PATH = path.resolve(
  "data/sources/fe14/skill-icon-sources.json",
);
const FIRST_ROSTER_PATH = path.resolve(
  "data/normalized/fe14/units/first-generation.json",
);
const SECOND_ROSTER_PATH = path.resolve(
  "data/normalized/fe14/units/second-generation.json",
);

type SourceRef = {
  sourceId: string;
  locator: string;
  fields: string[];
  reviewStatus: "candidate" | "corroborated" | "accepted" | "disputed" | "deprecated";
};

type PersonalSkill = {
  id: string;
  unitId: string;
  names: { en: string; zhHans: string };
  effect: string;
  iconAssetId?: string;
  provenance: SourceRef[];
};

type EmbeddedPersonalSkill = Omit<PersonalSkill, "unitId" | "iconAssetId" | "provenance">;

type ChildParentage = Record<string, unknown> & {
  unitId: string;
  personalSkill?: EmbeddedPersonalSkill;
};

type PersonalSourceRow = {
  section: string;
  name: string;
  effect: string;
  characterLabel: string;
};

type SourcePage = {
  id: string;
  skillType: "class" | "personal";
  rows: PersonalSourceRow[];
};

type Inventory = { pages: SourcePage[] };

type IconManifest = {
  entries: Array<{
    skillId: string;
    skillType: "class" | "personal";
    unitId?: string;
  }>;
};

type RosterFile = {
  units: Array<{ id: string; unitNo: number; availableRoutes: string[] }>;
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

function sourceCharacterUnitId(label: string): string {
  return label === "Avatar" ? "corrin" : label.toLowerCase();
}

function addIconProvenance(
  provenance: SourceRef[],
  rows: Array<PersonalSourceRow & { pageId: string }>,
): SourceRef[] {
  const additions = [...groupBy(rows, (row) => row.pageId).entries()].map(
    ([pageId, pageRows]) => ({
      sourceId: pageId,
      locator: pageRows
        .map(
          (row) =>
            `${row.section} > ${row.name} > ${row.characterLabel} > icon`,
        )
        .join("; "),
      fields: ["iconAssetId"],
      reviewStatus: "accepted" as const,
    }),
  );

  const existingKeys = new Set(
    provenance.map(
      (sourceRef) =>
        `${sourceRef.sourceId}|${sourceRef.locator}|${sourceRef.fields.join(",")}`,
    ),
  );

  return [
    ...provenance,
    ...additions.filter(
      (sourceRef) =>
        !existingKeys.has(
          `${sourceRef.sourceId}|${sourceRef.locator}|${sourceRef.fields.join(",")}`,
        ),
    ),
  ];
}

const [existingSkills, childParentage, inventory, iconManifest, firstRoster, secondRoster] = await Promise.all([
  readJson<PersonalSkill[]>(PERSONAL_SKILLS_PATH),
  readJson<ChildParentage[]>(CHILD_PARENTAGE_PATH),
  readJson<Inventory>(INVENTORY_PATH),
  readJson<IconManifest>(ICON_MANIFEST_PATH),
  readJson<RosterFile>(FIRST_ROSTER_PATH),
  readJson<RosterFile>(SECOND_ROSTER_PATH),
]);

const personalRows = inventory.pages
  .filter((page) => page.skillType === "personal")
  .flatMap((page) =>
    page.rows.map((row) => ({
      ...row,
      pageId: page.id,
      unitId: sourceCharacterUnitId(row.characterLabel),
    })),
  );
const rowsByUnit = groupBy(personalRows, (row) => row.unitId);
const iconEntryByUnit = new Map(
  iconManifest.entries
    .filter((entry) => entry.skillType === "personal" && entry.unitId)
    .map((entry) => [entry.unitId as string, entry]),
);
const skillByUnit = new Map(existingSkills.map((skill) => [skill.unitId, skill]));

for (const child of childParentage) {
  if (!child.personalSkill || skillByUnit.has(child.unitId)) continue;

  const rows = rowsByUnit.get(child.unitId) ?? [];
  if (rows.length === 0) throw new Error(`Missing source rows for ${child.unitId}.`);

  const sourceRefs = [...groupBy(rows, (row) => row.pageId).entries()].map(
    ([pageId, pageRows]) => ({
      sourceId: pageId,
      locator: pageRows
        .map((row) => `${row.section} > ${row.name} > ${row.characterLabel}`)
        .join("; "),
      fields:
        child.unitId === "kiragi"
          ? ["effect", "iconAssetId"]
          : ["names.en", "effect", "iconAssetId"],
      reviewStatus: "accepted" as const,
    }),
  );
  if (child.unitId === "kiragi") {
    sourceRefs.push({
      sourceId: "user-fe14-personal-skill-localization",
      locator: "Kiragi > Optimist",
      fields: ["id", "names.en"],
      reviewStatus: "accepted",
    });
  }

  skillByUnit.set(child.unitId, {
    ...child.personalSkill,
    unitId: child.unitId,
    iconAssetId: child.personalSkill.id,
    provenance: sourceRefs,
  });
}

const rosterById = new Map(
  [...firstRoster.units, ...secondRoster.units].map((unit) => [unit.id, unit]),
);
const personalSkills = [...skillByUnit.values()].map((skill) => {
  const iconEntry = iconEntryByUnit.get(skill.unitId);
  if (!iconEntry || iconEntry.skillId !== skill.id) {
    throw new Error(`Personal-skill icon manifest mismatch for ${skill.unitId}.`);
  }

  let provenance = skill.provenance;
  if (skill.unitId === "camilla") {
    provenance = provenance.map((sourceRef) =>
      sourceRef.sourceId === "serenes-fe14-nohrian-personal-skills"
        ? {
            ...sourceRef,
            fields: sourceRef.fields.filter((field) => field !== "names.en"),
            reviewStatus: "corroborated",
          }
        : sourceRef,
    );
    if (
      !provenance.some(
        (sourceRef) =>
          sourceRef.sourceId === "user-fe14-personal-skill-localization",
      )
    ) {
      provenance.push({
        sourceId: "user-fe14-personal-skill-localization",
        locator: "Camilla > Rose's Thorns",
        fields: ["id", "names.en"],
        reviewStatus: "accepted",
      });
    }
  }

  return {
    ...skill,
    iconAssetId: skill.id,
    provenance: addIconProvenance(provenance, rowsByUnit.get(skill.unitId) ?? []),
  };
}).sort((left, right) => {
  const leftUnit = rosterById.get(left.unitId);
  const rightUnit = rosterById.get(right.unitId);
  if (!leftUnit || !rightUnit) throw new Error("Personal skill references an unknown unit.");
  return (
    rightUnit.availableRoutes.length - leftUnit.availableRoutes.length ||
    leftUnit.unitNo - rightUnit.unitNo
  );
});

const consolidatedParentage = childParentage.map(({ personalSkill: _, ...record }) => record);
const parsedSkills = personalSkillsFileSchema.parse(personalSkills);
const parsedParentage = childParentageFileSchema.parse(consolidatedParentage);

await Promise.all([
  writeFile(
    PERSONAL_SKILLS_PATH,
    `${JSON.stringify(parsedSkills, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    CHILD_PARENTAGE_PATH,
    `${JSON.stringify(parsedParentage, null, 2)}\n`,
    "utf8",
  ),
]);

console.log(`Personal skills: ${parsedSkills.length}`);
console.log(`Child parentage records: ${parsedParentage.length}`);

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INVENTORY_PATH = path.resolve(
  "data/sources/fe14/serenes-skill-source-inventory.json",
);
const CLASS_TREES_PATH = path.resolve("data/normalized/fe14/class-trees.json");
const CLASS_STATS_PATH = path.resolve("data/normalized/fe14/class-stats.json");
const PERSONAL_SKILLS_PATH = path.resolve(
  "data/normalized/fe14/personal-skills.json",
);
const JSON_REPORT_PATH = path.resolve(
  "data/reports/fe14/skill-extraction-summary.json",
);
const TEXT_REPORT_PATH = path.resolve(
  "data/reports/fe14/skill-extraction-summary.txt",
);

type ClassSourceRow = {
  sourceOrder: number;
  iconUrl: string;
  name: string;
  description: string;
  classLabel: string;
  level: string;
  cost: string;
};

type PersonalSourceRow = {
  sourceOrder: number;
  section: string;
  iconUrl: string;
  name: string;
  effect: string;
  characterLabel: string;
};

type SourcePage = {
  id: string;
  title: string;
  skillType: "class" | "personal";
  category: string;
  url: string;
  rowCount: number;
  rows: ClassSourceRow[] | PersonalSourceRow[];
};

type Inventory = {
  gameId: string;
  capturedAt: string;
  pages: SourcePage[];
};

type ClassStats = {
  classes: Array<{
    classId: string;
    displayName: string;
  }>;
};

type ClassTrees = {
  classes: Array<{
    id: string;
    promotions: Array<{ id: string }>;
  }>;
};

type PersonalSkill = {
  id: string;
  unitId: string;
  names: { en: string };
};

type ClassMapping = {
  classIds: string[];
  gender?: "male" | "female";
};

const CLASS_LABEL_OVERRIDES: Record<string, ClassMapping> = {
  "Monk, Shrine Maiden": { classIds: ["monk", "shrine_maiden"] },
  "Great Master, Priestess": { classIds: ["great_master", "priestess"] },
  "Nohr Prince(ss)": { classIds: ["nohr_prince"] },
  "Troubadour(M)": { classIds: ["troubadour"], gender: "male" },
  "Troubadour (F)": { classIds: ["troubadour"], gender: "female" },
  "Maid, Butler": { classIds: ["attendant"] },
};

const REVIEWED_PERSONAL_NAME_DECISIONS: Record<
  string,
  { acceptedName: string; note: string }
> = {
  setsuna: {
    acceptedName: "Optimistic",
    note: "Serenes swaps the localized Optimist/Optimistic labels; Setsuna uses Optimistic in game.",
  },
  kiragi: {
    acceptedName: "Optimist",
    note: "Serenes swaps the localized Optimist/Optimistic labels; Kiragi uses Optimist in game.",
  },
  camilla: {
    acceptedName: "Rose's Thorns",
    note: "The accepted in-game localization is plural despite the singular Serenes label.",
  },
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

function normalizePunctuation(value: string): string {
  return value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function sourceCharacterUnitId(label: string): string {
  return label === "Avatar" ? "corrin" : label.toLowerCase();
}

const [inventory, classTrees, classStats, personalSkills] =
  await Promise.all([
    readJson<Inventory>(INVENTORY_PATH),
    readJson<ClassTrees>(CLASS_TREES_PATH),
    readJson<ClassStats>(CLASS_STATS_PATH),
    readJson<PersonalSkill[]>(PERSONAL_SKILLS_PATH),
  ]);

const classPages = inventory.pages.filter((page) => page.skillType === "class");
const personalPages = inventory.pages.filter(
  (page) => page.skillType === "personal",
);
const classRows = classPages.flatMap((page) =>
  (page.rows as ClassSourceRow[]).map((row) => ({ ...row, pageId: page.id })),
);
const personalRows = personalPages.flatMap((page) =>
  (page.rows as PersonalSourceRow[]).map((row) => ({ ...row, pageId: page.id })),
);

const classIdByDisplayName = new Map(
  classStats.classes.map((record) => [record.displayName, record.classId]),
);
const knownClassIds = new Set(classStats.classes.map((record) => record.classId));
const treeClassIds = new Set(
  classTrees.classes.flatMap((tree) => [
    tree.id,
    ...tree.promotions.map((promotion) => promotion.id),
  ]),
);
const sourceClassLabels = [...new Set(classRows.map((row) => row.classLabel))];

const classLabelMappings = sourceClassLabels.map((sourceLabel) => {
  const directClassId = classIdByDisplayName.get(sourceLabel);
  const mapping =
    CLASS_LABEL_OVERRIDES[sourceLabel] ??
    (directClassId ? { classIds: [directClassId] } : { classIds: [] });

  return {
    sourceLabel,
    ...mapping,
    allClassIdsKnown: mapping.classIds.every((classId) => knownClassIds.has(classId)),
  };
});

const mappingByLabel = new Map(
  classLabelMappings.map((mapping) => [mapping.sourceLabel, mapping]),
);
const unmappedClassLabels = classLabelMappings
  .filter((mapping) => mapping.classIds.length === 0 || !mapping.allClassIdsKnown)
  .map((mapping) => mapping.sourceLabel);
const acquisitionEdges = classRows.reduce(
  (total, row) => total + (mappingByLabel.get(row.classLabel)?.classIds.length ?? 0),
  0,
);

const classSkillGroups = groupBy(classRows, (row) => row.name);
const duplicateClassSkills = [...classSkillGroups.entries()]
  .filter(([, rows]) => rows.length > 1)
  .map(([name, rows]) => ({
    name,
    sourceRows: rows.length,
    classes: rows.map((row) => row.classLabel),
    pageIds: rows.map((row) => row.pageId),
    iconUrlsMatch: new Set(rows.map((row) => row.iconUrl)).size === 1,
    descriptionsMatch: new Set(rows.map((row) => row.description)).size === 1,
  }));

const personalSkillGroups = groupBy(personalRows, (row) => row.name);
const duplicatePersonalSkills = [...personalSkillGroups.entries()]
  .filter(([, rows]) => rows.length > 1)
  .map(([name, rows]) => ({
    name,
    sourceRows: rows.length,
    characters: [...new Set(rows.map((row) => row.characterLabel))],
    pageIds: rows.map((row) => row.pageId),
    iconUrlsMatch: new Set(rows.map((row) => row.iconUrl)).size === 1,
    effectsMatch: new Set(rows.map((row) => row.effect)).size === 1,
  }));

const acceptedPersonalSkillByUnit = new Map(
  personalSkills.map((skill) => [skill.unitId, skill]),
);
const uniquePersonalRowsByUnit = [
  ...groupBy(personalRows, (row) => sourceCharacterUnitId(row.characterLabel)).values(),
].map((rows) => rows[0]);

const personalNameDifferences = uniquePersonalRowsByUnit.flatMap((row) => {
  const unitId = sourceCharacterUnitId(row.characterLabel);
  const accepted = acceptedPersonalSkillByUnit.get(unitId);

  if (!accepted || row.name === accepted.names.en) {
    return [];
  }

  return [
    {
      unitId,
      sourceName: row.name,
      acceptedName: accepted.names.en,
      punctuationOnly:
        normalizePunctuation(row.name) === normalizePunctuation(accepted.names.en),
      reviewed:
        REVIEWED_PERSONAL_NAME_DECISIONS[unitId]?.acceptedName ===
        accepted.names.en,
    },
  ];
});

const duplicateAcceptedPersonalSkillIds = [
  ...groupBy(personalSkills, (skill) => skill.id).entries(),
]
  .filter(([, skills]) => skills.length > 1)
  .map(([id, skills]) => ({
    id,
    units: skills.map((skill) => skill.unitId),
    names: [...new Set(skills.map((skill) => skill.names.en))],
  }));

const allRows = [...classRows, ...personalRows];
const missingIconRows = allRows.filter((row) => !row.iconUrl);
const duplicateImageGroups = [...groupBy(allRows, (row) => row.iconUrl).entries()]
  .filter(([, rows]) => rows.length > 1)
  .map(([iconUrl, rows]) => ({
    iconUrl,
    sourceRows: rows.length,
    skillNames: [...new Set(rows.map((row) => row.name))],
  }));

const classTreeGaps = [
  ...new Set(
    classLabelMappings.flatMap((mapping) =>
      mapping.classIds.filter((classId) => !treeClassIds.has(classId)),
    ),
  ),
];

const errors = [
  ...(unmappedClassLabels.length
    ? [`Unmapped source class labels: ${unmappedClassLabels.join(", ")}`]
    : []),
  ...(missingIconRows.length
    ? [`Source rows missing icon URLs: ${missingIconRows.length}`]
    : []),
];

const unresolvedMaterialNameDifferences = personalNameDifferences.filter(
  (difference) => !difference.punctuationOnly && !difference.reviewed,
);
const warnings = [
  ...unresolvedMaterialNameDifferences.map(
    (difference) =>
      `${difference.unitId}: Serenes uses "${difference.sourceName}" while accepted data uses "${difference.acceptedName}". Preserve accepted data pending explicit review.`,
  ),
  ...duplicateAcceptedPersonalSkillIds.map(
    (duplicate) =>
      `Accepted personal-skill ID "${duplicate.id}" is reused by ${duplicate.units.join(" and ")}; resolve before consolidating personal skills.`,
  ),
];

const summary = {
  gameId: inventory.gameId,
  sourceInventoryCapturedAt: inventory.capturedAt,
  counts: {
    hoshidanClassSourceRows:
      classPages.find((page) => page.category === "hoshidan")?.rowCount ?? 0,
    nohrianClassSourceRows:
      classPages.find((page) => page.category === "nohrian")?.rowCount ?? 0,
    totalClassSourceRows: classRows.length,
    uniqueClassSkills: classSkillGroups.size,
    classAcquisitionEdges: acquisitionEdges,
    sourceClassLabels: sourceClassLabels.length,
    mappedSourceClassLabels:
      sourceClassLabels.length - unmappedClassLabels.length,
    personalSkillSourceRows: personalRows.length,
    uniquePersonalSkills: personalSkillGroups.size,
    acceptedPlayablePersonalSkills: personalSkills.length,
    missingIcons: missingIconRows.length,
    duplicateSourceImageGroups: duplicateImageGroups.length,
    duplicateSourceImageExtraRows: duplicateImageGroups.reduce(
      (total, group) => total + group.sourceRows - 1,
      0,
    ),
    validationErrors: errors.length,
    validationWarnings: warnings.length,
  },
  duplicateClassSkills,
  duplicatePersonalSkills,
  classLabelMappings,
  plannedClassTreeAdditions: classTreeGaps,
  reviewDecisions: {
    standaloneClasses: classTreeGaps.map((classId) => ({
      classId,
      decision: "Add as a standalone class-tree node.",
    })),
    personalSkillNames: Object.entries(REVIEWED_PERSONAL_NAME_DECISIONS).map(
      ([unitId, decision]) => ({ unitId, ...decision }),
    ),
  },
  personalSkillReconciliation: {
    nameDifferences: personalNameDifferences,
    duplicateAcceptedIds: duplicateAcceptedPersonalSkillIds,
  },
  duplicateSourceImages: duplicateImageGroups,
  validation: {
    errors,
    warnings,
  },
};

const textReport = [
  "FE14 Milestone 007 - Skill extraction summary",
  "",
  `Hoshidan class rows: ${summary.counts.hoshidanClassSourceRows}`,
  `Nohrian class rows: ${summary.counts.nohrianClassSourceRows}`,
  `Unique class skills: ${summary.counts.uniqueClassSkills}`,
  `Class acquisition edges: ${summary.counts.classAcquisitionEdges}`,
  `Class-label mappings: ${summary.counts.mappedSourceClassLabels}/${summary.counts.sourceClassLabels}`,
  `Personal-skill source rows: ${summary.counts.personalSkillSourceRows}`,
  `Unique playable personal skills: ${summary.counts.uniquePersonalSkills}`,
  `Accepted playable personal skills: ${summary.counts.acceptedPlayablePersonalSkills}`,
  `Missing icon URLs: ${summary.counts.missingIcons}`,
  `Duplicate source-image groups: ${summary.counts.duplicateSourceImageGroups}`,
  `Validation errors: ${summary.counts.validationErrors}`,
  `Validation warnings: ${summary.counts.validationWarnings}`,
  "",
  "Shared class skills:",
  ...duplicateClassSkills.map(
    (skill) =>
      `- ${skill.name}: ${skill.classes.join(" + ")} (icon ${skill.iconUrlsMatch ? "matches" : "DIFFERS"}; description ${skill.descriptionsMatch ? "matches" : "DIFFERS"})`,
  ),
  "",
  "Exceptional class-label mappings:",
  ...classLabelMappings
    .filter((mapping) => CLASS_LABEL_OVERRIDES[mapping.sourceLabel])
    .map(
      (mapping) =>
        `- ${mapping.sourceLabel} -> ${mapping.classIds.join(", ")}${mapping.gender ? ` (${mapping.gender} only)` : ""}`,
    ),
  "",
  "Reviewed decisions:",
  ...classTreeGaps.map(
    (classId) => `- ${classId}: add as a standalone class-tree node.`,
  ),
  ...Object.entries(REVIEWED_PERSONAL_NAME_DECISIONS).map(
    ([unitId, decision]) =>
      `- ${unitId}: keep ${decision.acceptedName}. ${decision.note}`,
  ),
  "",
  "Warnings:",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- None"]),
  "",
  "Errors:",
  ...(errors.length ? errors.map((error) => `- ${error}`) : ["- None"]),
  "",
].join("\n");

await Promise.all([
  writeFile(JSON_REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
  writeFile(TEXT_REPORT_PATH, textReport, "utf8"),
]);

console.log(textReport);

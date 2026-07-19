import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CLASS_STATS_PATH = path.resolve("data/normalized/fe14/class-stats.json");
const CHILD_RECRUITMENT_PATH = path.resolve("data/normalized/fe14/child-recruitment.json");
const STAT_KEYS = [
  "hp",
  "strength",
  "magic",
  "skill",
  "speed",
  "luck",
  "defense",
  "resistance",
] as const;

type StatKey = (typeof STAT_KEYS)[number];
type StatBlock = Record<StatKey, number>;
type ClassRecord = Record<string, unknown> & { classId: string };
type ClassStatsFile = {
  gameId: string;
  scope: string;
  classes: ClassRecord[];
  provenance: Array<Record<string, unknown> & { sourceId: string }>;
};

const stats = (values: number[]): StatBlock => {
  if (values.length !== STAT_KEYS.length) {
    throw new Error(`Expected ${STAT_KEYS.length} growth values; received ${values.length}.`);
  }
  return Object.fromEntries(
    STAT_KEYS.map((key, index) => [key, values[index]]),
  ) as StatBlock;
};

const growthRows = [
  source("serenes-fe14-hoshidan-class-growth-rates", {
    hoshido_noble: [15, 15, 10, 10, 10, 10, 15, 0],
    samurai: [10, 10, 0, 15, 20, 15, 0, 10],
    swordmaster: [10, 10, 5, 15, 20, 15, 0, 10],
    master_of_arms: [20, 15, 0, 10, 10, 10, 10, 0],
    oni_savage: [20, 20, 10, 0, 10, 0, 20, 0],
    oni_chieftain: [10, 20, 15, 0, 10, 0, 20, 5],
    blacksmith: [20, 15, 0, 15, 10, 5, 15, 0],
    spear_fighter: [15, 15, 0, 15, 15, 5, 10, 5],
    spear_master: [15, 15, 0, 15, 15, 5, 10, 5],
    basara: [20, 10, 10, 10, 10, 15, 5, 10],
    diviner: [0, 5, 15, 10, 15, 5, 0, 10],
    onmyoji: [0, 0, 20, 10, 15, 0, 0, 15],
    monk: [0, 5, 10, 10, 15, 15, 0, 20],
    shrine_maiden: [0, 5, 10, 10, 15, 15, 0, 20],
    great_master: [10, 15, 5, 5, 15, 15, 10, 10],
    priestess: [10, 10, 10, 5, 15, 15, 0, 20],
    sky_knight: [0, 10, 0, 10, 15, 20, 0, 20],
    falcon_knight: [0, 10, 10, 10, 15, 20, 0, 20],
    kinshi_knight: [0, 5, 0, 15, 15, 15, 0, 15],
    archer: [10, 15, 0, 15, 15, 5, 10, 0],
    sniper: [10, 15, 0, 20, 15, 5, 10, 0],
    ninja: [5, 5, 0, 20, 20, 0, 5, 15],
    master_ninja: [5, 5, 0, 20, 20, 0, 5, 20],
    mechanist: [10, 10, 0, 15, 10, 5, 5, 15],
    apothecary: [20, 20, 0, 10, 10, 5, 10, 5],
    merchant: [20, 20, 0, 10, 5, 15, 10, 5],
    kitsune: [10, 10, 0, 15, 20, 10, 0, 20],
    nine_tails: [10, 10, 0, 15, 20, 10, 0, 20],
    songstress: [0, 10, 0, 20, 20, 20, 0, 0],
    villager: [10, 10, 0, 10, 10, 20, 10, 0],
  }),
  source("serenes-fe14-nohrian-class-growth-rates", {
    nohr_prince: [15, 15, 10, 10, 10, 10, 10, 5],
    nohr_noble: [15, 10, 15, 5, 15, 5, 5, 15],
    cavalier: [10, 15, 0, 10, 10, 15, 10, 5],
    paladin: [10, 15, 0, 10, 10, 15, 10, 10],
    great_knight: [20, 20, 0, 10, 5, 5, 20, 0],
    knight: [20, 20, 0, 15, 5, 10, 20, 0],
    general: [25, 20, 0, 15, 0, 10, 20, 5],
    fighter: [20, 20, 0, 15, 15, 5, 5, 0],
    berserker: [30, 25, 0, 15, 15, 0, 0, 0],
    mercenary: [10, 15, 0, 20, 15, 5, 10, 5],
    hero: [20, 15, 0, 20, 15, 5, 10, 0],
    bow_knight: [10, 10, 0, 15, 15, 10, 0, 10],
    outlaw: [0, 10, 5, 10, 20, 0, 0, 20],
    adventurer: [0, 5, 15, 5, 20, 0, 0, 20],
    wyvern_rider: [10, 15, 5, 10, 10, 5, 20, 0],
    wyvern_lord: [10, 15, 0, 15, 10, 5, 20, 0],
    malig_knight: [0, 15, 15, 10, 5, 0, 10, 15],
    dark_mage: [0, 10, 20, 0, 10, 0, 5, 10],
    sorcerer: [0, 0, 25, 0, 10, 0, 5, 15],
    dark_knight: [15, 20, 10, 5, 5, 5, 15, 5],
    troubadour: [0, 0, 10, 20, 10, 15, 0, 15],
    strategist: [0, 0, 15, 5, 10, 20, 0, 15],
    attendant: [0, 10, 10, 15, 15, 10, 5, 10],
    wolfskin: [20, 20, 0, 5, 15, 5, 10, 0],
    wolfssegner: [20, 20, 0, 5, 15, 5, 10, 0],
  }),
];

function source(sourceId: string, rows: Record<string, number[]>) {
  return { sourceId, rows };
}

const growthByClassId = new Map<string, { growthRates: StatBlock; sourceId: string }>();
for (const { sourceId, rows } of growthRows) {
  for (const [classId, values] of Object.entries(rows)) {
    if (growthByClassId.has(classId)) {
      throw new Error(`Duplicate class-growth source mapping for ${classId}.`);
    }
    growthByClassId.set(classId, { growthRates: stats(values), sourceId });
  }
}

const [classStats, childRecruitment] = await Promise.all([
  readFile(CLASS_STATS_PATH, "utf8").then((value) => JSON.parse(value) as ClassStatsFile),
  readFile(CHILD_RECRUITMENT_PATH, "utf8").then((value) => JSON.parse(value) as Array<Record<string, any>>),
]);
const classIds = new Set(classStats.classes.map((record) => record.classId));
const missing = [...classIds].filter((classId) => !growthByClassId.has(classId));
const extra = [...growthByClassId.keys()].filter((classId) => !classIds.has(classId));
if (missing.length > 0 || extra.length > 0 || growthByClassId.size !== 55) {
  throw new Error(
    `Class-growth coverage mismatch. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`,
  );
}

classStats.classes = classStats.classes.map((record) => ({
  ...record,
  growthRates: growthByClassId.get(record.classId)?.growthRates,
}));

const growthSourceIds = new Set(growthRows.map((entry) => entry.sourceId));
classStats.provenance = [
  ...classStats.provenance.filter((entry) => !growthSourceIds.has(entry.sourceId)),
  ...growthRows.map(({ sourceId }) => ({
    sourceId,
    locator: "Growth Rates table",
    fields: ["classes.growthRates"],
    reviewStatus: "accepted",
  })),
];

for (const recruitment of childRecruitment) {
  delete recruitment.startingClassGrowthRates;
  for (const option of recruitment.offspringSeal.promotionOptions) {
    delete option.classGrowthRates;
  }
  recruitment.provenance = recruitment.provenance
    .map((sourceRef: Record<string, any>) => ({
      ...sourceRef,
      fields: Array.isArray(sourceRef.fields)
        ? sourceRef.fields.filter(
            (field: string) =>
              field !== "startingClassGrowthRates" &&
              field !== "offspringSeal.promotionOptions.classGrowthRates",
          )
        : sourceRef.fields,
    }))
    .filter(
      (sourceRef: Record<string, any>) =>
        !Array.isArray(sourceRef.fields) || sourceRef.fields.length > 0,
    );
}

await Promise.all([
  writeFile(CLASS_STATS_PATH, stringifyClassStats(classStats)),
  writeFile(CHILD_RECRUITMENT_PATH, `${JSON.stringify(childRecruitment, null, 2)}\n`),
]);
console.log(
  `Normalized class growth rates for ${growthByClassId.size} FE14 classes and removed copied child growth vectors.`,
);

function stringifyClassStats(value: ClassStatsFile): string {
  const classes = value.classes.map((record) => `    ${JSON.stringify(record)}`).join(",\n");
  const provenance = value.provenance.map((record) => `    ${JSON.stringify(record)}`).join(",\n");
  return [
    "{",
    `  \"gameId\": ${JSON.stringify(value.gameId)},`,
    `  \"scope\": ${JSON.stringify(value.scope)},`,
    '  "classes": [',
    classes,
    "  ],",
    '  "provenance": [',
    provenance,
    "  ]",
    "}",
    "",
  ].join("\n");
}

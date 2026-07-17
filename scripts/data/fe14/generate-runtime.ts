import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateFe14Data, type ValidationMessage } from "./validate";

type JsonObject = Record<string, unknown>;

const DOMAIN_PATHS = {
  firstRoster: "data/normalized/fe14/units/first-generation.json",
  secondRoster: "data/normalized/fe14/units/second-generation.json",
  childParentage: "data/normalized/fe14/child-parentage.json",
  childRecruitment: "data/normalized/fe14/child-recruitment.json",
  classTrees: "data/normalized/fe14/class-trees.json",
  classStats: "data/normalized/fe14/class-stats.json",
  availability: "data/normalized/fe14/unit-availability.json",
  baseStats: "data/normalized/fe14/unit-base-stats.json",
  growths: "data/normalized/fe14/unit-growths.json",
  capModifiers: "data/normalized/fe14/unit-cap-modifiers.json",
  avatarConfigurations: "data/normalized/fe14/avatar-configurations.json",
  pairupBonuses: "data/normalized/fe14/unit-pairup-bonuses.json",
  supports: "data/normalized/fe14/support-relationships.json",
  classAccess: "data/normalized/fe14/unit-class-access.json",
  personalSkills: "data/normalized/fe14/personal-skills.json",
  sources: "data/sources/fe14/sources.json",
} as const;

const result = await validateFe14Data();
if (!result.valid) {
  for (const error of result.errors) {
    console.error(`ERROR ${error.code}: ${error.message}`);
  }
  process.exitCode = 1;
  throw new Error("FE14 normalized data did not pass validation; runtime output was not generated.");
}

const firstRosterFile = result.parsed[DOMAIN_PATHS.firstRoster] as JsonObject;
const secondRosterFile = result.parsed[DOMAIN_PATHS.secondRoster] as JsonObject;
const firstRoster = (firstRosterFile.units as JsonObject[]).map((unit) => ({ ...unit, generation: "first" }));
const secondRoster = secondRosterFile.units as JsonObject[];
const roster = [...firstRoster, ...secondRoster];
const classTreeFile = result.parsed[DOMAIN_PATHS.classTrees] as JsonObject;
const classStatsFile = result.parsed[DOMAIN_PATHS.classStats] as JsonObject;
const sourcesFile = result.parsed[DOMAIN_PATHS.sources] as JsonObject;
const updatedAt = sourcesFile.updatedAt as string;

const runtimeUnits = roster
  .filter((unit) => unit.status !== "not_started")
  .map((identity) => {
    const unitId = identity.id as string;
    const parentage = firstRecordFor(result.parsed[DOMAIN_PATHS.childParentage], unitId);
    const recruitment = firstRecordFor(result.parsed[DOMAIN_PATHS.childRecruitment], unitId);
    const childBaseGrowth = parentage?.childBaseGrowth as JsonObject | undefined;
    const childBaseClassId = parentage?.childBaseClassId as string | undefined;
    return {
      identity,
      availability: recordsFor(result.parsed[DOMAIN_PATHS.availability], unitId),
      baseStats: recordsFor(result.parsed[DOMAIN_PATHS.baseStats], unitId),
      growths: childBaseGrowth
        ? [{ unitId, kind: "child_base", rates: childBaseGrowth, provenance: parentage?.provenance }]
        : recordsFor(result.parsed[DOMAIN_PATHS.growths], unitId),
      capModifiers: firstRecordFor(result.parsed[DOMAIN_PATHS.capModifiers], unitId),
      avatarConfiguration: firstRecordFor(result.parsed[DOMAIN_PATHS.avatarConfigurations], unitId),
      pairupBonuses: firstRecordFor(result.parsed[DOMAIN_PATHS.pairupBonuses], unitId),
      supports: supportRecordsFor(result.parsed[DOMAIN_PATHS.supports], unitId),
      classAccess: childBaseClassId ? {
        unitId,
        startingClassId: childBaseClassId,
        baseClassSet: [childBaseClassId],
        heartSealClassSet: [parentage?.fixedInheritedClassId],
        corrinTalentOnlyClassSet: [],
        sealGrants: [],
        provenance: parentage?.provenance,
      } : firstRecordFor(result.parsed[DOMAIN_PATHS.classAccess], unitId),
      personalSkill: parentage?.personalSkill ?? firstRecordFor(result.parsed[DOMAIN_PATHS.personalSkills], unitId),
      offspring: parentage && recruitment ? { parentage, recruitment } : null,
    };
  });

const runtime = {
  schemaVersion: 1,
  gameId: "fe14",
  lastUpdated: updatedAt,
  roster,
  classTrees: classTreeFile.classes,
  classStats: classStatsFile.classes,
  units: runtimeUnits,
  sources: sourcesFile.sources,
};

const progress = {
  gameId: "fe14",
  updatedAt,
  units: [...firstRoster].sort(byProcessingOrder).map((unit) => {
    const unitId = unit.id as string;
    return {
      order: unit.processingOrder as number,
      unitId,
      displayName: unit.displayName,
      status: unit.status,
      domains: {
        identity: Boolean(unit.names),
        availability: recordsFor(result.parsed[DOMAIN_PATHS.availability], unitId).length > 0,
        baseStats: recordsFor(result.parsed[DOMAIN_PATHS.baseStats], unitId).length > 0,
        growths: recordsFor(result.parsed[DOMAIN_PATHS.growths], unitId).length > 0,
        capModifiers: recordsFor(result.parsed[DOMAIN_PATHS.capModifiers], unitId).length > 0,
        avatarConfiguration: recordsFor(result.parsed[DOMAIN_PATHS.avatarConfigurations], unitId).length > 0,
        pairupBonuses: recordsFor(result.parsed[DOMAIN_PATHS.pairupBonuses], unitId).length > 0,
        supports: supportRecordsFor(result.parsed[DOMAIN_PATHS.supports], unitId).length > 0,
        classAccess: recordsFor(result.parsed[DOMAIN_PATHS.classAccess], unitId).length > 0,
        personalSkill: recordsFor(result.parsed[DOMAIN_PATHS.personalSkills], unitId).length > 0,
      },
      openIssues: result.warnings.filter((warning) => warning.unitId === unitId),
    };
  }),
};

const secondGenerationProgress = {
  gameId: "fe14",
  updatedAt,
  units: [...secondRoster].sort(byProcessingOrder).map((unit) => {
    const unitId = unit.id as string;
    return {
      order: unit.processingOrder,
      unitNo: unit.unitNo,
      unitId,
      displayName: unit.displayName,
      status: unit.status,
      domains: {
        identity: Boolean(unit.names),
        parentage: recordsFor(result.parsed[DOMAIN_PATHS.childParentage], unitId).length > 0,
        recruitment: recordsFor(result.parsed[DOMAIN_PATHS.childRecruitment], unitId).length > 0,
      },
      openIssues: result.warnings.filter((warning) => warning.unitId === unitId),
    };
  }),
};

const validationReport = {
  gameId: "fe14",
  lastUpdated: updatedAt,
  valid: result.valid,
  counts: {
    rosterUnits: roster.length,
    firstGenerationUnits: firstRoster.length,
    secondGenerationUnits: secondRoster.length,
    normalizedUnits: runtimeUnits.length,
    errors: result.errors.length,
    warnings: result.warnings.length,
  },
  errors: result.errors,
  warnings: result.warnings,
};

const reportText = formatValidationReport(validationReport, result.warnings);

await Promise.all([
  writeJson("data/runtime/fe14/units.json", runtime),
  writeJson("data/reports/fe14/first-generation-progress.json", progress),
  writeJson("data/reports/fe14/first-generation-validation.json", validationReport),
  writeText("data/reports/fe14/first-generation-validation.txt", reportText),
  writeJson("data/reports/fe14/second-generation-progress.json", secondGenerationProgress),
  writeJson("data/reports/fe14/second-generation-validation.json", validationReport),
  writeText("data/reports/fe14/second-generation-validation.txt", reportText.replace("first-generation", "second-generation")),
]);

console.log(
  `Generated FE14 runtime data for ${runtimeUnits.length} unit(s); roster manifest contains ${roster.length} units.`,
);
for (const warning of result.warnings) {
  console.warn(`WARN ${warning.code}: ${warning.message}`);
}

function recordsFor(value: unknown, unitId: string): JsonObject[] {
  return (value as JsonObject[]).filter((record) => record.unitId === unitId);
}

function supportRecordsFor(value: unknown, unitId: string): JsonObject[] {
  return (value as JsonObject[])
    .filter((record) => record.unitId === unitId || record.partnerUnitId === unitId)
    .map((record) => {
      if (record.unitId === unitId) return record;
      return {
        ...record,
        sourceUnitId: record.unitId,
        unitId,
        partnerUnitId: record.unitId,
      };
    });
}

function firstRecordFor(value: unknown, unitId: string): JsonObject | null {
  return recordsFor(value, unitId)[0] ?? null;
}

function byProcessingOrder(left: JsonObject, right: JsonObject): number {
  return (left.processingOrder as number) - (right.processingOrder as number);
}

async function writeJson(relativePath: string, value: unknown): Promise<void> {
  await writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeText(relativePath: string, value: string): Promise<void> {
  const absolutePath = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, value, "utf8");
}

function formatValidationReport(
  report: { valid: boolean; counts: JsonObject },
  warnings: ValidationMessage[],
): string {
  const lines = [
    "FE14 first-generation data validation",
    "======================================",
    `Result: ${report.valid ? "PASS" : "FAIL"}`,
    `Roster units: ${String(report.counts.rosterUnits)}`,
    `Normalized units: ${String(report.counts.normalizedUnits)}`,
    `Errors: ${String(report.counts.errors)}`,
    `Warnings: ${String(report.counts.warnings)}`,
  ];

  if (warnings.length > 0) {
    lines.push("", "Review warnings:");
    for (const warning of warnings) {
      lines.push(`- [${warning.code}] ${warning.unitId ?? "global"}: ${warning.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

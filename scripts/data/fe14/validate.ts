import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ZodTypeAny } from "zod";
import { domainSchemas } from "./schemas";
import { SOURCE_LOCATIONS } from "./source-locators";

const APPROVED_ROSTER = [
  "felicia",
  "jakob",
  "kaze",
  "silas",
  "azura",
  "mozu",
  "shura",
  "izana",
  "gunter",
  "flora",
  "elise",
  "arthur",
  "effie",
  "odin",
  "niles",
  "nyx",
  "camilla",
  "selena",
  "beruka",
  "laslow",
  "peri",
  "benny",
  "charlotte",
  "leo",
  "keaton",
  "xander",
  "rinkah",
  "sakura",
  "hana",
  "subaki",
  "saizo",
  "orochi",
  "hinoka",
  "azama",
  "setsuna",
  "hayato",
  "oboro",
  "hinata",
  "takumi",
  "kagero",
  "reina",
  "kaden",
  "scarlet",
  "ryoma",
  "yukimura",
  "fuga",
  "anna",
  "corrin",
] as const;

export interface ValidationMessage {
  code: string;
  message: string;
  unitId?: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  scope: string;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  parsed: Record<string, unknown>;
}

type JsonObject = Record<string, unknown>;

export async function validateFe14Data(unitId?: string): Promise<ValidationResult> {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const parsed: Record<string, unknown> = {};

  for (const [relativePath, schema] of Object.entries(domainSchemas) as Array<
    [string, ZodTypeAny]
  >) {
    const value = await readJson(relativePath);
    const result = schema.safeParse(value);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          code: "schema_error",
          message: issue.message,
          path: `${relativePath}:${issue.path.join(".")}`,
        });
      }
      continue;
    }

    parsed[relativePath] = result.data;
  }

  if (errors.length === 0) {
    validateRelationships(parsed, errors, warnings, unitId);
  }

  return {
    valid: errors.length === 0,
    scope: unitId ?? "all",
    errors,
    warnings,
    parsed,
  };
}

function validateRelationships(
  parsed: Record<string, unknown>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[],
  unitFilter?: string,
): void {
  const sourceCatalog = parsed["data/sources/fe14/sources.json"] as JsonObject;
  const sourceRecords = sourceCatalog.sources as JsonObject[];
  const sourceIds = new Set(sourceRecords.map((source) => source.id as string));
  const rosterFile = parsed["data/normalized/fe14/units/first-generation.json"] as JsonObject;
  const roster = rosterFile.units as JsonObject[];
  const rosterIds = roster.map((unit) => unit.id as string);
  const rosterIdSet = new Set(rosterIds);
  const rosterByProcessingOrder = [...roster].sort(
    (left, right) => (left.processingOrder as number) - (right.processingOrder as number),
  );
  const processingIds = rosterByProcessingOrder.map((unit) => unit.id as string);

  validateUniqueIds(sourceRecords, "source", errors);
  validateUniqueIds(roster, "roster unit", errors);
  validateContinuousOrder(roster, "unitNo", "unit number", errors);
  validateContinuousOrder(roster, "processingOrder", "processing order", errors);

  if (rosterIds.length !== APPROVED_ROSTER.length) {
    errors.push({ code: "roster_count", message: `Expected 48 units; found ${rosterIds.length}.` });
  }

  if (processingIds.join("|") !== APPROVED_ROSTER.join("|")) {
    errors.push({
      code: "roster_order",
      message: "First-generation roster membership or processing order differs from the approved manifest.",
    });
  }

  if (roster.some((unit, index) => unit.unitNo !== index + 1)) {
    errors.push({
      code: "roster_canonical_order",
      message: "First-generation roster JSON must be ordered by its canonical unit number.",
    });
  }

  for (const source of sourceRecords) {
    const expectedLocation = SOURCE_LOCATIONS[source.id as keyof typeof SOURCE_LOCATIONS];
    if (expectedLocation && source.location !== expectedLocation) {
      errors.push({
        code: "source_location",
        message: `Source ${source.id as string} does not match the source-locator registry.`,
      });
    }
  }

  for (const [relativePath, value] of Object.entries(parsed)) {
    for (const sourceRef of collectSourceRefs(value)) {
      if (!sourceIds.has(sourceRef.sourceId)) {
        errors.push({
          code: "unknown_source",
          message: `Unknown source ID ${sourceRef.sourceId}.`,
          path: relativePath,
        });
      }
    }
  }

  const domainPaths = Object.keys(parsed).filter(
    (relativePath) =>
      relativePath.startsWith("data/normalized/fe14/") &&
      !relativePath.endsWith("units/first-generation.json") &&
      !relativePath.endsWith("class-trees.json"),
  );

  for (const relativePath of domainPaths) {
    const records = parsed[relativePath] as JsonObject[];
    for (const record of records) {
      const recordUnitId = record.unitId as string | undefined;
      if (recordUnitId && !rosterIdSet.has(recordUnitId)) {
        errors.push({
          code: "unknown_unit",
          message: `${relativePath} references unknown unit ${recordUnitId}.`,
          unitId: recordUnitId,
        });
      }
    }
  }

  if (unitFilter && !rosterIdSet.has(unitFilter)) {
    errors.push({ code: "unknown_scope_unit", message: `Unknown unit filter ${unitFilter}.` });
    return;
  }

  const availability = parsed["data/normalized/fe14/unit-availability.json"] as JsonObject[];
  const availabilityIds = new Set(availability.map((record) => record.id as string));
  for (const record of availability) {
    const routeJoins = record.routeJoins as JsonObject[];
    const routes = routeJoins.map((routeJoin) => routeJoin.route as string);
    if (new Set(routes).size !== routes.length) {
      errors.push({
        code: "duplicate_route_join",
        message: `Availability ${record.id as string} contains a duplicate route join.`,
        unitId: record.unitId as string,
      });
    }
    const carryover = record.chapter5Carryover as JsonObject | undefined;
    if (carryover && !availabilityIds.has(carryover.sourceAvailabilityId as string)) {
      errors.push({
        code: "unknown_carryover_availability",
        message: `Availability references unknown carryover source ${carryover.sourceAvailabilityId as string}.`,
        unitId: record.unitId as string,
      });
    }
  }
  const baseStats = parsed["data/normalized/fe14/unit-base-stats.json"] as JsonObject[];
  for (const record of baseStats) {
    const baseAvailabilityIds = [
      ...(record.availabilityId ? [record.availabilityId as string] : []),
      ...((record.availabilityIds as string[] | undefined) ?? []),
    ];
    if (baseAvailabilityIds.length === 0 || baseAvailabilityIds.some((availabilityId) => !availabilityIds.has(availabilityId))) {
      errors.push({
        code: "unknown_availability",
        message: `Base stats reference an unknown availability.`,
        unitId: record.unitId as string,
      });
    }
    const carryover = record.chapter5Carryover as JsonObject | undefined;
    if (carryover && !availabilityIds.has(carryover.sourceAvailabilityId as string)) {
      errors.push({
        code: "unknown_carryover_availability",
        message: `Base stats reference unknown carryover source ${carryover.sourceAvailabilityId as string}.`,
        unitId: record.unitId as string,
      });
    }
  }

  const supports = parsed["data/normalized/fe14/support-relationships.json"] as JsonObject[];
  const supportIds = new Set<string>();
  const supportPairKeys = new Set<string>();
  for (const support of supports) {
    const supportId = support.id as string;
    const unitId = support.unitId as string;
    const partnerUnitId = support.partnerUnitId as string;
    const pairKey = `${[unitId, partnerUnitId].sort().join("__")}:${String(support.partnerGender ?? "any")}`;
    if (supportIds.has(supportId) || supportPairKeys.has(pairKey)) {
      errors.push({ code: "duplicate_support", message: `Duplicate support edge ${supportId}.` });
    }
    supportIds.add(supportId);
    supportPairKeys.add(pairKey);
    if (!rosterIdSet.has(unitId) || !rosterIdSet.has(partnerUnitId)) {
      errors.push({
        code: "child_or_unknown_support",
        message: `Support ${supportId} references a unit outside the first-generation roster.`,
        unitId,
      });
    }
  }

  const classAccess = parsed["data/normalized/fe14/unit-class-access.json"] as JsonObject[];
  for (const accessRecord of classAccess) {
    const accessUnitId = accessRecord.unitId as string;
    const sealGrants = accessRecord.sealGrants as JsonObject[];
    for (const grant of sealGrants) {
      const supportId = grant.supportRelationshipId as string;
      const support = supports.find((record) => record.id === supportId);
      if (!support) {
        errors.push({
          code: "unknown_support_grant",
          message: `Class grant references unknown support ${supportId}.`,
          unitId: accessUnitId,
        });
      } else if (support.unitId !== accessUnitId && support.partnerUnitId !== accessUnitId) {
        errors.push({
          code: "support_grant_owner",
          message: `Class grant ${supportId} does not involve ${accessUnitId}.`,
          unitId: accessUnitId,
        });
      }
    }
  }

  const completedUnitCounts: Record<string, { availability: number; baseStats: number }> = {
    felicia: { availability: 2, baseStats: 2 },
    jakob: { availability: 2, baseStats: 2 },
    kaze: { availability: 4, baseStats: 4 },
    silas: { availability: 3, baseStats: 2 },
    azura: { availability: 3, baseStats: 1 },
  };

  for (const [currentUnitId, counts] of Object.entries(completedUnitCounts)) {
    if (unitFilter && unitFilter !== currentUnitId) continue;

    const requiredCounts: Array<[string, number]> = [
      ["data/normalized/fe14/unit-availability.json", counts.availability],
      ["data/normalized/fe14/unit-base-stats.json", counts.baseStats],
      ["data/normalized/fe14/unit-growths.json", 1],
      ["data/normalized/fe14/unit-cap-modifiers.json", 1],
      ["data/normalized/fe14/unit-pairup-bonuses.json", 1],
      ["data/normalized/fe14/unit-class-access.json", 1],
      ["data/normalized/fe14/personal-skills.json", 1],
    ];

    for (const [relativePath, expectedCount] of requiredCounts) {
      const records = parsed[relativePath] as JsonObject[];
      const count = records.filter((record) => record.unitId === currentUnitId).length;
      if (count !== expectedCount) {
        errors.push({
          code: "unit_domain_count",
          message: `${relativePath} should contain ${expectedCount} ${currentUnitId} record(s); found ${count}.`,
          unitId: currentUnitId,
        });
      }
    }

    const unitSupports = supports.filter(
      (support) => support.unitId === currentUnitId || support.partnerUnitId === currentUnitId,
    );
    const accessRecord = classAccess.find((record) => record.unitId === currentUnitId);
    const sealGrants = (accessRecord?.sealGrants ?? []) as JsonObject[];
    const expectedSealGrants = currentUnitId === "azura" ? 24 : 23;
    if (unitSupports.length !== 24 || sealGrants.length !== expectedSealGrants) {
      errors.push({
        code: "unit_support_completeness",
        message: `${currentUnitId} requires 24 first-generation support edges and ${expectedSealGrants} seal outcomes; found ${unitSupports.length} and ${sealGrants.length}.`,
        unitId: currentUnitId,
      });
    }

    const sameGenderCorrinSupportId = {
      felicia: "felicia__corrin_female",
      jakob: "jakob__corrin_male",
      kaze: "kaze__corrin_male",
      silas: "silas__corrin_male",
    }[currentUnitId];
    if (sameGenderCorrinSupportId && sealGrants.some((grant) => grant.supportRelationshipId === sameGenderCorrinSupportId)) {
      errors.push({
        code: "invalid_same_gender_corrin_grant",
        message: `${currentUnitId}'s same-gender Corrin support reaches A rank but grants no class tree.`,
        unitId: currentUnitId,
      });
    }

    warnings.push(
      {
        code: "variable_corrin_class_grant",
        message: "Corrin's Partner Seal grant depends on the selected Talent and requires runtime resolution.",
        unitId: currentUnitId,
      },
    );
  }

  if (!unitFilter || unitFilter === "jakob") {
    warnings.push({
      code: "workbook_source_pending",
      message: "Jakob's 乔卡 workbook sheet still requires direct inspection; current records use independent web, chart, and in-game sources.",
      unitId: "jakob",
    });
  }
  if (!unitFilter || unitFilter === "kaze") {
    warnings.push({
      code: "workbook_source_pending",
      message: "Kaze's 凉风 workbook sheet and its four level/stat notes still require direct inspection; the current carryover rules are independently corroborated by Fire Emblem Wiki prose and Serenes Forest data.",
      unitId: "kaze",
    });
  }
}

function validateContinuousOrder(
  records: JsonObject[],
  field: "unitNo" | "processingOrder",
  label: string,
  errors: ValidationMessage[],
): void {
  const values = records.map((record) => record[field] as number).sort((left, right) => left - right);
  const isContinuous = values.length === APPROVED_ROSTER.length && values.every((value, index) => value === index + 1);
  if (!isContinuous) {
    errors.push({
      code: `invalid_${field}`,
      message: `Roster ${label} values must be unique and continuous from 1 through ${String(APPROVED_ROSTER.length)}.`,
    });
  }
}

function validateUniqueIds(records: JsonObject[], label: string, errors: ValidationMessage[]): void {
  const ids = new Set<string>();
  for (const record of records) {
    const id = record.id as string;
    if (ids.has(id)) {
      errors.push({ code: "duplicate_id", message: `Duplicate ${label} ID ${id}.` });
    }
    ids.add(id);
  }
}

function collectSourceRefs(value: unknown): Array<{ sourceId: string }> {
  if (Array.isArray(value)) {
    return value.flatMap(collectSourceRefs);
  }
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as JsonObject;
  const current =
    typeof record.sourceId === "string" && typeof record.locator === "string"
      ? [{ sourceId: record.sourceId }]
      : [];
  return current.concat(Object.values(record).flatMap(collectSourceRefs));
}

async function readJson(relativePath: string): Promise<unknown> {
  const absolutePath = path.join(process.cwd(), relativePath);
  return JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
}

async function runCli(): Promise<void> {
  const unitFlagIndex = process.argv.indexOf("--unit");
  const unitId = unitFlagIndex >= 0 ? process.argv[unitFlagIndex + 1] : undefined;
  const result = await validateFe14Data(unitId);

  for (const warning of result.warnings) {
    console.warn(`WARN ${warning.code}: ${warning.message}`);
  }
  for (const error of result.errors) {
    console.error(`ERROR ${error.code}: ${error.message}`);
  }

  console.log(
    `${result.valid ? "PASS" : "FAIL"} FE14 data validation (${result.scope}): ${result.errors.length} error(s), ${result.warnings.length} warning(s).`,
  );
  if (!result.valid) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}

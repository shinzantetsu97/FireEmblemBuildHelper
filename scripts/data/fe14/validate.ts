import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, statSync } from "node:fs";
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

const APPROVED_SECOND_GENERATION_ROSTER = [
  "kana", "shigure", "dwyer", "sophie", "midori", "shiro", "kiragi", "asugi", "selkie",
  "hisame", "mitama", "caeldori", "rhajat", "siegbert", "forrest", "ignatius", "velouria",
  "percy", "ophelia", "soleil", "nina",
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
  const secondRosterFile = parsed["data/normalized/fe14/units/second-generation.json"] as JsonObject;
  const secondRoster = secondRosterFile.units as JsonObject[];
  const allRoster = [...roster, ...secondRoster];
  const rosterIds = roster.map((unit) => unit.id as string);
  const secondRosterIds = secondRoster.map((unit) => unit.id as string);
  const rosterIdSet = new Set(allRoster.map((unit) => unit.id as string));
  const rosterById = new Map(allRoster.map((unit) => [unit.id as string, unit]));
  const rosterByProcessingOrder = [...roster].sort(
    (left, right) => (left.processingOrder as number) - (right.processingOrder as number),
  );
  const processingIds = rosterByProcessingOrder.map((unit) => unit.id as string);

  validateUniqueIds(sourceRecords, "source", errors);
  validateUniqueIds(allRoster, "roster unit", errors);
  validateContinuousOrder(roster, "unitNo", "unit number", 1, errors);
  validateContinuousOrder(roster, "processingOrder", "processing order", 1, errors);
  validateContinuousOrder(secondRoster, "unitNo", "second-generation unit number", 49, errors);
  validateContinuousOrder(secondRoster, "processingOrder", "second-generation processing order", 1, errors);

  if (rosterIds.length !== APPROVED_ROSTER.length) {
    errors.push({ code: "roster_count", message: `Expected 48 units; found ${rosterIds.length}.` });
  }

  if (processingIds.join("|") !== APPROVED_ROSTER.join("|")) {
    errors.push({
      code: "roster_order",
      message: "First-generation roster membership or processing order differs from the approved manifest.",
    });
  }

  if (secondRosterIds.join("|") !== APPROVED_SECOND_GENERATION_ROSTER.join("|")) {
    errors.push({
      code: "second_generation_roster_order",
      message: "Second-generation roster membership or canonical paralogue order differs from the approved manifest.",
    });
  }

  if (secondRoster.length !== 21 || secondRoster.some((unit, index) => unit.unitNo !== index + 49)) {
    errors.push({
      code: "second_generation_roster_count",
      message: "Second-generation roster must contain canonical unit numbers 49 through 69 in JSON order.",
    });
  }

  if (roster.some((unit, index) => unit.unitNo !== index + 1)) {
    errors.push({
      code: "roster_canonical_order",
      message: "First-generation roster JSON must be ordered by its canonical unit number.",
    });
  }

  validateUnitRecordOrdering(parsed, rosterById, errors);

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
      !relativePath.endsWith("units/second-generation.json") &&
      !relativePath.endsWith("class-trees.json") &&
      !relativePath.endsWith("class-stats.json") &&
      !relativePath.endsWith("class-skills.json") &&
      !relativePath.endsWith("weapon-types.json"),
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


  const childParentage = parsed["data/normalized/fe14/child-parentage.json"] as JsonObject[];
  const childRecruitment = parsed["data/normalized/fe14/child-recruitment.json"] as JsonObject[];
  for (const child of childParentage) {
    const childUnitId = child.unitId as string;
    const options = child.variableParentOptions as JsonObject[];
    if (!secondRosterIds.includes(childUnitId)) {
      errors.push({ code: "invalid_child_parentage", message: `${childUnitId} is not a second-generation unit.`, unitId: childUnitId });
    }
    for (const relatedUnitId of [child.fixedParentUnitId, ...options.map((option) => option.unitId), ...options.map((option) => option.siblingUnitId).filter(Boolean)]) {
      if (!rosterIdSet.has(relatedUnitId as string)) {
        errors.push({ code: "unknown_child_relative", message: `${childUnitId} references unknown related unit ${String(relatedUnitId)}.`, unitId: childUnitId });
      }
    }
  }
  for (const recruitment of childRecruitment) {
    if (!secondRosterIds.includes(recruitment.unitId as string)) {
      errors.push({ code: "invalid_child_recruitment", message: `${String(recruitment.unitId)} is not a second-generation unit.`, unitId: recruitment.unitId as string });
    }
  }

  const classTreeFile = parsed["data/normalized/fe14/class-trees.json"] as JsonObject;
  const classStatsFile = parsed["data/normalized/fe14/class-stats.json"] as JsonObject;
  const classTreeRows = classTreeFile.classes as JsonObject[];
  const classProfiles = classStatsFile.classes as JsonObject[];
  const standardClassIds = new Set<string>([
    ...classTreeRows.map((entry) => entry.id as string),
    ...classTreeRows.flatMap((entry) => (entry.promotions as JsonObject[]).map((promotion) => promotion.id as string)),
  ]);
  const profileIds = classProfiles.map((profile) => profile.classId as string);
  for (const classId of standardClassIds) {
    if (!profileIds.includes(classId)) {
      errors.push({ code: "missing_class_stat_profile", message: `Standard playable class ${classId} has no maximum-stat profile.` });
    }
  }
  for (const classId of profileIds) {
    if (!standardClassIds.has(classId)) {
      errors.push({ code: "unknown_class_stat_profile", message: `Class stat profile ${classId} is outside the standard playable non-DLC class scope.` });
    }
  }
  if (new Set(profileIds).size !== profileIds.length) {
    errors.push({ code: "duplicate_class_stat_profile", message: "Class stat profiles contain duplicate class IDs." });
  }
  for (const profile of classProfiles) {
    const growthRates = profile.growthRates as JsonObject;
    for (const [stat, value] of Object.entries(growthRates)) {
      if (typeof value !== "number" || value < 0 || value > 100 || value % 5 !== 0) {
        errors.push({
          code: "invalid_class_growth_rate",
          message: `Class ${String(profile.classId)} has invalid ${stat} growth ${String(value)}.`,
        });
      }
    }
  }
  const classStatProvenance = classStatsFile.provenance as JsonObject[];
  for (const sourceId of [
    "serenes-fe14-hoshidan-class-growth-rates",
    "serenes-fe14-nohrian-class-growth-rates",
  ]) {
    const sourceRef = classStatProvenance.find((entry) => entry.sourceId === sourceId);
    if (!sourceRef || !(sourceRef.fields as string[]).includes("classes.growthRates")) {
      errors.push({
        code: "missing_class_growth_provenance",
        message: `Class growth data is missing field-level provenance from ${sourceId}.`,
      });
    }
  }

  validateSkillData(
    parsed,
    errors,
    sourceIds,
    allRoster,
    standardClassIds,
    classTreeRows,
    classProfiles,
  );

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

  validateWeaponTypeData(
    parsed,
    errors,
    sourceIds,
    classProfiles,
    baseStats,
    childRecruitment,
  );

  const rawChildRecruitment = JSON.parse(
    readFileSync(path.resolve("data/normalized/fe14/child-recruitment.json"), "utf8"),
  ) as JsonObject[];
  for (const recruitment of rawChildRecruitment) {
    if ("startingClassGrowthRates" in recruitment) {
      errors.push({
        code: "copied_child_class_growth",
        message: `${String(recruitment.unitId)} copies starting-class growth rates instead of joining class-stats.json.`,
        unitId: recruitment.unitId as string,
      });
    }
    const offspringSeal = recruitment.offspringSeal as JsonObject;
    for (const option of offspringSeal.promotionOptions as JsonObject[]) {
      if ("classGrowthRates" in option) {
        errors.push({
          code: "copied_child_promotion_growth",
          message: `${String(recruitment.unitId)} copies ${String(option.classId)} growth rates instead of joining class-stats.json.`,
          unitId: recruitment.unitId as string,
        });
      }
    }
  }

  const supports = parsed["data/normalized/fe14/support-relationships.json"] as JsonObject[];
  validateSupportOrdering(supports, rosterById, errors);
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
    if (support.kind === "platonic" && (support.ranks as string[]).includes("S")) {
      errors.push({
        code: "invalid_platonic_support_rank",
        message: `Platonic support ${supportId} cannot include S rank.`,
        unitId,
      });
    }
    if (!rosterIdSet.has(unitId) || !rosterIdSet.has(partnerUnitId)) {
      errors.push({
        code: "child_or_unknown_support",
        message: `Support ${supportId} references a unit outside the canonical roster.`,
        unitId,
      });
    }
  }

  const classAccess = parsed["data/normalized/fe14/unit-class-access.json"] as JsonObject[];
  const supportById = new Map(supports.map((support) => [support.id as string, support]));
  for (const accessRecord of classAccess) {
    const accessUnitId = accessRecord.unitId as string;
    const sealGrants = accessRecord.sealGrants as JsonObject[];
    const baseClassSet = new Set(accessRecord.baseClassSet as string[]);
    const heartSealClassSet = new Set(accessRecord.heartSealClassSet as string[]);
    const corrinTalentOnlyClassSet = new Set(accessRecord.corrinTalentOnlyClassSet as string[]);
    validateSealGrantOrdering(accessUnitId, sealGrants, supportById, rosterById, errors);
    for (const grant of sealGrants) {
      const supportId = grant.supportRelationshipId as string;
      const support = supports.find((record) => record.id === supportId);
      const grantedClassId = grant.grantedClassId as string;
      const expectedOwnedVia = baseClassSet.has(grantedClassId)
        ? "base"
        : heartSealClassSet.has(grantedClassId)
          ? "heart_seal"
          : undefined;
      const resolutionSteps = (grant.resolutionSteps ?? []) as string[];

      if (expectedOwnedVia && (
        grant.resolution !== "already_owned"
        || grant.alreadyOwnedVia !== expectedOwnedVia
        || resolutionSteps.at(-1) !== "already_owned"
      )) {
        errors.push({
          code: "unmarked_owned_seal_grant",
          message: `${supportId} grants ${grantedClassId}, which ${accessUnitId} already has through ${expectedOwnedVia === "base" ? "base access" : "Heart Seal access"}.`,
          unitId: accessUnitId,
        });
      } else if (!expectedOwnedVia && grant.alreadyOwnedVia !== undefined) {
        errors.push({
          code: "invalid_owned_seal_grant",
          message: `${supportId} marks ${grantedClassId} as already owned, but it is not in ${accessUnitId}'s base or Heart Seal class set.`,
          unitId: accessUnitId,
        });
      }

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
    const mislabeledCorrinOnlyClasses = new Set(
      sealGrants
        .map((grant) => grant.grantedClassId as string)
        .filter((classId) => classId !== "avatar_talent" && corrinTalentOnlyClassSet.has(classId)),
    );
    if (mislabeledCorrinOnlyClasses.size > 0) {
      errors.push({
        code: "invalid_corrin_talent_only_class",
        message: `${accessUnitId}'s Corrin Talent-only list includes seal-obtainable class(es): ${[...mislabeledCorrinOnlyClasses].join(", ")}.`,
        unitId: accessUnitId,
      });
    }
  }

  const completedUnitCounts: Record<string, { availability: number; baseStats: number }> = {
    felicia: { availability: 2, baseStats: 2 },
    jakob: { availability: 2, baseStats: 2 },
    kaze: { availability: 3, baseStats: 3 },
    silas: { availability: 3, baseStats: 2 },
    azura: { availability: 3, baseStats: 1 },
    elise: { availability: 3, baseStats: 3 },
    arthur: { availability: 2, baseStats: 2 },
    effie: { availability: 2, baseStats: 2 },
    odin: { availability: 2, baseStats: 2 },
    niles: { availability: 2, baseStats: 2 },
    nyx: { availability: 2, baseStats: 1 },
    camilla: { availability: 3, baseStats: 2 },
    selena: { availability: 2, baseStats: 1 },
    beruka: { availability: 2, baseStats: 1 },
    laslow: { availability: 2, baseStats: 2 },
    peri: { availability: 2, baseStats: 2 },
    benny: { availability: 2, baseStats: 1 },
    charlotte: { availability: 2, baseStats: 1 },
    leo: { availability: 3, baseStats: 2 },
    keaton: { availability: 2, baseStats: 1 },
    xander: { availability: 3, baseStats: 2 },
    rinkah: { availability: 2, baseStats: 1 },
    sakura: { availability: 2, baseStats: 2 },
    hana: { availability: 2, baseStats: 2 },
    subaki: { availability: 2, baseStats: 1 },
    saizo: { availability: 2, baseStats: 2 },
    orochi: { availability: 2, baseStats: 2 },
    hinoka: { availability: 3, baseStats: 2 },
    azama: { availability: 2, baseStats: 2 },
    setsuna: { availability: 2, baseStats: 2 },
    hayato: { availability: 2, baseStats: 2 },
    oboro: { availability: 2, baseStats: 1 },
    hinata: { availability: 2, baseStats: 1 },
    takumi: { availability: 3, baseStats: 1 },
    kagero: { availability: 2, baseStats: 1 },
    reina: { availability: 2, baseStats: 2 },
    kaden: { availability: 2, baseStats: 1 },
    scarlet: { availability: 2, baseStats: 2 },
    ryoma: { availability: 3, baseStats: 2 },
    corrin: { availability: 1, baseStats: 1 },
  };

  for (const [currentUnitId, counts] of Object.entries(completedUnitCounts)) {
    if (unitFilter && unitFilter !== currentUnitId) continue;

    const requiredCounts: Array<[string, number]> = [
      ["data/normalized/fe14/unit-availability.json", counts.availability],
      ["data/normalized/fe14/unit-base-stats.json", counts.baseStats],
      ["data/normalized/fe14/unit-growths.json", 1],
      ["data/normalized/fe14/unit-cap-modifiers.json", 1],
      ["data/normalized/fe14/unit-pairup-bonuses.json", currentUnitId === "corrin" ? 0 : 1],
      ["data/normalized/fe14/unit-class-access.json", 1],
      ["data/normalized/fe14/personal-skills.json", 1],
      ["data/normalized/fe14/avatar-configurations.json", currentUnitId === "corrin" ? 1 : 0],
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
    const expectedSupportCounts: Record<string, number> = {
      elise: 19,
      arthur: 19,
      effie: 19,
      odin: 19,
      niles: 19,
      nyx: 19,
      camilla: 19,
      selena: 19,
      beruka: 19,
      laslow: 19,
      peri: 19,
      benny: 18,
      charlotte: 19,
      leo: 19,
      keaton: 19,
      xander: 19,
      rinkah: 19,
      sakura: 19,
      hana: 19,
      subaki: 19,
      saizo: 19,
      orochi: 19,
      hinoka: 19,
      azama: 19,
      setsuna: 19,
      hayato: 19,
      oboro: 19,
      hinata: 19,
      takumi: 19,
      kagero: 19,
      reina: 2,
      kaden: 19,
      scarlet: 2,
      ryoma: 19,
      anna: 2,
      corrin: 94,
    };
    const expectedSealGrantCounts: Record<string, number> = {
      azura: 23,
      mozu: 22,
      elise: 16,
      arthur: 18,
      effie: 18,
      odin: 18,
      niles: 19,
      nyx: 18,
      camilla: 16,
      selena: 18,
      beruka: 18,
      laslow: 18,
      peri: 18,
      benny: 17,
      charlotte: 18,
      leo: 16,
      keaton: 18,
      xander: 16,
      rinkah: 18,
      sakura: 16,
      hana: 18,
      subaki: 18,
      saizo: 18,
      orochi: 18,
      hinoka: 16,
      azama: 18,
      setsuna: 18,
      hayato: 18,
      oboro: 18,
      hinata: 18,
      takumi: 16,
      kagero: 18,
      reina: 1,
      kaden: 18,
      scarlet: 1,
      ryoma: 16,
      anna: 1,
      corrin: 0,
    };
    const expectedSupports = expectedSupportCounts[currentUnitId] ?? 24;
    const expectedSealGrants = expectedSealGrantCounts[currentUnitId] ?? 23;
    if (unitSupports.length !== expectedSupports || sealGrants.length !== expectedSealGrants) {
      errors.push({
        code: "unit_support_completeness",
        message: `${currentUnitId} requires ${expectedSupports} first-generation support edges and ${expectedSealGrants} seal outcomes; found ${unitSupports.length} and ${sealGrants.length}.`,
        unitId: currentUnitId,
      });
    }

    if (currentUnitId === "silas") {
      const periGrant = sealGrants.find((grant) => grant.supportRelationshipId === "silas__peri");
      if (periGrant?.grantedClassId !== "dark_mage" || periGrant?.resolution !== "same_primary_fallback") {
        errors.push({
          code: "unit_seal_grant",
          message: "Silas must receive Peri's Dark Mage Heart Seal class when their shared Cavalier primary triggers same-primary fallback.",
          unitId: currentUnitId,
        });
      }
    }

    if (["leo", "xander", "hinoka", "takumi", "ryoma"].includes(currentUnitId)) {
      const guest = availability.find(
        (record) => record.unitId === currentUnitId && String(record.id).endsWith("_guest"),
      );
      if (!guest || guest.gainsExperience !== false) {
        errors.push({
          code: "unit_guest_experience",
          message: `${currentUnitId}'s Chapter 6 guest record must explicitly disable EXP gain.`,
          unitId: currentUnitId,
        });
      }
    }

    if (currentUnitId === "rinkah") {
      const commonRecruitment = availability.find((record) => record.id === "rinkah.common");
      const departure = commonRecruitment?.temporaryDeparture as JsonObject | undefined;
      const returns = (departure?.returns ?? []) as JsonObject[];
      const revelationReturn = returns.find((record) => record.route === "revelation");
      const notes = (rosterById.get(currentUnitId)?.notes ?? []) as JsonObject[];
      const documentsCarryover = notes.some((note) =>
        /level, EXP, stats, and weapon proficiency.*retained/i.test(String(note.text ?? ""))
      );
      if (departure?.afterChapter !== 5 || revelationReturn?.chapter !== 9 || !documentsCarryover) {
        errors.push({
          code: "unit_progress_return",
          message: "Rinkah must leave after Chapter 5 and return in Revelation Chapter 9 with her Chapter 5 level, EXP, stats, and weapon proficiency retained.",
          unitId: currentUnitId,
        });
      }
    }

    if (currentUnitId === "sakura") {
      const revelationStats = baseStats.find((record) => record.availabilityId === "sakura.revelation");
      const carryover = revelationStats?.chapter5Carryover as JsonObject | undefined;
      const weaponRanks = revelationStats?.weaponRanks as JsonObject | undefined;
      const azamaGrant = sealGrants.find((grant) => grant.supportRelationshipId === "sakura__azama");
      if (
        revelationStats?.level !== 4
        || weaponRanks?.staff !== "D"
        || carryover?.levelCalculation !== "template_plus_chapter_5_levels_gained"
        || carryover?.statCalculation !== "template_plus_chapter_5_level_up_gains"
        || carryover?.weaponProficiencyCalculation !== "template_plus_chapter_5_proficiency_gained"
        || azamaGrant?.grantedClassId !== "apothecary"
        || azamaGrant?.resolution !== "same_primary_fallback"
      ) {
        errors.push({
          code: "unit_progress_return",
          message: "Sakura must use the enhanced Revelation carryover template and receive Azama's Apothecary secondary class through same-primary fallback.",
          unitId: currentUnitId,
        });
      }
    }

    if (currentUnitId === "azama") {
      const sakuraGrant = sealGrants.find((grant) => grant.supportRelationshipId === "sakura__azama");
      if (sakuraGrant?.grantedClassId !== "sky_knight" || sakuraGrant?.resolution !== "same_primary_fallback") {
        errors.push({
          code: "unit_seal_grant",
          message: "Azama must receive Sakura's Sky Knight secondary class when their shared Monk/Shrine Maiden primary triggers same-primary fallback.",
          unitId: currentUnitId,
        });
      }
    }

    if (currentUnitId === "reina") {
      const heartClasses = (accessRecord?.heartSealClassSet ?? []) as string[];
      if (unitSupports.length !== 2 || heartClasses.join("|") !== "diviner|ninja") {
        errors.push({
          code: "unit_special_access",
          message: "Reina must have Corrin-only supports and both Diviner and Ninja Heart Seal access.",
          unitId: currentUnitId,
        });
      }
    }

    if (currentUnitId === "scarlet") {
      const revelationJoin = availability.find((record) => record.id === "scarlet.revelation");
      const heartClasses = (accessRecord?.heartSealClassSet ?? []) as string[];
      if (revelationJoin?.permanentlyLeavesAfterChapter !== 18 || unitSupports.length !== 2 || heartClasses.join("|") !== "outlaw|knight") {
        errors.push({
          code: "unit_special_access",
          message: "Scarlet must have Corrin-only supports, Outlaw and Knight Heart Seal access, and permanently leave after Revelation Chapter 18.",
          unitId: currentUnitId,
        });
      }
    }

    const sameGenderCorrinSupportId = {
      felicia: "felicia__corrin_female",
      jakob: "jakob__corrin_male",
      kaze: "kaze__corrin_male",
      silas: "silas__corrin_male",
      elise: "elise__corrin_female",
      arthur: "arthur__corrin_male",
      effie: "effie__corrin_female",
      odin: "odin__corrin_male",
      nyx: "nyx__corrin_female",
      camilla: "camilla__corrin_female",
      selena: "selena__corrin_female",
      beruka: "beruka__corrin_female",
      laslow: "laslow__corrin_male",
      peri: "peri__corrin_female",
      benny: "benny__corrin_male",
      charlotte: "charlotte__corrin_female",
      leo: "leo__corrin_male",
      keaton: "keaton__corrin_male",
      xander: "xander__corrin_male",
      rinkah: "rinkah__corrin_female",
      sakura: "sakura__corrin_female",
      hana: "hana__corrin_female",
      subaki: "subaki__corrin_male",
      saizo: "saizo__corrin_male",
      orochi: "orochi__corrin_female",
      hinoka: "hinoka__corrin_female",
      azama: "azama__corrin_male",
      setsuna: "setsuna__corrin_female",
      hayato: "hayato__corrin_male",
      oboro: "oboro__corrin_female",
      hinata: "hinata__corrin_male",
      takumi: "takumi__corrin_male",
      kagero: "kagero__corrin_female",
      reina: "reina__corrin_female",
      kaden: "kaden__corrin_male",
      scarlet: "scarlet__corrin_female",
      ryoma: "ryoma__corrin_male",
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
      message: "Kaze's 凉风 workbook sheet and its three level/stat records still require direct inspection; the current route records are independently corroborated by Fire Emblem Wiki prose and Serenes Forest data.",
      unitId: "kaze",
    });
  }
  if (!unitFilter || unitFilter === "effie") {
    warnings.push({
      code: "workbook_source_pending",
      message: "Effie's 艾尔菲 workbook sheet still requires direct inspection; the required local spreadsheet runtime was unavailable, so current records use independent Serenes Forest, Fire Emblem Wiki, and seal-chart sources.",
      unitId: "effie",
    });
  }
  const pendingWorkbookUnits = [
    ["odin", "奥丁"],
    ["niles", "零"],
    ["nyx", "纽克斯"],
    ["camilla", "卡米拉"],
    ["selena", "露娜"],
    ["beruka", "贝璐卡"],
    ["laslow", "拉兹沃德"],
    ["peri", "皮埃利"],
    ["benny", "贝诺瓦"],
    ["charlotte", "夏洛特"],
    ["leo", "里昂"],
    ["keaton", "弗拉内尔"],
    ["xander", "马库斯"],
    ["rinkah", "磷火"],
    ["sakura", "樱"],
    ["hana", "风花"],
    ["subaki", "椿"],
    ["saizo", "才藏"],
    ["orochi", "大蛇"],
    ["hinoka", "日乃香"],
    ["azama", "浅间"],
    ["setsuna", "刹那"],
    ["hayato", "月读"],
    ["oboro", "胧"],
    ["hinata", "日向"],
    ["takumi", "拓海"],
    ["kagero", "阳炎"],
    ["reina", "夕雾"],
    ["kaden", "锦"],
    ["scarlet", "克丽姆颂"],
    ["ryoma", "龙马"],
    ["anna", "安娜"],
  ] as const;
  for (const [pendingUnitId, sheetName] of pendingWorkbookUnits) {
    if (!unitFilter || unitFilter === pendingUnitId) {
      warnings.push({
        code: "workbook_source_pending",
        message: `${pendingUnitId[0].toUpperCase()}${pendingUnitId.slice(1)}'s ${sheetName} workbook sheet still requires direct inspection; current records use independent Serenes Forest, Fire Emblem Wiki, and seal-chart sources.`,
        unitId: pendingUnitId,
      });
    }
  }
}

function compareUnitOrder(
  leftId: string,
  rightId: string,
  rosterById: Map<string, JsonObject>,
): number {
  const left = rosterById.get(leftId);
  const right = rosterById.get(rightId);
  const leftRouteCount = (left?.availableRoutes as unknown[] | undefined)?.length ?? 0;
  const rightRouteCount = (right?.availableRoutes as unknown[] | undefined)?.length ?? 0;
  return rightRouteCount - leftRouteCount ||
    ((left?.unitNo as number | undefined) ?? Number.MAX_SAFE_INTEGER) -
      ((right?.unitNo as number | undefined) ?? Number.MAX_SAFE_INTEGER) ||
    leftId.localeCompare(rightId);
}

function unitNo(unitId: string, rosterById: Map<string, JsonObject>): number {
  return (rosterById.get(unitId)?.unitNo as number | undefined) ?? Number.MAX_SAFE_INTEGER;
}

function validateWeaponTypeData(
  parsed: Record<string, unknown>,
  errors: ValidationMessage[],
  sourceIds: Set<string>,
  classProfiles: JsonObject[],
  baseStats: JsonObject[],
  childRecruitment: JsonObject[],
): void {
  const expectedIds = [
    "sword",
    "lance",
    "axe",
    "dagger",
    "bow",
    "tome",
    "staff",
    "dragonstone",
    "beaststone",
  ];
  const weaponTypeFile = parsed[
    "data/normalized/fe14/weapon-types.json"
  ] as JsonObject;
  const weaponTypes = weaponTypeFile.weaponTypes as JsonObject[];
  const manifest = parsed[
    "data/sources/fe14/weapon-icon-sources.json"
  ] as JsonObject;
  const entries = manifest.entries as JsonObject[];

  validateUniqueIds(weaponTypes, "weapon type", errors);
  const weaponTypeIds = weaponTypes.map((weaponType) => weaponType.id as string);
  const knownWeaponTypeIds = new Set(weaponTypeIds);
  if (weaponTypeIds.join("|") !== expectedIds.join("|")) {
    errors.push({
      code: "weapon_type_order",
      message: "Weapon types must use the approved nine-type canonical order.",
    });
  }
  for (const [index, weaponType] of weaponTypes.entries()) {
    if (
      weaponType.displayOrder !== index + 1 ||
      weaponType.iconAssetId !== weaponType.id
    ) {
      errors.push({
        code: "weapon_type_identity",
        message: `Weapon type ${String(weaponType.id)} has an invalid display order or icon asset ID.`,
      });
    }
  }

  const referencedIds = new Set<string>();
  const recordWeaponRanks = (value: unknown): void => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    for (const weaponTypeId of Object.keys(value as JsonObject)) {
      referencedIds.add(weaponTypeId);
    }
  };
  for (const profile of classProfiles) recordWeaponRanks(profile.weaponRankCaps);
  for (const record of baseStats) {
    recordWeaponRanks(record.weaponRanks);
    for (const ranks of Object.values(
      (record.weaponRanksByAvailability as JsonObject | undefined) ?? {},
    )) {
      recordWeaponRanks(ranks);
    }
  }
  for (const recruitment of childRecruitment) {
    recordWeaponRanks(recruitment.weaponRanks);
    const offspringSeal = recruitment.offspringSeal as JsonObject;
    for (const option of offspringSeal.promotionOptions as JsonObject[]) {
      for (const weaponTypeId of [
        option.primaryWeaponId,
        option.secondaryWeaponId,
        ...((option.secondaryWeaponIds as string[] | undefined) ?? []),
      ]) {
        if (weaponTypeId) referencedIds.add(weaponTypeId as string);
      }
    }
  }
  for (const weaponTypeId of referencedIds) {
    if (!knownWeaponTypeIds.has(weaponTypeId)) {
      errors.push({
        code: "unknown_weapon_type",
        message: `Game data references unknown weapon type ${weaponTypeId}.`,
      });
    }
  }
  for (const weaponTypeId of knownWeaponTypeIds) {
    if (!referencedIds.has(weaponTypeId)) {
      errors.push({
        code: "unused_weapon_type",
        message: `Canonical weapon type ${weaponTypeId} is not referenced by FE14 data.`,
      });
    }
  }

  const declaredCount = (manifest.counts as JsonObject).weaponTypeIcons;
  if (declaredCount !== entries.length || entries.length !== expectedIds.length) {
    errors.push({
      code: "weapon_icon_manifest_count",
      message: "Weapon icon manifest declared count does not match its entries.",
    });
  }
  const manifestIds = new Set<string>();
  const destinations = new Set<string>();
  const manifestById = new Map<string, JsonObject>();
  const assetRoot = path.resolve("src/games/fe14/assets/weapon_type_icons");
  const pngSignature = "89504e470d0a1a0a";
  for (const entry of entries) {
    const weaponTypeId = entry.weaponTypeId as string;
    const destination = entry.localDestination as string;
    const absoluteDestination = path.resolve(destination);
    const relativeDestination = path.relative(assetRoot, absoluteDestination);
    if (manifestIds.has(weaponTypeId)) {
      errors.push({
        code: "duplicate_weapon_icon_manifest_key",
        message: `Duplicate weapon icon manifest key ${weaponTypeId}.`,
      });
    }
    manifestIds.add(weaponTypeId);
    manifestById.set(weaponTypeId, entry);
    if (destinations.has(destination)) {
      errors.push({
        code: "duplicate_weapon_icon_destination",
        message: `Duplicate weapon icon destination ${destination}.`,
      });
    }
    destinations.add(destination);
    if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
      errors.push({
        code: "weapon_icon_destination_scope",
        message: `Weapon icon destination escapes its asset directory: ${destination}.`,
      });
    }
    for (const sourcePageId of entry.sourcePageIds as string[]) {
      if (!sourceIds.has(sourcePageId)) {
        errors.push({
          code: "unknown_weapon_icon_source_page",
          message: `Weapon icon ${weaponTypeId} references unknown source page ${sourcePageId}.`,
        });
      }
    }
    if (!existsSync(absoluteDestination)) {
      errors.push({
        code: "missing_weapon_icon_file",
        message: `Missing weapon icon file ${destination}.`,
      });
    } else if (
      statSync(absoluteDestination).size === 0 ||
      readFileSync(absoluteDestination).subarray(0, 8).toString("hex") !== pngSignature
    ) {
      errors.push({
        code: "invalid_weapon_icon_file",
        message: `Weapon icon file is empty or not PNG: ${destination}.`,
      });
    }
  }
  for (const weaponType of weaponTypes) {
    const weaponTypeId = weaponType.id as string;
    const manifestEntry = manifestById.get(weaponTypeId);
    if (
      !manifestEntry ||
      manifestEntry.canonicalName !== (weaponType.names as JsonObject).en
    ) {
      errors.push({
        code: "weapon_type_icon_manifest",
        message: `Weapon type ${weaponTypeId} does not match its icon manifest entry.`,
      });
    }
  }
  for (const manifestId of manifestIds) {
    if (!knownWeaponTypeIds.has(manifestId)) {
      errors.push({
        code: "orphan_weapon_icon_manifest_entry",
        message: `Weapon icon manifest entry ${manifestId} has no canonical weapon-type record.`,
      });
    }
  }
}

function validateSkillData(
  parsed: Record<string, unknown>,
  errors: ValidationMessage[],
  sourceIds: Set<string>,
  roster: JsonObject[],
  standardClassIds: Set<string>,
  classTreeRows: JsonObject[],
  classProfiles: JsonObject[],
): void {
  const classSkillFile = parsed[
    "data/normalized/fe14/class-skills.json"
  ] as JsonObject;
  const classSkills = classSkillFile.skills as JsonObject[];
  const personalSkills = parsed[
    "data/normalized/fe14/personal-skills.json"
  ] as JsonObject[];
  const iconManifest = parsed[
    "data/sources/fe14/skill-icon-sources.json"
  ] as JsonObject;
  const iconEntries = iconManifest.entries as JsonObject[];

  validateUniqueIds(classSkills, "class skill", errors);
  validateUniqueIds(personalSkills, "personal skill", errors);

  const classNodes = classTreeRows.flatMap((tree) => [
    tree,
    ...(tree.promotions as JsonObject[]),
  ]);
  const classNodeGroups = new Map<string, JsonObject[]>();
  for (const node of classNodes) {
    const classId = node.id as string;
    classNodeGroups.set(classId, [...(classNodeGroups.get(classId) ?? []), node]);
  }
  const profileById = new Map(
    classProfiles.map((profile) => [profile.classId as string, profile]),
  );
  for (const [classId, nodes] of classNodeGroups) {
    const labels = new Set(nodes.map((node) => node.label as string));
    const affiliations = new Set(nodes.map((node) => node.affiliation as string));
    if (labels.size !== 1 || affiliations.size !== 1) {
      errors.push({
        code: "inconsistent_class_tree_node",
        message: `Class ${classId} has inconsistent labels or affiliations across class trees.`,
      });
    }
    if (profileById.get(classId)?.displayName !== nodes[0].label) {
      errors.push({
        code: "class_tree_label_mismatch",
        message: `Class-tree label for ${classId} does not match its class-stat profile.`,
      });
    }
  }
  const songstressTree = classTreeRows.find((tree) => tree.id === "songstress");
  if (
    !songstressTree ||
    (songstressTree.affiliation as string) !== "special" ||
    (songstressTree.promotions as JsonObject[]).length !== 0
  ) {
    errors.push({
      code: "invalid_songstress_tree",
      message: "Songstress must be a standalone special class-tree node.",
    });
  }
  const nohrPrinceTree = classTreeRows.find((tree) => tree.id === "nohr_prince");
  const nohrPrincePromotions = new Map(
    ((nohrPrinceTree?.promotions as JsonObject[] | undefined) ?? []).map((node) => [
      node.id as string,
      node.affiliation as string,
    ]),
  );
  if (
    nohrPrinceTree?.affiliation !== "special" ||
    nohrPrincePromotions.get("hoshido_noble") !== "hoshidan" ||
    nohrPrincePromotions.get("nohr_noble") !== "nohrian"
  ) {
    errors.push({
      code: "invalid_nohr_prince_affiliation",
      message: "The Nohr Prince tree must preserve its special base and mixed promotion affiliations.",
    });
  }
  const expectedSpecialClassTrees = ["kitsune", "nohr_prince", "songstress", "villager", "wolfskin"];
  const actualSpecialClassTrees = classTreeRows
    .filter((tree) => ((tree.categories as string[] | undefined) ?? []).includes("special"))
    .map((tree) => tree.id as string)
    .sort();
  if (JSON.stringify(actualSpecialClassTrees) !== JSON.stringify(expectedSpecialClassTrees)) {
    errors.push({
      code: "invalid_special_class_category",
      message: `Special class-tree category must contain exactly: ${expectedSpecialClassTrees.join(", ")}.`,
    });
  }

  const classSkillIds = new Set(classSkills.map((skill) => skill.id as string));
  const personalSkillIds = new Set(personalSkills.map((skill) => skill.id as string));
  const classSkillById = new Map(classSkills.map((skill) => [skill.id as string, skill]));
  const baseStats = parsed["data/normalized/fe14/unit-base-stats.json"] as JsonObject[];
  const classAliases: Record<string, string> = { maid: "attendant", butler: "attendant" };
  for (const record of baseStats) {
    const classId = classAliases[record.classId as string] ?? record.classId as string;
    const level = record.level as number;
    const overrides = (record.startingSkillOverrideIds as string[] | undefined) ?? [];
    for (const skillId of overrides) {
      const skill = classSkillById.get(skillId);
      if (!skill) {
        errors.push({
          code: personalSkillIds.has(skillId) ? "personal_skill_as_starting_override" : "unknown_starting_skill_override",
          message: `${String(record.unitId)} has invalid starting-skill override ${skillId}.`,
          unitId: record.unitId as string,
        });
        continue;
      }
      const derivable = (skill.acquisition as JsonObject[]).some((edge) => (
        edge.classId === classId && (edge.level as number) <= level
      ));
      if (derivable) {
        errors.push({
          code: "redundant_starting_skill_override",
          message: `${String(record.unitId)} redundantly overrides derivable ${skillId} at ${classId} level ${String(level)}.`,
          unitId: record.unitId as string,
        });
      }
    }
  }
  const childRecruitment = parsed["data/normalized/fe14/child-recruitment.json"] as JsonObject[];
  for (const recruitment of childRecruitment) {
    const offspringSeal = recruitment.offspringSeal as JsonObject;
    for (const promotion of offspringSeal.promotionOptions as JsonObject[]) {
      for (const learned of promotion.learnedSkills as JsonObject[]) {
        const skillId = learned.skillId as string;
        const skill = classSkillById.get(skillId);
        const matchesPromotion = skill && (skill.acquisition as JsonObject[]).some((edge) => (
          edge.classId === promotion.classId && edge.level === learned.level
        ));
        if (!matchesPromotion) {
          errors.push({
            code: "invalid_offspring_seal_skill",
            message: `${String(recruitment.unitId)} maps ${skillId} to the wrong Offspring Seal class or level.`,
            unitId: recruitment.unitId as string,
          });
        }
      }
    }
  }
  const classIdsWithSkills = new Set<string>();
  const acquisitionKeys = new Set<string>();
  const approvedClassSkillSources = new Set([
    "serenes-fe14-hoshidan-class-skills",
    "serenes-fe14-nohrian-class-skills",
  ]);
  for (const skill of classSkills) {
    const skillId = skill.id as string;
    const acquisition = skill.acquisition as JsonObject[];
    for (const edge of acquisition) {
      const classId = edge.classId as string;
      const level = edge.level as number;
      const gender = edge.gender as string | undefined;
      classIdsWithSkills.add(classId);
      if (!standardClassIds.has(classId)) {
        errors.push({
          code: "unknown_class_skill_class",
          message: `Class skill ${skillId} references unknown class ${classId}.`,
        });
      }
      if (![1, 5, 10, 15, 25, 35].includes(level)) {
        errors.push({
          code: "invalid_class_skill_level",
          message: `Class skill ${skillId} has invalid acquisition level ${String(level)}.`,
        });
      }
      if (gender && (classId !== "troubadour" || level !== 10)) {
        errors.push({
          code: "invalid_class_skill_gender",
          message: `Gender condition on ${skillId} is outside the Troubadour level-10 exception.`,
        });
      }
      const edgeKey = `${skillId}:${classId}:${String(level)}:${gender ?? "all"}`;
      if (acquisitionKeys.has(edgeKey)) {
        errors.push({
          code: "duplicate_class_skill_edge",
          message: `Duplicate class-skill acquisition edge ${edgeKey}.`,
        });
      }
      acquisitionKeys.add(edgeKey);
    }
    const provenance = skill.provenance as JsonObject[];
    if (
      provenance.some(
        (sourceRef) =>
          !approvedClassSkillSources.has(sourceRef.sourceId as string),
      )
    ) {
      errors.push({
        code: "class_skill_scope",
        message: `Class skill ${skillId} uses a source outside the approved standard class-skill pages.`,
      });
    }
  }
  for (const classId of standardClassIds) {
    if (!classIdsWithSkills.has(classId)) {
      errors.push({
        code: "class_without_skills",
        message: `Standard class ${classId} has no class-skill acquisition mapping.`,
      });
    }
  }

  const personalSkillOwners = new Set<string>();
  for (const skill of personalSkills) {
    const unitId = skill.unitId as string;
    if (personalSkillOwners.has(unitId)) {
      errors.push({
        code: "duplicate_personal_skill_owner",
        message: `Unit ${unitId} owns more than one personal skill.`,
        unitId,
      });
    }
    personalSkillOwners.add(unitId);
    if (skill.iconAssetId !== skill.id) {
      errors.push({
        code: "personal_skill_icon_id",
        message: `Personal skill ${String(skill.id)} must use the same icon asset ID.`,
        unitId,
      });
    }
  }
  for (const unit of roster) {
    const unitId = unit.id as string;
    const skillId = unit.personalSkillId as string | undefined;
    const skill = personalSkills.find((record) => record.unitId === unitId);
    if (!skill || !skillId || skill.id !== skillId) {
      errors.push({
        code: "personal_skill_owner_mismatch",
        message: `Unit ${unitId} does not resolve to exactly one matching personal skill.`,
        unitId,
      });
    }
  }

  const manifestCounts = iconManifest.counts as JsonObject;
  const manifestKeys = new Set<string>();
  const manifestDestinations = new Set<string>();
  const manifestByKey = new Map<string, JsonObject>();
  let classIconCount = 0;
  let personalIconCount = 0;
  const assetRoot = path.resolve("src/games/fe14/assets");
  const pngSignature = "89504e470d0a1a0a";
  for (const entry of iconEntries) {
    const skillId = entry.skillId as string;
    const skillType = entry.skillType as "class" | "personal";
    const key = `${skillType}:${skillId}`;
    const destination = entry.localDestination as string;
    const absoluteDestination = path.resolve(destination);
    const relativeDestination = path.relative(assetRoot, absoluteDestination);
    if (manifestKeys.has(key)) {
      errors.push({
        code: "duplicate_icon_manifest_key",
        message: `Duplicate icon manifest key ${key}.`,
      });
    }
    manifestKeys.add(key);
    manifestByKey.set(key, entry);
    if (manifestDestinations.has(destination)) {
      errors.push({
        code: "duplicate_icon_destination",
        message: `Duplicate icon destination ${destination}.`,
      });
    }
    manifestDestinations.add(destination);
    if (
      relativeDestination.startsWith("..") ||
      path.isAbsolute(relativeDestination)
    ) {
      errors.push({
        code: "icon_destination_scope",
        message: `Icon destination escapes the FE14 asset root: ${destination}.`,
      });
    }
    for (const sourcePageId of entry.sourcePageIds as string[]) {
      if (!sourceIds.has(sourcePageId)) {
        errors.push({
          code: "unknown_icon_source_page",
          message: `Icon ${key} references unknown source page ${sourcePageId}.`,
        });
      }
    }
    if (!existsSync(absoluteDestination)) {
      errors.push({
        code: "missing_icon_file",
        message: `Missing icon file ${destination}.`,
      });
    } else if (
      statSync(absoluteDestination).size === 0 ||
      readFileSync(absoluteDestination).subarray(0, 8).toString("hex") !==
        pngSignature
    ) {
      errors.push({
        code: "invalid_icon_file",
        message: `Icon file is empty or not PNG: ${destination}.`,
      });
    }
    if (skillType === "class") classIconCount += 1;
    else personalIconCount += 1;
  }
  if (
    manifestCounts.classIcons !== classIconCount ||
    manifestCounts.personalIcons !== personalIconCount ||
    manifestCounts.totalIcons !== iconEntries.length
  ) {
    errors.push({
      code: "icon_manifest_count",
      message: "Icon manifest declared counts do not match its entries.",
    });
  }

  for (const skill of classSkills) {
    const skillId = skill.id as string;
    const manifestEntry = manifestByKey.get(`class:${skillId}`);
    if (
      !manifestEntry ||
      manifestEntry.canonicalName !== (skill.names as JsonObject).en ||
      skill.iconAssetId !== skillId
    ) {
      errors.push({
        code: "class_skill_icon_manifest",
        message: `Class skill ${skillId} does not match its icon manifest entry.`,
      });
    }
  }
  for (const skill of personalSkills) {
    const skillId = skill.id as string;
    const manifestEntry = manifestByKey.get(`personal:${skillId}`);
    if (
      !manifestEntry ||
      manifestEntry.unitId !== skill.unitId ||
      manifestEntry.canonicalName !== (skill.names as JsonObject).en
    ) {
      errors.push({
        code: "personal_skill_icon_manifest",
        message: `Personal skill ${skillId} does not match its icon manifest entry.`,
        unitId: skill.unitId as string,
      });
    }
  }
  for (const entry of iconEntries) {
    const id = entry.skillId as string;
    const type = entry.skillType as string;
    if (
      (type === "class" && !classSkillIds.has(id)) ||
      (type === "personal" && !personalSkillIds.has(id))
    ) {
      errors.push({
        code: "orphan_icon_manifest_entry",
        message: `Icon manifest entry ${type}:${id} has no canonical skill record.`,
      });
    }
  }
}

function validateUnitRecordOrdering(
  parsed: Record<string, unknown>,
  rosterById: Map<string, JsonObject>,
  errors: ValidationMessage[],
): void {
  const paths = [
    "data/normalized/fe14/unit-availability.json",
    "data/normalized/fe14/unit-base-stats.json",
    "data/normalized/fe14/unit-growths.json",
    "data/normalized/fe14/unit-cap-modifiers.json",
    "data/normalized/fe14/unit-pairup-bonuses.json",
    "data/normalized/fe14/avatar-configurations.json",
    "data/normalized/fe14/unit-class-access.json",
    "data/normalized/fe14/personal-skills.json",
  ];

  for (const path of paths) {
    const records = parsed[path] as JsonObject[];
    for (let index = 1; index < records.length; index += 1) {
      const previous = records[index - 1];
      const current = records[index];
      if (compareUnitOrder(previous.unitId as string, current.unitId as string, rosterById) > 0) {
        errors.push({
          code: "unit_record_order",
          message: `${path} must be ordered by available-route count, then unit number.`,
          path,
        });
        break;
      }
    }
  }
}

function validateSupportOrdering(
  supports: JsonObject[],
  rosterById: Map<string, JsonObject>,
  errors: ValidationMessage[],
): void {
  const compareSupports = (left: JsonObject, right: JsonObject) => {
    const leftIds = [left.unitId as string, left.partnerUnitId as string].sort((a, b) => unitNo(a, rosterById) - unitNo(b, rosterById));
    const rightIds = [right.unitId as string, right.partnerUnitId as string].sort((a, b) => unitNo(a, rosterById) - unitNo(b, rosterById));
    return ((right.routes as unknown[]).length - (left.routes as unknown[]).length) ||
      unitNo(leftIds[0], rosterById) - unitNo(rightIds[0], rosterById) ||
      unitNo(leftIds[1], rosterById) - unitNo(rightIds[1], rosterById) ||
      (left.id as string).localeCompare(right.id as string);
  };

  for (let index = 1; index < supports.length; index += 1) {
    if (compareSupports(supports[index - 1], supports[index]) > 0) {
      errors.push({
        code: "support_record_order",
        message: "Support relationships must be ordered by each pair's available-route count, then unit number.",
        path: "data/normalized/fe14/support-relationships.json",
      });
      break;
    }
  }
}

function validateSealGrantOrdering(
  unitId: string,
  grants: JsonObject[],
  supportById: Map<string, JsonObject>,
  rosterById: Map<string, JsonObject>,
  errors: ValidationMessage[],
): void {
  const partnerId = (grant: JsonObject) => {
    const support = supportById.get(grant.supportRelationshipId as string);
    if (!support) return "";
    return support.unitId === unitId ? support.partnerUnitId as string : support.unitId as string;
  };

  for (let index = 1; index < grants.length; index += 1) {
    const previousPartnerId = partnerId(grants[index - 1]);
    const currentPartnerId = partnerId(grants[index]);
    const routeDifference = ((grants[index].routes as unknown[]).length - (grants[index - 1].routes as unknown[]).length);
    if (routeDifference > 0 || (routeDifference === 0 && unitNo(previousPartnerId, rosterById) > unitNo(currentPartnerId, rosterById))) {
      errors.push({
        code: "seal_grant_order",
          message: `Class grants for ${unitId} must be ordered by route count, then the partner's unit number.`,
        unitId,
        path: "data/normalized/fe14/unit-class-access.json",
      });
      break;
    }
  }
}

function validateContinuousOrder(
  records: JsonObject[],
  field: "unitNo" | "processingOrder",
  label: string,
  start: number,
  errors: ValidationMessage[],
): void {
  const values = records.map((record) => record[field] as number).sort((left, right) => left - right);
  const isContinuous = new Set(values).size === records.length && values.every((value, index) => value === index + start);
  if (!isContinuous) {
    errors.push({
      code: `invalid_${field}`,
      message: `Roster ${label} values must be unique and continuous from ${String(start)} through ${String(start + records.length - 1)}.`,
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
    console.error(`ERROR ${error.code}: ${error.message}${error.path ? ` (${error.path})` : ""}`);
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

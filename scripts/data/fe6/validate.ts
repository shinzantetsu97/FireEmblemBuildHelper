import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ZodTypeAny } from "zod";
import { domainSchemas } from "./schemas";
import { json } from "./shared";

type JsonObject = Record<string, any>;
export type ValidationMessage = { code: string; message: string; path?: string };
export type ValidationResult = {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  parsed: Record<string, JsonObject>;
};

const EXPECTED_COUNTS = {
  units: 54,
  recruitment: 54,
  growths: 54,
  weaponLevels: 54,
  startingItems: 54,
  affinities: 7,
  classes: 67,
  promotions: 26,
  weapons: 93,
  items: 34,
  supports: 143,
} as const;

function canonicalSnapshot(content: Buffer): Buffer {
  return Buffer.from(content.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
}

async function readJson(relativePath: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), "utf8"));
}

function unique(records: JsonObject[], label: string, errors: ValidationMessage[]): void {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) errors.push({ code: "duplicate_id", message: `Duplicate ${label} ID ${record.id}.` });
    seen.add(record.id);
  }
}

function expectedCount(actual: number, key: keyof typeof EXPECTED_COUNTS, errors: ValidationMessage[]): void {
  if (actual !== EXPECTED_COUNTS[key]) {
    errors.push({ code: "unexpected_count", message: `Expected ${EXPECTED_COUNTS[key]} ${key}; found ${actual}.` });
  }
}

function collectSourceRefs(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap(collectSourceRefs);
  if (!value || typeof value !== "object") return [];
  const object = value as JsonObject;
  const own = typeof object.sourceId === "string" && typeof object.locator === "string" ? [object] : [];
  return own.concat(Object.values(object).flatMap(collectSourceRefs));
}

export async function validateFe6Data(): Promise<ValidationResult> {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const parsed: Record<string, JsonObject> = {};

  for (const [relativePath, schema] of Object.entries(domainSchemas) as Array<[string, ZodTypeAny]>) {
    const value = await readJson(relativePath);
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ code: "schema_error", message: issue.message, path: `${relativePath}:${issue.path.join(".")}` });
      }
    } else {
      parsed[relativePath] = result.data;
    }
  }

  if (errors.length > 0) return { valid: false, errors, warnings, parsed };

  const sources = parsed["data/sources/fe6/sources.json"].sources as JsonObject[];
  const units = parsed["data/normalized/fe6/units.json"].units as JsonObject[];
  const recruitment = parsed["data/normalized/fe6/recruitment.json"].recruitment as JsonObject[];
  const snapshots = parsed["data/normalized/fe6/unit-base-stats.json"].snapshots as JsonObject[];
  const growths = parsed["data/normalized/fe6/unit-growths.json"].growths as JsonObject[];
  const weaponLevels = parsed["data/normalized/fe6/unit-weapon-levels.json"].weaponLevels as JsonObject[];
  const startingItems = parsed["data/normalized/fe6/unit-starting-items.json"].startingItems as JsonObject[];
  const relationships = parsed["data/normalized/fe6/support-relationships.json"].relationships as JsonObject[];
  const affinities = parsed["data/normalized/fe6/affinities.json"].affinities as JsonObject[];
  const classes = parsed["data/normalized/fe6/classes.json"].classes as JsonObject[];
  const promotions = parsed["data/normalized/fe6/class-promotions.json"].promotions as JsonObject[];
  const weapons = parsed["data/normalized/fe6/weapons.json"].weapons as JsonObject[];
  const items = parsed["data/normalized/fe6/items.json"].items as JsonObject[];

  expectedCount(units.length, "units", errors);
  expectedCount(recruitment.length, "recruitment", errors);
  expectedCount(growths.length, "growths", errors);
  expectedCount(weaponLevels.length, "weaponLevels", errors);
  expectedCount(startingItems.length, "startingItems", errors);
  expectedCount(relationships.length, "supports", errors);
  expectedCount(affinities.length, "affinities", errors);
  expectedCount(classes.length, "classes", errors);
  expectedCount(promotions.length, "promotions", errors);
  expectedCount(weapons.length, "weapons", errors);
  expectedCount(items.length, "items", errors);

  unique(sources, "source", errors);
  unique(units, "unit", errors);
  unique(recruitment, "recruitment", errors);
  unique(snapshots, "base-stat snapshot", errors);
  unique(weaponLevels, "weapon-level snapshot", errors);
  unique(startingItems, "starting-item snapshot", errors);
  unique(relationships, "support relationship", errors);
  unique(affinities, "affinity", errors);
  unique(classes, "class", errors);
  unique(promotions, "promotion", errors);
  unique(weapons, "weapon", errors);
  unique(items, "item", errors);

  const sourceIds = new Set(sources.map((source) => source.id));
  for (const [relativePath, value] of Object.entries(parsed)) {
    for (const ref of collectSourceRefs(value)) {
      if (!sourceIds.has(ref.sourceId)) errors.push({ code: "unknown_source", message: `Unknown source ${ref.sourceId}.`, path: relativePath });
    }
  }

  for (const source of sources) {
    if (!source.snapshot) continue;
    const snapshotPath = path.join(process.cwd(), source.snapshot.path);
    if (!existsSync(snapshotPath)) {
      errors.push({ code: "missing_snapshot", message: `Missing snapshot ${source.snapshot.path}.` });
      continue;
    }
    const content = await readFile(snapshotPath);
    const hash = createHash("sha256").update(canonicalSnapshot(content)).digest("hex");
    if (hash !== source.snapshot.sha256) errors.push({ code: "snapshot_hash", message: `Snapshot hash changed for ${source.id}.` });
  }

  const unitIds = new Set(units.map((unit) => unit.id));
  const classIds = new Set(classes.map((entry) => entry.id));
  const affinityIds = new Set(affinities.map((entry) => entry.id));
  const snapshotIds = new Set(snapshots.map((entry) => entry.id));
  const weaponLevelIds = new Set(weaponLevels.map((entry) => entry.id));

  units.forEach((unit, index) => {
    if (unit.displayOrder !== index + 1) errors.push({ code: "unit_order", message: `${unit.id} has non-canonical display order.` });
    if (!affinityIds.has(unit.affinityId)) errors.push({ code: "unknown_affinity", message: `${unit.id} references ${unit.affinityId}.` });
    const normalBases = snapshots.filter((entry) => entry.unitId === unit.id && entry.difficulty === "normal");
    if (normalBases.length !== 1) errors.push({ code: "unit_bases", message: `${unit.id} must have exactly one Normal-mode base snapshot.` });
    if (growths.filter((entry) => entry.unitId === unit.id).length !== 1) errors.push({ code: "unit_growth", message: `${unit.id} must have exactly one growth vector.` });
    if (weaponLevels.filter((entry) => entry.unitId === unit.id).length !== 1) errors.push({ code: "unit_weapon_levels", message: `${unit.id} must have exactly one starting weapon-level snapshot.` });
    if (startingItems.filter((entry) => entry.unitId === unit.id).length !== 1) errors.push({ code: "unit_starting_items", message: `${unit.id} must have exactly one starting-item snapshot.` });
    if (recruitment.filter((entry) => entry.unitId === unit.id).length !== 1) errors.push({ code: "unit_recruitment", message: `${unit.id} must have exactly one recruitment record.` });
  });

  for (const record of recruitment) {
    if (!unitIds.has(record.unitId)) errors.push({ code: "unknown_unit", message: `${record.id} references ${record.unitId}.` });
    if (!classIds.has(record.startingClassId)) errors.push({ code: "unknown_class", message: `${record.id} references ${record.startingClassId}.` });
    if (!snapshotIds.has(record.baseStatSnapshotId)) errors.push({ code: "unknown_snapshot", message: `${record.id} references ${record.baseStatSnapshotId}.` });
    if (!weaponLevelIds.has(record.weaponLevelSnapshotId)) errors.push({ code: "unknown_weapon_levels", message: `${record.id} references ${record.weaponLevelSnapshotId}.` });
  }

  for (const relationship of relationships) {
    const [left, right] = relationship.unitIds;
    if (left >= right) errors.push({ code: "support_order", message: `${relationship.id} is not lexically ordered.` });
    if (relationship.id !== `${left}__${right}`) errors.push({ code: "support_id", message: `${relationship.id} does not match its units.` });
    if (!unitIds.has(left) || !unitIds.has(right)) errors.push({ code: "unknown_support_unit", message: `${relationship.id} has an unknown unit.` });
  }

  for (const entry of classes) {
    if (entry.promotionClassId && !classIds.has(entry.promotionClassId)) errors.push({ code: "unknown_promotion_class", message: `${entry.id} references ${entry.promotionClassId}.` });
    if (entry.maximumStats.hp !== 60 || entry.maximumStats.luck !== 30 || entry.maximumStats.movement !== 15) {
      errors.push({ code: "shared_class_caps", message: `${entry.id} is missing FE6 shared maximum caps.` });
    }
    if ("skills" in entry) errors.push({ code: "class_skills", message: `${entry.id} unexpectedly contains skill data.` });
  }

  for (const promotion of promotions) {
    if (!classIds.has(promotion.sourceClassId) || !classIds.has(promotion.targetClassId)) {
      errors.push({ code: "promotion_reference", message: `${promotion.id} has an unknown class.` });
    }
    const source = classes.find((entry) => entry.id === promotion.sourceClassId);
    if (source?.promotionClassId !== promotion.targetClassId) errors.push({ code: "promotion_mismatch", message: `${promotion.id} disagrees with its source class.` });
  }

  const combinedInventoryIds = new Set<string>();
  for (const record of [...weapons, ...items]) {
    if (combinedInventoryIds.has(record.id)) errors.push({ code: "inventory_id_collision", message: `Inventory ID ${record.id} is duplicated.` });
    combinedInventoryIds.add(record.id);
  }
  for (const weapon of weapons) {
    const isStaff = weapon.weaponTypeId === "staff";
    if (isStaff && [weapon.weight, weapon.might, weapon.hit, weapon.critical].some((value) => value !== null)) {
      errors.push({ code: "staff_combat_fields", message: `${weapon.id} has combat weapon fields.` });
    }
    if (!isStaff && weapon.staffExperience !== null) errors.push({ code: "weapon_staff_experience", message: `${weapon.id} has staff experience.` });
  }

  const hardSnapshots = snapshots.filter((entry) => entry.difficulty === "hard");
  if (hardSnapshots.some((entry) => entry.valueKind !== "expected_hard_mode")) {
    errors.push({ code: "hard_mode_value_kind", message: "Hard-mode bases must remain explicitly expected values." });
  }

  return { valid: errors.length === 0, errors, warnings, parsed };
}

async function writeReports(result: ValidationResult): Promise<void> {
  const reportRoot = path.join(process.cwd(), "data/reports/fe6");
  await mkdir(reportRoot, { recursive: true });
  const counts = result.valid ? {
    units: result.parsed["data/normalized/fe6/units.json"].units.length,
    classes: result.parsed["data/normalized/fe6/classes.json"].classes.length,
    weapons: result.parsed["data/normalized/fe6/weapons.json"].weapons.length,
    items: result.parsed["data/normalized/fe6/items.json"].items.length,
    supports: result.parsed["data/normalized/fe6/support-relationships.json"].relationships.length,
  } : {};
  await writeFile(path.join(reportRoot, "validation.json"), json({ gameId: "fe6", valid: result.valid, counts, errors: result.errors, warnings: result.warnings }), "utf8");
  const text = [
    `FE6 validation: ${result.valid ? "PASS" : "FAIL"}`,
    "",
    ...Object.entries(counts).map(([key, value]) => `${key}: ${value}`),
    "",
    `errors: ${result.errors.length}`,
    ...result.errors.map((error) => `- [${error.code}] ${error.message}${error.path ? ` (${error.path})` : ""}`),
    `warnings: ${result.warnings.length}`,
    ...result.warnings.map((warning) => `- [${warning.code}] ${warning.message}`),
    "",
  ].join("\n");
  await writeFile(path.join(reportRoot, "validation.txt"), text, "utf8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await validateFe6Data();
  await writeReports(result);
  console.log(`FE6 validation ${result.valid ? "passed" : "failed"} with ${result.errors.length} errors and ${result.warnings.length} warnings.`);
  if (!result.valid) process.exitCode = 1;
}

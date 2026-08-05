import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SourceRow = {
  sourceFile: string;
  section: string;
  cells: string[];
};

type SourceInventory = {
  sources: {
    fewikiWeapons: SourceRow[];
    fewikiItems: SourceRow[];
    serenes: SourceRow[];
  };
};

const sourcePath = path.join(process.cwd(), "data/sources/fe14/weapon-item-source-inventory.json");
const reportPath = path.join(process.cwd(), "data/reports/fe14/weapon-item-source-reconciliation.md");

const includedWeaponSections = new Set([
  "Sword", "Katana", "Lance", "Naginata", "Axe", "Club", "Dagger", "Shuriken",
  "Bow", "Yumi", "Tome", "Scroll", "Staff", "Rod", "Dragonstone", "Beaststone",
]);

function keyOf(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .replace(/[’'`]/g, "")
    .replace(/[−–—~〜]/g, "-")
    .replace(/[^a-z0-9]/g, "");
}

function valueOf(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .replace(/[−–—]/g, "-")
    .replace(/[,\s]/g, "");
  return normalized === "--" || normalized === "-" ? null : normalized;
}

function rangeOf(value: string | undefined): string | null {
  const normalized = valueOf(value);
  return normalized?.replace(/[~〜]/g, "-") ?? null;
}

function mapByName(rows: SourceRow[]): Map<string, SourceRow[]> {
  const result = new Map<string, SourceRow[]>();
  for (const row of rows) {
    const key = keyOf(row.cells[0] ?? "");
    if (!key) continue;
    result.set(key, [...(result.get(key) ?? []), row]);
  }
  return result;
}

function quoted(values: string[]): string {
  return values.map((value) => `\`${value}\``).join(", ");
}

function compareWeaponRow(fewiki: SourceRow, serenes: SourceRow): string[] {
  const staffOrRod = ["serenes-staves.html", "serenes-rods.html"].includes(serenes.sourceFile);
  const fields = staffOrRod
    ? [
        ["Rank", fewiki.cells[3], serenes.cells[1]],
        ["Rng", fewiki.cells[9], serenes.cells[3], true],
        ["Uses", fewiki.cells[10], serenes.cells[4]],
        ["Worth", fewiki.cells[13], serenes.cells[5]],
      ]
    : [
        ["Rank", fewiki.cells[3], serenes.cells[1]],
        ["Mt", fewiki.cells[4], serenes.cells[2]],
        ["Hit", fewiki.cells[5], serenes.cells[3]],
        ["Crit", fewiki.cells[6], serenes.cells[4]],
        ["Avo", fewiki.cells[7], serenes.cells[5]],
        ["Rng", fewiki.cells[9], serenes.cells[6], true],
        ["Worth", fewiki.cells[13], serenes.cells[7]],
      ];
  return fields.flatMap(([field, left, right, range]) => {
    const normalizedLeft = range ? rangeOf(left) : valueOf(left);
    const normalizedRight = range ? rangeOf(right) : valueOf(right);
    return normalizedLeft === normalizedRight ? [] : [`${field}: FE Wiki ${quoted([left ?? ""])}, Serenes ${quoted([right ?? ""])}`];
  });
}

function compareItemRow(fewiki: SourceRow, serenes: SourceRow): string[] {
  const fields = [
    ["Uses", fewiki.cells[2], serenes.cells[1]],
    ["Worth", fewiki.cells[3], serenes.cells[2]],
  ];
  return fields.flatMap(([field, left, right]) => valueOf(left) === valueOf(right)
    ? []
    : [`${field}: FE Wiki ${quoted([left ?? ""])}, Serenes ${quoted([right ?? ""])}`]);
}

const source = JSON.parse(await readFile(sourcePath, "utf8")) as SourceInventory;
const fewikiWeapons = source.sources.fewikiWeapons.filter((row) => includedWeaponSections.has(row.section));
const serenesWeapons = source.sources.serenes.filter((row) => row.section !== "Item");
const fewikiItems = source.sources.fewikiItems;
const serenesItems = source.sources.serenes.filter((row) => row.section === "Item");

const serenesWeaponByName = mapByName(serenesWeapons);
const serenesItemByName = mapByName(serenesItems);
const fewikiWeaponByName = mapByName(fewikiWeapons);
const fewikiItemByName = mapByName(fewikiItems);

const missingSerenesWeapons: string[] = [];
const ambiguousWeapons: string[] = [];
const weaponConflicts: Array<{ name: string; differences: string[] }> = [];
for (const row of fewikiWeapons) {
  const candidates = serenesWeaponByName.get(keyOf(row.cells[0])) ?? [];
  if (candidates.length === 0) {
    missingSerenesWeapons.push(row.cells[0]);
  } else if (candidates.length > 1) {
    ambiguousWeapons.push(row.cells[0]);
  } else {
    const differences = compareWeaponRow(row, candidates[0]);
    if (differences.length > 0) weaponConflicts.push({ name: row.cells[0], differences });
  }
}

const extraSerenesWeapons = serenesWeapons
  .filter((row) => !fewikiWeaponByName.has(keyOf(row.cells[0])))
  .map((row) => row.cells[0]);

const missingSerenesItems: string[] = [];
const ambiguousItems: string[] = [];
const itemConflicts: Array<{ name: string; differences: string[] }> = [];
for (const row of fewikiItems) {
  const candidates = serenesItemByName.get(keyOf(row.cells[0])) ?? [];
  if (candidates.length === 0) {
    missingSerenesItems.push(row.cells[0]);
  } else if (candidates.length > 1) {
    ambiguousItems.push(row.cells[0]);
  } else {
    const differences = compareItemRow(row, candidates[0]);
    if (differences.length > 0) itemConflicts.push({ name: row.cells[0], differences });
  }
}

const extraSerenesItems = serenesItems
  .filter((row) => !fewikiItemByName.has(keyOf(row.cells[0])))
  .map((row) => row.cells[0]);

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : "- None";
}

function conflictList(conflicts: Array<{ name: string; differences: string[] }>): string {
  return conflicts.length > 0
    ? conflicts.map(({ name, differences }) => `- **${name}:** ${differences.join("; ")}`).join("\n")
    : "- None";
}

const report = `# FE14 Weapon and Item Source Reconciliation\n\nGenerated from the local source inventory. Values listed as conflicts require curated review; this report does not pick a winner.\n\n## Weapon coverage\n\n- Fire Emblem Wiki in-scope weapons: ${fewikiWeapons.length}\n- Serenes Forest weapon rows (including miscellaneous): ${serenesWeapons.length}\n- FE Wiki weapons missing from Serenes name match: ${missingSerenesWeapons.length}\n- Extra Serenes weapon rows: ${extraSerenesWeapons.length}\n- Ambiguous name matches: ${ambiguousWeapons.length}\n- Mechanical field conflicts: ${weaponConflicts.length}\n\n### Missing FE Wiki weapon names\n\n${bulletList(missingSerenesWeapons)}\n\n### Extra Serenes weapon names\n\n${bulletList(extraSerenesWeapons)}\n\n### Ambiguous weapon matches\n\n${bulletList(ambiguousWeapons)}\n\n### Weapon field conflicts\n\n${conflictList(weaponConflicts)}\n\n## Item coverage\n\n- Fire Emblem Wiki item rows: ${fewikiItems.length}\n- Serenes Forest item rows: ${serenesItems.length}\n- FE Wiki items missing from Serenes name match: ${missingSerenesItems.length}\n- Extra Serenes item rows: ${extraSerenesItems.length}\n- Ambiguous name matches: ${ambiguousItems.length}\n- Compared Uses/Worth conflicts: ${itemConflicts.length}\n\n### Missing FE Wiki item names\n\n${bulletList(missingSerenesItems)}\n\n### Extra Serenes item names\n\n${bulletList(extraSerenesItems)}\n\n### Ambiguous item matches\n\n${bulletList(ambiguousItems)}\n\n### Item field conflicts\n\n${conflictList(itemConflicts)}\n`;

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report, "utf8");

console.log(`Reconciled ${fewikiWeapons.length} in-scope FE Wiki weapons and ${fewikiItems.length} FE Wiki items.`);

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

type SourceRow = {
  sourceId: string;
  sourceFile: string;
  sourceTable: number;
  sourceRow: number;
  section: string;
  cells: string[];
  links: Array<{ text: string; href: string }>;
  image?: { filePageUrl?: string; imageUrl?: string; alt?: string };
};

const rawDirectory = path.join(process.cwd(), "data/raw/fe14/weapons");
const sourceDirectory = path.join(process.cwd(), "data/sources/fe14");
const reportDirectory = path.join(process.cwd(), "data/reports/fe14");

function textOf(element: Element): string {
  return (element.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(value: string | null, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function linksOf(row: HTMLTableRowElement, baseUrl: string): Array<{ text: string; href: string }> {
  return [...row.querySelectorAll("a[href]")]
    .map((link) => ({ text: textOf(link), href: absoluteUrl(link.getAttribute("href"), baseUrl) }))
    .filter((link): link is { text: string; href: string } => Boolean(link.href));
}

function imageOf(row: HTMLTableRowElement, baseUrl: string): SourceRow["image"] {
  const image = row.querySelector("img");
  if (!image) return undefined;
  const fileLink = image.closest("a[href]");
  return {
    filePageUrl: absoluteUrl(fileLink?.getAttribute("href") ?? null, baseUrl),
    imageUrl: absoluteUrl(image.getAttribute("src"), baseUrl),
    alt: image.getAttribute("alt") || undefined,
  };
}

async function documentFor(fileName: string): Promise<Document> {
  const html = await readFile(path.join(rawDirectory, fileName), "utf8");
  return new JSDOM(html).window.document;
}

function wikiRows(
  document: Document,
  fileName: string,
  sourceId: string,
  baseUrl: string,
  expectedCells: number,
): SourceRow[] {
  const table = document.querySelectorAll("table")[1];
  if (!table) throw new Error(`${fileName} is missing its primary source table.`);
  return [...table.querySelectorAll("tbody tr, :scope > tr")]
    .map((row, index) => ({ row, index, cells: [...row.cells].map(textOf) }))
    .filter(({ cells }) => cells.length === expectedCells)
    .filter(({ cells }) => cells[0] && !["Off", "Weapon", "Item"].includes(cells[0]))
    .map(({ row, index, cells }) => ({
      sourceId,
      sourceFile: fileName,
      sourceTable: 1,
      sourceRow: index,
      section: cells[2] || "Unknown",
      cells,
      links: linksOf(row, baseUrl),
      image: imageOf(row, baseUrl),
    }));
}

function fcfantasyRows(
  document: Document,
  fileName: string,
  sourceId: string,
  baseUrl: string,
  sections: [string, string],
): SourceRow[] {
  return [...document.querySelectorAll("table.type2")].flatMap((table, tableIndex) =>
    [...table.querySelectorAll("tbody tr, :scope > tr")]
      .slice(1)
      .map((row, rowIndex) => ({ row, rowIndex, cells: [...row.cells].map(textOf) }))
      .filter(({ cells }) => cells.length === 10 && cells[0])
      .map(({ row, rowIndex, cells }) => ({
        sourceId,
        sourceFile: fileName,
        sourceTable: tableIndex,
        sourceRow: rowIndex + 1,
        section: sections[tableIndex] ?? "Unknown",
        cells,
        links: linksOf(row, baseUrl),
      })),
  );
}

function genericTableRows(
  document: Document,
  fileName: string,
  sourceId: string,
  baseUrl: string,
): SourceRow[] {
  return [...document.querySelectorAll("table")].flatMap((table, tableIndex) =>
    [...table.querySelectorAll("tbody tr, :scope > tr")].map((row, rowIndex) => ({
      sourceId,
      sourceFile: fileName,
      sourceTable: tableIndex,
      sourceRow: rowIndex,
      section: "Unclassified",
      cells: [...row.cells].map(textOf),
      links: linksOf(row, baseUrl),
      image: imageOf(row, baseUrl),
    })),
  ).filter((row) => row.cells.length > 1 && row.cells.some(Boolean));
}

function serenesRows(
  document: Document,
  fileName: string,
  sourceId: string,
  baseUrl: string,
  section: string,
): SourceRow[] {
  return [...document.querySelectorAll("table")].flatMap((table, tableIndex) =>
    [...table.querySelectorAll("tbody tr, :scope > tr")]
      .slice(1)
      .map((row, rowIndex) => ({ row, rowIndex, cells: [...row.cells].map(textOf) }))
      .filter(({ cells }) => cells.length > 1 && cells[0])
      .map(({ row, rowIndex, cells }) => ({
        sourceId,
        sourceFile: fileName,
        sourceTable: tableIndex,
        sourceRow: rowIndex + 1,
        section,
        cells,
        links: linksOf(row, baseUrl),
      })),
  );
}

function markdownTable(rows: Array<[string, number]>): string {
  return [
    "| Source | Rows |",
    "| --- | ---: |",
    ...rows.map(([name, count]) => `| ${name} | ${count} |`),
  ].join("\n");
}

const fewikiWeaponsUrl = "https://fireemblemwiki.org/wiki/List_of_weapons_in_Fire_Emblem_Fates";
const fewikiItemsUrl = "https://fireemblemwiki.org/wiki/List_of_items_in_Fire_Emblem_Fates";
const serenesInventorySources: Array<{ fileName: string; sourceId: string; baseUrl: string; section: string }> = [
  { fileName: "serenes-swords.html", sourceId: "serenes-fe14-inventory-swords", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/swords/", section: "Sword" },
  { fileName: "serenes-katanas.html", sourceId: "serenes-fe14-inventory-katanas", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/katanas/", section: "Katana" },
  { fileName: "serenes-lances.html", sourceId: "serenes-fe14-inventory-lances", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/lances/", section: "Lance" },
  { fileName: "serenes-naginatas.html", sourceId: "serenes-fe14-inventory-naginatas", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/naginatas/", section: "Naginata" },
  { fileName: "serenes-axes.html", sourceId: "serenes-fe14-inventory-axes", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/axes/", section: "Axe" },
  { fileName: "serenes-clubs.html", sourceId: "serenes-fe14-inventory-clubs", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/clubs/", section: "Club" },
  { fileName: "serenes-daggers.html", sourceId: "serenes-fe14-inventory-daggers", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/daggers/", section: "Dagger" },
  { fileName: "serenes-shurikens.html", sourceId: "serenes-fe14-inventory-shurikens", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/shurikens/", section: "Shuriken" },
  { fileName: "serenes-bows.html", sourceId: "serenes-fe14-inventory-bows", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/bows/", section: "Bow" },
  { fileName: "serenes-yumi.html", sourceId: "serenes-fe14-inventory-yumi", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/yumi/", section: "Yumi" },
  { fileName: "serenes-tomes.html", sourceId: "serenes-fe14-inventory-tomes", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/tomes/", section: "Tome" },
  { fileName: "serenes-scrolls.html", sourceId: "serenes-fe14-inventory-scrolls", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/scrolls/", section: "Scroll" },
  { fileName: "serenes-staves.html", sourceId: "serenes-fe14-inventory-staves", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/staves/", section: "Staff" },
  { fileName: "serenes-rods.html", sourceId: "serenes-fe14-inventory-rods", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/rods/", section: "Rod" },
  { fileName: "serenes-miscellaneous.html", sourceId: "serenes-fe14-inventory-miscellaneous", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/miscellaneous/", section: "Miscellaneous" },
  { fileName: "serenes-items.html", sourceId: "serenes-fe14-inventory-items", baseUrl: "https://serenesforest.net/fire-emblem-fates/inventory/items/", section: "Item" },
];

const fewikiWeapons = wikiRows(
  await documentFor("fewiki-weapons.html"),
  "fewiki-weapons.html",
  "fewiki-fe14-weapons",
  fewikiWeaponsUrl,
  17,
);
const fewikiItems = wikiRows(
  await documentFor("fewiki-items.html"),
  "fewiki-items.html",
  "fewiki-fe14-items",
  fewikiItemsUrl,
  6,
);

const fcfantasySources: Array<{
  fileName: string;
  sourceId: string;
  baseUrl: string;
  sections: [string, string];
}> = [
  { fileName: "fcfantasy-sword.html", sourceId: "fcfantasy-fe14-sword-katana", baseUrl: "http://fcfantasy.cn/fe2015/database/sword.html", sections: ["Sword", "Katana"] },
  { fileName: "fcfantasy-lance.html", sourceId: "fcfantasy-fe14-lance-naginata", baseUrl: "http://fcfantasy.cn/fe2015/database/lance.html", sections: ["Lance", "Naginata"] },
  { fileName: "fcfantasy-axe.html", sourceId: "fcfantasy-fe14-axe-club", baseUrl: "http://fcfantasy.cn/fe2015/database/axe.html", sections: ["Axe", "Club"] },
  { fileName: "fcfantasy-bow.html", sourceId: "fcfantasy-fe14-bow-yumi", baseUrl: "http://fcfantasy.cn/fe2015/database/bow.html", sections: ["Bow", "Yumi"] },
  { fileName: "fcfantasy-knife.html", sourceId: "fcfantasy-fe14-dagger-shuriken", baseUrl: "http://fcfantasy.cn/fe2015/database/knife.html", sections: ["Dagger", "Shuriken"] },
  { fileName: "fcfantasy-magic.html", sourceId: "fcfantasy-fe14-tome-scroll", baseUrl: "http://fcfantasy.cn/fe2015/database/magic.html", sections: ["Tome", "Scroll"] },
];

const fcfantasy = (
  await Promise.all(
    fcfantasySources.map(async (source) => fcfantasyRows(
      await documentFor(source.fileName),
      source.fileName,
      source.sourceId,
      source.baseUrl,
      source.sections,
    )),
  )
).flat();

const serenes = (
  await Promise.all(
    serenesInventorySources.map(async (source) => serenesRows(
      await documentFor(source.fileName),
      source.fileName,
      source.sourceId,
      source.baseUrl,
      source.section,
    )),
  )
).flat();

const japaneseSources = await Promise.all([
  ["pegasusknight-items-tools-ja.html", "pegasusknight-fe14-items", "https://www.pegasusknight.com/wiki/fe14/%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0/%E9%81%93%E5%85%B7"],
  ["pegasusknight-staves-rods-ja.html", "pegasusknight-fe14-staves-rods", "https://www.pegasusknight.com/wiki/fe14/%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0/%E6%9D%96%E3%83%BB%E7%A5%93%E4%B8%B2"],
  ["pegasusknight-stones-ja.html", "pegasusknight-fe14-stones", "https://www.pegasusknight.com/wiki/fe14/%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0/%E7%AB%9C%E7%9F%B3%E3%83%BB%E7%8D%A3%E7%9F%B3%E3%83%BB%E3%81%9D%E3%81%AE%E4%BB%96"],
].map(async ([fileName, sourceId, baseUrl]) => genericTableRows(
  await documentFor(fileName),
  fileName,
  sourceId,
  baseUrl,
)));

const payload = {
  gameId: "fe14",
  capturedAt: new Date().toISOString(),
  sources: {
    fewikiWeapons,
    fewikiItems,
    fcfantasy,
    serenes,
    japanese: japaneseSources.flat(),
  },
};

const fcfantasyBySection = new Map<string, number>();
for (const row of fcfantasy) {
  fcfantasyBySection.set(row.section, (fcfantasyBySection.get(row.section) ?? 0) + 1);
}
const fewikiWeaponTypes = new Map<string, number>();
for (const row of fewikiWeapons) {
  fewikiWeaponTypes.set(row.section, (fewikiWeaponTypes.get(row.section) ?? 0) + 1);
}

const report = `# FE14 Weapon and Item Source Inventory\n\nGenerated from locally captured source HTML. This report is an inventory, not accepted normalized game data.\n\n## Captured row counts\n\n${markdownTable([
  ["Fire Emblem Wiki weapons", fewikiWeapons.length],
  ["Fire Emblem Wiki items", fewikiItems.length],
  ["FC Fantasy weapon rows", fcfantasy.length],
  ["Serenes Forest inventory rows", serenes.length],
  ["Japanese item/staff/stone table rows", japaneseSources.flat().length],
])}\n\n## Fire Emblem Wiki weapon types\n\n${markdownTable([...fewikiWeaponTypes.entries()])}\n\n## FC Fantasy sections\n\n${markdownTable([...fcfantasyBySection.entries()])}\n\n## Initial source gaps\n\n- The supplied Serenes Forest page is explicitly pre-release and contains example tables only. It does not independently cover the full Fire Emblem Wiki catalog.\n- FC Fantasy has no supplied staff/rod or stone table. The captured Pegasus Knight pages are candidate Japanese sources for those missing sections.\n- Fire Emblem Wiki item rows have no supplied Simplified Chinese counterpart. Japanese names/descriptions must be sourced and translated in reviewable sections before they are accepted.\n- This inventory intentionally retains all Fire Emblem Wiki rows, including entries that may later be excluded as enemy-only, unused, dummy, or otherwise out of scope. Inclusion decisions belong in the normalized-data review step.\n`;

const correctedReport = report.replace(
  "The supplied Serenes Forest page is explicitly pre-release and contains example tables only. It does not independently cover the full Fire Emblem Wiki catalog.",
  "The Serenes Forest FE14 index links to one inventory page per weapon family plus dedicated miscellaneous and item pages. These pages are the complete Serenes input; the old pre-release article is retained only as raw research material.",
);

await mkdir(sourceDirectory, { recursive: true });
await mkdir(reportDirectory, { recursive: true });
await writeFile(
  path.join(sourceDirectory, "weapon-item-source-inventory.json"),
  `${JSON.stringify(payload, null, 2)}\n`,
  "utf8",
);
await writeFile(
  path.join(reportDirectory, "weapon-item-source-inventory.md"),
  correctedReport,
  "utf8",
);

console.log(`Captured ${fewikiWeapons.length} Fire Emblem Wiki weapon rows, ${fewikiItems.length} item rows, and ${fcfantasy.length} FC Fantasy rows.`);

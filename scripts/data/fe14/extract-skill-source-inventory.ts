import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const OUTPUT_PATH = path.resolve(
  "data/sources/fe14/serenes-skill-source-inventory.json",
);

const SOURCE_PAGES = [
  {
    id: "serenes-fe14-hoshidan-class-skills",
    title: "Fire Emblem Fates: Hoshidan Classes - Class Skills",
    skillType: "class",
    category: "hoshidan",
    url: "https://serenesforest.net/fire-emblem-fates/hoshidan-classes/class-skills/",
  },
  {
    id: "serenes-fe14-nohrian-class-skills",
    title: "Fire Emblem Fates: Nohrian Classes - Class Skills",
    skillType: "class",
    category: "nohrian",
    url: "https://serenesforest.net/fire-emblem-fates/nohrian-classes/class-skills/",
  },
  {
    id: "serenes-fe14-hoshidan-personal-skills",
    title: "Fire Emblem Fates: Hoshidan Characters - Personal Skills",
    skillType: "personal",
    category: "hoshidan",
    url: "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/personal-skills/",
  },
  {
    id: "serenes-fe14-nohrian-personal-skills",
    title: "Fire Emblem Fates: Nohrian Characters - Personal Skills",
    skillType: "personal",
    category: "nohrian",
    url: "https://serenesforest.net/fire-emblem-fates/nohrian-characters/personal-skills/",
  },
  {
    id: "serenes-fe14-other-personal-skills",
    title: "Fire Emblem Fates: Other Characters - Personal Skills",
    skillType: "personal",
    category: "other",
    url: "https://serenesforest.net/fire-emblem-fates/other-characters/personal-skills/",
  },
] as const;

type SourcePage = (typeof SOURCE_PAGES)[number];

function readText(element: Element | undefined): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function findTable(document: Document, expectedHeader: string[]): HTMLTableElement {
  const table = [...document.querySelectorAll("table")].find((candidate) => {
    const firstRow = candidate.rows.item(0);
    const headers = firstRow
      ? [...firstRow.cells].map((cell) => readText(cell))
      : [];

    return expectedHeader.every((header, index) => headers[index] === header);
  });

  if (!table) {
    throw new Error(`Could not find table with header: ${expectedHeader.join(", ")}`);
  }

  return table;
}

function readIconUrl(row: HTMLTableRowElement, pageUrl: string): string {
  const source = row.cells.item(0)?.querySelector("img")?.getAttribute("src");

  if (!source) {
    throw new Error(`Missing icon URL for source row ${row.rowIndex}`);
  }

  return new URL(source, pageUrl).href;
}

function readClassRows(document: Document, page: SourcePage) {
  const table = findTable(document, [
    "Icon",
    "Skill",
    "Description",
    "Class",
    "Level",
    "Cost",
  ]);

  return [...table.rows].slice(1).map((row, index) => ({
    sourceOrder: index + 1,
    iconUrl: readIconUrl(row, page.url),
    name: readText(row.cells.item(1) ?? undefined),
    description: readText(row.cells.item(2) ?? undefined),
    classLabel: readText(row.cells.item(3) ?? undefined),
    level: readText(row.cells.item(4) ?? undefined),
    cost: readText(row.cells.item(5) ?? undefined),
  }));
}

function findSectionHeading(table: HTMLTableElement): string {
  let sibling = table.previousElementSibling;

  while (sibling && sibling.tagName !== "H4") {
    sibling = sibling.previousElementSibling;
  }

  return readText(sibling ?? undefined);
}

function readPersonalRows(document: Document, page: SourcePage) {
  const tables = [...document.querySelectorAll("table")].filter((candidate) => {
    const firstRow = candidate.rows.item(0);
    const headers = firstRow
      ? [...firstRow.cells].map((cell) => readText(cell))
      : [];

    return ["Icon", "Name", "Effect", "Character"].every(
      (header, index) => headers[index] === header,
    );
  });

  let sourceOrder = 0;

  return tables.flatMap((table) => {
    const section = findSectionHeading(table);

    return [...table.rows].slice(1).map((row) => ({
      sourceOrder: ++sourceOrder,
      section,
      iconUrl: readIconUrl(row, page.url),
      name: readText(row.cells.item(1) ?? undefined),
      effect: readText(row.cells.item(2) ?? undefined),
      characterLabel: readText(row.cells.item(3) ?? undefined),
    }));
  });
}

async function fetchPage(page: SourcePage) {
  const response = await fetch(page.url, {
    headers: { "user-agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`${page.id} returned HTTP ${response.status}`);
  }

  const document = new JSDOM(await response.text()).window.document;
  const rows =
    page.skillType === "class"
      ? readClassRows(document, page)
      : readPersonalRows(document, page);

  return {
    ...page,
    rowCount: rows.length,
    rows,
  };
}

const pages = [];

for (const page of SOURCE_PAGES) {
  pages.push(await fetchPage(page));
}

const inventory = {
  gameId: "fe14",
  scope: "milestone-007-approved-sources",
  capturedAt: new Date().toISOString(),
  pages,
};

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUTPUT_PATH}`);
for (const page of pages) {
  console.log(`${page.id}: ${page.rowCount} rows`);
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Scrapes the fcfantasy.cn (FC Fantasy community) FE Fates skill database pages
// into raw source JSON. These pages carry Simplified-Chinese skill/character
// names and descriptions plus Japanese names. The site's HTTPS certificate is
// expired, so we must fetch over plain HTTP. Output is raw provenance material
// under data/sources/fe14/ — curated into normalized data by hand afterwards.

const CLASS_SKILLS_URL = "http://fcfantasy.cn/fe2015/database/class_skills.html";
const PERSONAL_SKILLS_URL = "http://fcfantasy.cn/fe2015/database/personal_skills.html";

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  return response.text();
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRows(html: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) ?? [];
  for (const row of rowMatches) {
    const cellMatches = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) ?? [];
    const cells = cellMatches.map((cell) => stripTags(cell.replace(/^<t[dh][^>]*>/, "").replace(/<\/t[dh]>$/, "")));
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

// Class-skills table columns: [class] icon | zhName | jaName | description.
// The class column is rowspan-merged, so continuation rows omit it (4 cells).
function parseClassSkills(html: string) {
  const rows = extractRows(html);
  const entries: Array<{ className: string; skillName: string; skillNameJa: string; description: string }> = [];
  let currentClass = "";
  for (const cells of rows.slice(1)) {
    let className = currentClass;
    let rest = cells;
    if (cells.length === 5) {
      className = cells[0];
      currentClass = className;
      rest = cells.slice(1);
    } else if (cells.length !== 4) {
      continue;
    }
    // rest = [iconAlt, zhName, jaName, description]
    const [, skillName, skillNameJa, description] = rest;
    if (!skillName) continue;
    entries.push({ className, skillName, skillNameJa, description });
  }
  return entries;
}

// Personal-skills table columns: portrait | character | icon | skillName | description.
// Character and skillName cells bundle Chinese + Japanese (+ romaji) text.
function parsePersonalSkills(html: string) {
  const rows = extractRows(html);
  const entries: Array<{ character: string; skill: string; description: string }> = [];
  for (const cells of rows.slice(1)) {
    if (cells.length < 4) continue;
    const character = cells[1];
    const skill = cells[cells.length - 2];
    const description = cells[cells.length - 1];
    if (!character) continue;
    entries.push({ character, skill, description });
  }
  return entries;
}

async function writeJson(relativePath: string, value: unknown): Promise<void> {
  const absolutePath = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const capturedAt = new Date().toISOString();

const [classHtml, personalHtml] = await Promise.all([
  fetchHtml(CLASS_SKILLS_URL),
  fetchHtml(PERSONAL_SKILLS_URL),
]);

const classSkills = parseClassSkills(classHtml);
const personalSkills = parsePersonalSkills(personalHtml);

await writeJson("data/sources/fe14/fcfantasy-class-skills.json", {
  sourceId: "fcfantasy-fe14-class-skills",
  sourceUrl: CLASS_SKILLS_URL,
  capturedAt,
  rowCount: classSkills.length,
  rows: classSkills,
});

await writeJson("data/sources/fe14/fcfantasy-personal-skills.json", {
  sourceId: "fcfantasy-fe14-personal-skills",
  sourceUrl: PERSONAL_SKILLS_URL,
  capturedAt,
  rowCount: personalSkills.length,
  rows: personalSkills,
});

console.log(`Scraped ${classSkills.length} class-skill rows and ${personalSkills.length} personal-skill rows from fcfantasy.cn.`);

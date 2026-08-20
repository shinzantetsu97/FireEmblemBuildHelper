import { readFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { sourceById } from "./source-manifest";

export const RAW_ROOT = path.join(process.cwd(), "data/raw/fe6/serenes");

export type SourceRef = {
  sourceId: string;
  locator: string;
  fields: string[];
  reviewStatus: "accepted";
};

export function sourceRef(sourceId: string, locator: string, fields: string[]): SourceRef {
  return { sourceId, locator, fields, reviewStatus: "accepted" };
}

export function textOf(element: Element): string {
  return (element.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function imageAlts(element: Element): string[] {
  return [...element.querySelectorAll("img")]
    .map((image) => image.getAttribute("alt")?.trim() ?? "")
    .filter(Boolean);
}

export async function sourceDocument(sourceId: string): Promise<Document> {
  const source = sourceById.get(sourceId);
  if (!source) throw new Error(`Unknown FE6 source ${sourceId}.`);
  const html = await readFile(path.join(RAW_ROOT, source.relativePath), "utf8");
  return new JSDOM(html).window.document;
}

export async function sourceTable(sourceId: string, tableIndex = 0): Promise<HTMLTableElement> {
  const document = await sourceDocument(sourceId);
  const table = document.querySelectorAll("table")[tableIndex] as HTMLTableElement | undefined;
  if (!table) throw new Error(`${sourceId} is missing table ${tableIndex}.`);
  return table;
}

export function rowCells(row: HTMLTableRowElement): string[] {
  return [...row.cells].map(textOf);
}

export function dataRows(table: HTMLTableElement, firstHeader: string): HTMLTableRowElement[] {
  return [...table.rows].filter((row) => {
    const cells = rowCells(row);
    return cells.length > 0 && cells[0] !== firstHeader;
  });
}

export function asciiId(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " plus ")
    .replace(/['’]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function lookupKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function integer(value: string, context: string): number {
  const normalized = value.replace(/[+,]/g, "").trim();
  if (!/^-?\d+$/.test(normalized)) throw new Error(`${context} is not an integer: ${value}`);
  return Number(normalized);
}

export function nullableInteger(value: string, context: string): number | null {
  return value === "–" || value === "-" || value === "" ? null : integer(value, context);
}

export async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), "utf8")) as T;
}

export function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

type RuntimeUnit = { id: string; names: { en: string; fan?: string; officialJpn?: string }; aliases: string[] };
type RuntimePayload = { units: RuntimeUnit[] };
type ImageInfo = { url: string; mime: string; width: number; height: number };
type PortraitManifestEntry = {
  unitId: string;
  sourceListUrl: string;
  sourceGalleryOrFileUrl: string;
  sourceImageUrl: string;
  localFileName: string;
  mimeType: string;
  width: number;
  height: number;
  sha256: string;
  dateChecked: string;
  reviewStatus: "accepted";
  rightsNote: string;
};

const sourceListUrl = "https://fireemblem.fandom.com/wiki/List_of_characters_in_Fire_Emblem:_The_Binding_Blade";
const userAgent = "FireEmblemBuildHelper data curation (+https://github.com/)";
const assetDirectory = path.join(process.cwd(), "src/games/fe6/assets/character_portraits");
const manifestPath = path.join(process.cwd(), "data/sources/fe6/character-portraits.json");
const runtimePath = path.join(process.cwd(), "data/runtime/fe6/units.json");
const runtime = JSON.parse(await readFile(runtimePath, "utf8")) as RuntimePayload;
const refresh = process.argv.includes("--refresh");
const listHtml = await fetchText(apiUrl({ action: "parse", page: "List of characters in Fire Emblem: The Binding Blade", prop: "text", format: "json" }));
const portraitsByName = listPortraits(listHtml);
const entries: PortraitManifestEntry[] = [];

await mkdir(assetDirectory, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

for (const unit of runtime.units) {
  const fileName = findListPortrait(unit, portraitsByName).fileName;
  const image = await imageInfo(fileName);
  const localFileName = `${unit.id}${extensionFor(image.mime, fileName)}`;
  const destination = path.join(assetDirectory, localFileName);

  if (refresh || !existsSync(destination)) {
    const response = await fetch(image.url, { headers: { "user-agent": userAgent, accept: "image/avif,image/webp,image/png,image/gif,image/jpeg,*/*" } });
    if (!response.ok) throw new Error(`${unit.id}: portrait download returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? "";
    if (!contentType.startsWith("image/")) throw new Error(`${unit.id}: expected an image response, received ${contentType || "unknown content type"}.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) throw new Error(`${unit.id}: portrait file was empty.`);
    await writeFile(destination, bytes);
  }

  const bytes = await readFile(destination);
  entries.push({
    unitId: unit.id,
    sourceListUrl,
    sourceGalleryOrFileUrl: `https://fireemblem.fandom.com/wiki/${encodeURIComponent(`File:${fileName}`)}`,
    sourceImageUrl: image.url,
    localFileName,
    mimeType: image.mime,
    width: image.width,
    height: image.height,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    dateChecked: new Date().toISOString(),
    reviewStatus: "accepted",
    rightsNote: "Source-page attribution only. The underlying game portrait remains the property of its respective copyright holder.",
  });
  console.log(`${unit.id}: ${fileName} -> ${localFileName}`);
}

await writeFile(manifestPath, `${JSON.stringify({ gameId: "fe6", source: "Fire Emblem Wiki / Fandom", entries }, null, 2)}\n`, "utf8");
console.log(`Recorded ${entries.length} local FE6 character portraits.`);

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`Fandom API returned HTTP ${response.status} for ${url}.`);
  const payload = await response.json() as { parse?: { text?: { "*"?: string } } };
  const html = payload.parse?.text?.["*"];
  if (!html) throw new Error("Fandom API did not return the approved character-list markup.");
  return html;
}

function listPortraits(html: string): Map<string, { fileName: string }> {
  const document = new JSDOM(html).window.document;
  const portraits = new Map<string, { fileName: string }>();
  for (const card of document.querySelectorAll(".p-container")) {
    const name = card.querySelector(".link a")?.textContent?.trim();
    const fileName = card.querySelector<HTMLImageElement>("img[data-image-name]")?.dataset.imageName;
    if (name && fileName) portraits.set(normalizeName(name), { fileName });
  }
  return portraits;
}

function findListPortrait(unit: RuntimeUnit, portraitsByName: Map<string, { fileName: string }>): { fileName: string } {
  const names = [unit.names.en, unit.names.fan, unit.names.officialJpn, ...unit.aliases]
    .filter((name): name is string => Boolean(name))
    .map(normalizeName);
  const portrait = names.map((name) => portraitsByName.get(name)).find(Boolean);
  if (!portrait) throw new Error(`${unit.id}: no matching portrait was found on the approved character list.`);
  return portrait;
}

function normalizeName(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

async function imageInfo(fileName: string): Promise<ImageInfo> {
  const payload = await fetchJson<{ query?: { pages?: Record<string, { imageinfo?: Array<{ url?: string; mime?: string; width?: number; height?: number }> }> } }>(
    apiUrl({ action: "query", titles: `File:${fileName}`, prop: "imageinfo", iiprop: "url|mime|size", format: "json" }),
  );
  const image = Object.values(payload.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!image?.url || !image.mime || !image.width || !image.height) throw new Error(`Missing image information for ${fileName}.`);
  return { url: image.url, mime: image.mime, width: image.width, height: image.height };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`Fandom API returned HTTP ${response.status} for ${url}.`);
  return response.json() as Promise<T>;
}

function apiUrl(params: Record<string, string>): string {
  return `https://fireemblem.fandom.com/api.php?${new URLSearchParams(params).toString()}`;
}

function extensionFor(mime: string, fileName: string): string {
  const fromMime: Record<string, string> = { "image/png": ".png", "image/gif": ".gif", "image/jpeg": ".jpg", "image/webp": ".webp" };
  if (fromMime[mime]) return fromMime[mime];
  const extension = path.extname(fileName).toLowerCase();
  if ([".png", ".gif", ".jpg", ".jpeg", ".webp"].includes(extension)) return extension;
  throw new Error(`Unsupported portrait MIME type ${mime} for ${fileName}.`);
}

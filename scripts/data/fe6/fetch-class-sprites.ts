import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

type RuntimeClass = { id: string; names: { en: string }; aliases: string[] };
type RuntimePayload = { classes: RuntimeClass[] };
type ImageInfo = { url: string; mime: string; width: number; height: number };
type SpriteSource = { assetId: string; className: string; fileName: string };
type SpriteAsset = ImageInfo & {
  id: string;
  sourceClassName: string;
  sourceFileUrl: string;
  sourceImageUrl: string;
  localFileName: string;
  sha256: string;
  reviewStatus: "accepted";
  rightsNote: string;
};

const sourcePageUrl = "https://fireemblem.fandom.com/wiki/List_of_classes_in_Fire_Emblem:_The_Binding_Blade";
const userAgent = "FireEmblemBuildHelper data curation (+https://github.com/)";
const assetDirectory = path.join(process.cwd(), "src/games/fe6/assets/class_sprites");
const manifestPath = path.join(process.cwd(), "data/sources/fe6/class-sprites.json");
const runtimePath = path.join(process.cwd(), "data/runtime/fe6/classes.json");
const genderSpriteOverrides: Record<string, SpriteSource> = {
  thief_f: { assetId: "thief-f", className: "Thief (F)", fileName: "FE6 Female Thief Map Sprite.gif" },
  myrmidon_f: { assetId: "myrmidon-f", className: "Myrmidon (F)", fileName: "FE8 Female Myrmidon Map Sprite.gif" },
  swordmaster_f: { assetId: "swordmaster-f", className: "Swordmaster (F)", fileName: "FE8 Female Swordmaster Map Sprite.gif" },
  sniper_f: { assetId: "sniper-f", className: "Sniper (F)", fileName: "FE8 Sniper Map Sprite (F).gif" },
  mage_f: { assetId: "mage-f", className: "Mage (F)", fileName: "FE8 Female Mage Map Sprite.gif" },
  sage_f: { assetId: "sage-f", className: "Sage (F)", fileName: "FE8 Female Sage Map Sprite.gif" },
  druid_m: { assetId: "druid-m", className: "Druid (M)", fileName: "FE8 Druid Map Sprite.gif" },
  bishop_f: { assetId: "bishop-f", className: "Bishop (F)", fileName: "FE8 Female Bishop Map Sprite.gif" },
};
const runtime = JSON.parse(await readFile(runtimePath, "utf8")) as RuntimePayload;
const refresh = process.argv.includes("--refresh");
const pageMarkup = await fetchText(apiUrl({ action: "parse", page: "List of classes in Fire Emblem: The Binding Blade", prop: "text", format: "json" }));
const spriteSources = listSprites(pageMarkup);
for (const source of Object.values(genderSpriteOverrides)) spriteSources.set(source.assetId, source);
const assets: SpriteAsset[] = [];
const assignments: Array<{ classId: string; assetId: string; reviewStatus: "accepted" }> = [];

await mkdir(assetDirectory, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

for (const source of spriteSources.values()) {
  const image = await imageInfo(source.fileName);
  const sourceImageUrl = originalImageUrl(image.url);
  const assetId = source.assetId;
  const localFileName = `${assetId}${extensionFor(image.mime, source.fileName)}`;
  const destination = path.join(assetDirectory, localFileName);
  if (refresh || !existsSync(destination)) {
    const response = await fetch(sourceImageUrl, { headers: { "user-agent": userAgent, accept: image.mime } });
    if (!response.ok) throw new Error(`${source.className}: sprite download returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? "";
    if (contentType !== image.mime) throw new Error(`${source.className}: expected ${image.mime}, received ${contentType || "unknown content type"}.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error(`${source.className}: sprite file was empty.`);
    if (!hasExpectedSignature(bytes, image.mime)) throw new Error(`${source.className}: sprite bytes do not match ${image.mime}.`);
    await writeFile(destination, bytes);
  }
  const bytes = await readFile(destination);
  assets.push({
    id: assetId,
    sourceClassName: source.className,
    sourceFileUrl: `https://fireemblem.fandom.com/wiki/${encodeURIComponent(`File:${source.fileName}`)}`,
    sourceImageUrl,
    localFileName,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    reviewStatus: "accepted",
    rightsNote: "Source-page attribution only. The underlying game map sprite remains the property of its respective copyright holder.",
    ...image,
  });
}

for (const entry of runtime.classes) {
  const source = findSprite(entry, spriteSources);
  if (source) assignments.push({ classId: entry.id, assetId: source.assetId, reviewStatus: "accepted" });
  else console.warn(`${entry.id}: no sprite present on the approved class-list source.`);
}

await writeFile(manifestPath, `${JSON.stringify({ gameId: "fe6", sourcePageUrl, assets, assignments }, null, 2)}\n`, "utf8");
console.log(`Recorded ${assets.length} local FE6 class sprites and ${assignments.length} class assignments.`);

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`Fandom API returned HTTP ${response.status} for ${url}.`);
  const payload = await response.json() as { parse?: { text?: { "*"?: string } } };
  const html = payload.parse?.text?.["*"];
  if (!html) throw new Error("Fandom API did not return the approved class-list markup.");
  return html;
}

function listSprites(html: string): Map<string, SpriteSource> {
  const document = new JSDOM(html).window.document;
  const sprites = new Map<string, SpriteSource>();
  for (const row of document.querySelectorAll("tr")) {
    const cells = row.querySelectorAll("td");
    const className = cells[1]?.textContent?.trim();
    const fileName = row.querySelector<HTMLImageElement>("img[data-image-name]")?.dataset.imageName;
    if (className && fileName) sprites.set(normalizeName(className), { assetId: slug(className), className, fileName });
  }
  return sprites;
}

function findSprite(entry: RuntimeClass, spriteSources: Map<string, SpriteSource>): SpriteSource | undefined {
  const override = genderSpriteOverrides[entry.id];
  if (override) return override;
  return [entry.names.en, ...entry.aliases]
    .map(normalizeName)
    .map((name) => spriteSources.get(name))
    .find((source): source is SpriteSource => Boolean(source));
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

function apiUrl(params: Record<string, string>): string { return `https://fireemblem.fandom.com/api.php?${new URLSearchParams(params).toString()}`; }
function originalImageUrl(value: string): string { const url = new URL(value); url.searchParams.set("format", "original"); return url.toString(); }
function normalizeName(value: string): string { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/\s*\([mf]\)\s*/g, "").replace(/[^a-z0-9]/g, ""); }
function slug(value: string): string { return normalizeName(value).replace(/([a-z])([A-Z])/g, "$1-$2").toLocaleLowerCase(); }
function extensionFor(mime: string, fileName: string): string {
  const fromMime: Record<string, string> = { "image/png": ".png", "image/gif": ".gif", "image/jpeg": ".jpg", "image/webp": ".webp" };
  if (fromMime[mime]) return fromMime[mime];
  const extension = path.extname(fileName).toLowerCase();
  if ([".png", ".gif", ".jpg", ".jpeg", ".webp"].includes(extension)) return extension;
  throw new Error(`Unsupported sprite MIME type ${mime} for ${fileName}.`);
}

function hasExpectedSignature(bytes: Buffer, mime: string): boolean {
  const signatures: Record<string, number[]> = {
    "image/gif": [0x47, 0x49, 0x46],
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/webp": [0x52, 0x49, 0x46, 0x46],
  };
  const expected = signatures[mime];
  return Boolean(expected) && expected.every((value, index) => bytes[index] === value);
}

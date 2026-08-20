import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

type RuntimeEntry = { id: string; names: { en: string } };
type RuntimePayload = { weapons: RuntimeEntry[]; items: RuntimeEntry[] };
type SourceIcon = { name: string; fileName: string };
type ImageInfo = { url: string; mime: string; width: number; height: number };
type ManifestEntry = ImageInfo & {
  id: string;
  kind: "weapon" | "item";
  sourceName: string;
  sourcePageUrl: string;
  sourceFileUrl: string;
  sourceImageUrl: string;
  localFileName: string;
  sha256: string;
  reviewStatus: "accepted";
  rightsNote: string;
};

const sourcePages = {
  weapon: { title: "List of weapons in Fire Emblem: The Binding Blade", url: "https://fireemblem.fandom.com/wiki/List_of_weapons_in_Fire_Emblem:_The_Binding_Blade" },
  item: { title: "List of items in Fire Emblem: The Binding Blade", url: "https://fireemblem.fandom.com/wiki/List_of_items_in_Fire_Emblem:_The_Binding_Blade" },
} as const;
const sourceNameAliases: Record<string, string[]> = {
  armourslayer: ["Armor Slayer"],
  tienas_staff: ["Tina's Staff"],
  speedwings: ["Speedwing"],
  fire_dragonstone: ["Fire Dragon Stone", "Firestone"],
  divine_dragonstone: ["Divine Dragon Stone", "Divinestone"],
};
const userAgent = "FireEmblemBuildHelper data curation (+https://github.com/)";
const assetDirectory = path.join(process.cwd(), "src/games/fe6/assets/weapon_item_icons");
const manifestPath = path.join(process.cwd(), "data/sources/fe6/weapon-item-icons.json");
const runtimePath = path.join(process.cwd(), "data/runtime/fe6/weapons-items.json");
const runtime = JSON.parse(await readFile(runtimePath, "utf8")) as RuntimePayload;
const refresh = process.argv.includes("--refresh");
const sourceIcons = {
  weapon: listIcons(await fetchPageMarkup(sourcePages.weapon.title)),
  item: listIcons(await fetchPageMarkup(sourcePages.item.title)),
};
const entries = [
  ...await downloadEntries("weapon", runtime.weapons),
  ...await downloadEntries("item", runtime.items),
];

await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify({ gameId: "fe6", source: "Fire Emblem Wiki / Fandom", entries }, null, 2)}\n`, "utf8");
console.log(`Recorded ${entries.filter((entry) => entry.kind === "weapon").length} weapon icons and ${entries.filter((entry) => entry.kind === "item").length} item icons.`);

async function downloadEntries(kind: "weapon" | "item", runtimeEntries: RuntimeEntry[]): Promise<ManifestEntry[]> {
  const matches = runtimeEntries.map((entry) => ({ entry, source: findIcon(entry, sourceIcons[kind]) }));
  const missing = matches.filter((match) => !match.source).map((match) => `${match.entry.id} (${match.entry.names.en})`);
  if (missing.length) console.warn(`No ${kind}-list icon was found for: ${missing.join(", ")}.`);

  await mkdir(assetDirectory, { recursive: true });
  return Promise.all(matches.filter((match): match is { entry: RuntimeEntry; source: SourceIcon } => Boolean(match.source)).map(async ({ entry, source: icon }) => {
    const image = await imageInfo(icon.fileName);
    const sourceImageUrl = originalImageUrl(image.url);
    const localFileName = `${kind}-${entry.id}${extensionFor(image.mime, icon.fileName)}`;
    const destination = path.join(assetDirectory, localFileName);
    if (refresh || !existsSync(destination)) {
      const response = await fetch(sourceImageUrl, { headers: { "user-agent": userAgent, accept: image.mime } });
      if (!response.ok) throw new Error(`${entry.id}: download returned HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? "";
      if (contentType !== image.mime) throw new Error(`${entry.id}: expected ${image.mime}, received ${contentType || "unknown content type"}.`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!hasExpectedSignature(bytes, image.mime)) throw new Error(`${entry.id}: icon bytes do not match ${image.mime}.`);
      await writeFile(destination, bytes);
    }
    const bytes = await readFile(destination);
    return {
      id: entry.id,
      kind,
      sourceName: icon.name,
      sourcePageUrl: sourcePages[kind].url,
      sourceFileUrl: `https://fireemblem.fandom.com/wiki/${encodeURIComponent(`File:${icon.fileName}`)}`,
      sourceImageUrl,
      localFileName,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      reviewStatus: "accepted",
      rightsNote: "Source-page attribution only. The underlying game icon remains the property of its respective copyright holder.",
      ...image,
    };
  }));
}

async function fetchPageMarkup(title: string): Promise<string> {
  const response = await fetch(apiUrl({ action: "parse", page: title, prop: "text", format: "json" }), { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`Fandom API returned HTTP ${response.status} for ${title}.`);
  const payload = await response.json() as { parse?: { text?: { "*"?: string } } };
  const html = payload.parse?.text?.["*"];
  if (!html) throw new Error(`${title}: no source markup returned.`);
  return html;
}

function listIcons(html: string): Map<string, SourceIcon> {
  const document = new JSDOM(html).window.document;
  const icons = new Map<string, SourceIcon>();
  for (const row of document.querySelectorAll("tr")) {
    const image = row.querySelector<HTMLImageElement>("img[data-image-name]");
    const fileName = image?.dataset.imageName;
    const imageAnchor = image?.closest("a");
    const name = [...row.querySelectorAll("a")].find((anchor) => anchor !== imageAnchor && Boolean(anchor.textContent?.trim()))?.textContent?.trim();
    if (name && fileName) icons.set(normalizeName(name), { name, fileName });
  }
  return icons;
}

function findIcon(entry: RuntimeEntry, icons: Map<string, SourceIcon>): SourceIcon | undefined {
  const candidates = [entry.names.en, ...(sourceNameAliases[entry.id] ?? [])];
  return candidates.map(normalizeName).map((name) => icons.get(name)).find((icon): icon is SourceIcon => Boolean(icon));
}

async function imageInfo(fileName: string): Promise<ImageInfo> {
  const response = await fetch(apiUrl({ action: "query", titles: `File:${fileName}`, prop: "imageinfo", iiprop: "url|mime|size", format: "json" }), { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`${fileName}: API returned HTTP ${response.status}.`);
  const payload = await response.json() as { query?: { pages?: Record<string, { imageinfo?: Array<Partial<ImageInfo>> }> } };
  const image = Object.values(payload.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!image?.url || !image.mime || !image.width || !image.height) throw new Error(`${fileName}: missing image information.`);
  return image as ImageInfo;
}

function apiUrl(params: Record<string, string>): string { return `https://fireemblem.fandom.com/api.php?${new URLSearchParams(params).toString()}`; }
function originalImageUrl(value: string): string { const url = new URL(value); url.searchParams.set("format", "original"); return url.toString(); }
function normalizeName(value: string): string { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, ""); }
function extensionFor(mime: string, fileName: string): string { const extensions: Record<string, string> = { "image/png": ".png", "image/gif": ".gif", "image/jpeg": ".jpg", "image/webp": ".webp" }; return extensions[mime] ?? path.extname(fileName).toLowerCase(); }
function hasExpectedSignature(bytes: Buffer, mime: string): boolean { const signatures: Record<string, number[]> = { "image/gif": [0x47, 0x49, 0x46], "image/png": [0x89, 0x50, 0x4e, 0x47], "image/jpeg": [0xff, 0xd8, 0xff], "image/webp": [0x52, 0x49, 0x46, 0x46] }; const signature = signatures[mime]; return Boolean(signature) && signature.every((value, index) => bytes[index] === value); }

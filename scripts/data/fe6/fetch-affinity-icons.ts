import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ImageInfo = { url: string; mime: string; width: number; height: number };
type ManifestEntry = ImageInfo & { id: string; sourceFileUrl: string; localFileName: string; sha256: string; reviewStatus: "accepted" };

const sourcePageUrl = "https://fireemblem.fandom.com/wiki/Affinity#Support_Rank:_C";
const userAgent = "FireEmblemBuildHelper data curation (+https://github.com/)";
const assets = [
  ["fire", "GBAFire.gif"], ["thunder", "GBAThunder.gif"], ["wind", "GBAWind.gif"], ["ice", "GBAIce.gif"],
  ["dark", "GBADark.gif"], ["anima", "GBAAnima.gif"], ["light", "GBALight.gif"],
] as const;
const assetDirectory = path.join(process.cwd(), "src/games/fe6/assets/affinities");
const manifestPath = path.join(process.cwd(), "data/sources/fe6/affinity-icons.json");
const entries: ManifestEntry[] = [];

await mkdir(assetDirectory, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

for (const [id, sourceFileName] of assets) {
  const image = await imageInfo(sourceFileName);
  if (image.mime !== "image/gif") throw new Error(`${id}: expected GIF icon, received ${image.mime}.`);
  const localFileName = `${id}.gif`;
  const response = await fetch(image.url, { headers: { "user-agent": userAgent, accept: "image/gif" } });
  if (!response.ok) throw new Error(`${id}: download returned HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`${id}: icon file was empty.`);
  await writeFile(path.join(assetDirectory, localFileName), bytes);
  entries.push({
    id,
    sourceFileUrl: `https://fireemblem.fandom.com/wiki/${encodeURIComponent(`File:${sourceFileName}`)}`,
    localFileName,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    reviewStatus: "accepted",
    ...image,
  });
  console.log(`${id}: ${sourceFileName} -> ${localFileName}`);
}

await writeFile(manifestPath, `${JSON.stringify({ gameId: "fe6", sourcePageUrl, entries }, null, 2)}\n`, "utf8");

async function imageInfo(fileName: string): Promise<ImageInfo> {
  const response = await fetch(`https://fireemblem.fandom.com/api.php?${new URLSearchParams({ action: "query", titles: `File:${fileName}`, prop: "imageinfo", iiprop: "url|mime|size", format: "json" })}`, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!response.ok) throw new Error(`${fileName}: API returned HTTP ${response.status}.`);
  const payload = await response.json() as { query?: { pages?: Record<string, { imageinfo?: Array<Partial<ImageInfo>> }> } };
  const image = Object.values(payload.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!image?.url || !image.mime || !image.width || !image.height) throw new Error(`${fileName}: missing image information.`);
  return image as ImageInfo;
}

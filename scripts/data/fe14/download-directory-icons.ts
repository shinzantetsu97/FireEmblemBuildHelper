import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type DirectoryRecord = { iconSource: { imageUrl?: string } };
type DirectoryFile = { weapons?: DirectoryRecord[]; items?: DirectoryRecord[] };

const outputDirectory = path.resolve("src/games/fe14/assets/directory_icons");
const sourceFiles = ["data/normalized/fe14/weapons.json", "data/normalized/fe14/items.json"];
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function assetName(sourceUrl: string): string {
  const fileName = new URL(sourceUrl).pathname.split("/").at(-1)?.toLowerCase();
  if (!fileName?.match(/^is_fe14_[a-z0-9_]+\.png$/)) {
    throw new Error(`Unexpected directory icon URL: ${sourceUrl}`);
  }
  return fileName;
}

async function readIconUrls(sourceFile: string): Promise<string[]> {
  const file = JSON.parse(await readFile(sourceFile, "utf8")) as DirectoryFile;
  return [...(file.weapons ?? []), ...(file.items ?? [])]
    .map((record) => record.iconSource.imageUrl)
    .filter((url): url is string => Boolean(url));
}

const sourceUrls = [...new Set((await Promise.all(sourceFiles.map(readIconUrls))).flat())].sort();
await mkdir(outputDirectory, { recursive: true });

for (const sourceUrl of sourceUrls) {
  const response = await fetch(sourceUrl, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Failed to download ${sourceUrl}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.subarray(0, pngSignature.length).equals(pngSignature)) throw new Error(`Directory icon is not a PNG: ${sourceUrl}`);
  await writeFile(path.join(outputDirectory, assetName(sourceUrl)), bytes);
}

console.log(`Downloaded ${sourceUrls.length} directory icons.`);

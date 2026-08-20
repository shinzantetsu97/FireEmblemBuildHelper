import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { FE6_SOURCES } from "./source-manifest";

const rawRoot = path.join(process.cwd(), "data/raw/fe6/serenes");
const refresh = process.argv.includes("--refresh");

function canonicalSnapshot(html: string): string {
  return html.replace(/\r\n/g, "\n");
}

type ManifestEntry = {
  sourceId: string;
  url: string;
  relativePath: string;
  retrievedAt: string;
  status: number;
  bytes: number;
  sha256: string;
  acquisition: "automated_fetch";
};

const manifestPath = path.join(rawRoot, "manifest.json");
const previous = existsSync(manifestPath)
  ? JSON.parse(await readFile(manifestPath, "utf8")) as { entries: ManifestEntry[] }
  : { entries: [] };
const previousById = new Map(previous.entries.map((entry) => [entry.sourceId, entry]));
const entries: ManifestEntry[] = [];

for (const source of FE6_SOURCES) {
  const destination = path.join(rawRoot, source.relativePath);
  if (!refresh && existsSync(destination)) {
    const existing = previousById.get(source.id);
    if (!existing) throw new Error(`Snapshot ${source.relativePath} exists without a manifest entry.`);
    entries.push(existing);
    console.log(`Reused ${source.relativePath}`);
    continue;
  }

  const response = await fetch(source.url, {
    headers: {
      "user-agent": "FireEmblemBuildHelper data curation (+https://github.com/)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  const html = canonicalSnapshot(await response.text());
  if (!response.ok) throw new Error(`${source.id} returned HTTP ${response.status}.`);
  if (/just a moment|request is being verified|cf-chl-/i.test(html)) {
    throw new Error(`${source.id} returned a verification page; existing snapshots were not replaced.`);
  }
  if (!html.includes(source.expectedHeading)) {
    throw new Error(`${source.id} is missing expected heading ${source.expectedHeading}.`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, html, "utf8");
  const bytes = Buffer.byteLength(html, "utf8");
  entries.push({
    sourceId: source.id,
    url: source.url,
    relativePath: source.relativePath.replaceAll("\\", "/"),
    retrievedAt: new Date().toISOString(),
    status: response.status,
    bytes,
    sha256: createHash("sha256").update(html, "utf8").digest("hex"),
    acquisition: "automated_fetch",
  });
  console.log(`Fetched ${source.relativePath} (${bytes} bytes)`);
}

await mkdir(rawRoot, { recursive: true });
await writeFile(
  manifestPath,
  `${JSON.stringify({ gameId: "fe6", source: "Serenes Forest", entries }, null, 2)}\n`,
  "utf8",
);

console.log(`Recorded ${entries.length} FE6 source snapshots.`);

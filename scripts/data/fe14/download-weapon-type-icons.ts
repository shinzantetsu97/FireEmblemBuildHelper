import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MANIFEST_PATH = path.resolve(
  "data/sources/fe14/weapon-icon-sources.json",
);
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type ManifestEntry = {
  weaponTypeId: string;
  sourceImageUrl: string;
  localDestination: string;
};

type Manifest = {
  entries: ManifestEntry[];
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isPng(bytes: Buffer): boolean {
  return (
    bytes.length > PNG_SIGNATURE.length &&
    bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  );
}

async function fetchIcon(entry: ManifestEntry): Promise<Buffer> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(entry.sourceImageUrl, {
        headers: { "user-agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!isPng(bytes)) throw new Error("Response is not a PNG.");
      return bytes;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await delay(attempt * 500);
    }
  }

  throw new Error(
    `Failed to download ${entry.weaponTypeId} from ${entry.sourceImageUrl}: ${String(lastError)}`,
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as Manifest;
const downloads = await mapWithConcurrency(
  manifest.entries,
  CONCURRENCY,
  async (entry) => ({ entry, bytes: await fetchIcon(entry) }),
);

for (const { entry } of downloads) {
  const destination = path.resolve(entry.localDestination);
  const relativeDestination = path.relative(process.cwd(), destination);
  if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
    throw new Error(`Refusing to write outside the workspace: ${destination}`);
  }
}

for (const { entry, bytes } of downloads) {
  const destination = path.resolve(entry.localDestination);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

const totalBytes = downloads.reduce((total, download) => total + download.bytes.length, 0);
console.log(`Downloaded ${downloads.length} weapon-type icons (${totalBytes} bytes).`);

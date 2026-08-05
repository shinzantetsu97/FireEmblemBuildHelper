const directoryIconModules = import.meta.glob<string>(
  "./assets/directory_icons/*.png",
  { eager: true, import: "default", query: "?url" },
);

export function getDirectoryIconUrl(sourceImageUrl: string | undefined): string {
  const assetName = sourceImageUrl ? new URL(sourceImageUrl).pathname.split("/").at(-1)?.toLowerCase() : undefined;
  if (!assetName) throw new Error("Missing FE14 directory icon source URL.");

  const assetUrl = directoryIconModules[`./assets/directory_icons/${assetName}`];
  if (!assetUrl) throw new Error(`Missing FE14 directory icon asset: ${assetName}`);
  return assetUrl;
}

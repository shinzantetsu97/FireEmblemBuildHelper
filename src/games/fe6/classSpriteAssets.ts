import classSpriteManifest from "../../../data/sources/fe6/class-sprites.json";

const assets = import.meta.glob("./assets/class_sprites/*.{png,gif,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

type ClassSpriteManifest = {
  assets: Array<{ id: string; localFileName: string }>;
  assignments: Array<{ classId: string; assetId: string }>;
};

const manifest = classSpriteManifest as ClassSpriteManifest;

export function getFe6ClassSpriteUrl(classId: string): string | undefined {
  const assetId = manifest.assignments.find((assignment) => assignment.classId === classId)?.assetId;
  const fileName = manifest.assets.find((asset) => asset.id === assetId)?.localFileName;
  return fileName ? assets[`./assets/class_sprites/${fileName}`] : undefined;
}

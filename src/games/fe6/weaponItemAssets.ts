import weaponItemIconManifest from "../../../data/sources/fe6/weapon-item-icons.json";

const assets = import.meta.glob("./assets/weapon_item_icons/*.{png,gif,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

type WeaponItemIconManifest = {
  entries: Array<{ id: string; kind: "weapon" | "item"; localFileName: string }>;
};

const manifest = weaponItemIconManifest as WeaponItemIconManifest;

export function getFe6WeaponItemIconUrl(kind: "weapon" | "item", id: string): string | undefined {
  const fileName = manifest.entries.find((entry) => entry.kind === kind && entry.id === id)?.localFileName;
  return fileName ? assets[`./assets/weapon_item_icons/${fileName}`] : undefined;
}

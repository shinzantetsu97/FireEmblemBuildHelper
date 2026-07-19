const weaponTypeIconModules = import.meta.glob<string>(
  "./assets/weapon_type_icons/*.png",
  { eager: true, import: "default", query: "?url" },
);

export function getWeaponTypeIconUrl(assetId: string): string {
  const assetPath = `./assets/weapon_type_icons/${assetId}.png`;
  const assetUrl = weaponTypeIconModules[assetPath];

  if (!assetUrl) {
    throw new Error(`Missing FE14 weapon-type icon asset: ${assetId}`);
  }

  return assetUrl;
}

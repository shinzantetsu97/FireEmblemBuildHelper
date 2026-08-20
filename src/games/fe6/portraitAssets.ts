const assets = import.meta.glob("./assets/character_portraits/*.{png,gif,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export function getFe6PortraitUrl(unitId: string): string | undefined {
  return Object.entries(assets).find(([path]) => new RegExp(`/` + escapeRegExp(unitId) + "\\.(png|gif|jpe?g|webp)$", "i").test(path))?.[1];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

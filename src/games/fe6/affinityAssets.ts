const assets = import.meta.glob("./assets/affinities/*.gif", { eager: true, import: "default" }) as Record<string, string>;

export function getFe6AffinityIconUrl(affinityId: string): string | undefined {
  return assets[`./assets/affinities/${affinityId}.gif`];
}

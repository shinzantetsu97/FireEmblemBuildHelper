import { describe, expect, it } from "vitest";
import { fe14Data } from "./data";
import { getWeaponTypeIconUrl } from "./weaponAssets";

describe("FE14 weapon-type assets", () => {
  it("resolves every canonical weapon type to a local PNG", () => {
    expect(fe14Data.weaponTypes).toHaveLength(9);
    expect(fe14Data.weaponTypes.map((weaponType) => weaponType.id)).toEqual([
      "sword",
      "lance",
      "axe",
      "dagger",
      "bow",
      "tome",
      "staff",
      "dragonstone",
      "beaststone",
    ]);

    for (const weaponType of fe14Data.weaponTypes) {
      expect(getWeaponTypeIconUrl(weaponType.iconAssetId)).toContain(
        `/weapon_type_icons/${weaponType.iconAssetId}.png`,
      );
    }
  });

  it("fails loudly for an unknown asset ID", () => {
    expect(() => getWeaponTypeIconUrl("missing_weapon")).toThrow(
      "Missing FE14 weapon-type icon asset: missing_weapon",
    );
  });
});

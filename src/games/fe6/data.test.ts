import { describe, expect, it } from "vitest";
import {
  fe6Classes,
  fe6Items,
  fe6Units,
  fe6Weapons,
  calculateFe6SupportAffinityBonuses,
  findFe6ClassBySlug,
  findFe6UnitBySlug,
  formatAffinityHalfUnits,
  formatFe6Join,
  matchesFe6UnitSearch,
} from "./data";
import { getFe6PortraitUrl } from "./portraitAssets";
import { getFe6ClassSpriteUrl } from "./classSpriteAssets";

describe("FE6 runtime adapter", () => {
  it("exposes the checked-in curated runtime collections in canonical order", () => {
    expect(fe6Units).toHaveLength(54);
    expect(fe6Classes).toHaveLength(67);
    expect(fe6Weapons).toHaveLength(93);
    expect(fe6Items).toHaveLength(34);
    expect(fe6Units.map((unit) => unit.displayOrder)).toEqual([...Array(54)].map((_, index) => index + 1));
  });

  it("provides Simplified Chinese names and effects for every inventory record", () => {
    for (const weapon of fe6Weapons) {
      expect(weapon.names.zhHans, `${weapon.id} Simplified Chinese name`).toBeTruthy();
      if (weapon.effect) {
        expect(weapon.effectZhHans, `${weapon.id} Simplified Chinese effect`).toBeTruthy();
      }
    }

    for (const item of fe6Items) {
      expect(item.names.zhHans, `${item.id} Simplified Chinese name`).toBeTruthy();
      if (item.effect) {
        expect(item.effectZhHans, `${item.id} Simplified Chinese effect`).toBeTruthy();
      }
    }
  });

  it("resolves every story unit through a local portrait asset", () => {
    for (const unit of fe6Units) {
      expect(getFe6PortraitUrl(unit.id), unit.id).toContain(`/character_portraits/${unit.id}.`);
      expect(unit.names.zhHans, `${unit.id} Simplified Chinese name`).toBeTruthy();
    }
    expect(findFe6UnitBySlug("roy")?.names.zhHans).toBe("罗伊");
    expect(findFe6UnitBySlug("fae")?.names.zhHans).toBe("珐");
    expect(findFe6UnitBySlug("niime")?.characterProfile.startingClassId).toBe("druid_f");
  });

  it("uses the dedicated local sprites for the female Manakete and Divine Dragon", () => {
    expect(getFe6ClassSpriteUrl("manakete_f")).toContain("/class_sprites/manakete-f.webp");
    expect(getFe6ClassSpriteUrl("divine_dragon")).toContain("/class_sprites/divine-dragon.webp");
  });

  it("places the female Manakete and Divine Dragon directly after Valkyrie", () => {
    expect(fe6Classes.slice(56, 61).map((entry) => entry.id)).toEqual([
      "valkyrie",
      "manakete_f",
      "divine_dragon",
      "manakete_m",
      "fire_dragon",
    ]);
  });

  it("preserves aliases and exact affinity half-unit formatting", () => {
    expect(matchesFe6UnitSearch(findFe6UnitBySlug("thea")!, "Thite")).toBe(true);
    expect(matchesFe6UnitSearch(findFe6UnitBySlug("wade")!, "Ward")).toBe(true);
    expect(formatAffinityHalfUnits(1)).toBe("+0.5");
    expect(formatAffinityHalfUnits(5)).toBe("+2.5");
    expect(findFe6ClassBySlug("master_lord")?.names.en).toBe("Master Lord");
  });

  it("formats Chinese recruitment chapters with route labels before the chapter number", () => {
    expect(formatFe6Join(findFe6UnitBySlug("roy")!.characterProfile.recruitment, "zhHans")).toBe("第1章");
    expect(formatFe6Join(findFe6UnitBySlug("gonzalez")!.characterProfile.recruitment, "zhHans")).toBe("A线第10章 / B线第10章");
    expect(formatFe6Join(findFe6UnitBySlug("gonzalez")!.characterProfile.recruitment)).toBe("Ch. 10A / Ch. 10B");
  });

  it("combines both affinity contributions and scales them by C, B, and A rank", () => {
    const roy = findFe6UnitBySlug("roy")!;
    const alen = findFe6UnitBySlug("alen")!;
    const c = calculateFe6SupportAffinityBonuses(roy, alen, "C");
    const b = calculateFe6SupportAffinityBonuses(roy, alen, "B");
    const a = calculateFe6SupportAffinityBonuses(roy, alen, "A");
    expect(b.attack).toBe(c.attack * 2);
    expect(a.attack).toBe(c.attack * 3);
    expect(a.accuracy).toBe(c.accuracy * 3);
  });
});

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
  matchesFe6UnitSearch,
} from "./data";
import { getFe6PortraitUrl } from "./portraitAssets";

describe("FE6 runtime adapter", () => {
  it("exposes the checked-in curated runtime collections in canonical order", () => {
    expect(fe6Units).toHaveLength(54);
    expect(fe6Classes).toHaveLength(67);
    expect(fe6Weapons).toHaveLength(93);
    expect(fe6Items).toHaveLength(34);
    expect(fe6Units.map((unit) => unit.displayOrder)).toEqual([...Array(54)].map((_, index) => index + 1));
  });

  it("resolves every story unit through a local portrait asset", () => {
    for (const unit of fe6Units) {
      expect(getFe6PortraitUrl(unit.id), unit.id).toContain(`/character_portraits/${unit.id}.`);
    }
  });

  it("preserves aliases and exact affinity half-unit formatting", () => {
    expect(matchesFe6UnitSearch(findFe6UnitBySlug("thea")!, "Thite")).toBe(true);
    expect(matchesFe6UnitSearch(findFe6UnitBySlug("wade")!, "Ward")).toBe(true);
    expect(formatAffinityHalfUnits(1)).toBe("+0.5");
    expect(formatAffinityHalfUnits(5)).toBe("+2.5");
    expect(findFe6ClassBySlug("master_lord")?.names.en).toBe("Master Lord");
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

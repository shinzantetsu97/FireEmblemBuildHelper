import { describe, expect, it } from "vitest";
import { fe14Data, type StatBlock } from "./data";

const STAT_KEYS: Array<keyof StatBlock> = [
  "hp",
  "strength",
  "magic",
  "skill",
  "speed",
  "luck",
  "defense",
  "resistance",
];

describe("FE14 normalized class growths", () => {
  it("covers all 55 standard playable classes with valid eight-stat vectors", () => {
    expect(fe14Data.classStats).toHaveLength(55);

    for (const profile of fe14Data.classStats) {
      expect(Object.keys(profile.growthRates)).toEqual(STAT_KEYS);
      for (const value of Object.values(profile.growthRates)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(value % 5).toBe(0);
      }
    }
  });

  it("preserves shared source rows without splitting mechanical profiles", () => {
    const byId = new Map(fe14Data.classStats.map((profile) => [profile.classId, profile]));

    expect(byId.get("monk")?.growthRates).toEqual(byId.get("shrine_maiden")?.growthRates);
    expect(byId.get("attendant")?.growthRates).toEqual({
      hp: 0,
      strength: 10,
      magic: 10,
      skill: 15,
      speed: 15,
      luck: 10,
      defense: 5,
      resistance: 10,
    });
  });

  it("keeps child recruitment records free of copied class-growth vectors", () => {
    for (const unit of fe14Data.units.filter((entry) => entry.offspring)) {
      const recruitment = unit.offspring!.recruitment as unknown as Record<string, unknown>;
      expect(recruitment).not.toHaveProperty("startingClassGrowthRates");
      const offspringSeal = recruitment.offspringSeal as {
        promotionOptions: Array<Record<string, unknown>>;
      };
      for (const option of offspringSeal.promotionOptions) {
        expect(option).not.toHaveProperty("classGrowthRates");
      }
    }
  });
});

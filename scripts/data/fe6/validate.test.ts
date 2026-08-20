import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateFe6Data } from "./validate";

async function readJson(relativePath: string): Promise<any> {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), "utf8"));
}

describe("FE6 curated data", () => {
  it("passes schema, provenance, hash, completeness, and relationship validation", async () => {
    const result = await validateFe6Data();
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("uses Heroes-adjusted display names while retaining source aliases and Japanese names", async () => {
    const { units } = await readJson("data/normalized/fe6/units.json");
    const alen = units.find((unit: any) => unit.id === "alen");
    const melady = units.find((unit: any) => unit.id === "melady");
    const thea = units.find((unit: any) => unit.id === "thea");

    expect(alen.names).toMatchObject({ en: "Alen", ja: "アレン", fan: "Alan" });
    expect(alen.aliases).toContain("Allen");
    expect(melady.names.en).toBe("Melady");
    expect(melady.aliases).toContain("Miredy");
    expect(thea).toMatchObject({ gender: "female", names: { en: "Thea", ja: "ティト" } });
    expect(thea.aliases).toEqual(expect.arrayContaining(["Thite", "Tate"]));
  });

  it("generates the requested unit profile and flat support-list contract", async () => {
    const { units } = await readJson("data/runtime/fe6/units.json");
    const roy = units.find((unit: any) => unit.id === "roy");
    const marcus = units.find((unit: any) => unit.id === "marcus");
    const merlinus = units.find((unit: any) => unit.id === "merlinus");

    expect(roy.characterProfile).toMatchObject({
      startingClassId: "lord",
      startingLevel: 1,
      promotedClassId: "master_lord",
    });
    expect(roy.characterProfile.baseStats.stats.hp).toBe(18);
    expect(roy.characterProfile.growths.hp).toBe(80);
    expect(roy.characterProfile.weaponLevels).toEqual({ sword: "D" });
    expect(roy.characterProfile.affinity.id).toBe("fire");
    expect(roy.supports).toHaveLength(10);
    expect(marcus.characterProfile.baseClassIds).toEqual(["cavalier_m"]);
    expect(merlinus.characterProfile.promotedClassCap).toBeNull();
    expect(merlinus.supports).toEqual([]);
  });

  it("keeps classes skill-free and disambiguates the Torch staff from the Torch item", async () => {
    const [{ classes }, inventory] = await Promise.all([
      readJson("data/runtime/fe6/classes.json"),
      readJson("data/runtime/fe6/weapons-items.json"),
    ]);

    expect(classes.every((entry: any) => !("skills" in entry))).toBe(true);
    expect(classes.find((entry: any) => entry.id === "thief_m").promotion).toBeNull();
    expect(inventory.weapons.some((entry: any) => entry.id === "torch_staff")).toBe(true);
    expect(inventory.items.some((entry: any) => entry.id === "torch")).toBe(true);
  });
});

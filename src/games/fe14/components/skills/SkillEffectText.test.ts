import { describe, expect, it } from "vitest";
import { splitEnglishSkillText, splitZhHansSkillText } from "./SkillEffectText";

describe("splitEnglishSkillText", () => {
  it("emphasizes stat terms, values, and tile ranges", () => {
    const parts = splitEnglishSkillText("When not at full HP, grants Damage Dealt +4, Crit +20 to allies within 2 tiles.");

    expect(parts.filter((part) => part.emphasized).map((part) => part.text)).toEqual([
      "not at full HP",
      "Damage Dealt +4",
      "Crit +20",
      "within 2 tiles",
    ]);
  });

  it("emphasizes commands and numeric requirements", () => {
    const parts = splitEnglishSkillText("Can use the Capture command with a name of at least 12 characters.");

    expect(parts.filter((part) => part.emphasized).map((part) => part.text)).toEqual([
      "Capture command",
      "at least 12 characters",
    ]);
  });

  it("does not treat the end of Dragonstone as the written number one", () => {
    const parts = splitEnglishSkillText("When equipped with a Dragonstone, restores 15% of maximum HP.");

    expect(parts.filter((part) => part.emphasized).map((part) => part.text)).toEqual([
      "15%",
      "maximum HP",
    ]);
  });

  it("emphasizes Chinese stat terms, thresholds, numbers, and ranges", () => {
    const parts = splitZhHansSkillText("攻击HP未满的敌方时，造成的伤害+4，周围2格内的敌方必杀回避-15");

    expect(parts.filter((part) => part.emphasized).map((part) => part.text)).toEqual([
      "HP未满",
      "造成的伤害+4",
      "周围2格内",
      "必杀回避-15",
    ]);
  });
});

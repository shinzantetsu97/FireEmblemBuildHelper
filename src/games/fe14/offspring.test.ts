import { describe, expect, it } from "vitest";
import { fe14Data } from "./data";
import { calculateOffspringRecruitmentStat, resolveOffspringScenario, roundHalfUp } from "./offspring";

describe("Dwyer offspring scenarios", () => {
  const dwyer = fe14Data.units.find((unit) => unit.identity.id === "dwyer")!;

  it("inherits Corrin's Noble line rather than the Avatar Talent", () => {
    const corrin = fe14Data.units.find((unit) => unit.identity.id === "corrin")!;
    const boon = corrin.avatarConfiguration!.boons.find((choice) => choice.id === "robust")!;
    const bane = corrin.avatarConfiguration!.banes.find((choice) => choice.id === "weak")!;
    const scenario = resolveOffspringScenario(dwyer, "corrin", boon, bane);

    expect(scenario?.inheritedClassId).toBe("nohr_prince");
    expect(scenario?.siblingUnitId).toBe("kana");
    expect(scenario?.unitTags).toContain("dragon");
  });

  it("does not add the Dragon trait when Corrin is not Dwyer's parent", () => {
    expect(resolveOffspringScenario(dwyer, "felicia")?.unitTags).not.toContain("dragon");
  });

  it("averages Dwyer's child-base growth with the selected mother's personal growth", () => {
    const scenario = resolveOffspringScenario(dwyer, "felicia");
    expect(scenario?.personalGrowth.hp).toBe(42.5);
    expect(scenario?.inheritedClassId).toBe("mercenary");
  });

  it("subtracts promoted aptitude from both parents before applying the inheritance cap", () => {
    const result = calculateOffspringRecruitmentStat({
      childAptitude: 12,
      promotedClassAptitude: 2,
      fatherCurrentStat: 24,
      motherCurrentStat: 22,
      currentClassBase: 5,
    });

    expect(result).toEqual({
      fatherSurplus: 10,
      motherSurplus: 8,
      quarteredSurplus: 4,
      inheritanceCap: 3,
      inheritanceBonus: 3,
      finalStat: 22,
    });
  });

  it("rounds exact promoted-class aptitude halves up", () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.49)).toBe(1);
  });
});

describe("map-level autoleveling", () => {
  it("uses internal level 10 and the verified Chapter 19-27 map levels for every offspring", () => {
    for (const unit of fe14Data.units.filter((candidate) => candidate.offspring)) {
      const scaling = unit.offspring!.recruitment.mapLevelScaling;

      expect(scaling.internalLevel, unit.identity.id).toBe(10);
      expect(scaling.knownMapLevelsByChapter["19"], unit.identity.id).toBe(22);
      expect(scaling.knownMapLevelsByChapter["27"], unit.identity.id).toBe(38);
      expect(scaling.promotedInternalLevelOffset, unit.identity.id).toBe(20);
    }
  });

  it("records the map-level thresholds for all four castle recruits", () => {
    const expected = {
      flora: { internalLevel: 28, chapter25Level: 11 },
      izana: { internalLevel: 28, chapter25Level: 11 },
      yukimura: { internalLevel: 33, chapter25Level: 11 },
      fuga: { internalLevel: 33, chapter25Level: 11 },
    } as const;

    for (const [unitId, values] of Object.entries(expected)) {
      const unit = fe14Data.units.find((candidate) => candidate.identity.id === unitId)!;

      expect(unit.availability.length, unitId).toBeGreaterThan(0);
      for (const scenario of unit.availability) {
        expect(scenario.autoLevel?.basis, scenario.id).toBe("map_level");
        expect(scenario.autoLevel?.internalLevel, scenario.id).toBe(values.internalLevel);
      }
      const chapter25 = unit.availability
        .flatMap((scenario) => scenario.autoLevel?.milestones ?? [])
        .find((milestone) => milestone.displayedChapterStart === 25);
      expect(chapter25, unitId).toMatchObject({ mapLevel: 34, level: values.chapter25Level });
    }
  });

  it("keeps Yukimura and Fuga at level 10 until map level exceeds 33", () => {
    for (const unitId of ["yukimura", "fuga"]) {
      const unit = fe14Data.units.find((candidate) => candidate.identity.id === unitId)!;
      const milestones = unit.availability[0].autoLevel!.milestones;

      expect(milestones.find((milestone) => milestone.displayedChapterStart === 24), unitId)
        .toMatchObject({ mapLevel: 32, level: 10 });
      expect(milestones.find((milestone) => milestone.displayedChapterStart === 26), unitId)
        .toMatchObject({ mapLevel: 36, level: 13 });
    }
  });
});

describe("Shigure father scenarios", () => {
  const shigure = fe14Data.units.find((unit) => unit.identity.id === "shigure")!;

  it("offers all 20 valid fathers and identifies the variable role correctly", () => {
    expect(shigure.offspring?.parentage.variableParentRole).toBe("father");
    expect(shigure.offspring?.parentage.variableParentOptions).toHaveLength(20);
  });

  it("uses the selected father's growth while keeping Azura as Shigure's mother", () => {
    const jakob = fe14Data.units.find((unit) => unit.identity.id === "jakob")!;
    const scenario = resolveOffspringScenario(shigure, "jakob")!;

    expect(scenario.father.identity.id).toBe("jakob");
    expect(scenario.mother.identity.id).toBe("azura");
    expect(scenario.personalGrowth.hp).toBe((35 + jakob.growths[0].rates.hp) / 2);
  });

  it("resolves Jakob's collision to Troubadour from Jakob and Wyvern Rider from Azura", () => {
    const scenario = resolveOffspringScenario(shigure, "jakob")!;

    expect(scenario.inheritedClassId).toBe("troubadour");
    expect(scenario.fixedInheritedClassId).toBe("wyvern_rider");
    expect(scenario.siblingUnitId).toBe("dwyer");
  });

  it("derives stance ranks from the actual father and mother rather than their selection roles", () => {
    const jakob = fe14Data.units.find((unit) => unit.identity.id === "jakob")!;
    const azura = fe14Data.units.find((unit) => unit.identity.id === "azura")!;
    const scenario = resolveOffspringScenario(shigure, "jakob")!;

    expect(scenario.bonuses.attackStance.rankDeltas.C).toEqual(azura.pairupBonuses!.attackStance.rankDeltas.C);
    expect(scenario.bonuses.attackStance.rankDeltas.B).toEqual(jakob.pairupBonuses!.attackStance.rankDeltas.B);
    expect(scenario.bonuses.guardStance.rankDeltas.C).toEqual(jakob.pairupBonuses!.guardStance.rankDeltas.C);
    expect(scenario.bonuses.guardStance.rankDeltas.B).toEqual(azura.pairupBonuses!.guardStance.rankDeltas.B);
  });

  it("resolves Corrin's configured stance bonuses when Corrin is the selected father", () => {
    const corrin = fe14Data.units.find((unit) => unit.identity.id === "corrin")!;
    const config = corrin.avatarConfiguration!;
    const boon = config.boons.find((choice) => choice.id === "robust")!;
    const bane = config.banes.find((choice) => choice.id === "weak")!;
    const expectedAttack = config.pairupRule.attackStance.variants.find(
      (variant) => variant.boonIds.includes(boon.id) && variant.baneIds.includes(bane.id),
    )!;
    const expectedGuard = config.pairupRule.guardStance.variants.find(
      (variant) => variant.boonId === boon.id && variant.baneId === bane.id,
    )!;
    const scenario = resolveOffspringScenario(shigure, "corrin", boon, bane)!;

    expect(scenario.bonuses.attackStance.rankDeltas.B).toEqual(expectedAttack.rankDeltas.B);
    expect(scenario.bonuses.attackStance.rankDeltas.S).toEqual(expectedAttack.rankDeltas.S);
    expect(scenario.bonuses.guardStance.rankDeltas.C).toEqual(expectedGuard.rankDeltas.C);
    expect(scenario.bonuses.guardStance.rankDeltas.A).toEqual(expectedGuard.rankDeltas.A);
  });

  it("inherits parent-dependent traits and the selected father's linked offspring as a sibling", () => {
    expect(resolveOffspringScenario(shigure, "corrin")?.unitTags).toContain("dragon");
    expect(resolveOffspringScenario(shigure, "kaden")?.unitTags).toContain("beast");
    expect(resolveOffspringScenario(shigure, "keaton")?.unitTags).toContain("beast");
    expect(resolveOffspringScenario(shigure, "xander")?.siblingUnitId).toBe("siegbert");
  });

  it("keeps Hisame and Forrest as Shigure's only fixed A+ supports", () => {
    const friendships = shigure.offspring!.parentage.supports
      .filter((support) => support.kind === "friendship")
      .map((support) => support.partnerUnitId);

    expect(friendships).toEqual(["hisame", "forrest"]);
  });
});

describe("exhaustive offspring class collisions", () => {
  it("resolves the three parallel-tree inheritance exceptions", () => {
    const shigure = fe14Data.units.find((unit) => unit.identity.id === "shigure")!;
    const nina = fe14Data.units.find((unit) => unit.identity.id === "nina")!;
    const percy = fe14Data.units.find((unit) => unit.identity.id === "percy")!;

    expect(resolveOffspringScenario(shigure, "jakob")).toMatchObject({
      inheritedClassId: "troubadour",
      fixedInheritedClassId: "wyvern_rider",
    });
    expect(resolveOffspringScenario(nina, "nyx")).toMatchObject({
      fixedInheritedClassId: "dark_mage",
      inheritedClassId: "diviner",
    });
    expect(resolveOffspringScenario(percy, "beruka")).toMatchObject({
      fixedInheritedClassId: "fighter",
      inheritedClassId: "sky_knight",
    });
  });
});

describe("Kana avatar-child scenarios", () => {
  const kana = fe14Data.units.find((unit) => unit.identity.id === "kana")!;
  const corrin = fe14Data.units.find((unit) => unit.identity.id === "corrin")!;
  const boon = corrin.avatarConfiguration!.boons.find((choice) => choice.id === "robust")!;
  const bane = corrin.avatarConfiguration!.banes.find((choice) => choice.id === "weak")!;

  it("offers every opposite-gender first-generation and offspring spouse", () => {
    const options = kana.offspring!.parentage.variableParentOptions;
    expect(options).toHaveLength(67);
    expect(options.filter((option) => option.parentGeneration === "first")).toHaveLength(47);
    expect(options.filter((option) => option.parentGeneration === "second")).toHaveLength(20);
  });

  it("derives Kana's gender and actual parent roles from Corrin's spouse", () => {
    const femaleKana = resolveOffspringScenario(kana, "azura", boon, bane, { corrinTalentId: "cavalier" })!;
    const maleKana = resolveOffspringScenario(kana, "silas", boon, bane, { corrinTalentId: "cavalier" })!;

    expect(femaleKana.childGender).toBe("female");
    expect(femaleKana.father.identity.id).toBe("corrin");
    expect(femaleKana.mother.identity.id).toBe("azura");
    expect(maleKana.childGender).toBe("male");
    expect(maleKana.father.identity.id).toBe("silas");
    expect(maleKana.mother.identity.id).toBe("corrin");
  });

  it("applies father-before-mother class inheritance and can exhaust a Talent with no parallel class", () => {
    const femaleKana = resolveOffspringScenario(kana, "azura", boon, bane, { corrinTalentId: "cavalier" })!;
    const maleKana = resolveOffspringScenario(kana, "jakob", boon, bane, { corrinTalentId: "troubadour" })!;

    expect(femaleKana.fixedInheritedClassId).toBe("cavalier");
    expect(femaleKana.inheritedClassId).toBe("sky_knight");
    expect(maleKana.inheritedClassId).toBe("troubadour");
    expect(maleKana.fixedInheritedClassId).toBeNull();
  });

  it("uses the duplicated Talent's parallel class instead of backtracking the father", () => {
    const scenario = resolveOffspringScenario(kana, "silas", boon, bane, { corrinTalentId: "cavalier" })!;

    expect(scenario.inheritedClassId).toBe("cavalier");
    expect(scenario.fixedInheritedClassId).toBe("ninja");
  });

  it("recursively resolves an offspring spouse through the selected grandparent", () => {
    const sophie = fe14Data.units.find((unit) => unit.identity.id === "sophie")!;
    const sophieScenario = resolveOffspringScenario(sophie, "felicia")!;
    const kanaScenario = resolveOffspringScenario(kana, "sophie", boon, bane, {
      corrinTalentId: "cavalier",
      nestedVariableParentId: "felicia",
    })!;

    expect(kanaScenario.nestedVariableParentScenario?.variableParent.identity.id).toBe("felicia");
    expect(kanaScenario.variableParentGrowth).toEqual(sophieScenario.personalGrowth);
    expect(kanaScenario.bonuses.attackStance.rankDeltas.C).toEqual(sophieScenario.bonuses.attackStance.rankDeltas.C);
    expect(kanaScenario.nestedVariableParentOptions.some((option) => option.unitId === "corrin")).toBe(false);
  });

  it("omits the usual cap bonus for an offspring spouse", () => {
    const firstGeneration = resolveOffspringScenario(kana, "felicia", boon, bane, { corrinTalentId: "cavalier" })!;
    const secondGeneration = resolveOffspringScenario(kana, "sophie", boon, bane, {
      corrinTalentId: "cavalier",
      nestedVariableParentId: "felicia",
    })!;
    const sophie = secondGeneration.nestedVariableParentScenario!;

    expect(firstGeneration.capModifiers.strength).toBe(
      (corrin.capModifiers!.modifiers.strength + boon.capDeltas.strength! + bane.capDeltas.strength!)
      + fe14Data.units.find((unit) => unit.identity.id === "felicia")!.capModifiers!.modifiers.strength + 1,
    );
    expect(secondGeneration.capModifiers.strength).toBe(
      (corrin.capModifiers!.modifiers.strength + boon.capDeltas.strength! + bane.capDeltas.strength!)
      + sophie.capModifiers.strength,
    );
  });

  it("keeps Corrin's configured stance profile in the actual father or mother columns", () => {
    const config = corrin.avatarConfiguration!;
    const expectedAttack = config.pairupRule.attackStance.variants.find(
      (variant) => variant.boonIds.includes(boon.id) && variant.baneIds.includes(bane.id),
    )!;
    const expectedGuard = config.pairupRule.guardStance.variants.find(
      (variant) => variant.boonId === boon.id && variant.baneId === bane.id,
    )!;
    const femaleKana = resolveOffspringScenario(kana, "azura", boon, bane, { corrinTalentId: "cavalier" })!;
    const maleKana = resolveOffspringScenario(kana, "silas", boon, bane, { corrinTalentId: "cavalier" })!;

    expect(femaleKana.bonuses.attackStance.rankDeltas.B).toEqual(expectedAttack.rankDeltas.B);
    expect(femaleKana.bonuses.guardStance.rankDeltas.C).toEqual(expectedGuard.rankDeltas.C);
    expect(maleKana.bonuses.attackStance.rankDeltas.C).toEqual(expectedAttack.rankDeltas.C);
    expect(maleKana.bonuses.guardStance.rankDeltas.B).toEqual(expectedGuard.rankDeltas.B);
  });

  it("keeps Kana's Dragon trait and adds Beast through an applicable spouse", () => {
    const scenario = resolveOffspringScenario(kana, "selkie", boon, bane, {
      corrinTalentId: "cavalier",
      nestedVariableParentId: "azura",
    })!;
    expect(scenario.unitTags).toEqual(["dragon", "beast"]);
  });
});

describe("offspring batch regressions", () => {
  it("builds complete parentage and recruitment data for processing slots 2 through 19", () => {
    const ids = [
      "sophie", "midori", "shiro", "kiragi", "asugi", "selkie", "hisame", "mitama", "caeldori",
      "rhajat", "siegbert", "forrest", "ignatius", "velouria", "percy", "ophelia", "soleil", "nina",
    ];
    for (const id of ids) {
      const unit = fe14Data.units.find((candidate) => candidate.identity.id === id);
      expect(unit?.offspring?.parentage.variableParentOptions.length, id).toBeGreaterThan(0);
      expect(unit?.offspring?.recruitment.offspringSeal.promotionOptions.length, id).toBeGreaterThan(0);
    }
  });

  it("resolves the Sophie and Siegbert Cavalier collision to their secondary trees", () => {
    const sophie = fe14Data.units.find((unit) => unit.identity.id === "sophie")!;
    const siegbert = fe14Data.units.find((unit) => unit.identity.id === "siegbert")!;
    const sophieGrant = sophie.offspring!.parentage.supports.find((support) => support.partnerUnitId === "siegbert")!.sealGrant;
    const siegbertGrant = siegbert.offspring!.parentage.supports.find((support) => support.partnerUnitId === "sophie")!.sealGrant;
    expect(sophieGrant).toMatchObject({ grantedClassId: "wyvern_rider", resolution: "duplicate_primary_fallback" });
    expect(siegbertGrant).toMatchObject({ grantedClassId: "mercenary", resolution: "duplicate_primary_fallback" });
  });

  it("applies the restricted-primary parallel fallback to Rhajat and Selkie", () => {
    const rhajat = fe14Data.units.find((unit) => unit.identity.id === "rhajat")!;
    const grant = rhajat.offspring!.parentage.supports.find((support) => support.partnerUnitId === "selkie")!.sealGrant;
    expect(grant).toMatchObject({ borrowedClassId: "kitsune", grantedClassId: "apothecary", resolution: "parallel_class_fallback" });
  });

  it("keeps Nina's Corrin parent and Corrin romance gender cases distinct", () => {
    const nina = fe14Data.units.find((unit) => unit.identity.id === "nina")!;
    expect(nina.offspring!.parentage.variableParentOptions.find((option) => option.unitId === "corrin")?.inheritedClassId).toBe("nohr_prince");
    const corrinSupports = nina.offspring!.parentage.supports.filter((support) => support.partnerUnitId === "corrin");
    expect(corrinSupports.find((support) => support.partnerGender === "female")?.kind).toBe("platonic");
    expect(corrinSupports.find((support) => support.partnerGender === "male")?.kind).toBe("romantic");
  });

  it("uses the online-corroborated 40 percent child-base Defense growth for Kiragi", () => {
    const kiragi = fe14Data.units.find((unit) => unit.identity.id === "kiragi")!;
    expect(kiragi.offspring!.parentage.childBaseGrowth.defense).toBe(40);
  });

  it("gives every ordinary offspring the Dragon trait when Corrin is the variable parent", () => {
    const offspring = fe14Data.units.filter((unit) => unit.offspring?.parentage.variableParentOptions.some((option) => option.unitId === "corrin"));

    for (const unit of offspring) {
      expect(resolveOffspringScenario(unit, "corrin")?.unitTags, unit.identity.id).toContain("dragon");
    }
  });

  it("combines inherited Dragon with an offspring's innate Beast trait", () => {
    const selkie = fe14Data.units.find((unit) => unit.identity.id === "selkie")!;
    expect(resolveOffspringScenario(selkie, "corrin")?.unitTags).toEqual(["beast", "dragon"]);
  });

  it("resolves Shrine Maiden inheritance to Monk for Hisame", () => {
    const hisame = fe14Data.units.find((unit) => unit.identity.id === "hisame")!;
    const sakura = hisame.offspring!.parentage.variableParentOptions.find((option) => option.unitId === "sakura");

    expect(sakura?.inheritedClassId).toBe("monk");
    expect(sakura?.inheritedClassReason).toBe("gender_parallel");
  });

  it("never leaves a gender-exclusive Monk tree on the wrong offspring gender", () => {
    for (const unit of fe14Data.units.filter((candidate) => candidate.offspring)) {
      for (const option of unit.offspring!.parentage.variableParentOptions) {
        if (unit.identity.gender === "male") expect(option.inheritedClassId, `${unit.identity.id}/${option.unitId}`).not.toBe("shrine_maiden");
        if (unit.identity.gender === "female") expect(option.inheritedClassId, `${unit.identity.id}/${option.unitId}`).not.toBe("monk");
      }
    }
  });

  it("records Caeldori and Selena's special A-rank support dialogue", () => {
    const caeldori = fe14Data.units.find((unit) => unit.identity.id === "caeldori")!;

    expect(caeldori.offspring!.parentage.notes).toContain("If Selena is Caeldori's mother, their A-rank support uses special dialogue.");
  });

  it("describes Prodigy as comparing Caeldori's higher offensive stat to the matching enemy stat", () => {
    const caeldori = fe14Data.units.find((unit) => unit.identity.id === "caeldori")!;

    expect(caeldori.personalSkill?.effect).toBe("Compare Caeldori's higher offensive stat (Strength or Magic) with the enemy's matching stat. If the enemy's stat is higher, Caeldori deals 4 extra damage.");
  });

  it("uses the fixed Revelation-only offspring support graph", () => {
    const expected: Record<string, { friendship: string; romantic: string[] }> = {
      shiro: { friendship: "siegbert", romantic: ["ophelia", "nina"] },
      kiragi: { friendship: "forrest", romantic: ["velouria", "soleil"] },
      asugi: { friendship: "ignatius", romantic: ["soleil", "nina"] },
      hisame: { friendship: "percy", romantic: ["velouria", "ophelia"] },
      selkie: { friendship: "velouria", romantic: ["forrest", "ignatius"] },
      mitama: { friendship: "soleil", romantic: ["siegbert", "percy"] },
      caeldori: { friendship: "nina", romantic: ["siegbert", "ignatius"] },
      rhajat: { friendship: "ophelia", romantic: ["forrest", "percy"] },
      siegbert: { friendship: "shiro", romantic: ["mitama", "caeldori"] },
      forrest: { friendship: "kiragi", romantic: ["selkie", "rhajat"] },
      ignatius: { friendship: "asugi", romantic: ["selkie", "caeldori"] },
      percy: { friendship: "hisame", romantic: ["mitama", "rhajat"] },
      velouria: { friendship: "selkie", romantic: ["kiragi", "hisame"] },
      ophelia: { friendship: "rhajat", romantic: ["shiro", "hisame"] },
      soleil: { friendship: "mitama", romantic: ["kiragi", "asugi"] },
      nina: { friendship: "caeldori", romantic: ["shiro", "asugi"] },
    };

    for (const [unitId, supportSet] of Object.entries(expected)) {
      const unit = fe14Data.units.find((candidate) => candidate.identity.id === unitId)!;
      const revelationOnly = unit.offspring!.parentage.supports.filter(
        (support) => (support.kind === "friendship" || support.kind === "romantic")
          && support.routes.length === 1 && support.routes[0] === "revelation",
      );
      expect(revelationOnly.filter((support) => support.kind === "friendship").map((support) => support.partnerUnitId), unitId)
        .toEqual([supportSet.friendship]);
      expect(revelationOnly.filter((support) => support.kind === "romantic").map((support) => support.partnerUnitId).sort(), unitId)
        .toEqual([...supportSet.romantic].sort());
    }
  });

  it("keeps every Revelation-only offspring support symmetric", () => {
    const units = fe14Data.units.filter((unit) => unit.offspring);
    for (const unit of units) {
      const revelationOnly = unit.offspring!.parentage.supports.filter(
        (support) => (support.kind === "friendship" || support.kind === "romantic")
          && support.routes.length === 1 && support.routes[0] === "revelation",
      );
      for (const support of revelationOnly) {
        const partner = units.find((candidate) => candidate.identity.id === support.partnerUnitId)!;
        expect(partner.offspring!.parentage.supports, `${unit.identity.id}/${support.partnerUnitId}`).toContainEqual(
          expect.objectContaining({ partnerUnitId: unit.identity.id, kind: support.kind, routes: ["revelation"] }),
        );
      }
    }
  });

  it("inherits variable-parent base class trees rather than promoted join classes", () => {
    const baseClassIds = new Set(fe14Data.classTrees.map((tree) => tree.id));
    const offspring = fe14Data.units.filter((unit) => unit.offspring);

    for (const unit of offspring) {
      for (const option of unit.offspring!.parentage.variableParentOptions) {
        expect(baseClassIds.has(option.inheritedClassId), `${unit.identity.id} from ${option.unitId}`).toBe(true);
      }
    }

    const camillaOptions = offspring.flatMap((unit) =>
      unit.offspring!.parentage.variableParentOptions
        .filter((option) => option.unitId === "camilla")
        .map((option) => ({ childId: unit.identity.id, option })),
    );
    expect(camillaOptions.length).toBeGreaterThan(0);
    for (const { childId, option } of camillaOptions) {
      if (childId === "percy") {
        expect(option).toMatchObject({ inheritedClassId: "dark_mage", inheritedClassReason: "duplicate_primary_fallback" });
      } else {
        expect(option).toMatchObject({ inheritedClassId: "wyvern_rider", inheritedClassReason: "direct" });
      }
    }
  });
});

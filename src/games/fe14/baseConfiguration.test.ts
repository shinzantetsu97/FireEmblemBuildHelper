import { describe, expect, it } from "vitest";
import { ROUTE_ORDER, resolveUnitBaseConfiguration } from "./baseConfiguration";
import { fe14Data } from "./data";

function unit(unitId: string) {
  return fe14Data.units.find((entry) => entry.identity.id === unitId)!;
}

function expectClassSkillMetadata(unitId: string, skills: ReturnType<typeof resolveUnitBaseConfiguration>["configuration"]["learnedSkills"]) {
  for (const skill of skills.filter((entry) => entry.kind === "class")) {
    expect(skill.sourceClassName, `${unitId}/${skill.skillId} source class`).toBeTruthy();
    expect(skill.acquiredLevel, `${unitId}/${skill.skillId} acquisition level`).toEqual(expect.any(Number));
  }
}

describe("FE14 route-driven base configuration", () => {
  it("resolves every legal first-generation route without a second route dataset", () => {
    for (const entry of fe14Data.units.filter((candidate) => !candidate.offspring && candidate.availability.length)) {
      const routes = ROUTE_ORDER.filter((routeId) =>
        entry.availability.some((scenario) => scenario.routeJoins.some((join) => join.route === routeId)),
      );
      for (const routeId of routes) {
        const result = resolveUnitBaseConfiguration(entry, { routeId });
        expect(result.configuration.routeId, `${entry.identity.id} ${routeId}`).toBe(routeId);
        expect(result.configuration.availabilityId, `${entry.identity.id} ${routeId}`).toBeTruthy();
        expect(result.configuration.weaponLevels.length, `${entry.identity.id} ${routeId}`).toBeGreaterThan(0);
        expect(result.configuration.unresolvedSkillIds, `${entry.identity.id} ${routeId}`).toEqual([]);
        expectClassSkillMetadata(entry.identity.id, result.configuration.learnedSkills);
      }
    }
  });

  it("resolves every legal offspring parent and route combination", () => {
    for (const child of fe14Data.units.filter((candidate) => candidate.offspring)) {
      for (const parent of child.offspring!.parentage.variableParentOptions) {
        for (const routeId of ROUTE_ORDER.filter((route) => parent.routes.includes(route))) {
          const result = resolveUnitBaseConfiguration(child, {
            routeId,
            avatarGender: parent.childGender,
            variableParentUnitId: parent.unitId,
          });
          expect(result.selectedParentUnitId, `${child.identity.id}/${parent.unitId}/${routeId}`).toBe(parent.unitId);
          expect(result.routeId, `${child.identity.id}/${parent.unitId}/${routeId}`).toBe(routeId);
          expect(result.configuration.unresolvedSkillIds, `${child.identity.id}/${parent.unitId}/${routeId}`).toEqual([]);
          expectClassSkillMetadata(child.identity.id, result.configuration.learnedSkills);
        }
      }
    }
  });

  it("resolves Silas through canonical route order and one coherent snapshot", () => {
    const result = resolveUnitBaseConfiguration(unit("silas"), { routeId: "birthright" });

    expect(result.availableRoutes).toEqual(["birthright", "conquest", "revelation"]);
    expect(result.selectedAvailabilityId).toBe("silas.birthright");
    expect(result.configuration).toMatchObject({
      availabilityId: "silas.birthright",
      join: { chapter: 7, timing: "end" },
      canonicalClassId: "cavalier",
      classLabel: "Cavalier",
      level: 6,
      joiningStats: { hp: 22, strength: 11, resistance: 5 },
      inventory: { items: ["steel_sword", "javelin"] },
      individualGrowths: { hp: 40, strength: 45, resistance: 25 },
      effectiveGrowths: { hp: 50, strength: 60, resistance: 30 },
    });
    expect(result.configuration.weaponLevels).toEqual([
      expect.objectContaining({ weaponTypeId: "sword", currentRank: "C", rankCap: "B" }),
      expect.objectContaining({ weaponTypeId: "lance", currentRank: "D", rankCap: "B" }),
    ]);
    expect(result.configuration.learnedSkills.map((skill) => skill.skillId)).toEqual([
      "vow_of_friendship",
      "elbow_room",
    ]);
    expect(result.configuration.learnedSkills[1]).toMatchObject({
      source: "current_class",
      sourceClassId: "cavalier",
      sourceClassName: "Cavalier",
      acquiredLevel: 1,
    });
  });

  it("switches every route-dependent Silas field from the same resolver", () => {
    const conquest = resolveUnitBaseConfiguration(unit("silas"), { routeId: "conquest" }).configuration;
    const revelation = resolveUnitBaseConfiguration(unit("silas"), { routeId: "revelation" }).configuration;

    expect(conquest).toMatchObject({
      availabilityId: "silas.conquest",
      join: { chapter: 7, timing: "during" },
      level: 6,
      inventory: { items: ["iron_sword", "bronze_lance"] },
    });
    expect(conquest.weaponLevels.map((weapon) => weapon.currentRank)).toEqual(["D", "E"]);

    expect(revelation).toMatchObject({
      availabilityId: "silas.revelation",
      join: { chapter: 14, timing: "end" },
      level: 18,
      joiningStats: { hp: 39, strength: 19, resistance: 14 },
      inventory: { items: ["javelin"] },
    });
    expect(revelation.weaponLevels.map((weapon) => weapon.currentRank)).toEqual(["B", "B"]);
    expect(revelation.learnedSkills.map((skill) => skill.skillId)).toEqual([
      "vow_of_friendship",
      "elbow_room",
      "shelter",
    ]);
  });

  it("keeps route and state notes scoped to the selected configuration", () => {
    const birthrightGuest = resolveUnitBaseConfiguration(unit("takumi"), {
      routeId: "birthright",
      availabilityId: "takumi.birthright_guest",
    }).configuration;
    const birthrightJoin = resolveUnitBaseConfiguration(unit("takumi"), {
      routeId: "birthright",
      availabilityId: "takumi.birthright",
    }).configuration;
    const revelation = resolveUnitBaseConfiguration(unit("takumi"), { routeId: "revelation" }).configuration;

    expect(birthrightGuest.notes).toContain("Takumi is a temporary guest in Birthright Chapter 6 and cannot gain EXP there.");
    expect(birthrightJoin.notes).not.toContain("Takumi is a temporary guest in Birthright Chapter 6 and cannot gain EXP there.");
    expect(birthrightJoin.notes).toContain("Takumi is unavailable for deployment in Birthright Chapter 16.");
    expect(revelation.notes).not.toContain("Takumi is unavailable for deployment in Birthright Chapter 16.");
  });

  it("puts conditional join requirements in recruitment context", () => {
    const mozu = resolveUnitBaseConfiguration(unit("mozu"), { routeId: "birthright" }).configuration;
    const charlotteConquest = resolveUnitBaseConfiguration(unit("charlotte"), { routeId: "conquest" }).configuration;
    const charlotteRevelation = resolveUnitBaseConfiguration(unit("charlotte"), { routeId: "revelation" }).configuration;
    const bennyConquest = resolveUnitBaseConfiguration(unit("benny"), { routeId: "conquest" }).configuration;
    const bennyRevelation = resolveUnitBaseConfiguration(unit("benny"), { routeId: "revelation" }).configuration;

    expect(mozu.join).toMatchObject({
      chapter: 7,
      timing: "conditional",
      condition: "Talk to Mozu with Corrin, or complete the map while she survives.",
    });
    expect(mozu.notes.join(" ")).not.toMatch(/recruit mozu|talk to mozu/i);
    expect(charlotteConquest.join).toEqual({ kind: "story", chapter: 13, timing: "during", turn: 3 });
    expect(bennyConquest.join).toEqual({ kind: "story", chapter: 13, timing: "during", turn: 3 });
    expect(charlotteRevelation.join).toMatchObject({
      kind: "story",
      chapter: 14,
      timing: "conditional",
      condition: "Talk to Charlotte with Elise.",
    });
    expect(bennyRevelation.join).toMatchObject({
      kind: "story",
      chapter: 14,
      timing: "conditional",
      condition: "Talk to Benny with Elise.",
    });
  });

  it("exposes Kaze's appearance and rejoin as separate selectable states", () => {
    const defaultResult = resolveUnitBaseConfiguration(unit("kaze"), { routeId: "conquest" });

    expect(defaultResult.stateOptions).toEqual([
      expect.objectContaining({ availabilityId: "kaze.common", kind: "appearance" }),
      expect.objectContaining({ availabilityId: "kaze.conquest", kind: "rejoin" }),
    ]);
    expect(defaultResult.selectedAvailabilityId).toBe("kaze.conquest");
    expect(defaultResult.configuration.level).toBe(9);

    const appearance = resolveUnitBaseConfiguration(unit("kaze"), {
      routeId: "conquest",
      availabilityId: "kaze.common",
    }).configuration;
    expect(appearance.stateKind).toBe("appearance");
    expect(appearance.join).toEqual({ kind: "story", chapter: 4, timing: "start" });
    expect(appearance.notes[0]).toMatch(/returns in Chapter 11/i);
  });

  it("keeps Kaze in one continuous Birthright state", () => {
    const result = resolveUnitBaseConfiguration(unit("kaze"), { routeId: "birthright" });

    expect(result.stateOptions).toEqual([
      expect.objectContaining({ availabilityId: "kaze.common" }),
    ]);
    expect(result.selectedAvailabilityId).toBe("kaze.common");
    expect(result.configuration.join).toEqual({ kind: "story", chapter: 4, timing: "start" });
    expect(result.configuration.notes).toContain(
      "Kaze remains in the army after Chapter 15 only if Corrin has reached A support or higher with him.",
    );
  });

  it("omits redundant Corrin stance prose and localizes both attendant level-cap notes", () => {
    const corrin = resolveUnitBaseConfiguration(unit("corrin"), { routeId: "birthright" }).configuration;
    const felicia = resolveUnitBaseConfiguration(unit("felicia"), {
      routeId: "birthright",
      avatarGender: "male",
    }).configuration;
    const jakob = resolveUnitBaseConfiguration(unit("jakob"), {
      routeId: "birthright",
      avatarGender: "female",
    }).configuration;

    expect(corrin.notes.join(" ")).not.toMatch(/Attack Stance|Guard Stance/);
    expect(corrin.notesZhHans.join(" ")).not.toMatch(/攻阵|防阵/);
    expect(felicia.notes).toContain(
      "Felicia has the effect of four built-in Eternal Seals, allowing her to reach level 40 despite starting in the promoted Maid class.",
    );
    expect(felicia.notesZhHans).toContain(
      "菲利希亚内置了相当于使用四枚永恒之证的效果，因此即使初始职业是上级职业女仆，等级上限也能达到40级。",
    );
    expect(jakob.notes).toContain(
      "Jakob has the effect of four built-in Eternal Seals, allowing him to reach level 40 despite starting in the promoted Butler class.",
    );
    expect(jakob.notesZhHans).toContain(
      "乔卡内置了相当于使用四枚永恒之证的效果，因此即使初始职业是上级职业管家，等级上限也能达到40级。",
    );
  });

  it("classifies Rinkah by route and warns when Rinkah or Sakura are not permanent", () => {
    const rinkahBirthright = resolveUnitBaseConfiguration(unit("rinkah"), { routeId: "birthright" }).configuration;
    const rinkahConquest = resolveUnitBaseConfiguration(unit("rinkah"), { routeId: "conquest" }).configuration;
    const sakuraConquest = resolveUnitBaseConfiguration(unit("sakura"), { routeId: "conquest" }).configuration;

    expect(rinkahBirthright.stateKind).toBe("join");
    expect(rinkahConquest.stateKind).toBe("appearance");
    expect(rinkahConquest.notes).toContain(
      "Warning: Rinkah is not a permanent unit on Conquest and leaves after Chapter 5 without rejoining.",
    );
    expect(sakuraConquest.notes).toContain(
      "Warning: Sakura is not a permanent unit on Conquest and leaves after Chapter 5 without rejoining.",
    );
  });

  it("retains Felicia's Corrin-gender condition while joining Attendant mechanics", () => {
    const maleCorrin = resolveUnitBaseConfiguration(unit("felicia"), {
      routeId: "birthright",
      avatarGender: "male",
    }).configuration;
    const femaleCorrin = resolveUnitBaseConfiguration(unit("felicia"), {
      routeId: "birthright",
      avatarGender: "female",
    }).configuration;

    expect(maleCorrin).toMatchObject({
      availabilityId: "felicia.avatar_male",
      canonicalClassId: "attendant",
      classLabel: "Maid",
      level: 1,
      scenarioConditions: { avatarGender: "male" },
    });
    expect(femaleCorrin).toMatchObject({
      availabilityId: "felicia.avatar_female",
      canonicalClassId: "attendant",
      classLabel: "Maid",
      level: 13,
      scenarioConditions: { avatarGender: "female" },
    });
    expect(maleCorrin.learnedSkills.find((skill) => skill.skillId === "resistance_plus_2")).toMatchObject({
      source: "scenario_override",
      sourceClassId: "troubadour",
      sourceClassName: "Troubadour",
      acquiredLevel: 1,
    });
  });

  it("applies Corrin boon and bane before calculating effective growth", () => {
    const corrin = unit("corrin");
    const config = corrin.avatarConfiguration!;
    const boon = config.boons.find((choice) => choice.id === "robust")!;
    const bane = config.banes.find((choice) => choice.id === "weak")!;
    const result = resolveUnitBaseConfiguration(corrin, {
      routeId: "birthright",
      avatarGender: "male",
      boon,
      bane,
      talentId: "cavalier",
    }).configuration;

    expect(result.individualGrowths.hp).toBe(
      corrin.growths[0].rates.hp + (boon.growthDeltas.hp ?? 0) + (bane.growthDeltas.hp ?? 0),
    );
    const nohrPrinceGrowth = fe14Data.classStats.find((profile) => profile.classId === "nohr_prince")!.growthRates;
    expect(result.effectiveGrowths.hp).toBe(result.individualGrowths.hp + nohrPrinceGrowth.hp);
    expect(result.capModifiers).toEqual(expect.objectContaining({
      strength: (corrin.capModifiers!.modifiers.strength ?? 0) + (boon.capDeltas.strength ?? 0) + (bane.capDeltas.strength ?? 0),
    }));
  });

  it("resolves an offspring baseline with Corrin as the default parent", () => {
    const result = resolveUnitBaseConfiguration(unit("dwyer"), { routeId: "conquest" });

    expect(result.selectedParentUnitId).toBe("corrin");
    expect(result.availableRoutes).toEqual(["birthright", "conquest", "revelation"]);
    expect(result.configuration).toMatchObject({
      routeId: "conquest",
      joiningStatsKind: "minimum_before_parent_inheritance",
      canonicalClassId: "troubadour",
      level: 10,
      scenarioConditions: { variableParentUnitId: "corrin" },
      join: { kind: "paralogue" },
    });
    expect(result.configuration.learnedSkills.slice(0, 3).map((skill) => skill.name)).toEqual([
      "Born Steward",
      "Resistance +2",
      "Gentilhomme",
    ]);
    expect(result.configuration.learnedSkills.some((skill) => skill.source === "offspring_seal")).toBe(false);
    expect(result.configuration.offspringContext).toMatchObject({
      earliestChapter: 8,
      selectedChapter: 8,
      childBaseGrowths: unit("dwyer").offspring!.parentage.childBaseGrowth,
    });
    expect(result.configuration.offspringContext?.unlockSources).toEqual([
      expect.objectContaining({ unitId: "jakob", availableChapter: 8, note: expect.stringMatching(/ASAP default/) }),
      expect.objectContaining({ unitId: "corrin", availableChapter: 0 }),
    ]);
  });

  it("drives an offspring's level-only stats, class, ranks, growths, and skills from story position", () => {
    const baseline = resolveUnitBaseConfiguration(unit("dwyer"), {
      routeId: "conquest",
      offspringStoryChapter: 8,
    }).configuration;
    const promoted = resolveUnitBaseConfiguration(unit("dwyer"), {
      routeId: "conquest",
      offspringStoryChapter: 24,
      offspringPromotionClassId: "strategist",
    }).configuration;

    expect(promoted).toMatchObject({
      canonicalClassId: "strategist",
      classLabel: "Strategist",
      level: 12,
      joiningStatsKind: "minimum_before_parent_inheritance",
      offspringContext: {
        selectedChapter: 24,
        selectedPromotionClassId: "strategist",
      },
    });
    expect(promoted.joiningStats).not.toEqual(baseline.joiningStats);
    expect(promoted.effectiveGrowths).not.toEqual(baseline.effectiveGrowths);
    expect(promoted.weaponLevels).toEqual([
      expect.objectContaining({ weaponTypeId: "tome", currentRank: "C" }),
      expect.objectContaining({ weaponTypeId: "staff", currentRank: "B" }),
    ]);
    expect(promoted.learnedSkills).toEqual(expect.arrayContaining([
      expect.objectContaining({ skillId: "rally_resistance", source: "offspring_seal", acquiredLevel: 5, guaranteed: true }),
    ]));
    expect(promoted.learnedSkills.some((skill) => skill.skillId === "inspiration")).toBe(false);
  });

  it("derives a late child's earliest selectable chapter from the later recruited parent", () => {
    const result = resolveUnitBaseConfiguration(unit("kana"), {
      routeId: "conquest",
      avatarGender: "female",
      variableParentUnitId: "flora",
      offspringStoryChapter: 8,
    }).configuration;

    expect(result.offspringContext).toMatchObject({ earliestChapter: 19, selectedChapter: 19 });
    expect(result.offspringContext?.unlockSources).toEqual([
      expect.objectContaining({ unitId: "corrin", availableChapter: 0 }),
      expect.objectContaining({ unitId: "flora", availableChapter: 19 }),
    ]);
    expect(result.level).toBe(2);
  });

  it("keeps the planning route and falls back to a legal parent for that route", () => {
    const result = resolveUnitBaseConfiguration(unit("dwyer"), {
      routeId: "conquest",
      variableParentUnitId: "hinoka",
    });

    expect(result.selectedParentUnitId).toBe("corrin");
    expect(result.availableRoutes).toEqual(["birthright", "conquest", "revelation"]);
    expect(result.routeId).toBe("conquest");
    expect(result.parentOptions?.every((option) => option.routes.includes("conquest"))).toBe(true);
  });

  it("ignores Chapter 6 royal guest appearances when deriving child unlock timing", () => {
    const siegbert = resolveUnitBaseConfiguration(unit("siegbert"), {
      routeId: "conquest",
      variableParentUnitId: "corrin",
    }).configuration;
    const forrest = resolveUnitBaseConfiguration(unit("forrest"), {
      routeId: "conquest",
      variableParentUnitId: "corrin",
    }).configuration;

    expect(siegbert.offspringContext).toMatchObject({ earliestChapter: 16, selectedChapter: 16 });
    expect(siegbert.offspringContext?.unlockSources).toEqual(expect.arrayContaining([
      expect.objectContaining({ unitId: "xander", availableChapter: 16 }),
    ]));
    expect(forrest.offspringContext).toMatchObject({ earliestChapter: 14, selectedChapter: 14 });
    expect(forrest.offspringContext?.unlockSources).toEqual(expect.arrayContaining([
      expect.objectContaining({ unitId: "leo", availableChapter: 14 }),
    ]));
  });

  it("resolves Kana through a second-generation parent and nested parent", () => {
    const result = resolveUnitBaseConfiguration(unit("kana"), {
      routeId: "conquest",
      avatarGender: "male",
      variableParentUnitId: "shigure",
      nestedVariableParentUnitId: "jakob",
      talentId: "cavalier",
    });

    expect(result.selectedParentUnitId).toBe("shigure");
    expect(result.configuration.scenarioConditions).toMatchObject({
      avatarGender: "male",
      variableParentUnitId: "shigure",
      nestedVariableParentUnitId: "jakob",
    });
    expect(result.configuration.classLabel).toBe("Nohr Prince");
  });
});

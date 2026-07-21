import { z } from "zod";

export const reviewStatusSchema = z.enum([
  "candidate",
  "corroborated",
  "accepted",
  "disputed",
  "deprecated",
]);

export const processingStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "in_review",
  "accepted",
  "blocked",
]);

export const routeSchema = z.enum(["birthright", "conquest", "revelation"]);
export const weaponRankSchema = z.enum(["E", "D", "C", "B", "A", "S"]);

export const sourceRefSchema = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  reviewStatus: reviewStatusSchema,
});

export const statBlockSchema = z.object({
  hp: z.number().int(),
  strength: z.number().int(),
  magic: z.number().int(),
  skill: z.number().int(),
  speed: z.number().int(),
  luck: z.number().int(),
  defense: z.number().int(),
  resistance: z.number().int(),
}).strict();

export const sourceCatalogSchema = z.object({
  gameId: z.literal("fe14"),
  updatedAt: z.string().min(1),
  sources: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum(["workbook", "web", "book", "game_data"]),
      title: z.string().min(1),
      location: z.string().min(1),
      language: z.string().min(1),
      reviewStatus: reviewStatusSchema,
      notes: z.string().optional(),
    }),
  ),
});

const rosterUnitSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  unitNo: z.number().int().positive(),
  processingOrder: z.number().int().positive(),
  availableRoutes: z.array(routeSchema).min(1),
  availabilityCategory: z.enum(["dlc_exclusive"]).optional(),
  slug: z.string().min(1),
  displayName: z.string().min(1),
  portraitFile: z.string().min(1),
  sourceSheet: z.string().min(1),
  status: processingStatusSchema,
  names: z
    .object({
      en: z.string().min(1),
      ja: z.string().min(1),
      jaLatn: z.string().min(1),
      zhHans: z.string().min(1),
    })
    .optional(),
  gender: z.enum(["female", "male", "variable"]).optional(),
  dragonVein: z.boolean().optional(),
  unitTags: z.array(z.enum(["dragon", "beast"])).max(2).optional(),
  personalSkillId: z.string().optional(),
  notes: z.array(z.object({
    text: z.string().min(1),
    textZhHans: z.string().min(1).optional(),
    routes: z.array(routeSchema).min(1).optional(),
    availabilityIds: z.array(z.string().min(1)).min(1).optional(),
  })).optional(),
  supportNotes: z.array(z.string().min(1)).optional(),
  supportNotesZhHans: z.array(z.string().min(1)).optional(),
});

export const rosterSchema = z.object({
  gameId: z.literal("fe14"),
  rosterKind: z.literal("first_generation"),
  units: z.array(rosterUnitSchema),
});

export const secondGenerationRosterSchema = z.object({
  gameId: z.literal("fe14"),
  rosterKind: z.literal("second_generation"),
  units: z.array(rosterUnitSchema.extend({
    generation: z.literal("second"),
    paralogueNo: z.number().int().min(2).max(22),
    paralogueTitle: z.string().min(1),
    paralogueTitleZhHans: z.string().min(1).optional(),
    fixedParentUnitId: z.string().min(1),
  })).length(21),
});

const childSupportSchema = z.object({
  partnerUnitId: z.string().min(1),
  partnerGender: z.enum(["female", "male"]).optional(),
  unitGender: z.enum(["female", "male"]).optional(),
  kind: z.enum(["romantic", "friendship", "platonic", "family"]),
  ranks: z.array(z.enum(["C", "B", "A", "S", "A+"])).min(1),
  routes: z.array(routeSchema).min(1),
  condition: z.enum(["always", "selected_variable_parent", "selected_sibling"]).default("always"),
  sealGrant: z.object({
    seal: z.enum(["friendship", "partner"]),
    borrowedClassId: z.string().min(1),
    grantedClassId: z.string().min(1),
    resolution: z.enum([
      "direct",
      "duplicate_primary_fallback",
      "restricted_primary_fallback",
      "parallel_class_fallback",
      "gender_parallel",
      "variable",
    ]),
    classCandidates: z.object({
      primaryClassId: z.string().min(1),
      secondaryClassId: z.string().min(1).optional(),
    }).optional(),
  }).optional(),
});

export const childParentageFileSchema = z.array(z.object({
  unitId: z.string().min(1),
  fixedParentUnitId: z.string().min(1),
  variableParentRole: z.enum(["mother", "father", "parent"]),
  scenarioKind: z.enum(["standard", "avatar_child"]).optional(),
  variableParentOptions: z.array(z.object({
    unitId: z.string().min(1),
    routes: z.array(routeSchema).min(1),
    childGender: z.enum(["female", "male"]).optional(),
    parentGeneration: z.enum(["first", "second"]).optional(),
    inheritanceClassCandidates: z.object({
      primaryClassId: z.string().min(1),
      secondaryClassId: z.string().min(1).optional(),
    }).optional(),
    inheritedClassId: z.string().min(1),
    inheritedClassReason: z.enum([
      "direct",
      "duplicate_primary_fallback",
      "restricted_primary_fallback",
      "parallel_class_fallback",
      "gender_parallel",
    ]),
    fixedInheritedClassId: z.string().min(1).optional(),
    fixedInheritedClassReason: z.enum([
      "direct",
      "duplicate_primary_fallback",
      "restricted_primary_fallback",
      "parallel_class_fallback",
      "gender_parallel",
    ]).optional(),
    siblingUnitId: z.string().min(1).optional(),
  })).min(1),
  fixedInheritedClassId: z.string().min(1),
  childBaseClassId: z.string().min(1),
  childBaseGrowth: statBlockSchema,
  notes: z.array(z.string().min(1)).optional(),
  notesZhHans: z.array(z.string().min(1)).optional(),
  formulas: z.object({
    personalGrowth: z.literal("floor((child_base + variable_parent) / 2)"),
    capModifiers: z.enum(["fixed_parent + variable_parent + 1", "fixed_parent + variable_parent + generation_bonus"]),
    attackStanceRanks: z.object({ C: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]), B: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]), A: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]), S: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]) }),
    guardStanceRanks: z.object({ C: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]), B: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]), A: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]), S: z.enum(["fixed_parent", "variable_parent", "actual_mother", "actual_father"]) }),
  }),
  supports: z.array(childSupportSchema),
  provenance: z.array(sourceRefSchema).min(1),
}));

const availabilitySchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  scenarioLabel: z.string().min(1).optional(),
  avatarGender: z.enum(["female", "male"]).optional(),
  routeJoins: z
    .array(
      z.object({
        route: routeSchema,
        chapter: z.number().int().nonnegative(),
        timing: z.enum(["start", "during", "end", "conditional"]),
        turn: z.number().int().positive().optional(),
        condition: z.string().min(1).optional(),
        conditionZhHans: z.string().min(1).optional(),
      }).superRefine((join, context) => {
        if (join.timing === "conditional" && !join.condition) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["condition"],
            message: "Conditional route joins must explain their recruitment condition",
          });
        }
      }),
    )
    .min(1),
  level: z.number().int().positive(),
  classId: z.string().min(1),
  gainsExperience: z.boolean().optional(),
  myCastleRecruitment: z
    .object({
      facilityId: z.string().min(1).optional(),
      facilityIds: z.array(z.string().min(1)).min(2).optional(),
      facilityLevel: z.number().int().positive(),
      refreshMethods: z
        .array(z.enum(["real_time", "map_completion"]))
        .min(1),
      note: z.string().min(1),
      noteZhHans: z.string().min(1).optional(),
    })
    .refine(
      ({ facilityId, facilityIds }) => Boolean(facilityId) !== Boolean(facilityIds),
      { message: "My Castle recruitment must specify either facilityId or facilityIds" },
    )
    .optional(),
  dlcRecruitment: z
    .object({
      mapId: z.string().min(1),
      mapName: z.string().min(1),
      accessRequirement: z.literal("dragon_gate_unlocked"),
      recruitmentTiming: z.literal("first_clear"),
      recruitedUnitScaling: z.literal("fixed"),
      npcScaling: z.object({
        basis: z.literal("displayed_story_chapter"),
        minimumLevel: z.number().int().positive(),
        maximumLevel: z.number().int().positive(),
        earliestChapter: z.number().int().nonnegative(),
        latestChapter: z.number().int().nonnegative(),
        carriesIntoRecruitedUnit: z.literal(false),
        note: z.string().min(1),
        noteZhHans: z.string().min(1).optional(),
      }),
    })
    .optional(),
  autoLevel: z
    .object({
      basis: z.literal("map_level"),
      internalLevel: z.number().int().nonnegative(),
      minimumLevel: z.number().int().positive(),
      maximumLevel: z.number().int().positive().optional(),
      milestones: z
        .array(
          z.object({
            displayedChapterStart: z.number().int().nonnegative(),
            displayedChapterEnd: z.number().int().nonnegative().optional(),
            mapLevel: z.number().int().nonnegative(),
            level: z.number().int().positive(),
          }),
        )
        .min(1),
      levelFormula: z.literal("stat_base_level + max(0, map_level - internal_level), capped_at_maximum_level"),
      statCalculation: z.literal("average_growths_round_half_up"),
      statBaseLevel: z.number().int().positive(),
      growthClassId: z.string().min(1),
      skillsLearnedAutomatically: z.boolean(),
      modelBasis: z.literal("map_level_autolevel"),
      weaponProficiencyScales: z.boolean(),
      weaponProficiencyMilestonesStatus: z.literal("unresolved"),
      evidenceStatus: z.enum(["tested", "partial", "accepted"]),
      note: z.string().min(1),
      noteZhHans: z.string().min(1).optional(),
    })
    .optional(),
  temporarilyLeavesAfterChapter: z.number().int().nonnegative().optional(),
  permanentlyLeavesAfterChapter: z.number().int().nonnegative().optional(),
  returnsChapter: z.number().int().nonnegative().optional(),
  temporaryDeparture: z
    .object({
      afterChapter: z.number().int().nonnegative(),
      routes: z.array(routeSchema).min(1),
      returns: z.array(
        z.object({
          route: routeSchema,
          chapter: z.number().int().nonnegative(),
          timing: z.enum(["start", "during", "end", "conditional"]),
        }),
      ),
    })
    .optional(),
  retentionCondition: z
    .object({
      route: routeSchema,
      afterChapter: z.number().int().nonnegative(),
      requirement: z.object({
        kind: z.literal("support_rank"),
        partnerUnitId: z.string().min(1),
        minimumRank: z.enum(["C", "B", "A", "S"]),
      }),
      onFailure: z.literal("permanent_departure"),
      note: z.string().min(1),
      noteZhHans: z.string().min(1).optional(),
    })
    .optional(),
  chapter5Carryover: z
    .object({
      sourceAvailabilityId: z.string().min(1),
      checkpoint: z.literal("end_of_chapter_5"),
      levelCalculation: z.enum([
        "retain_chapter_5_level",
        "template_plus_chapter_5_levels_gained",
      ]),
      statCalculation: z.enum([
        "retain_chapter_5_stats",
        "template_plus_chapter_5_level_up_gains",
      ]),
      weaponProficiencyCalculation: z
        .enum([
          "retain_chapter_5_proficiency",
          "template_plus_chapter_5_proficiency_gained",
        ])
        .optional(),
      note: z.string().min(1),
      noteZhHans: z.string().min(1).optional(),
    })
    .optional(),
  inventory: z.array(z.string().min(1)),
  inventoryByDifficulty: z
    .object({
      normal: z.array(z.string().min(1)),
      hard: z.array(z.string().min(1)),
      lunatic: z.array(z.string().min(1)),
    })
    .optional(),
  provenance: z.array(sourceRefSchema).min(1),
});

export const availabilityFileSchema = z.array(availabilitySchema);

export const childRecruitmentFileSchema = z.array(z.object({
  unitId: z.string().min(1),
  paralogueNo: z.number().int().min(2).max(22),
  paralogueTitle: z.string().min(1),
  paralogueTitleZhHans: z.string().min(1).optional(),
  initialFaction: z.enum(["player", "npc", "enemy", "not_deployed"]),
  recruitment: z.object({
    description: z.string().min(1),
    descriptionZhHans: z.string().min(1).optional(),
    talkUnitId: z.string().min(1).optional(),
    automaticAtMapEndIfSurvives: z.boolean(),
    deathBeforeRecruitmentIsPermanent: z.boolean(),
  }),
  recruitmentNotes: z.array(z.string().min(1)).optional(),
  recruitmentNotesZhHans: z.array(z.string().min(1)).optional(),
  startingClassId: z.string().min(1),
  level10PersonalBases: statBlockSchema,
  level10MinimumStatsBeforeInheritance: statBlockSchema,
  weaponRanks: z.record(z.string(), weaponRankSchema),
  inventory: z.array(z.string().min(1)),
  baseStatFormula: z.object({
    childAptitude: z.string().min(1),
    promotedClassAptitude: z.string().min(1),
    parentInheritanceValue: z.string().min(1),
    parentStatInput: z.string().min(1),
    inheritanceBonus: z.string().min(1),
    finalStat: z.string().min(1),
    rounding: z.string().min(1),
    offspringSealNote: z.string().min(1),
  }),
  levelByStoryPosition: z.array(z.object({
    chapterStart: z.number().int().min(1),
    chapterEnd: z.number().int().min(1).optional(),
    level: z.number().int().positive(),
  })).min(1),
  mapLevelScaling: z.object({
    basis: z.literal("map_level"),
    internalLevel: z.literal(10),
    unpromotedLevelFormula: z.literal("max(10, map_level)"),
    promotedInternalLevelOffset: z.literal(20),
    offspringSealLevelFormula: z.literal("map_level - promoted_internal_level_offset"),
    knownMapLevelsByChapter: z.record(z.string(), z.number().int().nonnegative()),
    note: z.string().min(1),
    noteZhHans: z.string().min(1).optional(),
  }),
  offspringSeal: z.object({
    availableFromChapter: z.literal(19),
    promotedLevelsByChapter: z.record(z.string(), z.number().int().positive()),
    promotionOptions: z.array(z.object({
      classId: z.string().min(1),
      displayName: z.string().min(1),
      displayNameZhHans: z.string().min(1).optional(),
      routes: z.array(routeSchema).min(1).optional(),
      classBaseStats: statBlockSchema,
      promotionGains: statBlockSchema,
      primaryWeaponId: z.string().min(1),
      secondaryWeaponIds: z.array(z.string().min(1)),
      learnedSkills: z.array(z.object({
        level: z.number().int().positive(),
        skillId: z.string().min(1),
      })),
    })).min(1),
    weaponRankMilestones: z.array(z.object({
      chapterStart: z.number().int().min(19),
      chapterEnd: z.number().int().min(19),
      primaryRank: weaponRankSchema,
      secondaryRank: weaponRankSchema,
    })),
  }),
  provenance: z.array(sourceRefSchema).min(1),
}));

export const baseStatsFileSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    availabilityId: z.string().min(1).optional(),
    availabilityIds: z.array(z.string().min(1)).min(2).optional(),
    level: z.number().int().positive(),
    classId: z.string().min(1),
    stats: statBlockSchema,
    weaponRanks: z.record(z.string(), weaponRankSchema),
    weaponRanksByAvailability: z
      .record(z.string(), z.record(z.string(), weaponRankSchema))
      .optional(),
    weaponRankProgress: z
      .record(
        z.string(),
        z.object({
          towardRank: z.enum(["D", "C", "B", "A", "S"]),
          barFraction: z.number().min(0).max(1),
          precision: z.enum(["exact", "approximate"]),
        }),
      )
      .optional(),
    weaponRankProgressByAvailability: z
      .record(
        z.string(),
        z.record(
          z.string(),
          z.object({
            towardRank: z.enum(["D", "C", "B", "A", "S"]),
            barFraction: z.number().min(0).max(1),
            precision: z.enum(["exact", "approximate"]),
          }),
        ),
      )
      .optional(),
    startingSkillOverrideIds: z.array(z.string().min(1)).optional(),
    chapter5Carryover: z
      .object({
        sourceAvailabilityId: z.string().min(1),
        checkpoint: z.literal("end_of_chapter_5"),
        levelCalculation: z.enum([
          "retain_chapter_5_level",
          "template_plus_chapter_5_levels_gained",
        ]),
        statCalculation: z.enum([
          "retain_chapter_5_stats",
          "template_plus_chapter_5_level_up_gains",
        ]),
        weaponProficiencyCalculation: z
          .enum([
            "retain_chapter_5_proficiency",
            "template_plus_chapter_5_proficiency_gained",
          ])
          .optional(),
        fixedStatAdjustments: statBlockSchema.partial().optional(),
        note: z.string().min(1),
      })
      .optional(),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const growthsFileSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    kind: z.enum(["personal", "child_base"]),
    rates: statBlockSchema,
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const capModifiersFileSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    modifiers: statBlockSchema.omit({ hp: true }),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

const avatarDeltaSchema = z.record(
  z.enum(["hp", "strength", "magic", "skill", "speed", "luck", "defense", "resistance"]),
  z.number().int(),
);

const avatarCapDeltaSchema = z.record(
  z.enum(["strength", "magic", "skill", "speed", "luck", "defense", "resistance"]),
  z.number().int(),
);

const avatarChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  labelZhHans: z.string().min(1).optional(),
  stat: z.enum(["hp", "strength", "magic", "skill", "speed", "luck", "defense", "resistance"]),
  baseDeltas: avatarDeltaSchema,
  growthDeltas: avatarDeltaSchema,
  capDeltas: avatarCapDeltaSchema,
});

const avatarStanceBonusSchema = z.object({
  strength: z.number().int().optional(),
  magic: z.number().int().optional(),
  skill: z.number().int().optional(),
  speed: z.number().int().optional(),
  luck: z.number().int().optional(),
  defense: z.number().int().optional(),
  resistance: z.number().int().optional(),
  hit: z.number().int().optional(),
  avoid: z.number().int().optional(),
  critical: z.number().int().optional(),
  criticalAvoid: z.number().int().optional(),
});

const avatarStanceRankDeltasSchema = z.object({
  C: avatarStanceBonusSchema,
  B: avatarStanceBonusSchema,
  A: avatarStanceBonusSchema,
  S: avatarStanceBonusSchema,
});

export const avatarConfigurationsFileSchema = z.array(
  z.object({
    unitId: z.literal("corrin"),
    defaultName: z.string().min(1),
    genderOptions: z.tuple([z.literal("male"), z.literal("female")]),
    boons: z.array(avatarChoiceSchema).length(8),
    banes: z.array(avatarChoiceSchema).length(8),
    talents: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        classId: z.string().min(1).optional(),
        classIdByGender: z.object({ male: z.string().min(1), female: z.string().min(1) }).optional(),
      }).refine(({ classId, classIdByGender }) => Boolean(classId) !== Boolean(classIdByGender), {
        message: "Avatar Talent must define either classId or classIdByGender.",
      }),
    ).length(17),
    routePromotions: z.object({
      birthright: z.array(z.string().min(1)).min(1),
      conquest: z.array(z.string().min(1)).min(1),
      revelation: z.array(z.string().min(1)).min(1),
    }),
    friendshipSealRule: z.object({
      requiredRank: z.literal("A"),
      requiresSameGender: z.literal(true),
      commitsToSingleFriend: z.literal(false),
      bottleneck: z.literal("missable_class_access"),
      note: z.string().min(1),
      noteZhHans: z.string().min(1).optional(),
    }),
    pairupRule: z.object({
      variableBy: z.tuple([z.literal("boon"), z.literal("bane")]),
      note: z.string().min(1),
      noteZhHans: z.string().min(1).optional(),
      attackStance: z.object({
        reviewStatus: z.literal("accepted"),
        semantics: z.string().min(1),
        baseBonus: avatarStanceBonusSchema,
        variants: z.array(z.object({
          boonIds: z.array(z.string().min(1)).length(2),
          baneIds: z.array(z.string().min(1)).length(2),
          rankDeltas: avatarStanceRankDeltasSchema,
        })).length(16),
      }),
      guardStance: z.object({
        reviewStatus: z.literal("accepted"),
        semantics: z.string().min(1),
        baseBonus: avatarStanceBonusSchema,
        variants: z.array(z.object({
          boonId: z.string().min(1),
          baneId: z.string().min(1),
          rankDeltas: avatarStanceRankDeltasSchema,
        })).length(56),
      }),
    }),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

const bonusStatsSchema = z
  .object({
    strength: z.number().int().optional(),
    magic: z.number().int().optional(),
    skill: z.number().int().optional(),
    speed: z.number().int().optional(),
    luck: z.number().int().optional(),
    defense: z.number().int().optional(),
    resistance: z.number().int().optional(),
    hit: z.number().int().optional(),
    avoid: z.number().int().optional(),
    critical: z.number().int().optional(),
    criticalAvoid: z.number().int().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "A rank delta cannot be empty.");

const stanceSchema = z.object({
  reviewStatus: reviewStatusSchema,
  semantics: z.string().min(1),
  baseBonus: bonusStatsSchema,
  rankDeltas: z.object({
    C: bonusStatsSchema,
    B: bonusStatsSchema,
    A: bonusStatsSchema,
    S: bonusStatsSchema,
  }),
});

export const pairupFileSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    attackStance: stanceSchema,
    guardStance: stanceSchema,
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const supportsFileSchema = z.array(
  z.object({
    id: z.string().min(1),
    unitId: z.string().min(1),
    partnerUnitId: z.string().min(1),
    kind: z.enum(["romantic", "friendship", "platonic"]),
    ranks: z.array(z.enum(["C", "B", "A", "S", "A+"])).min(1),
    routes: z.array(routeSchema).min(1),
    partnerGender: z.enum(["female", "male"]).optional(),
    direction: z.enum(["mutual", "unit_to_partner"]),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const classAccessFileSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    startingClassId: z.string().min(1),
    baseClassSet: z.array(z.string().min(1)).min(1),
    heartSealClassSet: z.array(z.string().min(1)).min(1),
    corrinTalentOnlyClassSet: z.array(z.string().min(1)),
    sealGrants: z.array(
      z.object({
        supportRelationshipId: z.string().min(1),
        seal: z.enum(["friendship", "partner"]),
        borrowedClassId: z.string().min(1),
        grantedClassId: z.string().min(1),
        resolution: z.enum([
          "direct",
          "same_primary_fallback",
          "restricted_primary_fallback",
          "gender_parallel",
          "already_owned",
          "variable",
        ]),
        resolutionSteps: z
          .array(
            z.enum([
              "direct",
              "same_primary_fallback",
              "restricted_primary_fallback",
              "gender_parallel",
              "already_owned",
              "variable",
            ]),
          )
          .min(1)
          .optional(),
        alreadyOwnedVia: z.enum(["base", "heart_seal"]).optional(),
        routes: z.array(routeSchema).min(1),
        reviewStatus: reviewStatusSchema,
      }),
    ),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const personalSkillsFileSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    unitId: z.string().min(1),
    names: z.object({ en: z.string().min(1), zhHans: z.string().min(1) }),
    effect: z.string().min(1),
    effectZhHans: z.string().min(1).optional(),
    iconAssetId: z.string().regex(/^[a-z][a-z0-9_]*$/),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const classAffiliationSchema = z.enum(["hoshidan", "nohrian", "special"]);
export const classCategorySchema = z.enum(["special"]);

const classTreeNodeSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(1),
  labelZhHans: z.string().min(1).optional(),
  affiliation: classAffiliationSchema,
});

export const classTreeFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("standard_non_dlc"),
  classes: z.array(
    classTreeNodeSchema.extend({
      categories: z.array(classCategorySchema).max(1).optional(),
      promotions: z.array(classTreeNodeSchema).max(2),
    }).refine(
      (record) => record.promotions.length > 0 || record.id === "songstress",
      { message: "Only Songstress may be a standalone class-tree node." },
    ),
  ).min(1),
  provenance: z.array(sourceRefSchema).min(1),
});

export const classStatsFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("standard_playable_non_dlc"),
  classes: z.array(z.object({
    classId: z.string().min(1),
    displayName: z.string().min(1),
    displayNameZhHans: z.string().min(1).optional(),
    tier: z.enum(["base", "advanced", "special"]),
    growthRates: statBlockSchema,
    maximumStats: statBlockSchema,
    weaponRankCaps: z.record(z.string(), weaponRankSchema),
  })).min(1),
  provenance: z.array(sourceRefSchema).min(1),
});

const weaponTypeIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const weaponTypesFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("standard_playable_non_dlc"),
  weaponTypes: z.array(z.object({
    id: weaponTypeIdSchema,
    names: z.object({ en: z.string().min(1), zhHans: z.string().min(1).optional() }),
    iconAssetId: weaponTypeIdSchema,
    displayOrder: z.number().int().positive(),
    provenance: z.array(sourceRefSchema).min(1),
  })).length(9),
});

export const weaponIconManifestFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("milestone-008-standard-weapon-types"),
  counts: z.object({ weaponTypeIcons: z.number().int().nonnegative() }),
  entries: z.array(z.object({
    weaponTypeId: weaponTypeIdSchema,
    canonicalName: z.string().min(1),
    sourcePageIds: z.array(z.string().min(1)).min(1),
    sourcePageUrls: z.array(z.string().url()).min(1),
    sourceImageUrl: z.string().url().regex(/\.png(?:\/[^?]*)?(?:\?.*)?$/i),
    localDestination: z.string().regex(
      /^src\/games\/fe14\/assets\/weapon_type_icons\/[a-z][a-z0-9_]*\.png$/,
    ),
  })).length(9),
});

export const classSkillAcquisitionSchema = z.object({
  classId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  level: z.number().int().positive(),
  gender: z.enum(["male", "female"]).optional(),
});

export const classSkillsFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("standard_non_dlc"),
  skills: z.array(
    z.object({
      id: z.string().regex(/^[a-z][a-z0-9_]*$/),
      names: z.object({ en: z.string().min(1), zhHans: z.string().min(1).optional() }),
      description: z.string().min(1),
      descriptionZhHans: z.string().min(1).optional(),
      iconAssetId: z.string().regex(/^[a-z][a-z0-9_]*$/),
      acquisition: z.array(classSkillAcquisitionSchema).min(1),
      notes: z.array(z.string().min(1)).optional(),
      notesZhHans: z.array(z.string().min(1)).optional(),
      provenance: z.array(sourceRefSchema).min(1),
    }),
  ).min(1),
});

const skillIconManifestEntrySchema = z.object({
  skillId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  skillType: z.enum(["class", "personal"]),
  unitId: z.string().min(1).optional(),
  canonicalName: z.string().min(1),
  sourceNames: z.array(z.string().min(1)).min(1),
  sourcePageIds: z.array(z.string().min(1)).min(1),
  sourcePageUrls: z.array(z.string().url()).min(1),
  sourceImageUrl: z.string().url().regex(/\.png$/i),
  localDestination: z.string().regex(
    /^src\/games\/fe14\/assets\/(class_skill_icons|personal_skill_icons)\/[a-z][a-z0-9_]*\.png$/,
  ),
}).superRefine((entry, context) => {
  if (entry.skillType === "personal" && !entry.unitId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Personal-skill icon entries require unitId.",
      path: ["unitId"],
    });
  }
  if (entry.skillType === "class" && entry.unitId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Class-skill icon entries must not define unitId.",
      path: ["unitId"],
    });
  }
});

export const skillIconManifestFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("milestone-007-standard-class-and-playable-personal-skills"),
  sourceInventoryCapturedAt: z.string().datetime(),
  counts: z.object({
    classIcons: z.number().int().nonnegative(),
    personalIcons: z.number().int().nonnegative(),
    totalIcons: z.number().int().nonnegative(),
  }),
  entries: z.array(skillIconManifestEntrySchema).min(1),
});

export const domainSchemas = {
  "data/sources/fe14/sources.json": sourceCatalogSchema,
  "data/sources/fe14/skill-icon-sources.json": skillIconManifestFileSchema,
  "data/sources/fe14/weapon-icon-sources.json": weaponIconManifestFileSchema,
  "data/normalized/fe14/units/first-generation.json": rosterSchema,
  "data/normalized/fe14/units/second-generation.json": secondGenerationRosterSchema,
  "data/normalized/fe14/child-parentage.json": childParentageFileSchema,
  "data/normalized/fe14/child-recruitment.json": childRecruitmentFileSchema,
  "data/normalized/fe14/class-trees.json": classTreeFileSchema,
  "data/normalized/fe14/class-stats.json": classStatsFileSchema,
  "data/normalized/fe14/weapon-types.json": weaponTypesFileSchema,
  "data/normalized/fe14/class-skills.json": classSkillsFileSchema,
  "data/normalized/fe14/unit-availability.json": availabilityFileSchema,
  "data/normalized/fe14/unit-base-stats.json": baseStatsFileSchema,
  "data/normalized/fe14/unit-growths.json": growthsFileSchema,
  "data/normalized/fe14/unit-cap-modifiers.json": capModifiersFileSchema,
  "data/normalized/fe14/avatar-configurations.json": avatarConfigurationsFileSchema,
  "data/normalized/fe14/unit-pairup-bonuses.json": pairupFileSchema,
  "data/normalized/fe14/support-relationships.json": supportsFileSchema,
  "data/normalized/fe14/unit-class-access.json": classAccessFileSchema,
  "data/normalized/fe14/personal-skills.json": personalSkillsFileSchema,
} as const;

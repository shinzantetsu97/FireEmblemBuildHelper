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

export const sourceRefSchema = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  reviewStatus: reviewStatusSchema,
});

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

export const rosterSchema = z.object({
  gameId: z.literal("fe14"),
  rosterKind: z.literal("first_generation"),
  units: z.array(
    z.object({
      id: z.string().regex(/^[a-z][a-z0-9_]*$/),
      unitNo: z.number().int().positive(),
      processingOrder: z.number().int().positive(),
      availableRoutes: z.array(routeSchema).min(1),
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
      notes: z.array(z.string().min(1)).optional(),
      supportNotes: z.array(z.string().min(1)).optional(),
    }),
  ),
});

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
    })
    .refine(
      ({ facilityId, facilityIds }) => Boolean(facilityId) !== Boolean(facilityIds),
      { message: "My Castle recruitment must specify either facilityId or facilityIds" },
    )
    .optional(),
  autoLevel: z
    .object({
      basis: z.literal("displayed_story_chapter"),
      minimumLevel: z.number().int().positive(),
      maximumLevel: z.number().int().positive().optional(),
      milestones: z
        .array(
          z.object({
            displayedChapterStart: z.number().int().nonnegative(),
            displayedChapterEnd: z.number().int().nonnegative().optional(),
            level: z.number().int().positive(),
          }),
        )
        .min(1),
      statCalculation: z.literal("average_growths_round_half_up"),
      statBaseLevel: z.number().int().positive(),
      growthClassId: z.string().min(1),
      skillsLearnedAutomatically: z.boolean(),
      modelBasis: z.literal("castle_recruit_autolevel"),
      comparisonModel: z.literal("offspring_seal_esque_level_scaling"),
      comparisonStatus: z.literal("unverified"),
      weaponProficiencyScales: z.boolean(),
      weaponProficiencyMilestonesStatus: z.literal("unresolved"),
      evidenceStatus: z.enum(["tested", "partial"]),
      note: z.string().min(1),
    })
    .optional(),
  temporarilyLeavesAfterChapter: z.number().int().nonnegative().optional(),
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

export const statBlockSchema = z.object({
  hp: z.number().int(),
  strength: z.number().int(),
  magic: z.number().int(),
  skill: z.number().int(),
  speed: z.number().int(),
  luck: z.number().int(),
  defense: z.number().int(),
  resistance: z.number().int(),
});

export const baseStatsFileSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    availabilityId: z.string().min(1).optional(),
    availabilityIds: z.array(z.string().min(1)).min(2).optional(),
    level: z.number().int().positive(),
    classId: z.string().min(1),
    stats: statBlockSchema,
    weaponRanks: z.record(z.string(), z.enum(["E", "D", "C", "B", "A", "S"])),
    weaponRanksByAvailability: z
      .record(z.string(), z.record(z.string(), z.enum(["E", "D", "C", "B", "A", "S"])))
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
    startingSkillIds: z.array(z.string().min(1)),
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
    kind: z.literal("personal"),
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
    id: z.string().min(1),
    unitId: z.string().min(1),
    names: z.object({ en: z.string().min(1), zhHans: z.string().min(1) }),
    effect: z.string().min(1),
    provenance: z.array(sourceRefSchema).min(1),
  }),
);

export const classTreeFileSchema = z.object({
  gameId: z.literal("fe14"),
  scope: z.literal("standard_non_dlc"),
  classes: z.array(
    z.object({
      id: z.string().min(1),
      promotions: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1).max(2),
    }),
  ).min(1),
  provenance: z.array(sourceRefSchema).min(1),
});

export const domainSchemas = {
  "data/sources/fe14/sources.json": sourceCatalogSchema,
  "data/normalized/fe14/units/first-generation.json": rosterSchema,
  "data/normalized/fe14/class-trees.json": classTreeFileSchema,
  "data/normalized/fe14/unit-availability.json": availabilityFileSchema,
  "data/normalized/fe14/unit-base-stats.json": baseStatsFileSchema,
  "data/normalized/fe14/unit-growths.json": growthsFileSchema,
  "data/normalized/fe14/unit-cap-modifiers.json": capModifiersFileSchema,
  "data/normalized/fe14/unit-pairup-bonuses.json": pairupFileSchema,
  "data/normalized/fe14/support-relationships.json": supportsFileSchema,
  "data/normalized/fe14/unit-class-access.json": classAccessFileSchema,
  "data/normalized/fe14/personal-skills.json": personalSkillsFileSchema,
} as const;

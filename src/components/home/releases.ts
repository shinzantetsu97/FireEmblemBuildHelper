export const RELEASES = [
  {
    version: "0.6.0",
    date: "2026-07-19",
    dateLabel: "July 19, 2026",
    title: "Route-driven FE14 base configuration",
    current: true,
    changes: [
      "Rebuilt unit starting-state profiles around a shared route resolver so recruitment timing, joining stats, growths, inventory, learned skills, weapon levels, cap modifiers, and stance bonuses update together.",
      "Added normalized FE14 class growth rates, complete weapon-type metadata with local icons, validated starting-skill derivation, and explicit multi-state handling for temporary appearances and permanent rejoins.",
      "Added offspring route and parent filtering, earliest-paralogue timing, story-scaled levels, Offspring Seal projections, pre-inheritance growth comparisons, and an editable parent-stat recruitment calculator.",
      "Consolidated duplicated unit-profile sections into compact stat and support grids while preserving Corrin Talent exceptions, special recruitment notes, supports, seal previews, and JSON inspection.",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-07-18",
    dateLabel: "July 18, 2026",
    title: "FE14 skill data and accessible class planning",
    changes: [
      "Added 106 validated standard class skills with canonical IDs, acquisition edges, source-backed effects, and locally stored icons, plus local personal-skill icons for all 69 playable roster slots.",
      "Added the searchable FE14 skill directory with Hoshidan, Nohrian, and special-class filters, class-tree selection controls, and deduplicated skill results.",
      "Added compact class-skill cards to every unit profile, including hover details, gender-aware class and skill labels, dynamic offspring inheritance, and Friendship or Partner Seal access previews.",
      "Expanded Corrin's build access to resolve every same-gender A-support tree at once, preserve the selected Talent and Partner Seal priorities, and handle Monk, Shrine Maiden, Butler, and Maid gender parallels.",
    ],
  },
  {
    version: "0.4.2",
    date: "2026-07-17",
    dateLabel: "July 17, 2026",
    title: "FE14 autolevel scaling corrections",
    changes: [
      "Replaced the speculative castle-recruit model with verified level schedules for Izana, Flora, Yukimura, and Fuga, and recorded the shared story-scaling rules used by offspring and Offspring Seals. Thanks to FE14 modder ltranc@ for identifying and explaining the underlying mechanic.",
      "Simplified castle-recruit profiles by removing the obsolete uncertainty banner and showing compact chapter-to-level progressions while retaining technical details in the JSON data.",
    ],
  },
  {
    version: "0.4.1",
    date: "2026-07-17",
    dateLabel: "July 17, 2026",
    title: "Offspring inheritance edge-case fixes",
    changes: [
      "Corrected Nyx!Nina to inherit Diviner instead of Archer and Beruka!Percy to inherit Sky Knight instead of Oni Savage when both ordinary maternal class trees are exhausted.",
      "Added regression coverage for all three exhaustive inheritance cases, including Jakob!Shigure receiving Wyvern Rider from Azura after Jakob supplies Troubadour.",
      "Prioritized validated class-skill data and player-configurable unit-page layouts, including an accessible-skills-first arrangement, in the immediate roadmap.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-07-17",
    dateLabel: "July 17, 2026",
    title: "Complete FE14 second-generation roster",
    changes: [
      "Added all 21 second-generation unit profiles with canonical ordering, portraits, recruitment data, growths, cap modifiers, supports, stance bonuses, inherited traits, and source provenance.",
      "Added dynamic parent selection with recursive offspring-parent resolution, Corrin boon, bane, and Talent controls, gender-aware Kana presentation, and parent-dependent class and support outcomes.",
      "Added an interactive recruitment-stat calculator and inheritance flow, Offspring Seal promotion projections, class maximums, generation filtering, validation reports, and targeted offspring-mechanics tests.",
    ],
  },
  {
    version: "0.3.1",
    date: "2026-07-16",
    dateLabel: "July 16, 2026",
    title: "Frontend structure and support polish",
    changes: [
      "Split the frontend pages into focused components and grouped FE14 data, pages, unit components, and portraits under a dedicated game package.",
      "Rebalanced relationship lists with A and Friendship supports on the left, Partner supports on the right, and explicit Corrin (M) / Corrin (F) labels.",
      "Removed internal acceptance-status labels from the Attack Stance and Guard Stance table headers.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-16",
    dateLabel: "July 16, 2026",
    title: "Complete FE14 first-generation roster",
    changes: [
      "Completed all 48 parent-generation profiles with portraits, route-specific recruitment, stats, class access, supports, seal outcomes, stance bonuses, and references.",
      "Added interactive Corrin controls for gender, boon, bane, Talent, bases, growths, cap modifiers, support coverage, and stance bonuses.",
      "Added DLC-exclusive roster handling and Anna's separate NPC-scaling and recruited-unit data.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-16",
    dateLabel: "July 16, 2026",
    title: "FE14 unit data visualizer",
    changes: [
      "Introduced the validated FE14 data pipeline, generated runtime JSON, and source-review reports.",
      "Added the portrait roster, route filters, unit profiles, class-tree hints, and expandable JSON explorer.",
      "Established Felicia as the reference profile before expanding the first-generation roster.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-15",
    dateLabel: "July 15, 2026",
    title: "Browser-local notes workspace",
    changes: [
      "Added persistent planning notes stored locally in the browser.",
      "Added versioned JSON backup and restore plus readable text export.",
      "Prepared the static React application for GitHub Pages deployment.",
    ],
  },
  {
    version: "0.0.1",
    date: "2026-05-25",
    dateLabel: "May 25, 2026",
    title: "Project foundation",
    changes: [
      "Created the initial project structure, product documentation, and development workflow.",
      "Explored a local SQLite notes prototype that was later superseded by the static, browser-local application.",
    ],
  },
] as const;

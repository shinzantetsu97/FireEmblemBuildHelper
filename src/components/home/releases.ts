export const RELEASES = [
  {
    version: "0.4.1",
    date: "2026-07-17",
    dateLabel: "July 17, 2026",
    title: "Offspring inheritance edge-case fixes",
    current: true,
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

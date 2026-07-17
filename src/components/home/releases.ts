export const RELEASES = [
  {
    version: "0.3.0",
    date: "2026-07-16",
    dateLabel: "July 16, 2026",
    title: "Complete FE14 first-generation roster",
    current: true,
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

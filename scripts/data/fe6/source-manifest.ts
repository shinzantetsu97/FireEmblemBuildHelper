export type SourceDomain = "identity" | "units" | "supports" | "classes" | "inventory";

export type SourceDefinition = {
  id: string;
  title: string;
  url: string;
  relativePath: string;
  domain: SourceDomain;
  expectedHeading: string;
  expectedHeaders: string[];
  minimumRows: number;
};

const ROOT = "https://serenesforest.net/binding-blade";

export const FE6_SOURCES: SourceDefinition[] = [
  {
    id: "serenes-fe6-name-chart",
    title: "Binding Blade Name Chart",
    url: `${ROOT}/general/name-chart/`,
    relativePath: "identity/name-chart.html",
    domain: "identity",
    expectedHeading: "Name Chart",
    expectedHeaders: ["Japanese name", "Romaji", "Official JPN", "Fan name", "NOA Name"],
    minimumRows: 54,
  },
  {
    id: "serenes-fe6-recruitment",
    title: "Binding Blade Character Recruitment",
    url: `${ROOT}/characters/recruitment/`,
    relativePath: "characters/recruitment.html",
    domain: "units",
    expectedHeading: "Recruitment",
    expectedHeaders: ["Name", "Class", "Ch", "Recruit"],
    minimumRows: 50,
  },
  {
    id: "serenes-fe6-character-base-stats",
    title: "Binding Blade Character Base Stats",
    url: `${ROOT}/characters/base-stats/`,
    relativePath: "characters/base-stats.html",
    domain: "units",
    expectedHeading: "Base Stats",
    expectedHeaders: ["Name", "Class", "Lv", "HP", "S/M", "Skl", "Spd", "Lck", "Def", "Res", "Con", "Mov", "Affin", "Weapon ranks"],
    minimumRows: 54,
  },
  {
    id: "serenes-fe6-character-growth-rates",
    title: "Binding Blade Character Growth Rates",
    url: `${ROOT}/characters/growth-rates/`,
    relativePath: "characters/growth-rates.html",
    domain: "units",
    expectedHeading: "Growth Rates",
    expectedHeaders: ["Name", "HP", "S/M", "Skl", "Spd", "Lck", "Def", "Res"],
    minimumRows: 54,
  },
  {
    id: "serenes-fe6-starting-items",
    title: "Binding Blade Starting Items",
    url: `${ROOT}/characters/starting-items/`,
    relativePath: "characters/starting-items.html",
    domain: "units",
    expectedHeading: "Starting Items",
    expectedHeaders: ["Name", "Item 1", "Item 2", "Item 3", "Item 4"],
    minimumRows: 54,
  },
  {
    id: "serenes-fe6-supports",
    title: "Binding Blade Supports",
    url: `${ROOT}/characters/supports/`,
    relativePath: "characters/supports.html",
    domain: "supports",
    expectedHeading: "Supports",
    expectedHeaders: ["Character", "Option 1"],
    minimumRows: 50,
  },
  {
    id: "serenes-fe6-support-calculation",
    title: "Binding Blade Support Calculation",
    url: `${ROOT}/characters/supports/calculation/`,
    relativePath: "characters/support-calculation.html",
    domain: "supports",
    expectedHeading: "Calculation",
    expectedHeaders: [],
    minimumRows: 0,
  },
  {
    id: "serenes-fe6-class-introduction",
    title: "Binding Blade Class Introduction",
    url: `${ROOT}/classes/introduction/`,
    relativePath: "classes/introduction.html",
    domain: "classes",
    expectedHeading: "Introduction",
    expectedHeaders: ["Class", "Weapons", "Promotes to", "Notes"],
    minimumRows: 35,
  },
  {
    id: "serenes-fe6-class-base-stats",
    title: "Binding Blade Class Base Stats",
    url: `${ROOT}/classes/base-stats/`,
    relativePath: "classes/base-stats.html",
    domain: "classes",
    expectedHeading: "Base Stats",
    expectedHeaders: ["Class", "HP", "S/M", "Skl", "Spd", "Def", "Res", "Con", "Mov", "Weapon ranks"],
    minimumRows: 45,
  },
  {
    id: "serenes-fe6-class-maximum-stats",
    title: "Binding Blade Class Maximum Stats",
    url: `${ROOT}/classes/maximum-stats/`,
    relativePath: "classes/maximum-stats.html",
    domain: "classes",
    expectedHeading: "Maximum Stats",
    expectedHeaders: ["Class", "S/M", "Skl", "Spd", "Def", "Res", "Con"],
    minimumRows: 25,
  },
  {
    id: "serenes-fe6-promotion-gains",
    title: "Binding Blade Promotion Gains",
    url: `${ROOT}/classes/promotion-gains/`,
    relativePath: "classes/promotion-gains.html",
    domain: "classes",
    expectedHeading: "Promotion Gains",
    expectedHeaders: ["Class", "Promotion", "HP", "S/M", "Skl", "Spd", "Def", "Res", "Con", "Mov", "Weapon ranks"],
    minimumRows: 20,
  },
  ...[
    ["swords", "Swords"],
    ["lances", "Lances"],
    ["axes", "Axes"],
    ["bows", "Bows"],
    ["staves", "Staves"],
    ["anima-tomes", "Anima Tomes"],
    ["light-tomes", "Light Tomes"],
    ["dark-tomes", "Dark Tomes"],
    ["items", "Items"],
  ].map(([slug, title]) => ({
    id: `serenes-fe6-inventory-${slug}`,
    title: `Binding Blade ${title}`,
    url: `${ROOT}/inventory/${slug}/`,
    relativePath: `inventory/${slug}.html`,
    domain: "inventory" as const,
    expectedHeading: title,
    expectedHeaders: slug === "items" ? ["Name", "Uses", "Worth", "Effects"] : ["Name", "Rank", "Rng", "Uses", "Worth", "Effects"],
    minimumRows: slug === "items" ? 25 : 3,
  })),
];

export const sourceById = new Map(FE6_SOURCES.map((source) => [source.id, source]));

export const SOURCE_LOCATIONS = {
  "fe14-workbook-cn": "火纹if.xlsx",
  "serenes-fe14-base-stats":
    "https://serenesforest.net/fire-emblem-fates/revelation/character-base-stats/",
  "serenes-fe14-growth-rates":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/growth-rates/",
  "serenes-fe14-maximum-stats":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/maximum-stats/",
  "serenes-fe14-class-sets":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/class-sets/",
  "serenes-fe14-pair-up-stats":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/pair-up-stats/",
  "serenes-fe14-support-bonuses":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/supports/support-bonus/",
  "serenes-fe14-personal-skills":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/personal-skills/",
  "serenes-fe14-supports":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/supports/",
  "fewiki-felicia": "https://fireemblemwiki.org/wiki/Felicia",
  "fewiki-felicia-supports": "https://fireemblemwiki.org/wiki/Felicia/Supports",
  "fewiki-jakob": "https://fireemblemwiki.org/wiki/Jakob",
  "fewiki-jakob-supports": "https://fireemblemwiki.org/wiki/Jakob/Supports",
  "fewiki-kaze": "https://fireemblemwiki.org/wiki/Kaze",
  "fewiki-kaze-supports": "https://fireemblemwiki.org/wiki/Kaze/Supports",
  "fewiki-silas": "https://fireemblemwiki.org/wiki/Silas",
  "fewiki-silas-supports": "https://fireemblemwiki.org/wiki/Silas/Supports",
  "fewiki-azura": "https://fireemblemwiki.org/wiki/Azura",
  "fewiki-azura-supports": "https://fireemblemwiki.org/wiki/Azura/Supports",
  "fewiki-mozu": "https://fireemblemwiki.org/wiki/Mozu",
  "fewiki-mozu-supports": "https://fireemblemwiki.org/wiki/Mozu/Supports",
  "fewiki-shura": "https://fireemblemwiki.org/wiki/Shura",
  "fewiki-shura-supports": "https://fireemblemwiki.org/wiki/Shura/Supports",
  "fewiki-izana": "https://fireemblemwiki.org/wiki/Izana",
  "user-fe14-izana-recruitment": "User-provided Fire Emblem Fates gameplay verification",
  "reddit-fe14-castle-recruit-scaling":
    "https://www.reddit.com/r/fireemblem/comments/ra1sjh/floraizana_level_scaling/",
  "pegasusknight-fe14-parent-units":
    "https://www.pegasusknight.com/wiki/fe14/%E3%83%A6%E3%83%8B%E3%83%83%E3%83%88/%E3%83%A6%E3%83%8B%E3%83%83%E3%83%88%E8%A9%95%E4%BE%A1%EF%BC%88%E8%A6%AA%E4%B8%96%E4%BB%A3%EF%BC%89",
  "paragon-fe14-data-schemas": "https://github.com/thane98/paragon/tree/poetry/Data/FE14/Types",
  "serenes-fe14-hoshidan-other-data":
    "https://serenesforest.net/fire-emblem-fates/hoshidan-characters/other-data/",
  "serenes-fe14-nohrian-other-data":
    "https://serenesforest.net/fire-emblem-fates/nohrian-characters/other-data/",
  "fe14-partner-seal-chart":
    "https://drive.google.com/file/d/0B1EoYvI1FUNqZ3dpcjZwdU9CX0E/view?resourcekey=0-zq0JMUw2kAIcBfIeCmCR-A",
  "fe14-friendship-seal-chart":
    "https://drive.google.com/file/d/0B1EoYvI1FUNqaHhSd1pzUFJNSmc/view?resourcekey=0-kX2rTu6-3jF-6EDm8T7YXQ",
  "fewiki-fe14-name-chart": "https://fireemblemwiki.org/wiki/Name_chart/Fire_Emblem_Fates",
  "fewiki-fe14-classes": "https://fireemblemwiki.org/wiki/List_of_classes_in_Fire_Emblem_Fates",
} as const;

export type SourceId = keyof typeof SOURCE_LOCATIONS;

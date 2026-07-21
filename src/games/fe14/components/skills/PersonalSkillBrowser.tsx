import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { Search } from "lucide-react";
import { fe14Data, getPortraitUrl, type UnitRuntime } from "../../data";
import { getPersonalSkillIconUrl } from "../../skillAssets";
import { useLocale } from "../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../i18n/messages/en";
import SkillEffectText from "./SkillEffectText";

type RouteFilter = "all" | "birthright" | "conquest" | "revelation" | "dlc";
type GenerationFilter = "all" | "first" | "second";

const ROUTE_OPTIONS: Array<{ id: RouteFilter; labelKey: MessageKey }> = [
  { id: "all", labelKey: "filter.route.all" },
  { id: "birthright", labelKey: "filter.route.birthright" },
  { id: "conquest", labelKey: "filter.route.conquest" },
  { id: "revelation", labelKey: "filter.route.revelation" },
  { id: "dlc", labelKey: "filter.route.dlc" },
];

const GENERATION_OPTIONS: Array<{ id: GenerationFilter; labelKey: MessageKey }> = [
  { id: "all", labelKey: "filter.generation.all" },
  { id: "first", labelKey: "filter.generation.first" },
  { id: "second", labelKey: "filter.generation.second" },
];

interface PersonalSkillEntry {
  unit: UnitRuntime;
  skill: NonNullable<UnitRuntime["personalSkill"]>;
}

export default function PersonalSkillBrowser() {
  const { t, resolve } = useLocale();
  const [route, setRoute] = useState<RouteFilter>("all");
  const [generation, setGeneration] = useState<GenerationFilter>("all");
  const [skillSearch, setSkillSearch] = useState("");
  const [characterSearch, setCharacterSearch] = useState("");

  const entries = useMemo<PersonalSkillEntry[]>(
    () =>
      fe14Data.units
        .filter((unit): unit is PersonalSkillEntry["unit"] => unit.personalSkill !== null)
        .map((unit) => ({ unit, skill: unit.personalSkill! })),
    [],
  );

  const visibleEntries = entries.filter(({ unit, skill }) => {
    const { identity } = unit;
    const matchesRoute =
      route === "all" ||
      (route === "dlc"
        ? identity.availabilityCategory === "dlc_exclusive"
        : identity.availableRoutes.includes(route));
    const matchesGeneration = generation === "all" || identity.generation === generation;
    const matchesSkill = matchesSubstring(skillSearchHaystack(skill), skillSearch);
    const matchesCharacter = matchesSubstring(characterSearchHaystack(identity), characterSearch);
    return matchesRoute && matchesGeneration && matchesSkill && matchesCharacter;
  });

  return (
    <section className="personal-skill-browser" aria-label={t("personalSkills.directoryAria")}>
      <div className="class-skill-browser-toolbar">
        <div className="class-skill-browser-filters">
          <ButtonGroup aria-label={t("filter.route.aria")}>
            {ROUTE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={route === option.id ? "dark" : "outline-secondary"}
                aria-pressed={route === option.id}
                onClick={() => setRoute(option.id)}
              >
                {t(option.labelKey)}
              </Button>
            ))}
          </ButtonGroup>
          <ButtonGroup aria-label={t("filter.generation.aria")}>
            {GENERATION_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={generation === option.id ? "dark" : "outline-secondary"}
                aria-pressed={generation === option.id}
                onClick={() => setGeneration(option.id)}
              >
                {t(option.labelKey)}
              </Button>
            ))}
          </ButtonGroup>
          <label className="class-skill-search-control">
            <Search aria-hidden="true" size={15} />
            <span>{t("search.skill")}</span>
            <input
              type="search"
              value={skillSearch}
              aria-label={t("search.skill.aria")}
              onChange={(event) => setSkillSearch(event.target.value)}
            />
          </label>
          <label className="class-skill-search-control">
            <Search aria-hidden="true" size={15} />
            <span>{t("search.character")}</span>
            <input
              type="search"
              value={characterSearch}
              aria-label={t("search.character.aria")}
              onChange={(event) => setCharacterSearch(event.target.value)}
            />
          </label>
        </div>
        <span>{t("personalSkills.count", { count: visibleEntries.length })}</span>
      </div>

      <div className="personal-skill-results" aria-live="polite">
        {visibleEntries.length > 0 ? (
          visibleEntries.map(({ unit, skill }) => {
            const characterName = resolve(unit.identity.names, unit.identity.displayName);
            return (
              <article className="personal-skill-result" key={unit.identity.id}>
                <img
                  className="personal-skill-portrait"
                  src={getPortraitUrl(unit.identity)}
                  alt=""
                  loading="lazy"
                />
                <div className="personal-skill-result-copy">
                  <div className="personal-skill-result-head">
                    <img
                      className="class-skill-icon"
                      src={getPersonalSkillIconUrl(skill.iconAssetId)}
                      alt=""
                      width={24}
                      height={24}
                    />
                    <strong>{resolve(skill.names, skill.names.en)}</strong>
                    <span className="personal-skill-character">{characterName}</span>
                  </div>
                  <p><SkillEffectText en={skill.effect} zhHans={skill.effectZhHans} /></p>
                </div>
              </article>
            );
          })
        ) : (
          <p className="class-skill-empty">{t("personalSkills.empty")}</p>
        )}
      </div>
    </section>
  );
}

function skillSearchHaystack(skill: NonNullable<UnitRuntime["personalSkill"]>): string {
  return [skill.names.en, skill.names.zhHans].filter(Boolean).join(" ");
}

function characterSearchHaystack(identity: UnitRuntime["identity"]): string {
  return [
    identity.displayName,
    identity.names?.en,
    identity.names?.ja,
    identity.names?.jaLatn,
    identity.names?.zhHans,
  ]
    .filter(Boolean)
    .join(" ");
}

// Case-insensitive substring match that also works for CJK queries.
function matchesSubstring(haystack: string, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return haystack.toLocaleLowerCase().includes(normalizedQuery);
}

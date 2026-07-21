import Form from "react-bootstrap/Form";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { fe14Data, getPortraitUrl } from "../../../data";
import { AppLink } from "../../../../../router";
import { useLocale } from "../../../../../i18n/LocaleContext";
import type { MessageKey } from "../../../../../i18n/messages/en";

const ROUTE_OPTION_KEYS: Record<string, MessageKey> = {
  all: "filter.route.all",
  birthright: "filter.route.birthright",
  conquest: "filter.route.conquest",
  revelation: "filter.route.revelation",
  dlc: "filter.route.dlc",
};

const GENERATION_OPTION_KEYS: Record<string, MessageKey> = {
  all: "filter.generation.all",
  first: "filter.generation.first",
  second: "filter.generation.second",
};

const ROUTE_OPTIONS = [
  { value: "all", label: "All routes" },
  { value: "birthright", label: "Birthright" },
  { value: "conquest", label: "Conquest" },
  { value: "revelation", label: "Revelation" },
  { value: "dlc", label: "DLC-exclusive" },
] as const;

const ROUTE_KEYS: Record<string, string> = {
  birthright: "BR",
  conquest: "CQ",
  revelation: "RV",
};

const ROUTE_KEYS_ZH: Record<string, string> = {
  birthright: "白夜",
  conquest: "暗夜",
  revelation: "透魔",
};

const GENERATION_OPTIONS = [
  { value: "all", label: "All generations" },
  { value: "first", label: "First generation" },
  { value: "second", label: "Second generation" },
] as const;

export default function UnitDirectory() {
  const { t, resolve, locale } = useLocale();
  const [route, setRoute] = useState<(typeof ROUTE_OPTIONS)[number]["value"]>("all");
  const [generation, setGeneration] = useState<(typeof GENERATION_OPTIONS)[number]["value"]>("all");
  const roster = fe14Data.roster.filter((unit) => {
    const matchesGeneration = generation === "all" || unit.generation === generation;
    const matchesRoute = route === "all"
      || (route === "dlc" ? unit.availabilityCategory === "dlc_exclusive" : unit.availableRoutes.includes(route));
    return matchesGeneration && matchesRoute;
  });
  const availableCount = roster.filter((unit) => unit.status !== "not_started").length;

  return (
    <>
      <header className="data-page-heading">
        <div>
          <p className="eyebrow">{t("fe14.eyebrow")}</p>
          <h1>{t("directory.title")}</h1>
        </div>
        <div className="unit-directory-controls">
          <Form.Group controlId="unit-route-filter">
            <Form.Label>{t("filter.route.aria")}</Form.Label>
            <Form.Select value={route} onChange={(event) => setRoute(event.target.value as typeof route)}>
              {ROUTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(ROUTE_OPTION_KEYS[option.value])}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="unit-generation-filter">
            <Form.Label>{t("filter.generation.aria")}</Form.Label>
            <Form.Select value={generation} onChange={(event) => setGeneration(event.target.value as typeof generation)}>
              {GENERATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(GENERATION_OPTION_KEYS[option.value])}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <span>{t("directory.available", { available: availableCount, total: roster.length })}</span>
        </div>
      </header>

      <section className="unit-directory" aria-label={t("directory.rosterAria")}>
        {roster.map((unit) => {
          const portrait = getPortraitUrl(unit);
          const ready = unit.status !== "not_started";
          const name = resolve(unit.names, unit.displayName);
          const content = (
            <>
              <img src={portrait} alt={t("unit.portraitAlt", { name })} loading="lazy" />
              <span className="unit-directory-number">{t("directory.number", { no: String(unit.unitNo).padStart(2, "0") })}</span>
              <div className="unit-directory-meta">
                <span className="unit-directory-name">{name}</span>
                <div className="unit-directory-tags">
                  <span className="unit-directory-routes">{formatRosterRoutes(unit.availableRoutes, locale)}</span>
                  {unit.availabilityCategory === "dlc_exclusive" ? (
                    <span className="unit-directory-category">{t("filter.route.dlc")}</span>
                  ) : null}
                </div>
                {ready ? <ChevronRight className="unit-directory-arrow" aria-hidden="true" size={17} /> : null}
              </div>
            </>
          );

          return ready ? (
            <AppLink key={unit.id} className="unit-directory-card is-ready" to={`/FE14/Units/${unit.slug}`}>
              {content}
            </AppLink>
          ) : (
            <article key={unit.id} className="unit-directory-card" aria-label={t("directory.queued", { name })}>
              {content}
            </article>
          );
        })}
      </section>
    </>
  );
}

function formatRosterRoutes(routes: string[], locale: string): string {
  if (["birthright", "conquest", "revelation"].every((route) => routes.includes(route))) {
    return locale === "zhHans" ? "全部路线" : "ALL";
  }
  const labels = locale === "zhHans" ? ROUTE_KEYS_ZH : ROUTE_KEYS;
  return routes.map((route) => labels[route] ?? route.toUpperCase()).join(" · ");
}

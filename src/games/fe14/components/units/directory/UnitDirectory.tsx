import Form from "react-bootstrap/Form";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { fe14Data, getPortraitUrl } from "../../../data";
import { AppLink } from "../../../../../router";

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

const GENERATION_OPTIONS = [
  { value: "all", label: "All generations" },
  { value: "first", label: "First generation" },
  { value: "second", label: "Second generation" },
] as const;

export default function UnitDirectory() {
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
          <p className="eyebrow">Fire Emblem Fates</p>
          <h1>FE14 Units</h1>
        </div>
        <div className="unit-directory-controls">
          <Form.Group controlId="unit-route-filter">
            <Form.Label>Route roster</Form.Label>
            <Form.Select value={route} onChange={(event) => setRoute(event.target.value as typeof route)}>
              {ROUTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="unit-generation-filter">
            <Form.Label>Generation</Form.Label>
            <Form.Select value={generation} onChange={(event) => setGeneration(event.target.value as typeof generation)}>
              {GENERATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <span>{availableCount} of {roster.length} units available</span>
        </div>
      </header>

      <section className="unit-directory" aria-label="FE14 unit roster">
        {roster.map((unit) => {
          const portrait = getPortraitUrl(unit);
          const ready = unit.status !== "not_started";
          const content = (
            <>
              <img src={portrait} alt={`${unit.displayName} portrait`} loading="lazy" />
              <span className="unit-directory-number">No. {String(unit.unitNo).padStart(2, "0")}</span>
              <div className="unit-directory-meta">
                <span className="unit-directory-name">{unit.displayName}</span>
                <div className="unit-directory-tags">
                  <span className="unit-directory-routes">{formatRosterRoutes(unit.availableRoutes)}</span>
                  {unit.availabilityCategory === "dlc_exclusive" ? (
                    <span className="unit-directory-category">DLC-exclusive</span>
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
            <article key={unit.id} className="unit-directory-card" aria-label={`${unit.displayName}, queued`}>
              {content}
            </article>
          );
        })}
      </section>
    </>
  );
}

function formatRosterRoutes(routes: string[]): string {
  if (["birthright", "conquest", "revelation"].every((route) => routes.includes(route))) return "ALL";
  return routes.map((route) => ROUTE_KEYS[route] ?? route.toUpperCase()).join(" · ");
}

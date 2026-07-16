import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { fe14Data, getPortraitUrl } from "../data/fe14";
import { AppLink } from "../router";

const ROUTE_OPTIONS = [
  { value: "all", label: "All routes" },
  { value: "birthright", label: "Birthright" },
  { value: "conquest", label: "Conquest" },
  { value: "revelation", label: "Revelation" },
] as const;

export default function UnitIndexPage({ notFound = false }: { notFound?: boolean }) {
  const [route, setRoute] = useState<(typeof ROUTE_OPTIONS)[number]["value"]>("all");
  const roster = fe14Data.roster.filter((unit) => route === "all" || unit.availableRoutes.includes(route));
  const availableCount = roster.filter((unit) => unit.status !== "not_started").length;

  return (
    <main>
      <Container className="data-main" fluid="lg">
        {notFound ? (
          <Alert variant="warning">That page is not part of the current FE14 data slice.</Alert>
        ) : null}

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
            <span>{availableCount} of {roster.length} units available</span>
          </div>
        </header>

        <section className="unit-directory" aria-label="First-generation unit roster">
          {roster.map((unit) => {
            const portrait = getPortraitUrl(unit);
            const ready = unit.status !== "not_started";
            const content = (
              <>
                <img src={portrait} alt={`${unit.displayName} portrait`} loading="lazy" />
                <span className="unit-directory-number">No. {String(unit.unitNo).padStart(2, "0")}</span>
                <span className="unit-directory-name">{unit.displayName}</span>
                <span className={`unit-status unit-status-${unit.status}`}>
                  {unit.status === "accepted" ? "Accepted" : ready ? "In review" : "Queued"}
                </span>
                {ready ? <ChevronRight className="unit-directory-arrow" aria-hidden="true" size={17} /> : null}
              </>
            );

            return ready ? (
              <AppLink
                key={unit.id}
                className="unit-directory-card is-ready"
                to={`/FE14/Units/${unit.slug}`}
              >
                {content}
              </AppLink>
            ) : (
              <article key={unit.id} className="unit-directory-card" aria-label={`${unit.displayName}, queued`}>
                {content}
              </article>
            );
          })}
        </section>
      </Container>
    </main>
  );
}

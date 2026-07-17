import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import { ChevronLeft } from "lucide-react";
import JsonExplorer from "../../JsonExplorer";
import { findUnitBySlug } from "../../../data/fe14";
import { AppLink } from "../../../router";
import { CastleRecruitDataAlert } from "./UnitAlerts";
import UnitHeader from "./UnitHeader";
import UnitOverview from "./UnitOverview";
import UnitViewToolbar, { type UnitView } from "./UnitViewToolbar";
import type { AvatarGender } from "./types";

export default function UnitDetail({ slug }: { slug: string }) {
  const [view, setView] = useState<UnitView>("overview");
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("male");
  const unit = findUnitBySlug(slug);

  if (!unit) {
    return (
      <main>
        <Container className="data-main" fluid="lg">
          <Alert variant="warning">This unit has not reached a reviewable JSON slice yet.</Alert>
          <AppLink className="back-link" to="/FE14/Units">
            <ChevronLeft aria-hidden="true" size={17} />
            FE14 Units
          </AppLink>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="unit-detail-main" fluid="lg">
        <AppLink className="back-link" to="/FE14/Units">
          <ChevronLeft aria-hidden="true" size={17} />
          FE14 Units
        </AppLink>
        {["izana", "yukimura", "flora", "fuga"].includes(unit.identity.id) ? (
          <CastleRecruitDataAlert unitName={unit.identity.displayName} />
        ) : null}
        <UnitHeader unit={unit} avatarGender={avatarGender} setAvatarGender={setAvatarGender} />
        <UnitViewToolbar onChange={setView} view={view} />
        {view === "overview" ? (
          <UnitOverview unit={unit} avatarGender={avatarGender} setAvatarGender={setAvatarGender} />
        ) : (
          <JsonExplorer value={unit} label={`${unit.identity.displayName} JSON tree`} />
        )}
      </Container>
    </main>
  );
}

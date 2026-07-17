import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import { ChevronLeft } from "lucide-react";
import JsonExplorer from "../../../../../components/JsonExplorer";
import { findUnitBySlug } from "../../../data";
import { AppLink } from "../../../../../router";
import UnitHeader from "./UnitHeader";
import UnitOverview from "./UnitOverview";
import UnitViewToolbar, { type UnitView } from "./UnitViewToolbar";
import type { AvatarGender } from "./types";

export default function UnitDetail({ slug }: { slug: string }) {
  const [view, setView] = useState<UnitView>("overview");
  const [avatarGender, setAvatarGender] = useState<AvatarGender>(() => defaultGender(slug));
  const unit = findUnitBySlug(slug);

  useEffect(() => setAvatarGender(defaultGender(slug)), [slug]);

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

function defaultGender(slug: string): AvatarGender {
  return slug.toLocaleLowerCase() === "kana" ? "female" : "male";
}

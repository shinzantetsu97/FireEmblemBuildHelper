import { useState } from "react";
import Alert from "react-bootstrap/Alert";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { type UnitRuntime } from "../../../data/fe14";
import {
  AvatarConfigurationSection,
  AvatarPairupSection,
  avatarTalentClassIds,
} from "./AvatarConfiguration";
import { ClassTreeLabel, ClassTreeList } from "./ClassTree";
import PairupTable from "./PairupTable";
import RecruitmentSection from "./RecruitmentSection";
import SectionHeading from "./SectionHeading";
import StatComparison from "./StatComparison";
import SupportDirectory from "./SupportDirectory";
import { type AvatarGender } from "./types";
import { ScarletDepartureAlert } from "./UnitAlerts";
import { corrinNobleBaseLabel } from "./UnitHeader";
import UnitReferences from "./UnitReferences";
import { corrinTalentLabel } from "./utils";

export default function UnitOverview({
  unit,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarGender: AvatarGender;
  setAvatarGender: (gender: AvatarGender) => void;
}) {
  const config = unit.avatarConfiguration;
  const [boonId, setBoonId] = useState("robust");
  const [baneId, setBaneId] = useState("weak");
  const [talentId, setTalentId] = useState("cavalier");
  const boon = config?.boons.find((choice) => choice.id === boonId) ?? config?.boons[0];
  const bane = config?.banes.find((choice) => choice.id === baneId) ?? config?.banes[1];
  const talent = config?.talents.find((choice) => choice.id === talentId) ?? config?.talents[0];
  const avatarSelection = config && boon && bane && talent
    ? { config, boon, bane, talent, gender: avatarGender, boonId, baneId, talentId, setBoonId, setBaneId, setTalentId, setGender: setAvatarGender }
    : null;

  return (
    <div className="unit-overview">
      {unit.identity.id === "corrin" ? (
        <Alert className="review-alert" variant="warning">
          <TriangleAlert aria-hidden="true" size={19} />
          <span>Corrin's displayed data begins from the neutral Avatar template. Apply one boon and one different-stat bane from the configuration tables below.</span>
        </Alert>
      ) : (
        <Alert className="review-alert" variant="warning">
          <TriangleAlert aria-hidden="true" size={19} />
          <span>
            Corrin's Partner Seal grant depends on the selected Talent and remains a runtime-variable
            class outcome. {unit.identity.displayName}'s Attack and Guard Stance bonuses are independently corroborated.
            {unit.identity.id === "kaze" ? " The four 凉风 workbook notes remain pending direct inspection." : ""}
          </span>
        </Alert>
      )}

      {unit.identity.id === "scarlet" ? <ScarletDepartureAlert /> : null}

      <RecruitmentSection unit={unit} avatarSelection={avatarSelection} />

      {avatarSelection ? <AvatarConfigurationSection unit={unit} selection={avatarSelection} /> : null}

      {!unit.avatarConfiguration ? (
        <section className="data-section" aria-labelledby="stats-heading">
          <SectionHeading eyebrow="Numbers" title="Personal growth and cap modifiers" id="stats-heading" />
          <StatComparison unit={unit} />
        </section>
      ) : null}

      <section className="data-section two-column-data" aria-label="Skill and class access">
        <div>
          <SectionHeading eyebrow="Identity" title="Personal skill" id="skill-heading" />
          <div className="skill-block" aria-labelledby="skill-heading">
            <ShieldCheck aria-hidden="true" size={22} />
            <div>
              <strong>{unit.personalSkill?.names.en}</strong>
              <p>{unit.personalSkill?.effect}</p>
            </div>
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Reclassing" title="Native class access" id="class-heading" />
          <dl className="class-access-list" aria-labelledby="class-heading">
            <div>
              <dt>Starting class</dt>
              <dd>
                <ClassTreeLabel
                  classId={unit.classAccess?.startingClassId ?? ""}
                  labelOverride={avatarSelection ? corrinNobleBaseLabel(avatarSelection.gender) : undefined}
                />
              </dd>
            </div>
            <div>
              <dt>Base tree</dt>
              <dd>
                {avatarSelection ? (
                  <ClassTreeLabel classId="nohr_prince" labelOverride={corrinNobleBaseLabel(avatarSelection.gender)} />
                ) : (
                  <ClassTreeList classIds={unit.classAccess?.baseClassSet ?? []} />
                )}
              </dd>
            </div>
            <div>
              <dt>{avatarSelection ? "Heart Seal (Talent)" : "Heart Seal"}</dt>
              <dd><ClassTreeList classIds={avatarSelection ? avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) : unit.classAccess?.heartSealClassSet ?? []} /></dd>
            </div>
            {unit.identity.id !== "corrin" ? (
              <div><dt>{corrinTalentLabel(unit)}</dt><dd><ClassTreeList classIds={unit.classAccess?.corrinTalentOnlyClassSet ?? []} /></dd></div>
            ) : null}
          </dl>
        </div>
      </section>

      {avatarSelection ? (
        <AvatarPairupSection selection={avatarSelection} />
      ) : unit.pairupBonuses ? (
        <section className="data-section" aria-labelledby="pairup-heading">
          <SectionHeading eyebrow="Support bonuses" title="Attack and Guard Stance" id="pairup-heading" />
          <PairupTable bonuses={unit.pairupBonuses} />
        </section>
      ) : null}

      <section className="data-section" aria-labelledby="supports-heading">
        <SectionHeading eyebrow="Relationships" title="Supports and seal grants" id="supports-heading" />
        <SupportDirectory unit={unit} avatarSelection={avatarSelection} />
      </section>

      <UnitReferences unit={unit} />
    </div>
  );
}

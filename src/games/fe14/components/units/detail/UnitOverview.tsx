import { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import { TriangleAlert } from "lucide-react";
import { fe14Data, type UnitRuntime } from "../../../data";
import UnitClassSkills from "../../skills/UnitClassSkills";
import {
  AvatarConfigurationSection,
  avatarTalentClassIds,
} from "./AvatarConfiguration";
import { ClassTreeList } from "./ClassTree";
import RecruitmentSection from "./RecruitmentSection";
import SectionHeading from "./SectionHeading";
import SupportDirectory, { type SealGrantPreview, type SealGrantPreviews, type SealPreviewKind } from "./SupportDirectory";
import { type AvatarGender } from "./types";
import { ScarletDepartureAlert } from "./UnitAlerts";
import UnitReferences from "./UnitReferences";
import OffspringOverview from "./OffspringOverview";
import { corrinBorrowedClassId, corrinTalentLabel } from "./utils";

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
  const [selectedSealPreviews, setSelectedSealPreviews] = useState<SealGrantPreviews>({});
  const boon = config?.boons.find((choice) => choice.id === boonId) ?? config?.boons[0];
  const bane = config?.banes.find((choice) => choice.id === baneId) ?? config?.banes[1];
  const talent = config?.talents.find((choice) => choice.id === talentId) ?? config?.talents[0];
  const avatarSelection = config && boon && bane && talent
    ? { config, boon, bane, talent, gender: avatarGender, boonId, baneId, talentId, setBoonId, setBaneId, setTalentId, setGender: setAvatarGender }
    : null;
  const handleSealPreviewChange = useCallback((seal: SealPreviewKind, preview: SealGrantPreview | null) => {
    setSelectedSealPreviews((current) => {
      const next = { ...current };
      if (preview) next[seal] = preview;
      else delete next[seal];
      return next;
    });
  }, []);

  useEffect(() => setSelectedSealPreviews({}), [unit.identity.id]);

  if (unit.offspring) {
    return (
      <OffspringOverview
        unit={unit}
        childGender={avatarGender}
        setChildGender={setAvatarGender}
      />
    );
  }

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

      <RecruitmentSection
        unit={unit}
        avatarGender={avatarGender}
        avatarSelection={avatarSelection}
        setAvatarGender={setAvatarGender}
      />

      {avatarSelection ? <AvatarConfigurationSection unit={unit} selection={avatarSelection} /> : null}

      <UnitClassSkills
        gender={avatarSelection?.gender ?? resolvedUnitGender(unit.identity.gender)}
        initialCardLimit={avatarSelection ? 6 : undefined}
        prioritizePartnerSeal={Boolean(avatarSelection)}
        sources={avatarSelection ? [
          { label: "Native", classIds: ["nohr_prince"] },
          { label: "Heart Seal Talent", classIds: avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) },
          ...corrinFriendshipSkillSources(unit, avatarSelection.gender),
        ] : [
          { label: "Native", classIds: unit.classAccess?.baseClassSet ?? [] },
          { label: "Heart Seal", classIds: unit.classAccess?.heartSealClassSet ?? [] },
        ]}
        selectedSealPreviews={selectedSealPreviews}
      />

      {unit.identity.id !== "corrin" && unit.classAccess?.corrinTalentOnlyClassSet.length ? (
        <aside className="class-access-exception" aria-label={corrinTalentLabel(unit)}>
          <div>
            <strong>{corrinTalentLabel(unit)}</strong>
            <p>This class access is conditional and is not part of the unit's native or Heart Seal trees.</p>
          </div>
          <div className="class-access-exception-trees">
            <ClassTreeList classIds={unit.classAccess.corrinTalentOnlyClassSet} />
          </div>
        </aside>
      ) : null}

      <section className="data-section" aria-labelledby="supports-heading">
        <SectionHeading eyebrow="Relationships" title="Supports and seal grants" id="supports-heading" />
        <SupportDirectory
          unit={unit}
          avatarSelection={avatarSelection}
          selectedSealPreviews={selectedSealPreviews}
          onSealPreviewChange={handleSealPreviewChange}
        />
      </section>

      <UnitReferences unit={unit} />
    </div>
  );
}

function resolvedUnitGender(gender?: string): "male" | "female" | undefined {
  return gender === "male" || gender === "female" ? gender : undefined;
}

function corrinFriendshipSkillSources(unit: UnitRuntime, gender: AvatarGender) {
  return unit.supports.flatMap((support) => {
    if (support.partnerGender !== gender || support.kind === "romantic") return [];
    const classId = corrinBorrowedClassId(support.partnerUnitId, gender);
    if (!classId) return [];
    const partner = fe14Data.roster.find((candidate) => candidate.id === support.partnerUnitId);
    return [{
      label: `Friendship: ${partner?.displayName ?? support.partnerUnitId}`,
      classIds: [classId],
    }];
  });
}

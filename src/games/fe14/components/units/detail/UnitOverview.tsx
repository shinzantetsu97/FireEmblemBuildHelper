import { useCallback, useEffect, useState } from "react";
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
import { useLocale } from "../../../../../i18n/LocaleContext";

export default function UnitOverview({
  unit,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarGender: AvatarGender;
  setAvatarGender: (gender: AvatarGender) => void;
}) {
  const { t, resolve } = useLocale();
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
          { label: t("skills.source.native"), classIds: ["nohr_prince"] },
          { label: t("skills.source.heartSealTalent"), classIds: avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) },
          ...corrinFriendshipSkillSources(unit, avatarSelection.gender, (name) => t("skills.source.friendship", { name }), resolve),
        ] : [
          { label: t("skills.source.native"), classIds: unit.classAccess?.baseClassSet ?? [] },
          { label: t("skills.source.heartSeal"), classIds: unit.classAccess?.heartSealClassSet ?? [] },
        ]}
        selectedSealPreviews={selectedSealPreviews}
      />

      <section className="data-section" aria-labelledby="supports-heading">
        <SectionHeading title={t("section.supports.title")} id="supports-heading" />
        {unit.identity.id !== "corrin" && unit.classAccess?.corrinTalentOnlyClassSet.length ? (
          <aside className="class-access-exception" aria-label={corrinTalentLabel(unit, t)}>
            <div>
              <strong>{corrinTalentLabel(unit, t)}</strong>
            </div>
            <div className="class-access-exception-trees">
              <ClassTreeList classIds={unit.classAccess.corrinTalentOnlyClassSet} />
            </div>
          </aside>
        ) : null}
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

function corrinFriendshipSkillSources(
  unit: UnitRuntime,
  gender: AvatarGender,
  friendshipLabel: (name: string) => string,
  resolve: ReturnType<typeof useLocale>["resolve"],
) {
  return unit.supports.flatMap((support) => {
    if (support.partnerGender !== gender || support.kind === "romantic") return [];
    const classId = corrinBorrowedClassId(support.partnerUnitId, gender);
    if (!classId) return [];
    const partner = fe14Data.roster.find((candidate) => candidate.id === support.partnerUnitId);
    return [{
      label: friendshipLabel(resolve({ en: partner?.displayName ?? support.partnerUnitId, zhHans: partner?.names?.zhHans })),
      classIds: [classId],
    }];
  });
}

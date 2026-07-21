import { type UnitRuntime } from "../../../data";
import { AvatarConfigurationControls } from "./AvatarConfiguration";
import ResolvedConfigurationPreview from "./ResolvedConfigurationPreview";
import SectionHeading from "./SectionHeading";
import { type AvatarSelection } from "./types";
import { useLocale } from "../../../../../i18n/LocaleContext";

export default function RecruitmentSection({
  unit,
  avatarSelection,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarSelection: AvatarSelection | null;
  avatarGender: "male" | "female";
  setAvatarGender: (gender: "male" | "female") => void;
}) {
  const { t } = useLocale();
  return (
    <section className="data-section" aria-labelledby="recruitment-heading">
      <SectionHeading title={t("section.base.title")} id="recruitment-heading" />
      {avatarSelection ? (
        <div className="avatar-base-configuration">
          <h3>{t("config.corrinConfiguration")}</h3>
          <AvatarConfigurationControls selection={avatarSelection} context={t("config.startingBases")} />
        </div>
      ) : null}
      <ResolvedConfigurationPreview
        avatarGender={avatarGender}
        avatarSelection={avatarSelection}
        setAvatarGender={setAvatarGender}
        unit={unit}
      />
    </section>
  );
}

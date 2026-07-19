import { type UnitRuntime } from "../../../data";
import { AvatarConfigurationControls } from "./AvatarConfiguration";
import ResolvedConfigurationPreview from "./ResolvedConfigurationPreview";
import SectionHeading from "./SectionHeading";
import { type AvatarSelection } from "./types";

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
  return (
    <section className="data-section" aria-labelledby="recruitment-heading">
      <SectionHeading eyebrow="Starting state" title="Base configuration" id="recruitment-heading" />
      {avatarSelection ? (
        <div className="avatar-base-configuration">
          <h3>Corrin configuration</h3>
          <AvatarConfigurationControls selection={avatarSelection} context="Starting bases" />
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

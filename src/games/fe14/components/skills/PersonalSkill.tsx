import { type UnitRuntime } from "../../data";
import { getPersonalSkillIconUrl } from "../../skillAssets";

type PersonalSkillData = NonNullable<UnitRuntime["personalSkill"]>;

export default function PersonalSkill({
  skill,
  labelledBy,
}: {
  skill: PersonalSkillData;
  labelledBy: string;
}) {
  return (
    <div className="skill-block" aria-labelledby={labelledBy}>
      <img
        className="personal-skill-icon"
        src={getPersonalSkillIconUrl(skill.iconAssetId)}
        alt=""
        width={24}
        height={24}
      />
      <div>
        <strong>{skill.names.en}</strong>
        <p>{skill.effect}</p>
      </div>
    </div>
  );
}

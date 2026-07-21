import { type UnitRuntime } from "../../data";
import { getPersonalSkillIconUrl } from "../../skillAssets";
import { useLocale } from "../../../../i18n/LocaleContext";

type PersonalSkillData = NonNullable<UnitRuntime["personalSkill"]>;

export default function PersonalSkill({
  skill,
  labelledBy,
}: {
  skill: PersonalSkillData;
  labelledBy: string;
}) {
  const { resolve } = useLocale();
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
        <strong>{resolve(skill.names, skill.names.en)}</strong>
        <p>{resolve({ en: skill.effect, zhHans: skill.effectZhHans })}</p>
      </div>
    </div>
  );
}

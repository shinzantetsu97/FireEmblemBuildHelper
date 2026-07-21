import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import {
  classNames,
  type ClassSkill,
  type ClassSkillIndexEntry,
  type EnrichedClassNode,
  type EnrichedClassTree,
} from "../../data";
import { getClassSkillIconUrl } from "../../skillAssets";
import { useLocale } from "../../../../i18n/LocaleContext";
import type { Locale } from "../../../../i18n/locale";

export interface UnitClassSkillCard {
  sources: string[];
  tree: EnrichedClassTree;
}

export default function UnitClassSkillCards({
  cards,
  gender,
  skills,
}: {
  cards: UnitClassSkillCard[];
  gender?: "male" | "female";
  skills: ClassSkill[];
}) {
  const { t } = useLocale();
  const skillLookup = new Map(skills.map((skill) => [skill.id, skill]));

  return (
    <div className="unit-class-skill-card-region" role="region" aria-label={t("skills.cardRegionAria")}>
      <div className="unit-class-skill-card-grid" aria-label={t("skills.cardGridAria")}>
        {cards.map(({ sources, tree }) => (
          <article className="unit-class-skill-card" key={tree.id}>
            <div className="unit-class-skill-card-base">
              <div className="unit-class-skill-card-sources">
                {sources.map((source) => <span key={source}>{source}</span>)}
              </div>
              <ClassSkillColumn node={tree} skillLookup={skillLookup} gender={gender} headingLevel="base" />
            </div>
            {tree.promotions.length > 0 ? (
              <div className="unit-class-skill-card-promotions">
                {tree.promotions.map((promotion) => (
                  <ClassSkillColumn
                    key={promotion.id}
                    node={promotion}
                    skillLookup={skillLookup}
                    gender={gender}
                    headingLevel="promotion"
                  />
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function ClassSkillColumn({
  node,
  skillLookup,
  gender,
  headingLevel,
}: {
  node: EnrichedClassNode;
  skillLookup: ReadonlyMap<string, ClassSkill>;
  gender?: "male" | "female";
  headingLevel: "base" | "promotion";
}) {
  const { resolve, locale } = useLocale();
  const Heading = headingLevel === "base" ? "h3" : "h4";
  const baseLabel = resolve(classNames(node.id), node.label);
  const displayLabel = genderedClassLabel(node.id, baseLabel, gender, locale);

  return (
    <section className="unit-class-skill-column">
      <Heading>{displayLabel}</Heading>
      <div className="unit-class-skill-list">
        {node.skills.filter((acquisition) => !acquisition.gender || acquisition.gender === gender).map((acquisition) => {
          const skill = skillLookup.get(acquisition.skillId);
          return skill ? (
            <UnitClassSkill
              key={`${node.id}:${skill.id}:${acquisition.gender ?? "all"}`}
              acquisition={acquisition}
              classId={node.id}
              className={displayLabel}
              skill={skill}
            />
          ) : null;
        })}
      </div>
    </section>
  );
}

function UnitClassSkill({
  acquisition,
  classId,
  className,
  skill,
}: {
  acquisition: ClassSkillIndexEntry;
  classId: string;
  className: string;
  skill: ClassSkill;
}) {
  const { t, resolve } = useLocale();
  const iconUrl = getClassSkillIconUrl(skill.iconAssetId);
  const skillName = resolve(skill.names, skill.names.en);
  const learnedText = `${t("skills.learnedText", { level: acquisition.level, class: className })}${
    acquisition.gender ? t("skills.learnedGender", { gender: t(acquisition.gender === "male" ? "common.male" : "common.female") }) : ""
  }`;
  const popover = (
    <Popover className="unit-class-skill-popover" id={`unit-class-skill-${skill.id}-${classId}`}>
      <Popover.Header as="h3">
        <img src={iconUrl} alt="" width={22} height={22} />
        {skillName}
      </Popover.Header>
      <Popover.Body>
        <p>{resolve({ en: skill.description, zhHans: skill.descriptionZhHans })}</p>
        <strong>{t("skills.learned")}</strong> {learnedText}
        {skill.notes?.map((note, index) => <small key={note}>{resolve({ en: note, zhHans: skill.notesZhHans?.[index] })}</small>)}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger overlay={popover} placement="top" trigger={["hover", "focus"]}>
      <button className="unit-class-skill-entry" type="button" aria-label={`${skillName}: view skill details`}>
        <img src={iconUrl} alt="" width={20} height={20} />
        <span>{skillName}</span>
      </button>
    </OverlayTrigger>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function genderedClassLabel(
  classId: string,
  fallback: string,
  gender: "male" | "female" | undefined,
  locale: Locale,
): string {
  const zh = locale === "zhHans";
  if (classId === "attendant") {
    if (gender === "male") return zh ? "管家" : "Butler";
    if (gender === "female") return zh ? "女仆" : "Maid";
    return fallback;
  }
  if (classId === "nohr_prince") {
    if (gender === "male") return zh ? "黑暗王子" : "Nohr Prince";
    if (gender === "female") return zh ? "黑暗公主" : "Nohr Princess";
    return fallback;
  }
  return fallback;
}

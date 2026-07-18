import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import {
  type ClassSkill,
  type ClassSkillIndexEntry,
  type EnrichedClassNode,
  type EnrichedClassTree,
} from "../../data";
import { getClassSkillIconUrl } from "../../skillAssets";

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
  const skillLookup = new Map(skills.map((skill) => [skill.id, skill]));

  return (
    <div className="unit-class-skill-card-region" role="region" aria-label="Available class skills">
      <div className="unit-class-skill-card-grid" aria-label="Class access sources">
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
  const Heading = headingLevel === "base" ? "h3" : "h4";
  const displayLabel = genderedClassLabel(node.id, node.label, gender);

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
  const iconUrl = getClassSkillIconUrl(skill.iconAssetId);
  const learnedText = `Level ${acquisition.level} as ${className}${
    acquisition.gender ? ` (${capitalize(acquisition.gender)} only)` : ""
  }`;
  const popover = (
    <Popover className="unit-class-skill-popover" id={`unit-class-skill-${skill.id}-${classId}`}>
      <Popover.Header as="h3">
        <img src={iconUrl} alt="" width={22} height={22} />
        {skill.names.en}
      </Popover.Header>
      <Popover.Body>
        <p>{skill.description}</p>
        <strong>Learned:</strong> {learnedText}
        {skill.notes?.map((note) => <small key={note}>{note}</small>)}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger overlay={popover} placement="top" trigger={["hover", "focus"]}>
      <button className="unit-class-skill-entry" type="button" aria-label={`${skill.names.en}: view skill details`}>
        <img src={iconUrl} alt="" width={20} height={20} />
        <span>{skill.names.en}</span>
      </button>
    </OverlayTrigger>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function genderedClassLabel(classId: string, fallback: string, gender?: "male" | "female"): string {
  if (classId === "attendant") return gender === "male" ? "Butler" : gender === "female" ? "Maid" : fallback;
  if (classId === "nohr_prince") return gender === "male" ? "Nohr Prince" : gender === "female" ? "Nohr Princess" : fallback;
  return fallback;
}

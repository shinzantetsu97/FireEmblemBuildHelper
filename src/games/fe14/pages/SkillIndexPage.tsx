import Container from "react-bootstrap/Container";
import ClassSkillBrowser from "../components/skills/ClassSkillBrowser";
import { fe14Data } from "../data";
import { useLocale } from "../../../i18n/LocaleContext";

// The Monk line duplicates the Shrine Maiden line (identical skills; monk/
// great_master are the male-gendered ids). On the directory we show the pair
// once, under a combined label, while the data keeps both ids for unit pages.
const HIDDEN_DIRECTORY_TREE_IDS = new Set(["monk"]);

const DIRECTORY_LABEL_OVERRIDES: Record<string, { en: string; zhHans?: string }> = {
  shrine_maiden: { en: "Shrine Maiden/Monk", zhHans: "巫女/修炼者" },
  priestess: { en: "Priestess/Great Master", zhHans: "战巫女/山伏" },
};

const directoryTrees = fe14Data.classDirectory.filter((tree) => !HIDDEN_DIRECTORY_TREE_IDS.has(tree.id));

const allStandardClassIds = new Set(directoryTrees.flatMap((tree) => [
  tree.id,
  ...tree.promotions.map((promotion) => promotion.id),
]));

export default function SkillIndexPage() {
  const { t } = useLocale();
  return (
    <main>
      <Container className="data-main" fluid="lg">
        <header className="data-page-heading">
          <div>
            <p className="eyebrow">{t("fe14.eyebrow")}</p>
            <h1>FE14 Class Skills</h1>
          </div>
        </header>

        <ClassSkillBrowser
          availableClassIds={allStandardClassIds}
          classTrees={directoryTrees}
          classSkills={fe14Data.classSkills}
          skillsByClass={fe14Data.skillsByClass}
          scope="directory"
          labelOverrides={DIRECTORY_LABEL_OVERRIDES}
        />
      </Container>
    </main>
  );
}

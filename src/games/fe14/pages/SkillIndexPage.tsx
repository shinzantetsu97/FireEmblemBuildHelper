import Container from "react-bootstrap/Container";
import ClassSkillBrowser from "../components/skills/ClassSkillBrowser";
import { fe14Data } from "../data";

const allStandardClassIds = new Set(fe14Data.classDirectory.flatMap((tree) => [
  tree.id,
  ...tree.promotions.map((promotion) => promotion.id),
]));

export default function SkillIndexPage() {
  return (
    <main>
      <Container className="data-main" fluid="lg">
        <header className="data-page-heading">
          <div>
            <p className="eyebrow">Fire Emblem Fates</p>
            <h1>FE14 Class Skills</h1>
          </div>
        </header>

        <ClassSkillBrowser
          availableClassIds={allStandardClassIds}
          classTrees={fe14Data.classDirectory}
          classSkills={fe14Data.classSkills}
          skillsByClass={fe14Data.skillsByClass}
          scope="directory"
        />
      </Container>
    </main>
  );
}

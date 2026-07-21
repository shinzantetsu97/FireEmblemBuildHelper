import Container from "react-bootstrap/Container";
import PersonalSkillBrowser from "../components/skills/PersonalSkillBrowser";
import { useLocale } from "../../../i18n/LocaleContext";

export default function PersonalSkillIndexPage() {
  const { t } = useLocale();
  return (
    <main>
      <Container className="data-main" fluid="lg">
        <header className="data-page-heading">
          <div>
            <p className="eyebrow">{t("fe14.eyebrow")}</p>
            <h1>{t("personalSkills.title")}</h1>
          </div>
        </header>

        <PersonalSkillBrowser />
      </Container>
    </main>
  );
}

import Container from "react-bootstrap/Container";
import GameLibrary from "../components/home/GameLibrary";
import VersionLog from "../components/home/VersionLog";
import { useLocale } from "../i18n/LocaleContext";

export default function HomePage() {
  const { t } = useLocale();
  return (
    <main>
      <Container className="home-main" fluid="lg">
        <header className="home-heading">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1>FireEmblemBuildHelper</h1>
          <p>{t("home.tagline")}</p>
        </header>

        <GameLibrary />
        <VersionLog />

        <footer className="home-credits" aria-label={t("home.credits.title")}>
          <h2>{t("home.credits.title")}</h2>
          <p>
            {t("home.credits.intro")}
            <a href="http://fcfantasy.cn" target="_blank" rel="noreferrer">FC Fantasy（fcfantasy.cn）</a>
            {t("home.credits.and")}
            <a href="https://www.3dmgame.com" target="_blank" rel="noreferrer">3DM</a>
            {t("home.credits.outro")}
          </p>
        </footer>
      </Container>
    </main>
  );
}

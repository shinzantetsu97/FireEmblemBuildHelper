import { ChevronRight } from "lucide-react";
import { AppLink } from "../../router";
import { useLocale } from "../../i18n/LocaleContext";

export default function GameLibrary() {
  const { t } = useLocale();
  return (
    <section className="home-games" aria-labelledby="game-library-heading">
      <div className="home-section-heading">
        <p className="eyebrow">{t("home.games.eyebrow")}</p>
        <h2 id="game-library-heading">{t("home.games.title")}</h2>
      </div>
      <AppLink className="game-directory-link" to="/FE14/Units">
        <div>
          <span>FE14</span>
          <h3>{t("home.games.fe14Title")}</h3>
          <p>{t("home.games.fe14Desc")}</p>
        </div>
        <ChevronRight aria-hidden="true" size={20} />
      </AppLink>
    </section>
  );
}

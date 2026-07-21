import { useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { RELEASES } from "./releases";
import { useLocale } from "../../i18n/LocaleContext";

const HOMEPAGE_RELEASE_LIMIT = 5;

export default function VersionLog() {
  const { t } = useLocale();
  const [showCompleteHistory, setShowCompleteHistory] = useState(false);
  const visibleReleases = showCompleteHistory ? RELEASES : RELEASES.slice(0, HOMEPAGE_RELEASE_LIMIT);

  return (
    <section className="home-updates" aria-labelledby="version-log-heading">
      <div className="home-section-heading">
        <p className="eyebrow">{t("home.versions.eyebrow")}</p>
        <h2 id="version-log-heading">{t("home.versions.title")}</h2>
      </div>
      <div className="version-log" aria-label={t("home.versions.aria")}>
        {visibleReleases.map((release) => (
          <article className="version-entry" key={release.version}>
            <header>
              <strong>v{release.version}</strong>
              <time dateTime={release.date}>{release.dateLabel}</time>
              {"current" in release && release.current ? <span>{t("home.versions.current")}</span> : null}
            </header>
            <div>
              <h3>{release.title}</h3>
              <ul>
                {release.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
      {RELEASES.length > HOMEPAGE_RELEASE_LIMIT ? (
        <button
          className="version-log-history-toggle"
          type="button"
          aria-expanded={showCompleteHistory}
          onClick={() => setShowCompleteHistory((current) => !current)}
        >
          <History aria-hidden="true" size={17} />
          <span>{showCompleteHistory ? t("home.versions.showRecent") : t("home.versions.showAll")}</span>
          {showCompleteHistory ? <ChevronUp aria-hidden="true" size={17} /> : <ChevronDown aria-hidden="true" size={17} />}
        </button>
      ) : null}
    </section>
  );
}

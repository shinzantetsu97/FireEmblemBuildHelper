import { useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { RELEASES } from "./releases";

const HOMEPAGE_RELEASE_LIMIT = 5;

export default function VersionLog() {
  const [showCompleteHistory, setShowCompleteHistory] = useState(false);
  const visibleReleases = showCompleteHistory ? RELEASES : RELEASES.slice(0, HOMEPAGE_RELEASE_LIMIT);

  return (
    <section className="home-updates" aria-labelledby="version-log-heading">
      <div className="home-section-heading">
        <p className="eyebrow">Project history</p>
        <h2 id="version-log-heading">Version log</h2>
      </div>
      <div className="version-log" aria-label="FireEmblemBuildHelper releases">
        {visibleReleases.map((release) => (
          <article className="version-entry" key={release.version}>
            <header>
              <strong>v{release.version}</strong>
              <time dateTime={release.date}>{release.dateLabel}</time>
              {"current" in release && release.current ? <span>Current</span> : null}
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
          <span>{showCompleteHistory ? "Show newest releases only" : "View complete history"}</span>
          {showCompleteHistory ? <ChevronUp aria-hidden="true" size={17} /> : <ChevronDown aria-hidden="true" size={17} />}
        </button>
      ) : null}
    </section>
  );
}

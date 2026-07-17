import { RELEASES } from "./releases";

export default function VersionLog() {
  return (
    <section className="home-updates" aria-labelledby="version-log-heading">
      <div className="home-section-heading">
        <p className="eyebrow">Project history</p>
        <h2 id="version-log-heading">Version log</h2>
      </div>
      <div className="version-log" aria-label="FireEmblemBuildHelper releases">
        {RELEASES.map((release) => (
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
    </section>
  );
}

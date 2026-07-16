import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import { Braces, ChevronLeft, LayoutList, ShieldCheck, TriangleAlert } from "lucide-react";
import JsonExplorer from "../components/JsonExplorer";
import {
  displayId,
  fe14Data,
  findUnitBySlug,
  getPortraitUrl,
  type SealGrant,
  type SourceRef,
  type StatBlock,
  type UnitRuntime,
} from "../data/fe14";
import { AppLink } from "../router";

const STAT_KEYS: Array<keyof StatBlock> = [
  "hp",
  "strength",
  "magic",
  "skill",
  "speed",
  "luck",
  "defense",
  "resistance",
];

export default function UnitDetailPage({ slug }: { slug: string }) {
  const [view, setView] = useState<"overview" | "json">("overview");
  const unit = findUnitBySlug(slug);

  if (!unit) {
    return (
      <main>
        <Container className="data-main" fluid="lg">
          <Alert variant="warning">This unit has not reached a reviewable JSON slice yet.</Alert>
          <AppLink className="back-link" to="/FE14/Units">
            <ChevronLeft aria-hidden="true" size={17} />
            FE14 Units
          </AppLink>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="unit-detail-main" fluid="lg">
        <AppLink className="back-link" to="/FE14/Units">
          <ChevronLeft aria-hidden="true" size={17} />
          FE14 Units
        </AppLink>

        {unit.identity.id === "izana" ? <IzanaDataAlert /> : null}

        <UnitHeader unit={unit} />

        <div className="unit-view-toolbar">
          <ButtonGroup aria-label="Unit data view">
            <Button
              variant={view === "overview" ? "dark" : "outline-secondary"}
              onClick={() => setView("overview")}
              aria-pressed={view === "overview"}
            >
              <LayoutList aria-hidden="true" size={17} />
              Overview
            </Button>
            <Button
              variant={view === "json" ? "dark" : "outline-secondary"}
              onClick={() => setView("json")}
              aria-pressed={view === "json"}
            >
              <Braces aria-hidden="true" size={17} />
              JSON
            </Button>
          </ButtonGroup>
          <span>Last updated {fe14Data.lastUpdated}</span>
        </div>

        {view === "overview" ? (
          <UnitOverview unit={unit} />
        ) : (
          <JsonExplorer value={unit} label={`${unit.identity.displayName} JSON tree`} />
        )}
      </Container>
    </main>
  );
}

function IzanaDataAlert() {
  return (
    <Alert className="izana-data-alert" variant="danger">
      <TriangleAlert aria-hidden="true" size={28} />
      <div>
        <strong>Sharing is caring.</strong>
        <p>
          The more you care about Izana, the more reliable this table becomes. This game has been out for more than
          10 years, and no one has produced a concrete, accurate data table for Izana yet, FFS. If you know a verified
          source or have personally verified this data, I would be most obliged.
        </p>
        <p className="izana-table-flip">Until then, (╯‵□′)╯︵┻━┻</p>
      </div>
    </Alert>
  );
}

function UnitHeader({ unit }: { unit: UnitRuntime }) {
  const { identity } = unit;
  return (
    <header className="unit-header">
      <img src={getPortraitUrl(identity)} alt={`${identity.displayName} portrait`} />
      <div className="unit-header-copy">
        <div className="unit-header-meta">
          <span className={`unit-status unit-status-${identity.status}`}>
            {displayId(identity.status)}
          </span>
          <span>First generation</span>
          <ClassTreeLabel classId={unit.classAccess?.startingClassId ?? "unknown"} />
        </div>
        <h1>{identity.displayName}</h1>
        <p>
          <span lang="ja">{identity.names?.ja}</span>
          <span lang="zh-Hans">{identity.names?.zhHans}</span>
          <span>{identity.names?.jaLatn}</span>
        </p>
      </div>
      <dl className="unit-header-facts">
        <div>
          <dt>Personal skill</dt>
          <dd>{unit.personalSkill?.names.en}</dd>
        </div>
        <div>
          <dt>Dragon Vein</dt>
          <dd>{identity.dragonVein ? "Yes" : "No"}</dd>
        </div>
      </dl>
    </header>
  );
}

function UnitOverview({ unit }: { unit: UnitRuntime }) {
  return (
    <div className="unit-overview">
      <Alert className="review-alert" variant="warning">
        <TriangleAlert aria-hidden="true" size={19} />
        <span>
          Corrin's Partner Seal grant depends on the selected Talent and remains a runtime-variable
          class outcome. {unit.identity.displayName}'s Attack and Guard Stance bonuses are independently corroborated.
          {unit.identity.id === "kaze" ? " The four 凉风 workbook notes remain pending direct inspection." : ""}
        </span>
      </Alert>

      <section className="data-section" aria-labelledby="recruitment-heading">
        <SectionHeading eyebrow="Availability" title="Recruitment" id="recruitment-heading" />
        <div className="recruitment-grid">
          {unit.availability.map((scenario) => (
            <article key={scenario.id} className="recruitment-card">
              <div>
                <span>{scenarioLabel(scenario)}</span>
                <strong>{formatJoinLevel(unit, scenario.id)} {displayId(scenario.classId)}</strong>
              </div>
              <div className="route-join-list" aria-label={`${scenarioLabel(scenario)} route joins`}>
                {scenario.routeJoins.map((routeJoin) => (
                  <div key={routeJoin.route}>
                    <span>{displayId(routeJoin.route)}</span>
                    <strong>{formatRouteJoin(scenario, routeJoin)}</strong>
                  </div>
                ))}
              </div>
              <JoiningStats unit={unit} availabilityId={scenario.id} />
              <AutoLevelSummary scenario={scenario} />
              <dl>
                <div><dt>Weapon ranks</dt><dd>{formatWeaponRanks(unit, scenario.id)}</dd></div>
                <div><dt>Inventory</dt><dd>{formatInventory(unit, scenario.id)}</dd></div>
                {scenario.myCastleRecruitment ? (
                  <div className="recruitment-trigger">
                    <dt>Recruitment trigger</dt>
                    <dd>{formatMyCastleTrigger(scenario)}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
        {unit.availability
          .filter((scenario) => scenario.temporarilyLeavesAfterChapter !== undefined)
          .map((scenario) => (
            <p className="route-note" key={`${scenario.id}-route-note`}>
              * With {scenario.avatarGender} Corrin, {unit.identity.displayName} leaves after Chapter {scenario.temporarilyLeavesAfterChapter} and returns at the beginning of Chapter {scenario.returnsChapter} on every route.
            </p>
          ))}
        {unit.availability
          .filter((scenario) => scenario.temporaryDeparture)
          .map((scenario) => (
            <p className="route-note" key={`${scenario.id}-departure-note`}>
              * After Chapter {scenario.temporaryDeparture?.afterChapter}, {unit.identity.displayName} leaves on {scenario.temporaryDeparture?.routes.map(formatRoute).join(" and ")} and returns at {scenario.temporaryDeparture?.returns.map((entry) => `${formatRoute(entry.route)} Chapter ${entry.chapter} (${entry.timing})`).join("; ")}.
            </p>
          ))}
        {unit.availability
          .filter((scenario) => scenario.retentionCondition)
          .map((scenario) => (
            <p className="route-note" key={`${scenario.id}-retention-note`}>
              * {scenario.retentionCondition?.note}
            </p>
          ))}
        {unit.availability
          .filter((scenario) => scenario.chapter5Carryover)
          .map((scenario) => (
            <p className="route-note" key={`${scenario.id}-carryover`}>
              * <strong>{scenarioLabel(scenario)}:</strong> {scenario.chapter5Carryover?.note}
            </p>
          ))}
        {unit.identity.notes?.map((note) => <p className="route-note" key={note}>* {note}</p>)}
      </section>

      <section className="data-section" aria-labelledby="stats-heading">
        <SectionHeading eyebrow="Numbers" title="Personal growth and cap modifiers" id="stats-heading" />
        <StatComparison unit={unit} />
      </section>

      <section className="data-section two-column-data" aria-label="Skill and class access">
        <div>
          <SectionHeading eyebrow="Identity" title="Personal skill" id="skill-heading" />
          <div className="skill-block" aria-labelledby="skill-heading">
            <ShieldCheck aria-hidden="true" size={22} />
            <div>
              <strong>{unit.personalSkill?.names.en}</strong>
              <p>{unit.personalSkill?.effect}</p>
            </div>
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Reclassing" title="Native class access" id="class-heading" />
          <dl className="class-access-list" aria-labelledby="class-heading">
            <div><dt>Starting class</dt><dd><ClassTreeLabel classId={unit.classAccess?.startingClassId ?? ""} /></dd></div>
            <div><dt>Base tree</dt><dd><ClassTreeList classIds={unit.classAccess?.baseClassSet ?? []} /></dd></div>
            <div><dt>Heart Seal</dt><dd><ClassTreeList classIds={unit.classAccess?.heartSealClassSet ?? []} /></dd></div>
            <div><dt>{corrinTalentLabel(unit)}</dt><dd><ClassTreeList classIds={unit.classAccess?.corrinTalentOnlyClassSet ?? []} /></dd></div>
          </dl>
        </div>
      </section>

      <section className="data-section" aria-labelledby="pairup-heading">
        <SectionHeading eyebrow="Support bonuses" title="Attack and Guard Stance" id="pairup-heading" />
        <PairupTable unit={unit} />
      </section>

      <section className="data-section" aria-labelledby="supports-heading">
        <SectionHeading eyebrow="Relationships" title="Supports and seal grants" id="supports-heading" />
        <SupportDirectory unit={unit} />
      </section>

      <section className="data-section" aria-labelledby="sources-heading">
        <SectionHeading eyebrow="Audit trail" title="Sources used" id="sources-heading" />
        <SourceList unit={unit} />
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, id, title }: { eyebrow: string; id: string; title: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function StatComparison({ unit }: { unit: UnitRuntime }) {
  const growths = unit.growths[0]?.rates;
  const caps = unit.capModifiers?.modifiers;

  return (
    <>
    <Table className="stat-table" responsive>
      <thead>
        <tr>
          <th>Stat</th>
          <th>Personal growth</th>
          <th>Cap modifier</th>
        </tr>
      </thead>
      <tbody>
        {STAT_KEYS.map((stat) => (
          <tr key={stat}>
            <th scope="row">{stat === "hp" ? "HP" : displayId(stat)}</th>
            <td><GrowthBar value={growths?.[stat] ?? 0} /></td>
            <td>{stat === "hp" ? "—" : formatSigned(caps?.[stat] ?? 0)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td>{Object.values(growths ?? {}).reduce((sum, value) => sum + value, 0)}%</td>
          <td>—</td>
        </tr>
      </tfoot>
    </Table>
    </>
  );
}

function JoiningStats({ unit, availabilityId }: { unit: UnitRuntime; availabilityId: string }) {
  const record = baseStatsForAvailability(unit, availabilityId);
  if (!record) return null;
  const scenario = unit.availability.find((entry) => entry.id === availabilityId);

  return (
    <div className="joining-stats">
      <h3>{scenario?.autoLevel ? `Joining stats at Lv. ${record.level}` : "Joining stats"}</h3>
      <dl className="joining-stat-grid">
        {STAT_KEYS.map((stat) => (
          <div key={stat}>
            <dt>{shortStatLabel(stat)}</dt>
            <dd>{record.stats[stat]}</dd>
          </div>
        ))}
      </dl>
      {record.chapter5Carryover ? <p className="route-note">* {record.chapter5Carryover.note}</p> : null}
    </div>
  );
}

function AutoLevelSummary({ scenario }: { scenario: AvailabilityScenario }) {
  if (!scenario.autoLevel) return null;
  const { autoLevel } = scenario;

  return (
    <div className="auto-level-summary">
      <h3>Story-progress autolevel</h3>
      <div className="auto-level-milestones">
        {autoLevel.milestones.map((milestone) => (
          <span key={`${milestone.displayedChapterStart}-${milestone.displayedChapterEnd ?? milestone.displayedChapterStart}`}>
            Ch. {milestone.displayedChapterStart}
            {milestone.displayedChapterEnd && milestone.displayedChapterEnd !== milestone.displayedChapterStart
              ? `-${milestone.displayedChapterEnd}`
              : ""}: Lv. {milestone.level}
          </span>
        ))}
      </div>
      <p>
        <strong>Model:</strong>{" "}
        {autoLevel.modelBasis === "castle_recruit_autolevel" ? "Castle-recruit autolevel" : autoLevel.modelBasis}. Comparison:
        {autoLevel.comparisonModel === "offspring_seal_esque_level_scaling" ? " Offspring Seal-esque level scaling. " : ` ${autoLevel.comparisonModel}. `}
        {autoLevel.weaponProficiencyScales ? "Weapon proficiency scales with story progress" : "Weapon proficiency does not scale"}
        {autoLevel.weaponProficiencyMilestonesStatus === "unresolved" ? "; exact rank milestones remain unresolved." : "."}
      </p>
      <p>
        <strong>Stats:</strong> Level 5 bases + (individual growth rates + Onmyoji class growth rates) × levels gained.
        Round each resulting stat to the nearest integer; exact .5 results round up.
      </p>
      <p>{autoLevel.note}</p>
    </div>
  );
}

function GrowthBar({ value }: { value: number }) {
  return (
    <div className="growth-cell">
      <span>{value}%</span>
      <span className="growth-track" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>
    </div>
  );
}

function PairupTable({ unit }: { unit: UnitRuntime }) {
  const bonuses = unit.pairupBonuses;
  if (!bonuses) return null;
  return (
    <Table className="pairup-table" responsive>
      <thead><tr><th>Rank</th><th>Attack Stance <span>Accepted</span></th><th>Guard Stance <span>Accepted</span></th></tr></thead>
      <tbody>
        <tr>
          <th scope="row">No support</th>
          <td>{formatBonuses(bonuses.attackStance.baseBonus)}</td>
          <td>{formatBonuses(bonuses.guardStance.baseBonus)}</td>
        </tr>
        {Object.keys(bonuses.guardStance.rankDeltas).map((rank) => (
          <tr key={rank}>
            <th scope="row">{rank}</th>
            <td>{formatBonuses(bonuses.attackStance.rankDeltas[rank])}</td>
            <td>{formatBonuses(bonuses.guardStance.rankDeltas[rank])}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function SupportDirectory({ unit }: { unit: UnitRuntime }) {
  const grantsBySupport = new Map(
    (unit.classAccess?.sealGrants ?? []).map((grant) => [grant.supportRelationshipId, grant]),
  );
  const friendship = unit.supports.filter((support) => support.kind !== "romantic");
  const romantic = unit.supports.filter((support) => support.kind === "romantic");

  return (
    <div className="support-groups">
      <SupportGroup title="A / A+ supports" supports={friendship} grants={grantsBySupport} />
      <SupportGroup title="Partner Seal (S)" supports={romantic} grants={grantsBySupport} />
    </div>
  );
}

function SupportGroup({
  title,
  supports,
  grants,
}: {
  title: string;
  supports: UnitRuntime["supports"];
  grants: Map<string, SealGrant>;
}) {
  return (
    <div className="support-group">
      <h3>{title}</h3>
      <div className="support-list">
        {supports.map((support) => {
          const partner = fe14Data.roster.find((unit) => unit.id === support.partnerUnitId);
          const grant = grants.get(support.id);
          return (
            <div className="support-row" key={support.id}>
              <span>{partner?.displayName ?? displayId(support.partnerUnitId)}</span>
              <span>{support.routes.map(formatRoute).join(" / ")}</span>
              <strong>{grant ? <ClassTreeLabel classId={grant.grantedClassId} /> : "No class grant"}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SourceList({ unit }: { unit: UnitRuntime }) {
  const sourceIds = useMemo(() => new Set(collectSourceRefs(unit).map((ref) => ref.sourceId)), [unit]);
  const sources = fe14Data.sources.filter((source) => sourceIds.has(source.id));
  return (
    <div className="source-list">
      {sources.map((source) => (
        <div key={source.id} className="source-row">
          {source.location.startsWith("http") ? (
            <a href={source.location} target="_blank" rel="noreferrer">{source.title}</a>
          ) : (
            <strong>{source.title}</strong>
          )}
          <span>{source.reviewStatus}</span>
        </div>
      ))}
    </div>
  );
}

function collectSourceRefs(value: unknown): SourceRef[] {
  if (Array.isArray(value)) return value.flatMap(collectSourceRefs);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const current = typeof record.sourceId === "string" ? [record as unknown as SourceRef] : [];
  return current.concat(Object.values(record).flatMap(collectSourceRefs));
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function formatBonuses(values: Record<string, number>): string {
  return Object.entries(values).map(([stat, value]) => `${displayId(stat)} +${value}`).join(", ");
}

function formatRoute(route: string): string {
  return { birthright: "BR", conquest: "CQ", revelation: "RV" }[route] ?? route;
}

type AvailabilityScenario = UnitRuntime["availability"][number];

function scenarioLabel(scenario?: AvailabilityScenario): string {
  if (!scenario) return "Unknown scenario";
  if (scenario.scenarioLabel) return scenario.scenarioLabel;
  if (scenario.avatarGender) return `${displayId(scenario.avatarGender)} Corrin`;
  const idParts = scenario.id.split(".");
  return displayId(idParts[idParts.length - 1] ?? scenario.id);
}

function baseStatsForAvailability(unit: UnitRuntime, availabilityId: string) {
  return unit.baseStats.find((record) =>
    record.availabilityId === availabilityId || record.availabilityIds?.includes(availabilityId),
  );
}

function formatJoinLevel(unit: UnitRuntime, availabilityId: string): string {
  const baseStats = baseStatsForAvailability(unit, availabilityId);
  const scenario = unit.availability.find((record) => record.id === availabilityId);
  const carryover = baseStats?.chapter5Carryover ?? scenario?.chapter5Carryover;
  const level = baseStats?.level ?? scenario?.level ?? "?";
  if (scenario?.autoLevel) {
    return scenario.autoLevel.maximumLevel
      ? `Lv. ${scenario.autoLevel.minimumLevel}-${scenario.autoLevel.maximumLevel}`
      : `Lv. ${scenario.autoLevel.minimumLevel}+ (scales)`;
  }
  if (carryover?.levelCalculation === "template_plus_chapter_5_levels_gained") {
    return `Lv. ${level} + Ch. 4/5 levels`;
  }
  if (carryover?.levelCalculation === "retain_chapter_5_level") {
    return `Lv. ${level} + carried levels`;
  }
  return `Lv. ${level}`;
}

function formatRouteJoin(
  scenario: AvailabilityScenario,
  routeJoin: AvailabilityScenario["routeJoins"][number],
): string {
  if (scenario.myCastleRecruitment) return `After Chapter ${routeJoin.chapter}`;
  return `Chapter ${routeJoin.chapter}${routeJoin.timing === "start" ? "" : ` (${routeJoin.timing})`}`;
}

function formatMyCastleTrigger(scenario: AvailabilityScenario): string {
  const recruitment = scenario.myCastleRecruitment;
  if (!recruitment) return "—";
  return `${displayId(recruitment.facilityId)} Lv. ${recruitment.facilityLevel}, then a My Castle refresh by waiting or completing a map`;
}

function formatInventory(unit: UnitRuntime, availabilityId: string): string {
  const scenario = unit.availability.find((record) => record.id === availabilityId);
  if (!scenario) return "—";
  if (scenario.inventoryByDifficulty) {
    return `Normal: ${formatItemList(scenario.inventoryByDifficulty.normal)}; Hard/Lunatic: ${formatItemList(scenario.inventoryByDifficulty.hard)}`;
  }
  if (scenario.inventory.length > 0) return scenario.inventory.map(displayId).join(", ");
  const baseStats = baseStatsForAvailability(unit, availabilityId);
  return baseStats?.chapter5Carryover ? "Chapter 5 carryover" : "None";
}

function formatItemList(items: string[]): string {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].map(([item, count]) => `${displayId(item)}${count > 1 ? ` ×${count}` : ""}`).join(", ");
}

function formatWeaponRanks(unit: UnitRuntime, availabilityId: string): string {
  const baseStats = baseStatsForAvailability(unit, availabilityId);
  if (!baseStats) return "—";
  const ranks = Object.entries(baseStats.weaponRanksByAvailability?.[availabilityId] ?? baseStats.weaponRanks)
    .map(([weapon, rank]) => {
      const progress = baseStats.weaponRankProgress?.[weapon];
      if (!progress) return `${displayId(weapon)} ${rank}`;

      const fraction = Math.round(progress.barFraction * 3) === 1 ? "1/3" : `${Math.round(progress.barFraction * 100)}%`;
      const approximation = progress.precision === "approximate" ? "~" : "";
      return `${displayId(weapon)} ${rank} (${approximation}${fraction} to ${progress.towardRank})`;
    })
    .join(", ");
  const proficiencyRule = baseStats.chapter5Carryover?.weaponProficiencyCalculation;
  if (proficiencyRule === "retain_chapter_5_proficiency") {
    return `${ranks} + retained Chapter 5 proficiency`;
  }
  if (proficiencyRule === "template_plus_chapter_5_proficiency_gained") {
    return `${ranks} + Chapter 4/5 proficiency gained`;
  }
  return ranks;
}

function corrinTalentLabel(unit: UnitRuntime): string {
  const corrinGender = unit.identity.gender === "female" ? "Male" : "Female";
  return `${corrinGender} Corrin Talent only`;
}

function ClassTreeList({ classIds }: { classIds: string[] }) {
  return classIds.map((classId, index) => (
    <span key={classId}>
      {index > 0 ? ", " : null}
      <ClassTreeLabel classId={classId} />
    </span>
  ));
}

function ClassTreeLabel({ classId }: { classId: string }) {
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const label = displayId(classId);
  if (!classTree) return <>{label}</>;

  const promotions = classTree.promotions.map((promotion) => promotion.label).join(" or ");
  return (
    <span className="class-tree-label" tabIndex={0} title={`${label} promotes to ${promotions}.`}>
      {label}
    </span>
  );
}

function shortStatLabel(stat: keyof StatBlock): string {
  return {
    hp: "HP",
    strength: "Str",
    magic: "Mag",
    skill: "Skl",
    speed: "Spd",
    luck: "Lck",
    defense: "Def",
    resistance: "Res",
  }[stat];
}

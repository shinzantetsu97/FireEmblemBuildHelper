import { useMemo, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import { Braces, ChevronLeft, LayoutList, ShieldCheck, TriangleAlert } from "lucide-react";
import JsonExplorer from "../components/JsonExplorer";
import {
  displayId,
  fe14Data,
  findUnitBySlug,
  getPortraitUrl,
  type AvatarChoice,
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

type AvatarGender = "male" | "female";

export default function UnitDetailPage({ slug }: { slug: string }) {
  const [view, setView] = useState<"overview" | "json">("overview");
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("male");
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

        {["izana", "yukimura", "flora", "fuga"].includes(unit.identity.id) ? (
          <CastleRecruitDataAlert unitName={unit.identity.displayName} />
        ) : null}

        <UnitHeader unit={unit} avatarGender={avatarGender} setAvatarGender={setAvatarGender} />

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
          <UnitOverview unit={unit} avatarGender={avatarGender} setAvatarGender={setAvatarGender} />
        ) : (
          <JsonExplorer value={unit} label={`${unit.identity.displayName} JSON tree`} />
        )}
      </Container>
    </main>
  );
}

function CastleRecruitDataAlert({ unitName }: { unitName: string }) {
  return (
    <Alert className="unit-danger-alert castle-recruit-data-alert" variant="danger">
      <TriangleAlert aria-hidden="true" size={28} />
      <div>
        <strong>Sharing is caring.</strong>
        <p>
          The more you care about {unitName}, the more reliable this table becomes. This game has been out for more than
          10 years, and no one has produced a concrete, accurate data table for {unitName} yet, FFS. If you know a verified
          source or have personally verified this data, I would be most obliged.
        </p>
        <p className="castle-recruit-table-flip">Until then, (╯‵□′)╯︵┻━┻</p>
      </div>
    </Alert>
  );
}

function ScarletDepartureAlert() {
  return (
    <Alert className="unit-danger-alert scarlet-departure-alert" variant="danger">
      <TriangleAlert aria-hidden="true" size={28} />
      <div>
        <strong>WARNING for Revelation player</strong>
        <p>
          Scarlet permanently leaves the playable army at the end of Revelation Chapter 18. This warning does not apply
          to Birthright.
        </p>
      </div>
    </Alert>
  );
}

function UnitHeader({
  unit,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarGender: AvatarGender;
  setAvatarGender: (gender: AvatarGender) => void;
}) {
  const { identity } = unit;
  return (
    <header className="unit-header">
      <img
        src={getPortraitUrl(identity, avatarGender)}
        alt={identity.id === "corrin" ? `${displayId(avatarGender)} Corrin portrait` : `${identity.displayName} portrait`}
      />
      <div className="unit-header-copy">
        <div className="unit-header-meta">
          <span>First generation</span>
          {identity.availabilityCategory === "dlc_exclusive" ? <span>DLC-exclusive</span> : null}
          <ClassTreeLabel
            classId={unit.classAccess?.startingClassId ?? "unknown"}
            labelOverride={identity.id === "corrin" ? corrinNobleBaseLabel(avatarGender) : undefined}
          />
          {identity.unitTags?.map((tag) => <span key={tag}>{displayId(tag)} unit</span>)}
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
          <dt>Available In</dt>
          <dd>
            {identity.availabilityCategory === "dlc_exclusive" ? "DLC: " : ""}
            {identity.availableRoutes.map(displayId).join(", ")}
          </dd>
        </div>
        <div>
          <dt>Dragon Vein</dt>
          <dd>{identity.dragonVein ? "Yes" : "No"}</dd>
        </div>
        {identity.id === "corrin" ? (
          <div className="unit-header-gender">
            <dt>Gender</dt>
            <dd>
              <ButtonGroup aria-label="Corrin gender">
                {(["male", "female"] as const).map((gender) => (
                  <Button
                    key={gender}
                    size="sm"
                    variant={avatarGender === gender ? "dark" : "outline-secondary"}
                    aria-pressed={avatarGender === gender}
                    onClick={() => setAvatarGender(gender)}
                  >
                    {displayId(gender)}
                  </Button>
                ))}
              </ButtonGroup>
            </dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}

function UnitOverview({
  unit,
  avatarGender,
  setAvatarGender,
}: {
  unit: UnitRuntime;
  avatarGender: AvatarGender;
  setAvatarGender: (gender: AvatarGender) => void;
}) {
  const config = unit.avatarConfiguration;
  const [boonId, setBoonId] = useState("robust");
  const [baneId, setBaneId] = useState("weak");
  const [talentId, setTalentId] = useState("cavalier");
  const boon = config?.boons.find((choice) => choice.id === boonId) ?? config?.boons[0];
  const bane = config?.banes.find((choice) => choice.id === baneId) ?? config?.banes[1];
  const talent = config?.talents.find((choice) => choice.id === talentId) ?? config?.talents[0];
  const avatarSelection = config && boon && bane && talent
    ? { config, boon, bane, talent, gender: avatarGender, boonId, baneId, talentId, setBoonId, setBaneId, setTalentId, setGender: setAvatarGender }
    : null;

  return (
    <div className="unit-overview">
      {unit.identity.id === "corrin" ? (
        <Alert className="review-alert" variant="warning">
          <TriangleAlert aria-hidden="true" size={19} />
          <span>Corrin's displayed data begins from the neutral Avatar template. Apply one boon and one different-stat bane from the configuration tables below.</span>
        </Alert>
      ) : (
        <Alert className="review-alert" variant="warning">
          <TriangleAlert aria-hidden="true" size={19} />
          <span>
            Corrin's Partner Seal grant depends on the selected Talent and remains a runtime-variable
            class outcome. {unit.identity.displayName}'s Attack and Guard Stance bonuses are independently corroborated.
            {unit.identity.id === "kaze" ? " The four 凉风 workbook notes remain pending direct inspection." : ""}
          </span>
        </Alert>
      )}

      {unit.identity.id === "scarlet" ? <ScarletDepartureAlert /> : null}

      <section className="data-section" aria-labelledby="recruitment-heading">
        <SectionHeading eyebrow="Availability" title="Recruitment" id="recruitment-heading" />
        {avatarSelection ? (
          <div className="avatar-base-configuration">
            <h3>Starting base configuration</h3>
            <AvatarConfigurationControls selection={avatarSelection} context="Starting bases" />
          </div>
        ) : null}
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
              <JoiningStats unit={unit} availabilityId={scenario.id} avatarSelection={avatarSelection} />
              <AutoLevelSummary scenario={scenario} />
              <dl>
                <div><dt>Weapon ranks</dt><dd>{formatWeaponRanks(unit, scenario.id)}</dd></div>
                <div><dt>Inventory</dt><dd>{formatInventory(unit, scenario.id)}</dd></div>
                {scenario.gainsExperience === false ? (
                  <div><dt>EXP gain</dt><dd>Disabled</dd></div>
                ) : null}
                {scenario.myCastleRecruitment ? (
                  <div className="recruitment-trigger">
                    <dt>Recruitment trigger</dt>
                    <dd>{formatMyCastleTrigger(scenario)}</dd>
                  </div>
                ) : null}
                {scenario.dlcRecruitment ? (
                  <div className="recruitment-trigger">
                    <dt>Recruitment trigger</dt>
                    <dd>{formatDlcTrigger(scenario)}</dd>
                  </div>
                ) : null}
              </dl>
              {scenario.dlcRecruitment ? (
                <p className="dlc-scaling-note">{scenario.dlcRecruitment.npcScaling.note}</p>
              ) : null}
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
        {unit.identity.supportNotes?.map((note) => <p className="route-note" key={note}>* {note}</p>)}
      </section>

      {avatarSelection ? <AvatarConfigurationSection unit={unit} selection={avatarSelection} /> : null}

      {!unit.avatarConfiguration ? (
        <section className="data-section" aria-labelledby="stats-heading">
          <SectionHeading eyebrow="Numbers" title="Personal growth and cap modifiers" id="stats-heading" />
          <StatComparison unit={unit} />
        </section>
      ) : null}

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
            <div>
              <dt>Starting class</dt>
              <dd>
                <ClassTreeLabel
                  classId={unit.classAccess?.startingClassId ?? ""}
                  labelOverride={avatarSelection ? corrinNobleBaseLabel(avatarSelection.gender) : undefined}
                />
              </dd>
            </div>
            <div>
              <dt>Base tree</dt>
              <dd>
                {avatarSelection ? (
                  <ClassTreeLabel classId="nohr_prince" labelOverride={corrinNobleBaseLabel(avatarSelection.gender)} />
                ) : (
                  <ClassTreeList classIds={unit.classAccess?.baseClassSet ?? []} />
                )}
              </dd>
            </div>
            <div>
              <dt>{avatarSelection ? "Heart Seal (Talent)" : "Heart Seal"}</dt>
              <dd><ClassTreeList classIds={avatarSelection ? avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) : unit.classAccess?.heartSealClassSet ?? []} /></dd>
            </div>
            {unit.identity.id !== "corrin" ? (
              <div><dt>{corrinTalentLabel(unit)}</dt><dd><ClassTreeList classIds={unit.classAccess?.corrinTalentOnlyClassSet ?? []} /></dd></div>
            ) : null}
          </dl>
        </div>
      </section>

      {avatarSelection ? (
        <AvatarPairupSection selection={avatarSelection} />
      ) : unit.pairupBonuses ? (
        <section className="data-section" aria-labelledby="pairup-heading">
          <SectionHeading eyebrow="Support bonuses" title="Attack and Guard Stance" id="pairup-heading" />
          <PairupTable bonuses={unit.pairupBonuses} />
        </section>
      ) : null}

      <section className="data-section" aria-labelledby="supports-heading">
        <SectionHeading eyebrow="Relationships" title="Supports and seal grants" id="supports-heading" />
        <SupportDirectory unit={unit} avatarSelection={avatarSelection} />
      </section>

      <section className="unit-references" aria-labelledby="sources-heading">
        <h2 id="sources-heading">References</h2>
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

function JoiningStats({
  unit,
  availabilityId,
  avatarSelection,
}: {
  unit: UnitRuntime;
  availabilityId: string;
  avatarSelection: AvatarSelection | null;
}) {
  const record = baseStatsForAvailability(unit, availabilityId);
  if (!record) return null;
  const scenario = unit.availability.find((entry) => entry.id === availabilityId);
  const displayedStats = avatarSelection
    ? applyAvatarDeltas(record.stats, avatarSelection.boon.baseDeltas, avatarSelection.bane.baseDeltas)
    : record.stats;

  return (
    <div className="joining-stats">
      <h3>{scenario?.autoLevel ? `Joining stats at Lv. ${record.level}` : "Joining stats"}</h3>
      <dl className="joining-stat-grid">
        {STAT_KEYS.map((stat) => (
          <div key={stat}>
            <dt>{shortStatLabel(stat)}</dt>
            <dd>{displayedStats[stat]}</dd>
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
        <strong>Stats:</strong> Level {autoLevel.statBaseLevel} bases + (individual growth rates + {displayId(autoLevel.growthClassId)} class growth rates) × levels gained.
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

type PairupTableBonuses = {
  attackStance: { baseBonus: Record<string, number>; rankDeltas: Record<string, Record<string, number>> };
  guardStance: { baseBonus: Record<string, number>; rankDeltas: Record<string, Record<string, number>> };
};

function PairupTable({ bonuses }: { bonuses: PairupTableBonuses }) {
  return (
    <Table className="pairup-table" responsive>
      <thead><tr><th>Rank</th><th>Attack Stance / Tag Team <span>Accepted</span></th><th>Guard Stance / Pair Up <span>Accepted</span></th></tr></thead>
      <tbody>
        <tr>
          <th scope="row">No support</th>
          <td>{formatBonuses(bonuses.attackStance.baseBonus)}</td>
          <td>{formatBonuses(bonuses.guardStance.baseBonus)}</td>
        </tr>
        {(["C", "B", "A", "S"] as const).map((rank) => (
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

function SupportDirectory({ unit, avatarSelection }: { unit: UnitRuntime; avatarSelection: AvatarSelection | null }) {
  const grantsBySupport = new Map<string, SealGrant>(
    (unit.classAccess?.sealGrants ?? []).map((grant) => [grant.supportRelationshipId, grant]),
  );
  const visibleSupports = avatarSelection
    ? unit.supports.filter((support) => support.partnerGender === avatarSelection.gender)
    : unit.supports;
  const selectedTalentClasses = new Set(
    avatarSelection ? avatarTalentClassIds(avatarSelection.talent, avatarSelection.gender) : [],
  );
  if (unit.identity.id === "corrin") {
    for (const support of visibleSupports) {
      const classId = corrinBorrowedClassId(support.partnerUnitId);
      if (!classId) continue;
      grantsBySupport.set(support.id, {
        supportRelationshipId: support.id,
        seal: support.kind === "romantic" ? "partner" : "friendship",
        borrowedClassId: classId,
        grantedClassId: classId,
        resolution: "direct",
        alreadyOwnedVia: selectedTalentClasses.has(classId) ? "heart_seal" : undefined,
      });
    }
  }
  const alreadyOwnedVia = new Set(
    Array.from(grantsBySupport.values())
      .map((grant) => grant.alreadyOwnedVia)
      .filter((value): value is NonNullable<SealGrant["alreadyOwnedVia"]> => value !== undefined),
  );
  const rosterById = new Map(fe14Data.roster.map((rosterUnit) => [rosterUnit.id, rosterUnit]));
  const bySupportRoutesThenPartnerUnitNo = (
    left: UnitRuntime["supports"][number],
    right: UnitRuntime["supports"][number],
  ) => {
    const leftPartner = rosterById.get(left.partnerUnitId);
    const rightPartner = rosterById.get(right.partnerUnitId);
    return right.routes.length - left.routes.length ||
      (leftPartner?.unitNo ?? Number.MAX_SAFE_INTEGER) - (rightPartner?.unitNo ?? Number.MAX_SAFE_INTEGER) ||
      left.id.localeCompare(right.id);
  };
  const nonRomantic = visibleSupports.filter((support) => support.kind !== "romantic");
  const friendship = nonRomantic
    .filter((support) => unit.identity.id === "corrin" || grantsBySupport.has(support.id))
    .sort(bySupportRoutesThenPartnerUnitNo);
  const noClassGrant = nonRomantic
    .filter((support) => unit.identity.id !== "corrin" && !grantsBySupport.has(support.id))
    .sort(bySupportRoutesThenPartnerUnitNo);
  const romantic = visibleSupports
    .filter((support) => support.kind === "romantic")
    .sort(bySupportRoutesThenPartnerUnitNo);

  return (
    <div>
      {unit.identity.supportNotes?.map((note) => (
        <p className="support-availability-note" key={note}>
          <strong>Support availability:</strong> {note}
        </p>
      ))}
      <div className="support-groups">
        <SupportGroup
          title={unit.identity.id === "corrin" ? "Friendship Seal (same-gender A)" : "Friendship Seal (A+)"}
          supports={friendship}
          grants={grantsBySupport}
        />
        <SupportGroup title="A support (no class grant)" supports={noClassGrant} grants={grantsBySupport} />
        <SupportGroup title="Partner Seal (S)" supports={romantic} grants={grantsBySupport} />
      </div>
      {alreadyOwnedVia.size > 0 ? (
        <p className="seal-owned-legend">
          <TriangleAlert aria-hidden="true" size={17} />
          <span>
            <strong>Caution:</strong> Marked classes are already available through this unit&apos;s{" "}
            {formatOwnedSources(alreadyOwnedVia)}. The listed seal does not add a new class tree.
          </span>
        </p>
      ) : null}
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
  if (supports.length === 0) return null;
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
              <span>
                {support.routes.map(formatRoute).join(" / ")}
              </span>
              <div className="support-grant-result">
                <strong>
                  {grant ? <ClassTreeLabel classId={grant.grantedClassId} /> : "No class grant"}
                  {grant?.alreadyOwnedVia ? (
                    <TriangleAlert
                      aria-label={`Already available via ${grant.alreadyOwnedVia === "base" ? "Base class" : "Heart Seal"}`}
                      className="seal-owned-marker"
                      size={16}
                    />
                  ) : null}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatOwnedSources(sources: Set<"base" | "heart_seal">): string {
  if (sources.has("base") && sources.has("heart_seal")) return "base class set or Heart Seal options";
  if (sources.has("base")) return "base class set";
  return "Heart Seal options";
}

function SourceList({ unit }: { unit: UnitRuntime }) {
  const sourceIds = useMemo(() => new Set(collectSourceRefs(unit).map((ref) => ref.sourceId)), [unit]);
  const sources = fe14Data.sources.filter((source) => sourceIds.has(source.id));
  return (
    <ol className="source-list">
      {sources.map((source) => (
        <li key={source.id}>
          {source.location.startsWith("http") ? (
            <a href={source.location} target="_blank" rel="noreferrer">{source.title}</a>
          ) : (
            <span>{source.title}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function collectSourceRefs(value: unknown): SourceRef[] {
  if (Array.isArray(value)) return value.flatMap(collectSourceRefs);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const current = typeof record.sourceId === "string" ? [record as unknown as SourceRef] : [];
  return current.concat(Object.values(record).flatMap(collectSourceRefs));
}

function corrinBorrowedClassId(partnerUnitId: string): string | undefined {
  const partner = fe14Data.units.find((unit) => unit.identity.id === partnerUnitId);
  const startingClassId = partner?.classAccess?.startingClassId;
  if (!partner || !startingClassId) return undefined;
  const restricted = new Set(["nohr_prince", "songstress", "kitsune", "wolfskin", "villager"]);
  return restricted.has(startingClassId)
    ? partner.classAccess?.heartSealClassSet[0]
    : partner.classAccess?.baseClassSet[0];
}

function applyAvatarDeltas(base: StatBlock, ...deltas: Array<Partial<StatBlock>>): StatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [stat, deltas.reduce((value, delta) => value + (delta[stat] ?? 0), base[stat])]),
  ) as unknown as StatBlock;
}

function formatAvatarMatrixCell(boon?: number, bane?: number, percentage = false): string {
  if (boon === undefined && bane === undefined) return "—";
  const suffix = percentage ? "%" : "";
  return `${formatSigned(boon ?? 0)}${suffix} / ${formatSigned(bane ?? 0)}${suffix}`;
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function formatBonuses(values: Record<string, number>): string {
  const labels: Record<string, string> = {
    hit: "Hit rate",
    avoid: "Avoid",
    critical: "Critical",
    criticalAvoid: "Dodge",
  };
  return Object.entries(values).map(([stat, value]) => `${labels[stat] ?? displayId(stat)} +${value}`).join(", ");
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
    return `Lv. ${level} + ${carryoverTrainingLabel(carryover.sourceAvailabilityId, true)} levels`;
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
  if (scenario.dlcRecruitment) return "Dragon's Gate unlocked";
  if (scenario.myCastleRecruitment) return `After Chapter ${routeJoin.chapter}`;
  if (routeJoin.chapter === 0) return "Prologue";
  if (routeJoin.turn) return `Chapter ${routeJoin.chapter} (turn ${routeJoin.turn})`;
  return `Chapter ${routeJoin.chapter}${routeJoin.timing === "start" ? "" : ` (${routeJoin.timing})`}`;
}

function formatMyCastleTrigger(scenario: AvailabilityScenario): string {
  const recruitment = scenario.myCastleRecruitment;
  if (!recruitment) return "—";
  const facilities = recruitment.facilityIds
    ? `Any of ${formatDisjunction(recruitment.facilityIds.map(displayId))}`
    : displayId(recruitment.facilityId ?? "unknown_facility");
  return `${facilities} Lv. ${recruitment.facilityLevel}, then a My Castle refresh by waiting or completing a map`;
}

function formatDisjunction(values: string[]): string {
  if (values.length === 2) return `${values[0]} or ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
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
      const progress = baseStats.weaponRankProgressByAvailability?.[availabilityId]?.[weapon]
        ?? baseStats.weaponRankProgress?.[weapon];
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
    return `${ranks} + ${carryoverTrainingLabel(baseStats.chapter5Carryover?.sourceAvailabilityId)} proficiency gained`;
  }
  return ranks;
}

function formatDlcTrigger(scenario: AvailabilityScenario): string {
  const recruitment = scenario.dlcRecruitment;
  if (!recruitment) return "—";
  return `Clear ${recruitment.mapName} for the first time`;
}

type AvatarSelection = {
  config: NonNullable<UnitRuntime["avatarConfiguration"]>;
  boon: AvatarChoice;
  bane: AvatarChoice;
  talent: AvatarTalent;
  gender: AvatarGender;
  boonId: string;
  baneId: string;
  talentId: string;
  setBoonId: (id: string) => void;
  setBaneId: (id: string) => void;
  setTalentId: (id: string) => void;
  setGender: (gender: AvatarGender) => void;
};

type AvatarTalent = NonNullable<UnitRuntime["avatarConfiguration"]>["talents"][number];

function AvatarConfigurationSection({ unit, selection }: { unit: UnitRuntime; selection: AvatarSelection }) {
  const { config, boon, bane } = selection;
  const neutralGrowths = unit.growths[0]?.rates;
  const neutralCaps = unit.capModifiers?.modifiers;
  if (!neutralGrowths || !neutralCaps) return null;
  const growths = applyAvatarDeltas(neutralGrowths, boon.growthDeltas, bane.growthDeltas);
  const caps = applyAvatarDeltas(
    { hp: 0, ...neutralCaps },
    boon.capDeltas,
    bane.capDeltas,
  );

  return (
    <section className="data-section avatar-configuration" aria-labelledby="avatar-configuration-heading">
      <SectionHeading eyebrow="Avatar rules" title="Corrin configuration" id="avatar-configuration-heading" />
      <p className="avatar-config-intro">
        Boon and bane deltas are added to Corrin's neutral starting stats, personal growths, and zero neutral cap modifiers.
      </p>

      <div className="avatar-current-stats">
        <div className="avatar-current-stats-heading">
          <h3>Personal growth and cap modifiers</h3>
          <AvatarConfigurationControls selection={selection} context="Growth and caps" />
        </div>
        <Table className="stat-table" responsive>
          <thead><tr><th>Stat</th><th>Personal growth</th><th>Cap modifier</th></tr></thead>
          <tbody>
            {STAT_KEYS.map((stat) => (
              <tr key={stat}>
                <th scope="row">{stat === "hp" ? "HP" : displayId(stat)}</th>
                <td><GrowthBar value={growths[stat]} /></td>
                <td>{stat === "hp" ? "—" : formatSigned(caps[stat])}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><th scope="row">Total</th><td>{Object.values(growths).reduce((sum, value) => sum + value, 0)}%</td><td>—</td></tr></tfoot>
        </Table>
      </div>

      <div className="avatar-modifier-matrices">
        <h3>Boon and bane modifier matrices</h3>
        <p>Each populated cell shows the boon delta first and the corresponding bane delta second.</p>
        <AvatarBaseModifierArray config={config} />
        <AvatarModifierMatrix title="Personal growth modifiers" config={config} field="growthDeltas" percentage />
        <AvatarModifierMatrix title="Cap modifiers" config={config} field="capDeltas" />
      </div>

      <div className="avatar-class-grid">
        <div>
          <div className="avatar-talent-heading">
            <h3>Talent class trees</h3>
            <Form.Group className="avatar-talent-selector" controlId="corrin-talent">
              <Form.Label>Selected Talent</Form.Label>
              <Form.Select
                value={selection.talentId}
                onChange={(event) => selection.setTalentId(event.target.value)}
                aria-label="Corrin Talent"
              >
                {config.talents.map((talent) => <option key={talent.id} value={talent.id}>{talent.label}</option>)}
              </Form.Select>
            </Form.Group>
          </div>
          <dl className="avatar-talent-list">
            {config.talents.map((talent) => (
              <div
                className={talent.id === selection.talentId ? "is-selected" : "is-dimmed"}
                key={talent.id}
                aria-current={talent.id === selection.talentId ? "true" : undefined}
              >
                <dt>{talent.label}</dt>
                <dd>{formatAvatarTalentTree(talent, selection.gender)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3>Noble promotion access</h3>
          <dl className="avatar-route-promotions">
            {Object.entries(config.routePromotions).map(([route, classIds]) => (
              <div key={route}>
                <dt>{displayId(route)}</dt>
                <dd>{classIds.map(displayId).join(" / ")}</dd>
              </div>
            ))}
          </dl>
          <p className="avatar-pairup-note">{config.pairupRule.note}</p>
        </div>
      </div>

      <Alert className="avatar-class-warning" variant="warning">
        <TriangleAlert aria-hidden="true" size={22} />
        <div>
          <strong>Missable-class bottleneck</strong>
          <p>{config.friendshipSealRule.note}</p>
        </div>
      </Alert>

      <FriendshipCoverageTable unit={unit} selection={selection} />
    </section>
  );
}

function AvatarPairupSection({ selection }: { selection: AvatarSelection }) {
  const { pairupRule } = selection.config;
  const attackVariant = pairupRule.attackStance.variants.find(
    (variant) => variant.boonIds.includes(selection.boonId) && variant.baneIds.includes(selection.baneId),
  );
  const guardVariant = pairupRule.guardStance.variants.find(
    (variant) => variant.boonId === selection.boonId && variant.baneId === selection.baneId,
  );
  if (!attackVariant || !guardVariant) return null;

  const bonuses: PairupTableBonuses = {
    attackStance: { baseBonus: pairupRule.attackStance.baseBonus, rankDeltas: attackVariant.rankDeltas },
    guardStance: { baseBonus: pairupRule.guardStance.baseBonus, rankDeltas: guardVariant.rankDeltas },
  };

  return (
    <section className="data-section avatar-pairup-section" aria-labelledby="pairup-heading">
      <SectionHeading eyebrow="Support bonuses" title="Attack and Guard Stance" id="pairup-heading" />
      <div className="avatar-pairup-controls">
        <p>{selection.boon.label} boon with {selection.bane.label} bane</p>
        <AvatarConfigurationControls selection={selection} context="Stance bonuses" />
      </div>
      <PairupTable bonuses={bonuses} />
      <div className="avatar-pairup-notes">
        <p><strong>Attack Stance:</strong> {pairupRule.attackStance.semantics}</p>
        <p><strong>Guard Stance:</strong> {pairupRule.guardStance.semantics}</p>
      </div>
    </section>
  );
}

function AvatarConfigurationControls({ selection, context }: { selection: AvatarSelection; context: string }) {
  const { config, boon, bane, boonId, baneId, setBoonId, setBaneId } = selection;
  return (
    <div className="avatar-config-controls" aria-label={`${context} boon and bane`}>
      <Form.Group controlId={`${context.toLowerCase().replaceAll(" ", "-")}-boon`}>
        <Form.Label>Boon</Form.Label>
        <Form.Select value={boonId} onChange={(event) => setBoonId(event.target.value)} aria-label={`${context} boon`}>
          {config.boons.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.stat === bane.stat}>{choice.label} ({choice.stat === "hp" ? "HP" : displayId(choice.stat)})</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group controlId={`${context.toLowerCase().replaceAll(" ", "-")}-bane`}>
        <Form.Label>Bane</Form.Label>
        <Form.Select value={baneId} onChange={(event) => setBaneId(event.target.value)} aria-label={`${context} bane`}>
          {config.banes.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.stat === boon.stat}>{choice.label} ({choice.stat === "hp" ? "HP" : displayId(choice.stat)})</option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

function AvatarBaseModifierArray({ config }: { config: NonNullable<UnitRuntime["avatarConfiguration"]> }) {
  return (
    <div className="avatar-matrix-table avatar-base-modifier-array">
      <h4>Starting base modifiers</h4>
      <Table bordered responsive>
        <thead>
          <tr><th>Boon / Bane</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat)}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Adjustment</th>
            {STAT_KEYS.map((stat) => {
              const boon = config.boons.find((choice) => choice.stat === stat);
              const bane = config.banes.find((choice) => choice.stat === stat);
              return <td key={stat}>{formatAvatarMatrixCell(boon?.baseDeltas[stat], bane?.baseDeltas[stat], false)}</td>;
            })}
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

function AvatarModifierMatrix({
  config,
  field,
  percentage = false,
  title,
}: {
  config: NonNullable<UnitRuntime["avatarConfiguration"]>;
  field: "baseDeltas" | "growthDeltas" | "capDeltas";
  percentage?: boolean;
  title: string;
}) {
  return (
    <div className="avatar-matrix-table">
      <h4>{title}</h4>
      <Table bordered responsive>
        <thead>
          <tr><th>Boon / Bane</th>{STAT_KEYS.map((stat) => <th key={stat}>{shortStatLabel(stat)}</th>)}</tr>
        </thead>
        <tbody>
          {config.boons.map((boon) => {
            const bane = config.banes.find((choice) => choice.stat === boon.stat);
            const boonValues = boon[field] as Partial<StatBlock>;
            const baneValues = bane?.[field] as Partial<StatBlock> | undefined;
            return (
              <tr key={boon.id}>
                <th scope="row"><strong>{boon.label}</strong><span>{bane?.label}</span></th>
                {STAT_KEYS.map((stat) => (
                  <td key={stat}>{formatAvatarMatrixCell(boonValues[stat], baneValues?.[stat], percentage)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

function FriendshipCoverageTable({ unit, selection }: { unit: UnitRuntime; selection: AvatarSelection }) {
  const config = unit.avatarConfiguration;
  if (!config) return null;
  const routes = ["birthright", "conquest", "revelation"] as const;

  return (
    <div className="friendship-coverage">
      <h3>First-generation Friendship class coverage</h3>
      <Table responsive aria-label="Corrin missing class access">
        <thead><tr><th>Corrin</th><th>Route</th><th>Class trees still missing after Friendship and Talent access</th></tr></thead>
        <tbody>
          {routes.map((route) => {
            const gender = selection.gender;
            const available = new Set(
              unit.supports
                .filter((support) => support.kind !== "romantic" && support.partnerGender === gender && support.routes.includes(route))
                .map((support) => corrinBorrowedClassId(support.partnerUnitId))
                .filter((classId): classId is string => Boolean(classId)),
            );
            const talentClasses = config.talents.map((talent) => talent.classId ?? talent.classIdByGender?.[gender]).filter((classId): classId is string => Boolean(classId));
            const selectedTalentClass = avatarTalentClassId(selection.talent, gender);
            const gaps = talentClasses.filter((classId) => classId !== selectedTalentClass && !available.has(classId));
            return (
              <tr key={`${route}-${gender}`}>
                <th scope="row">{displayId(gender)}</th>
                <td>{displayId(route)}</td>
                <td>{gaps.length > 0 ? <ClassTreeList classIds={gaps} /> : "None in the current first-generation data"}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <p>Coverage includes Corrin's selected Talent and eligible first-generation Friendship Seals; it excludes Partner Seals, child units, DLC, and unrecruited units.</p>
    </div>
  );
}

function avatarTalentClassId(talent: AvatarTalent, gender: "male" | "female"): string | undefined {
  return talent.classId ?? talent.classIdByGender?.[gender];
}

function avatarTalentClassIds(talent: AvatarTalent, gender: AvatarGender): string[] {
  if (talent.classId) return [talent.classId];
  const classId = talent.classIdByGender?.[gender];
  return classId ? [classId] : [];
}

function formatAvatarTalentTree(talent: AvatarTalent, gender: AvatarGender): string {
  const classId = avatarTalentClassId(talent, gender);
  if (!classId) return "No class tree";
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const promotions = classTree?.promotions
    .map((promotion) => avatarPromotionLabel(promotion.id, promotion.label, gender))
    .join(" / ") ?? "No standard promotions";
  return `${displayId(classId)} → ${promotions}`;
}

function avatarPromotionLabel(id: string, label: string, gender: AvatarGender): string {
  if (id === "attendant") return gender === "female" ? "Maid" : "Butler";
  return label;
}

function corrinNobleBaseLabel(gender: AvatarGender): string {
  return gender === "female" ? "Nohr Princess" : "Nohr Prince";
}

function carryoverTrainingLabel(sourceAvailabilityId?: string, abbreviated = false): string {
  if (sourceAvailabilityId === "sakura.chapter_5") return "Chapter 5";
  return abbreviated ? "Ch. 4/5" : "Chapter 4/5";
}

function corrinTalentLabel(unit: UnitRuntime): string {
  if (unit.identity.id === "niles") return "Corrin Talent only";
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

function ClassTreeLabel({ classId, labelOverride }: { classId: string; labelOverride?: string }) {
  const classTree = fe14Data.classTrees.find((entry) => entry.id === classId);
  const label = labelOverride ?? displayId(classId);
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

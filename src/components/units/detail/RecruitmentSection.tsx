import { displayId, type UnitRuntime } from "../../../data/fe14";
import { AvatarConfigurationControls } from "./AvatarConfiguration";
import SectionHeading from "./SectionHeading";
import { STAT_KEYS, type AvatarSelection, type AvailabilityScenario } from "./types";
import {
  applyAvatarDeltas,
  baseStatsForAvailability,
  formatDlcTrigger,
  formatInventory,
  formatJoinLevel,
  formatMyCastleTrigger,
  formatRoute,
  formatRouteJoin,
  formatWeaponRanks,
  scenarioLabel,
  shortStatLabel,
} from "./utils";

export default function RecruitmentSection({
  unit,
  avatarSelection,
}: {
  unit: UnitRuntime;
  avatarSelection: AvatarSelection | null;
}) {
  return (
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
